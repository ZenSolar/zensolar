// tesla-fsd-sampler — adaptive polling fallback for HW3 vehicles where Tesla
// does NOT emit `SelfDrivingMilesSinceReset`.
//
// Cron drives this every 5 minutes. Per VIN we apply our own adaptive cadence:
//   - active driving:   sample every 5 min
//   - idle (awake):     sample every 30 min
//   - asleep / offline: sample every 6 h
//
// We NEVER force-wake an asleep car (would drain the 12V battery and burn API
// quota). When `tesla-telemetry-webhook` has already credited `fsd_source =
// 'official'` for a VIN in the last 7 days, we skip the calculated path entirely.
//
// verify_jwt = false — invoked by pg_cron via service-role header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  applyOdometerSample,
  defaultSamplerState,
  extractAutopilotState,
  extractOfficialFsdMiles,
  nextPollIntervalSec,
  resolveFsdMiles,
  type FsdSamplerState,
} from "../_shared/fsdSampler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_TOKEN_URL = "https://auth.tesla.com/oauth2/v3/token";
const OFFICIAL_PREFERENCE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
// Telemetry-gated inference: only credit `InferredDriveMoving` miles when
// tesla-telemetry-webhook has previously seen a confirmed engaged AutopilotState
// for this VIN within this window. Without a trust anchor, we refuse to credit
// HW3 fallback miles — preventing normal manual driving from being counted as FSD.
const INFERRED_TRUST_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function refreshTeslaToken(supabase: any, userId: string, refreshToken: string): Promise<string | null> {
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
      console.error("[fsd-sampler] token refresh failed:", await r.text());
      return null;
    }
    const j = await r.json();
    await supabase
      .from("energy_tokens")
      .update({
        access_token: j.access_token,
        refresh_token: j.refresh_token || refreshToken,
        expires_at: j.expires_in ? new Date(Date.now() + j.expires_in * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "tesla");
    return j.access_token;
  } catch (e) {
    console.error("[fsd-sampler] refresh error", e);
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
  const forcePoll = body?.force === true;

  const nowMs = Date.now();
  const nowIso = new Date().toISOString();
  let polled = 0;
  let skipped = 0;
  let credited = 0;
  let errors = 0;

  try {
    // Pull all Tesla vehicle devices. One row per VIN.
    let q = supabase
      .from("connected_devices")
      .select("user_id, device_id, device_type, lifetime_totals, baseline_data, last_known_state")
      .eq("provider", "tesla");
    if (onlyVin) q = q.eq("device_id", onlyVin);
    const { data: devices, error } = await q;
    if (error) throw error;

    for (const d of devices || []) {
      if (d.device_type && !["vehicle", "ev", "tesla_vehicle"].includes(d.device_type)) continue;

      const lifetime = (d.lifetime_totals as any) || {};
      const baseline = (d.baseline_data as any) || {};
      const lastState = (d.last_known_state as any) || {};
      const sampler: FsdSamplerState = lastState.fsd_sampler
        || defaultSamplerState(Number(lifetime.odometer ?? 0));
      const sourceMeta = (lastState.fsd_source_meta as any) || {};
      const lastSource: string | null = sourceMeta.last_source ?? lastState.fsd_source ?? null;
      const lastSourceUpdatedAt = sourceMeta.last_updated_at
        ? new Date(sourceMeta.last_updated_at).getTime() : 0;

      // If Fleet Telemetry has produced an official value recently, skip the
      // polling fallback — official wins and we don't want to waste API calls.
      if (lastSource === "official" && nowMs - lastSourceUpdatedAt < OFFICIAL_PREFERENCE_WINDOW_MS) {
        skipped += 1;
        continue;
      }

      // Adaptive cadence based on the LAST observed activity.
      const lastSampleAtMs = sampler.last_sample_at ? new Date(sampler.last_sample_at).getTime() : 0;
      const wasAwake = lastState.online === true || lastState.online === undefined;
      const wasInDrive = (lastState.last_shift_state ?? "").toUpperCase().startsWith("D");
      const wasMoving = (lastState.last_speed_mph ?? 0) > 0;
      const hasActivityHints = lastState.last_shift_state != null || lastState.last_speed_mph != null;
      const intervalSec = hasActivityHints
        ? nextPollIntervalSec({ in_drive: wasInDrive, moving: wasMoving, awake: wasAwake })
        : 5 * 60;
      if (!forcePoll && lastSampleAtMs && (nowMs - lastSampleAtMs) < intervalSec * 1000) {
        skipped += 1;
        continue;
      }

      // Need a valid access token for this user.
      const { data: tokenRow } = await supabase
        .from("energy_tokens")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", d.user_id)
        .eq("provider", "tesla")
        .maybeSingle();
      if (!tokenRow?.access_token) { skipped += 1; continue; }

      let accessToken = tokenRow.access_token as string;
      if (tokenRow.expires_at && new Date(tokenRow.expires_at).getTime() - nowMs < 5 * 60 * 1000) {
        const t = await refreshTeslaToken(supabase, d.user_id, tokenRow.refresh_token);
        if (t) accessToken = t;
      }

      // Non-waking vehicle_data call.
      try {
        const r = await fetch(
          `${TESLA_API_BASE}/api/1/vehicles/${d.device_id}/vehicle_data?endpoints=${encodeURIComponent("vehicle_state;drive_state")}`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        polled += 1;
        if (r.status === 408 || r.status === 503) {
          // Asleep — record activity and move on (no wake_up).
          sampler.last_sample_at = nowIso;
          await supabase
            .from("connected_devices")
            .update({
              last_known_state: {
                ...lastState,
                online: false,
                fsd_sampler: sampler,
              },
            })
            .eq("user_id", d.user_id).eq("provider", "tesla").eq("device_id", d.device_id);
          continue;
        }
        if (!r.ok) {
          errors += 1;
          await r.text().catch(() => "");
          continue;
        }
        const j = await r.json();
        const resp = j?.response || {};
        const vs = resp.vehicle_state || {};
        const ds = resp.drive_state || {};

        const odo = Number(vs.odometer ?? ds.odometer ?? 0);
        const shift = ds.shift_state ?? null;
        const speed = typeof ds.speed === "number" ? ds.speed : null;
        const rawAp = extractAutopilotState(resp);
        // Telemetry-gated inference: only fall back to `InferredDriveMoving`
        // when Fleet Telemetry has previously confirmed real FSD engagement on
        // this VIN within INFERRED_TRUST_WINDOW_MS. Otherwise leave ap = null
        // so applyOdometerSample returns `not_engaged` (no credit).
        const lastEngagedAtMs = sourceMeta.last_engaged_at
          ? new Date(sourceMeta.last_engaged_at).getTime() : 0;
        const inferenceTrusted = lastEngagedAtMs > 0
          && (nowMs - lastEngagedAtMs) < INFERRED_TRUST_WINDOW_MS;
        const ap = rawAp
          ?? (inferenceTrusted
            && ((shift ?? "").toUpperCase().startsWith("D") || (speed ?? 0) > 0 || odo > (sampler.last_odometer_mi || 0))
              ? "InferredDriveMoving"
              : null);

        const result = applyOdometerSample(sampler, {
          odometer_mi: odo,
          autopilot_state: ap,
          shift_state: shift,
          speed,
          sample_at: nowIso,
        });

        if (result.miles_added > 0) credited += result.miles_added;

        const officialMiles = extractOfficialFsdMiles(resp);
        const resolved = resolveFsdMiles(officialMiles, result.state);
        const fsdSource = resolved.source;

        // Write Proof-of-Delta row only when cumulative changed.
        const prevLifetime = Number(lifetime.lifetime_fsd_miles ?? 0);
        if (resolved.miles > prevLifetime) {
          const { data: prevRow } = await supabase
            .from("energy_production")
            .select("proof_metadata, production_wh")
            .eq("device_id", d.device_id)
            .eq("provider", "tesla")
            .eq("data_type", "fsd_miles")
            .eq("user_id", d.user_id)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const prevHash = (prevRow?.proof_metadata as any)?.hash || "genesis";
          const prevValue = Number(prevRow?.production_wh || 0);
          const hash = await sha256Hex(`${d.device_id}|${nowIso}|${resolved.miles}|${prevHash}`);
          await supabase.from("energy_production").upsert({
            user_id: d.user_id,
            device_id: d.device_id,
            provider: "tesla",
            production_wh: resolved.miles,
            data_type: "fsd_miles",
            recorded_at: nowIso,
            proof_metadata: {
              hash,
              prev_hash: prevHash,
              device_id: d.device_id,
              value: resolved.miles,
              prev_value: prevValue,
              delta: Math.max(0, resolved.miles - prevValue),
              data_type: "fsd_miles",
              unit: "miles",
              timestamp: nowIso,
              algorithm: "SHA-256",
              preimage_format: "device_id|timestamp|value|prevHash",
              source: fsdSource,
              sampler_reason: result.reason,
               autopilot_state: rawAp,
               autopilot_inferred: rawAp === null && ap === "InferredDriveMoving",
            },
          }, { onConflict: "device_id,provider,recorded_at,data_type" });
        }

        // Persist sampler + source flag + activity hints for the next cadence calc.
        const firstSampleAt = sourceMeta.first_sample_at
          || result.state.first_sample_at
          || nowIso;
        await supabase
          .from("connected_devices")
          .update({
            lifetime_totals: {
              ...lifetime,
              lifetime_fsd_miles: resolved.miles,
              updated_at: nowIso,
            },
            baseline_data: {
              ...baseline,
              fsd_baseline_miles: baseline.fsd_baseline_miles ?? 0,
            },
            last_known_state: {
              ...lastState,
              online: true,
              last_shift_state: shift,
              last_speed_mph: speed,
              fsd_sampler: result.state,
              fsd_source: fsdSource,
              fsd_source_meta: {
                ...sourceMeta,
                first_sample_at: firstSampleAt,
                last_source: fsdSource,
                last_updated_at: nowIso,
              },
            },
          })
          .eq("user_id", d.user_id)
          .eq("provider", "tesla")
          .eq("device_id", d.device_id);
      } catch (e) {
        errors += 1;
        console.error("[fsd-sampler] vin error", d.device_id, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, polled, skipped, credited_miles: credited, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("tesla-fsd-sampler error", err);
    return new Response(JSON.stringify({ error: String((err as Error).message || err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
