// tesla-odometer-cron — server-side odometer sampler for ALL connected Tesla
// vehicles, so ev_miles rows accumulate whether or not the user opens the app.
//
// Cron drives this every 3 hours (see pg_cron job `tesla-odometer-cron-3h`).
// Per VIN:
//   - Refresh access token if within 5 min of expiry.
//   - Non-waking `vehicle_data?endpoints=vehicle_state` call.
//   - On 408/503 (asleep) → skip, do NOT wake_up.
//   - Otherwise write a Proof-of-Delta ev_miles row and update lifetime.
//
// verify_jwt = false — invoked by pg_cron with service-role header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTeslaAccessToken } from '../_shared/teslaToken.ts';

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

/**
 * Delegates to the ONE Tesla refresh authority in _shared/teslaToken.ts.
 *
 * Tesla rotates refresh tokens on every use and invalidates the presented
 * one, so a private refresh copy per function is a race: parallel callers
 * present the same token, all but one are rejected with `login_required`,
 * and that rejection was being misreported as the member revoking consent.
 * The broker serialises via compare-and-swap and recovers lost races.
 *
 * `_unusedRefreshToken` is accepted only to keep existing call sites intact;
 * the broker reads the authoritative row itself and must never be handed a
 * refresh token captured earlier in a request.
 */
async function refreshTeslaToken(
  client: any,
  userId: string,
  _unusedRefreshToken?: string,
): Promise<string | null> {
  const r = await getTeslaAccessToken(client, userId);
  return r.ok ? r.accessToken : null;
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
      .select("user_id, device_id, device_type, lifetime_totals, baseline_data, last_known_state, paused_for_testing")
      .eq("provider", "tesla")
      .eq("paused_for_testing", false);
    if (onlyVin) q = q.eq("device_id", onlyVin);
    if (onlyUser) q = q.eq("user_id", onlyUser);
    const { data: devices, error } = await q;
    if (error) throw error;

    // Smart-skip: only poll users seen in the last 30 days (skip abandoned accounts
    // to keep Tesla Fleet API cost bounded). onlyVin/onlyUser bypass the filter.
    let activeUserIds: Set<string> | null = null;
    if (!onlyVin && !onlyUser) {
      const cutoff = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .gte("last_seen_at", cutoff);
      activeUserIds = new Set((activeProfiles || []).map((p: any) => p.user_id));
    }

    for (const d of devices || []) {
      if (activeUserIds && !activeUserIds.has(d.user_id)) { skipped += 1; continue; }
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

        const prevMeta = (prevRow?.proof_metadata as any) || null;
        const prevHash = prevMeta?.hash || "genesis";
        // Cumulative snapshot lives in proof_metadata.value; production_wh is
        // the issuable delta and must never be read as a running total.
        const prevValue = prevMeta && prevMeta.value !== undefined && prevMeta.value !== null
          ? Number(prevMeta.value)
          : Number(prevRow?.production_wh || 0);
        const hash = await sha256Hex(`${d.device_id}|${nowIso}|${odo}|${prevHash}`);
        const delta = Math.max(0, odo - (Number.isFinite(prevValue) ? prevValue : 0));
        if (delta > 0) credited += delta;

        await supabase.from("energy_production").upsert({
          user_id: d.user_id,
          device_id: d.device_id,
          provider: "tesla",
          production_wh: delta,
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
