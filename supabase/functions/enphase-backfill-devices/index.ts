// Backfill Enphase device rows into `connected_devices` for any user whose
// `energy_tokens` already holds a valid Enphase OAuth token but who never
// completed the system-selection step in onboarding (so their Envoy systems
// never landed in `connected_devices`).
//
// Without those rows, the SSOT layer (pickSource, useSolarTelemetry,
// LiveEnergyMonitoringCard) treats the user as having no solar — they show as
// charger-only / nothing-connected even though the OAuth link is healthy.
//
// Modes:
//   POST {}                          → backfill the caller's own account.
//   POST { user_ids: [uuid, ...] }   → admin/founder: backfill specific users.
//   POST { all_missing: true }       → admin/founder: scan every user whose
//                                      profile flags enphase_connected=true
//                                      but has zero enphase rows in
//                                      connected_devices, and backfill them.
//
// Idempotent: existing rows are not modified, and systems already claimed by
// a different user are skipped (never stolen).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENPHASE_API_BASE = "https://api.enphaseenergy.com/api/v4";
const ENPHASE_TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";

interface UserResult {
  user_id: string;
  claimed: string[];
  skipped_already_claimed: string[];
  skipped_existing: string[];
  errors: string[];
  systems_found: number;
}

async function refreshEnphaseToken(
  supabase: any,
  userId: string,
  refreshToken: string,
): Promise<string | null> {
  const clientId = Deno.env.get("ENPHASE_CLIENT_ID");
  const clientSecret = Deno.env.get("ENPHASE_CLIENT_SECRET");
  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const url = new URL(ENPHASE_TOKEN_URL);
    url.searchParams.set("grant_type", "refresh_token");
    url.searchParams.set("refresh_token", refreshToken);
    const r = await fetch(url.toString(), {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
    });
    if (!r.ok) {
      console.error("Enphase refresh failed:", await r.text());
      return null;
    }
    const tokens = await r.json();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;
    await supabase
      .from("energy_tokens")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "enphase");
    return tokens.access_token;
  } catch (e) {
    console.error("Enphase refresh error:", e);
    return null;
  }
}

async function getValidEnphaseToken(supabase: any, userId: string): Promise<string | null> {
  const { data: tokenRow } = await supabase
    .from("energy_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "enphase")
    .single();
  if (!tokenRow?.access_token) return null;

  // Refresh if expired or expiring within 5 min
  if (tokenRow.expires_at) {
    const expiresAt = new Date(tokenRow.expires_at).getTime();
    if (expiresAt - Date.now() < 5 * 60 * 1000 && tokenRow.refresh_token) {
      const fresh = await refreshEnphaseToken(supabase, userId, tokenRow.refresh_token);
      if (fresh) return fresh;
    }
  }
  return tokenRow.access_token;
}

async function backfillUser(
  supabase: any,
  userId: string,
  apiKey: string,
): Promise<UserResult> {
  const result: UserResult = {
    user_id: userId,
    claimed: [],
    skipped_already_claimed: [],
    skipped_existing: [],
    errors: [],
    systems_found: 0,
  };

  const accessToken = await getValidEnphaseToken(supabase, userId);
  if (!accessToken) {
    result.errors.push("no_enphase_token");
    return result;
  }

  const systemsRes = await fetch(`${ENPHASE_API_BASE}/systems?key=${apiKey}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!systemsRes.ok) {
    const body = await systemsRes.text();
    console.error(`enphase /systems failed for ${userId}:`, body);
    result.errors.push(`systems_fetch_${systemsRes.status}`);
    return result;
  }
  const systemsData = await systemsRes.json();
  const systems = (systemsData.systems || []) as any[];
  result.systems_found = systems.length;

  for (const sys of systems) {
    const deviceId = String(sys.system_id);
    // Check claim status across all users
    const { data: existing } = await supabase
      .from("connected_devices")
      .select("user_id")
      .eq("provider", "enphase")
      .eq("device_id", deviceId)
      .maybeSingle();

    if (existing) {
      if (existing.user_id === userId) {
        result.skipped_existing.push(deviceId);
      } else {
        result.skipped_already_claimed.push(deviceId);
      }
      continue;
    }

    const { error: insertErr } = await supabase
      .from("connected_devices")
      .insert({
        user_id: userId,
        provider: "enphase",
        device_id: deviceId,
        device_type: "solar_system",
        device_name: sys.name || sys.public_name || "Enphase System",
        device_metadata: {
          system_id: sys.system_id,
          public_name: sys.public_name,
          timezone: sys.timezone,
          status: sys.status,
          address: sys.address,
          size_w: sys.system_size,
          backfilled: true,
          backfilled_at: new Date().toISOString(),
        },
        baseline_data: { captured_at: new Date().toISOString() },
      });

    if (insertErr) {
      if (insertErr.code === "23505") {
        result.skipped_already_claimed.push(deviceId);
      } else {
        console.error(`insert failed for ${userId}/${deviceId}:`, insertErr);
        result.errors.push(`insert_${deviceId}`);
      }
    } else {
      result.claimed.push(deviceId);
    }
  }

  // Defensive: keep profile flag aligned
  if (result.claimed.length > 0 || result.skipped_existing.length > 0) {
    await supabase
      .from("profiles")
      .update({ enphase_connected: true })
      .eq("user_id", userId);
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ENPHASE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Enphase API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: { user_ids?: string[]; all_missing?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const isAdminMode = !!(body.all_missing || (body.user_ids && body.user_ids.length > 0));

    // Resolve target user list
    let targets: string[] = [];

    if (isAdminMode) {
      // Require admin or founder role
      const [{ data: isAdmin }, { data: isFounder }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "founder" }),
      ]);
      if (!isAdmin && !isFounder) {
        return new Response(JSON.stringify({ error: "Admin or founder role required for batch backfill" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.user_ids && body.user_ids.length > 0) {
        targets = body.user_ids;
      } else if (body.all_missing) {
        // Users with enphase_connected=true but zero enphase rows in connected_devices
        const { data: profilesRows } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("enphase_connected", true);
        const candidateIds = (profilesRows || []).map((r: any) => r.user_id);
        if (candidateIds.length > 0) {
          const { data: existingRows } = await supabase
            .from("connected_devices")
            .select("user_id")
            .eq("provider", "enphase")
            .in("user_id", candidateIds);
          const haveEnphase = new Set((existingRows || []).map((r: any) => r.user_id));
          targets = candidateIds.filter((id: string) => !haveEnphase.has(id));
        }
      }
    } else {
      targets = [user.id];
    }

    const results: UserResult[] = [];
    for (const uid of targets) {
      try {
        results.push(await backfillUser(supabase, uid, apiKey));
      } catch (e) {
        console.error(`backfillUser threw for ${uid}:`, e);
        results.push({
          user_id: uid,
          claimed: [],
          skipped_already_claimed: [],
          skipped_existing: [],
          errors: ["exception"],
          systems_found: 0,
        });
      }
    }

    const summary = {
      users_processed: results.length,
      total_claimed: results.reduce((n, r) => n + r.claimed.length, 0),
      total_already_existing: results.reduce((n, r) => n + r.skipped_existing.length, 0),
      total_blocked_other_user: results.reduce((n, r) => n + r.skipped_already_claimed.length, 0),
      users_with_errors: results.filter((r) => r.errors.length > 0).length,
    };

    return new Response(JSON.stringify({ summary, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("enphase-backfill-devices error:", error);
    return new Response(JSON.stringify({ error: "Backfill failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
