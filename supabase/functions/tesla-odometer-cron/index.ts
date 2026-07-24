// tesla-odometer-cron — server-side odometer sampler for ALL connected Tesla
// vehicles, so ev_miles rows accumulate whether or not the user opens the app.
//
// Cron drives this every 3 hours (see pg_cron job `tesla-odometer-cron-3h`).
// Per VIN:
//   - Refresh access token if within 5 min of expiry.
//   - Non-waking `vehicle_data?endpoints=vehicle_state` call.
//   - On 408/503 (asleep) → skip, do NOT wake_up.
//   - Otherwise write a Proof-of-Delta™ ev_miles row and update lifetime.
//
// verify_jwt = false — invoked by pg_cron with service-role header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_TOKEN_URL = "https://auth.tesla.com/oauth2/v3/token";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function refreshTeslaToken(
  supabase: any,
  userId: string,
  refreshToken: string,
): Promise<string | null> {
  const clientId = Deno.env.get("TESLA_CLIENT_ID");
  const clientSecret = Deno.env.get("TESLA_CLIENT_SECRET");
  if (!clientId || !clientSecret || !refreshToken) return null;
  try {
    const r = await fetch(TESLA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });
    if (!r.ok) {
      console.error("[odometer-cron] token refresh failed:", await r.text());
      return null;
    }
    const j = await r.json();
    await supabase
      .from("energy_tokens")
      .update({
        access_token: j.access_token,
        refresh_token: j.refresh_token || refreshToken,
        expires_at: j.expires_in
          ? new Date(Date.now() + j.expires_in * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "tesla");
    return j.access_token;
  } catch (e) {
    console.error("[odometer-cron] refresh error", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let body: any = {};
  try { body = await req.json(); } catch { /* cron sends empty body */ }
  const onlyVin: string | null = body?.vin ?? null;
  const onlyUser: string | null = body?.user_id ?? null;

  const nowMs = Date.now();
  const nowIso = new Date().toISOString();
  const recordedAt = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
    new Date().getHours(),
  ).toISOString();

  let polled = 0;
  let skipped = 0;
  let asleep = 0;
  let credited = 0;
  let errors = 0;

  try {
    let q = supabase
      .from("connected_devices")
      .select("user_id, device_id, device_type, lifetime_totals, baseline_data, last_known_state")
      .eq("provider", "tesla");
    if (onlyVin) q = q.eq("device_id", onlyVin);
    if (onlyUser) q = q.eq("user_id", onlyUser);
    const { data: devices, error } = await q;
    if (error) throw error;

    for (const d of devices || []) {
      if (d.device_type && !["vehicle", "ev", "tesla_vehicle"].includes(d.device_type)) {
        continue;
      }

      const { data: tokenRow } = await supabase
        .from("energy_tokens")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", d.user_id)
        .eq("provider", "tesla")
        .maybeSingle();
      if (!tokenRow?.access_token) { skipped += 1; continue; }

      let accessToken = tokenRow.access_token as string;
      if (
        tokenRow.expires_at &&
        new Date(tokenRow.expires_at).getTime() - nowMs < 5 * 60 * 1000
      ) {
        const t = await refreshTeslaToken(supabase, d.user_id, tokenRow.refresh_token);
        if (t) accessToken = t;
      }

      try {
        const r = await fetch(
          `${TESLA_API_BASE}/api/1/vehicles/${d.device_id}/vehicle_data?endpoints=${encodeURIComponent("vehicle_state")}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        polled += 1;

        if (r.status === 408 || r.status === 503) {
          // Asleep — do NOT wake. Note it and move on.
          asleep += 1;
          await r.text().catch(() => "");
          continue;
        }
        if (!r.ok) {
          errors += 1;
          console.error(`[odometer-cron] ${d.device_id} status ${r.status}`);
          await r.text().catch(() => "");
          continue;
        }

        const j = await r.json();
        const vs = j?.response?.vehicle_state ?? {};
        const odo = Number(vs.odometer ?? 0);
        if (!(odo > 0)) { skipped += 1; continue; }

        // Proof-of-Delta ev_miles row (matches tesla-data pattern)
        const { data: prevRow } = await supabase
          .from("energy_production")
          .select("proof_metadata, production_wh")
          .eq("device_id", d.device_id)
          .eq("provider", "tesla")
          .eq("data_type", "ev_miles")
          .eq("user_id", d.user_id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const prevHash = (prevRow?.proof_metadata as any)?.hash || "genesis";
        const prevValue = Number(prevRow?.production_wh || 0);
        const hash = await sha256Hex(`${d.device_id}|${nowIso}|${odo}|${prevHash}`);
        const delta = Math.max(0, odo - prevValue);
        if (delta > 0) credited += delta;

        await supabase.from("energy_production").upsert({
          user_id: d.user_id,
          device_id: d.device_id,
          provider: "tesla",
          production_wh: odo,
          data_type: "ev_miles",
          recorded_at: recordedAt,
          proof_metadata: {
            hash,
            prev_hash: prevHash,
            device_id: d.device_id,
            value: odo,
            prev_value: prevValue,
            delta,
            data_type: "ev_miles",
            unit: "miles",
            timestamp: nowIso,
            algorithm: "SHA-256",
            preimage_format: "device_id|timestamp|value|prevHash",
            source: "odometer_cron",
          },
        }, { onConflict: "device_id,provider,recorded_at,data_type" });

        // Keep lifetime_totals.odometer fresh so dashboard lifetime views work.
        const lifetime = (d.lifetime_totals as any) || {};
        await supabase
          .from("connected_devices")
          .update({
            lifetime_totals: {
              ...lifetime,
              odometer: odo,
              last_known_odometer: odo,
              updated_at: nowIso,
            },
            last_known_state: {
              ...((d.last_known_state as any) || {}),
              online: true,
              last_odometer_seen_at: nowIso,
            },
          })
          .eq("user_id", d.user_id)
          .eq("provider", "tesla")
          .eq("device_id", d.device_id);
      } catch (e) {
        errors += 1;
        console.error("[odometer-cron] vin error", d.device_id, e);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        polled,
        skipped,
        asleep,
        credited_miles: credited,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("tesla-odometer-cron error", err);
    return new Response(
      JSON.stringify({ error: String((err as Error).message || err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
