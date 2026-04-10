import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Provider-specific refresh configurations ─────────────────────────────────

const TESLA_TOKEN_URL = "https://auth.tesla.com/oauth2/v3/token";
const ENPHASE_TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";
const WALLBOX_API_BASE = "https://api.wall-box.com";
const SOLAREDGE_API_BASE = "https://monitoringapi.solaredge.com";

// Refresh buffer: refresh tokens that expire within this many days
const REFRESH_BUFFER_DAYS = 7;
// For providers without expires_at, refresh if not updated in this many days
const STALE_THRESHOLD_DAYS = 14;

interface RefreshResult {
  provider: string;
  user_id: string;
  status: "refreshed" | "failed" | "skipped" | "expired";
  message?: string;
}

// ── Tesla refresh ────────────────────────────────────────────────────────────

async function refreshTesla(
  supabase: any,
  userId: string,
  refreshToken: string,
): Promise<boolean> {
  const clientId = Deno.env.get("TESLA_CLIENT_ID");
  const clientSecret = Deno.env.get("TESLA_CLIENT_SECRET");
  if (!clientId || !clientSecret || !refreshToken) return false;

  const resp = await fetch(TESLA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!resp.ok) {
    console.error(`Tesla refresh failed for ${userId}: ${resp.status} ${await resp.text()}`);
    return false;
  }

  const tokens = await resp.json();
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
    .eq("provider", "tesla");

  return true;
}

// ── Enphase refresh ──────────────────────────────────────────────────────────

async function refreshEnphase(
  supabase: any,
  userId: string,
  refreshToken: string,
): Promise<boolean> {
  const clientId = Deno.env.get("ENPHASE_CLIENT_ID");
  const clientSecret = Deno.env.get("ENPHASE_CLIENT_SECRET");
  if (!clientId || !clientSecret || !refreshToken) return false;

  const credentials = btoa(`${clientId}:${clientSecret}`);
  const tokenUrl = new URL(ENPHASE_TOKEN_URL);
  tokenUrl.searchParams.set("grant_type", "refresh_token");
  tokenUrl.searchParams.set("refresh_token", refreshToken);

  const resp = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: { "Authorization": `Basic ${credentials}` },
  });

  if (!resp.ok) {
    console.error(`Enphase refresh failed for ${userId}: ${resp.status} ${await resp.text()}`);
    return false;
  }

  const tokens = await resp.json();
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

  return true;
}

// ── Wallbox refresh (uses stored credentials, not OAuth refresh_token) ───────

async function refreshWallbox(
  supabase: any,
  userId: string,
  refreshToken: string,
): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const { e: email, p: password } = JSON.parse(atob(refreshToken));
    const credentials = btoa(`${email}:${password}`);

    const resp = await fetch(`${WALLBOX_API_BASE}/auth/token/user`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!resp.ok) {
      console.error(`Wallbox refresh failed for ${userId}: ${resp.status}`);
      return false;
    }

    const authData = await resp.json();
    if (!authData.jwt) return false;

    await supabase
      .from("energy_tokens")
      .update({
        access_token: authData.jwt,
        expires_at: authData.ttl
          ? new Date(Date.now() + authData.ttl * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "wallbox");

    return true;
  } catch (err) {
    console.error(`Wallbox refresh error for ${userId}:`, err);
    return false;
  }
}

// ── SolarEdge: API-key based, no token refresh needed ────────────────────────
// SolarEdge uses a static API key, so we just verify it's still working.

