// tesla-fsd-backfill — one-shot per Tesla vehicle.
//
// HONESTY NOTE (per Proof-of-Delta SSOT): Tesla provides NO historical
// AutopilotState. Any estimate (% of EV miles, etc.) would fabricate Proof-
// of-Delta evidence and break the 1:1 mint-ratio invariant. So this job
// seeds lifetime_fsd_miles = 0 and marks the backfill complete. Real FSD
// miles only start accruing once tesla-telemetry-webhook receives events.
//
// Idempotent: re-running is a no-op once metadata.fsd_backfill_done = true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const explicitVin = body.vin ? String(body.vin) : null;
    const explicitUser = body.user_id ? String(body.user_id) : null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase
      .from("connected_devices")
      .select("user_id, device_id, metadata, lifetime_totals, baseline_data, last_known_state, device_type")
      .eq("provider", "tesla");

    if (explicitVin) query = query.eq("device_id", explicitVin);
    if (explicitUser) query = query.eq("user_id", explicitUser);

    const { data: devices, error } = await query;
    if (error) throw error;

    let seeded = 0;
    let skipped = 0;

    for (const d of devices || []) {
      // Only vehicles can have FSD miles. Solar/battery sites are skipped.
      if (d.device_type && !["vehicle", "ev", "tesla_vehicle"].includes(d.device_type)) {
        continue;
      }
      const meta = (d.metadata as any) || {};
      if (meta.fsd_backfill_done) { skipped += 1; continue; }

      const lifetime = (d.lifetime_totals as any) || {};
      const baseline = (d.baseline_data as any) || {};
      const lastState = (d.last_known_state as any) || {};

      await supabase
        .from("connected_devices")
        .update({
          metadata: { ...meta, fsd_backfill_done: true, fsd_backfill_at: new Date().toISOString() },
          lifetime_totals: { ...lifetime, lifetime_fsd_miles: lifetime.lifetime_fsd_miles ?? 0 },
          baseline_data:   { ...baseline, fsd_baseline_miles: baseline.fsd_baseline_miles ?? 0 },
          last_known_state: {
            ...lastState,
            fsd_accumulator: lastState.fsd_accumulator ?? {
              engaged: false,
              in_drive: false,
              last_odometer: lifetime.odometer ?? 0,
              last_event_at: null,
              supervised_miles: 0,
              unsupervised_miles: 0,
            },
          },
        })
        .eq("user_id", d.user_id)
        .eq("provider", "tesla")
        .eq("device_id", d.device_id);

      seeded += 1;
    }

    return new Response(JSON.stringify({
      ok: true,
      seeded,
      skipped,
      note: "lifetime_fsd_miles seeded to 0 — no historical FSD data from Tesla. Real miles will accrue from telemetry going forward.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("tesla-fsd-backfill error:", err);
    return new Response(JSON.stringify({ error: String((err as Error).message || err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
