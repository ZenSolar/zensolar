// tesla-telemetry-config — register Fleet Telemetry streaming for a VIN.
//
// Called once per Tesla vehicle (and re-run on config drift). Subscribes Tesla
// to stream AutopilotState + Odometer + Gear + Speed events to our
// tesla-telemetry-webhook endpoint at 1 Hz, which feeds the FSD Miles KPI.
//
// Honest scope:
//   - Tesla pushes ONLY future events. No historical AutopilotState exists.
//   - On first successful config, we seed lifetime_fsd_miles = 0 (see
//     tesla-fsd-backfill). Real FSD miles accrue from this moment on.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

// Fields we ask Tesla to stream. AutopilotState + Gear + Odometer is the
// minimum set required to credit FSD miles. Speed/Location are nice-to-have
// for sanity-checking deltas (glitch rejection).
//
// Cadence: 1000ms (1Hz). User-approved for current scale. We can dial down
// to 5000ms later to reduce bandwidth.
function buildTelemetryConfig(webhookUrl: string) {
  return {
    hostname: new URL(webhookUrl).host,
    port: 443,
    ca: "",
    fields: {
      AutopilotState:  { interval_seconds: 1 },
      AutosteerCmd:    { interval_seconds: 1 },
      Gear:            { interval_seconds: 1 },
      Odometer:        { interval_seconds: 1 },
      VehicleSpeed:    { interval_seconds: 1 },
    },
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year
  };
}

// Stable hash of a config object so we can detect drift without redeploying.
async function configHash(cfg: unknown): Promise<string> {
  const data = new TextEncoder().encode(JSON.stringify(cfg));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const vin = String(body.vin || "").trim();
    if (!vin) {
      return new Response(JSON.stringify({ error: "vin required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Locate the user's Tesla device (token lives in energy_tokens).
    const { data: device } = await supabase
      .from("connected_devices")
      .select("device_id, device_metadata, lifetime_totals, baseline_data, last_known_state")
      .eq("user_id", userId)
      .eq("provider", "tesla")
      .eq("device_id", vin)
      .maybeSingle();

    if (!device) {
      return new Response(JSON.stringify({ error: "vehicle_not_claimed" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // energy_tokens is service-role-only (RLS). Use a privileged client just for this read.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: tokenRow } = await admin
      .from("energy_tokens")
      .select("access_token")
      .eq("user_id", userId)
      .eq("provider", "tesla")
      .maybeSingle();
    const accessToken = tokenRow?.access_token as string | undefined;

    const deviceMeta = (device.device_metadata as any) || {};
    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/tesla-telemetry-webhook`;
    const cfg = buildTelemetryConfig(webhookUrl);
    const newHash = await configHash(cfg);
    const currentHash = deviceMeta?.telemetry_config?.hash;

    let teslaResult: { ok: boolean; status: number; body: string } = { ok: true, status: 0, body: "skipped_no_token" };

    if (accessToken && currentHash !== newHash) {
      const resp = await fetch(`${TESLA_API_BASE}/api/1/vehicles/fleet_telemetry_config`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vins: [vin], config: cfg }),
      });
      teslaResult = { ok: resp.ok, status: resp.status, body: await resp.text() };
    } else if (!accessToken) {
      teslaResult = { ok: false, status: 0, body: "no_access_token_in_energy_tokens" };
    }

    const lifetime = (device.lifetime_totals as any) || {};
    const baseline = (device.baseline_data as any) || {};
    const lastState = (device.last_known_state as any) || {};

    const firstTime = !deviceMeta.telemetry_config;
    const updatedMeta = {
      ...deviceMeta,
      telemetry_config: {
        hash: newHash,
        applied_at: new Date().toISOString(),
        ok: teslaResult.ok,
        status: teslaResult.status,
        response: teslaResult.body?.slice(0, 500),
      },
      fsd_backfill_done: firstTime ? true : deviceMeta.fsd_backfill_done ?? false,
    };

    const updatedLifetime = {
      ...lifetime,
      lifetime_fsd_miles: lifetime.lifetime_fsd_miles ?? 0,
    };
    const updatedBaseline = {
      ...baseline,
      fsd_baseline_miles: baseline.fsd_baseline_miles ?? 0,
    };
    const updatedLastState = {
      ...lastState,
      fsd_accumulator: lastState.fsd_accumulator ?? {
        engaged: false,
        last_odometer: lifetime.odometer ?? 0,
        last_event_at: null,
        supervised_miles: 0,
        unsupervised_miles: 0,
      },
    };

    await supabase
      .from("connected_devices")
      .update({
        device_metadata: updatedMeta,
        lifetime_totals: updatedLifetime,
        baseline_data: updatedBaseline,
        last_known_state: updatedLastState,
      })
      .eq("user_id", userId)
      .eq("provider", "tesla")
      .eq("device_id", vin);


    return new Response(JSON.stringify({
      success: true,
      vin,
      tesla: teslaResult,
      config_hash: newHash,
      first_time: firstTime,
      lifetime_fsd_miles: updatedLifetime.lifetime_fsd_miles,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("tesla-telemetry-config error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message || err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