async function verifySolaredge(
  supabase: any,
  userId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    // SolarEdge access_token IS the API key — just verify it works
    const resp = await fetch(
      `${SOLAREDGE_API_BASE}/sites/list?size=1&api_key=${accessToken}`,
    );

    if (resp.ok) {
      await resp.text(); // consume body
      // Update the timestamp so we know it was checked
      await supabase
        .from("energy_tokens")
        .update({ updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("provider", "solaredge");
      return true;
    }

    console.error(`SolarEdge API key invalid for ${userId}: ${resp.status}`);
    await resp.text(); // consume body
    return false;
  } catch (err) {
    console.error(`SolarEdge verify error for ${userId}:`, err);
    return false;
  }
}

// ── Determine if a token needs refreshing ────────────────────────────────────

function needsRefresh(token: {
  expires_at: string | null;
  updated_at: string;
  provider: string;
}): "needs_refresh" | "expired_beyond_recovery" | "ok" {
  const now = Date.now();
  const bufferMs = REFRESH_BUFFER_DAYS * 24 * 60 * 60 * 1000;
  const staleMs = STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  if (token.expires_at) {
    const expiresAt = new Date(token.expires_at).getTime();
    const timeUntilExpiry = expiresAt - now;

    // Already expired — still attempt refresh, provider might accept it
    if (timeUntilExpiry < 0) return "needs_refresh";

    // Expiring within buffer — proactively refresh
    if (timeUntilExpiry < bufferMs) return "needs_refresh";

    return "ok";
  }

  // No expires_at — check staleness by updated_at
  const updatedAt = new Date(token.updated_at).getTime();
  const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate > STALE_THRESHOLD_DAYS) return "needs_refresh";

  return "ok";
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch ALL provider tokens across all users
    const { data: allTokens, error: fetchError } = await supabase
      .from("energy_tokens")
      .select("user_id, provider, access_token, refresh_token, expires_at, updated_at")
      .not("access_token", "is", null);

    if (fetchError) {
      console.error("Failed to fetch tokens:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch tokens" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!allTokens || allTokens.length === 0) {
      console.log("No provider tokens found");
      return new Response(JSON.stringify({ success: true, results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${allTokens.length} provider tokens to check`);

    const results: RefreshResult[] = [];

    for (const token of allTokens) {
      const status = needsRefresh(token);

      if (status === "ok") {
        results.push({
          provider: token.provider,
          user_id: token.user_id,
          status: "skipped",
          message: "Token still valid",
        });
        continue;
      }

      console.log(
        `[${token.provider}] Token for user ${token.user_id} needs refresh ` +
        `(expires_at: ${token.expires_at}, updated_at: ${token.updated_at})`,
      );

      let success = false;

      try {
        switch (token.provider) {
          case "tesla":
            success = await refreshTesla(supabase, token.user_id, token.refresh_token);
            break;
          case "enphase":
            success = await refreshEnphase(supabase, token.user_id, token.refresh_token);
            break;
          case "wallbox":
            success = await refreshWallbox(supabase, token.user_id, token.refresh_token);
            break;
          case "solaredge":
            success = await verifySolaredge(supabase, token.user_id, token.access_token);
            break;
          default:
            console.log(`Unknown provider ${token.provider} for user ${token.user_id}, skipping`);
            results.push({
              provider: token.provider,
              user_id: token.user_id,
              status: "skipped",
              message: `Unknown provider: ${token.provider}`,
            });
            continue;
        }
      } catch (err) {
        console.error(`Unexpected error refreshing ${token.provider} for ${token.user_id}:`, err);
        success = false;
      }

      if (success) {
        console.log(`✅ [${token.provider}] Refreshed token for user ${token.user_id}`);
        results.push({
          provider: token.provider,
          user_id: token.user_id,
          status: "refreshed",
        });
      } else {
        console.error(`❌ [${token.provider}] Failed to refresh token for user ${token.user_id}`);
        results.push({
          provider: token.provider,
          user_id: token.user_id,
          status: "failed",
          message: "Refresh failed — user may need to re-authenticate",
        });
      }
    }

    // Summary
    const summary = {
      success: true,
      total: allTokens.length,
      refreshed: results.filter((r) => r.status === "refreshed").length,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      results,
    };

    console.log("Token refresh sweep complete:", {
      total: summary.total,
      refreshed: summary.refreshed,
      failed: summary.failed,
      skipped: summary.skipped,
    });

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Token refresh sweep error:", error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
