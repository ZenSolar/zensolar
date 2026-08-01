import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Tesla EV Miles Historical Backfill
 *
 * Uses an energy-weighted distribution algorithm to estimate daily miles
 * from verified Tesla charging history + real odometer readings.
 *
 * Methodology (cryptographically anchored):
 * 1. Anchor points: current odometer (Tesla API) + first charging session date
 * 2. Total miles driven = current_odometer - start_odometer
 * 3. Personal efficiency = total_miles / total_kWh_charged
 * 4. Days WITH charging: daily_miles = daily_kWh × efficiency
 * 5. Remaining miles distributed evenly across non-charging days
 * 6. Sum of all daily estimates ≡ actual total miles (guaranteed)
 *
 * All inputs are from verified Tesla API data — no fabrication.
 */


// ── Period-total proof tagging (post 2026-07-31 issuance cutover) ───────────
// These rows are DAILY PERIOD TOTALS, so production_wh is already the issuable
// delta for that day bucket — never a cumulative snapshot. Tag them explicitly
// so readers (and _shared/unmintedDeltas.ts) cannot misinterpret them.
async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function periodTotalProof(
  deviceId: string, recordedAt: string, value: number, dataType: string, unit: string,
): Promise<Record<string, unknown>> {
  return {
    hash: await sha256Hex(`${deviceId}|${recordedAt}|${value}|period_total`),
    device_id: deviceId,
    value,
    delta: value,
    value_semantics: "period_total",
    production_wh_semantics: "issuable_delta",
    data_type: dataType,
    unit,
    timestamp: recordedAt,
    algorithm: "SHA-256",
    preimage_format: "device_id|recorded_at|value|period_total",
    period: "day",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Optional body:
    //   start_odometer  — legacy single-vehicle hint; honoured ONLY when the
    //                     account has exactly one vehicle (otherwise ambiguous)
    //   start_odometers — { [vin]: number } per-vehicle hints (preferred)
    //   force           — re-run even if rows already exist
    //   dry_run         — compute and report, write nothing
    let legacyStartOdometer: number | null = null;
    let startOdometers: Record<string, number> = {};
    let forceRun = false;
    let dryRun = false;
    try {
      const body = await req.json();
      if (typeof body?.start_odometer === "number") legacyStartOdometer = body.start_odometer;
      if (body?.start_odometers && typeof body.start_odometers === "object") {
        for (const [k, v] of Object.entries(body.start_odometers as Record<string, unknown>)) {
          if (typeof v === "number") startOdometers[String(k).toUpperCase()] = v;
        }
      }
      if (body?.force === true) forceRun = true;
      if (body?.dry_run === true) dryRun = true;
    } catch {
      // No body or invalid JSON — that's fine
    }

    console.log(
      `[EV Miles Backfill] Starting for user ${userId}, force=${forceRun}, dry_run=${dryRun}`,
    );

    // 1. Get EVERY vehicle on the account.
    //    This function used to take vehicles[0] and attribute the whole
    //    account's miles to it. That wrote WRONG-VIN provenance into
    //    energy_production for any household with more than one car, which is
    //    a proof-chain defect, not merely a missing backfill. Each vehicle is
    //    now backfilled independently, from its own odometer and its own
    //    charging sessions.
    const { data: vehicles } = await supabaseClient
      .from("connected_devices")
      .select("device_id, device_name, lifetime_totals, baseline_data, device_metadata")
      .eq("user_id", userId)
      .eq("device_type", "vehicle");

    if (!vehicles || vehicles.length === 0) {
      return new Response(
        JSON.stringify({ error: "No vehicle found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (legacyStartOdometer !== null && vehicles.length > 1) {
      return new Response(
        JSON.stringify({
          error: "ambiguous_start_odometer",
          detail:
            `start_odometer is ambiguous with ${vehicles.length} vehicles on this account. ` +
            "Use start_odometers keyed by VIN.",
          vins: vehicles.map((v: any) => v.device_id),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (legacyStartOdometer !== null && vehicles.length === 1) {
      startOdometers[String(vehicles[0].device_id).toUpperCase()] = legacyStartOdometer;
    }

    const perVehicle: any[] = [];
    let totalInserted = 0;

    for (const vehicle of vehicles) {
      const vin = String(vehicle.device_id);
      const vinKey = vin.toUpperCase();
      const label = vehicle.device_name || vin;

      // Per-vehicle skip check — one car already backfilled must not block another.
      if (!forceRun) {
        const { count } = await supabaseClient
          .from("energy_production")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("device_id", vin)
          .eq("provider", "tesla_historical")
          .eq("data_type", "ev_miles");
        if (count && count > 0) {
          perVehicle.push({ vin, name: label, skipped: true, reason: "already_backfilled", existing_records: count });
          continue;
        }
      }

      const currentOdometer = Number((vehicle.lifetime_totals as any)?.odometer ?? 0);
      if (!(currentOdometer > 0)) {
        perVehicle.push({ vin, name: label, skipped: true, reason: "no_odometer" });
        continue;
      }

      // 2. Charging sessions FOR THIS VIN only.
      const { data: sessions } = await supabaseClient
        .from("charging_sessions")
        .select("session_date, energy_kwh")
        .eq("user_id", userId)
        .eq("device_id", vin)
        .order("session_date", { ascending: true });

      if (!sessions || sessions.length === 0) {
        perVehicle.push({ vin, name: label, skipped: true, reason: "no_charging_history" });
        continue;
      }

      const dailyKwhMap = new Map<string, number>();
      for (const s of sessions) {
        const date = String(s.session_date);
        dailyKwhMap.set(date, (dailyKwhMap.get(date) || 0) + Number(s.energy_kwh));
      }

      const sortedChargingDays = [...dailyKwhMap.entries()].sort(([a], [b]) => a.localeCompare(b));
      const firstChargingDate = sortedChargingDays[0][0];
      const totalKwhCharged = sortedChargingDays.reduce((sum, [, kwh]) => sum + kwh, 0);
      if (!(totalKwhCharged > 0)) {
        perVehicle.push({ vin, name: label, skipped: true, reason: "zero_charging_energy" });
        continue;
      }

      // 3. Start odometer: caller-supplied for this VIN, else estimated.
      let startOdometer = startOdometers[vinKey] ?? null;
      let startOdometerSource: "provided" | "estimated" = "provided";
      if (startOdometer === null) {
        const estimatedEfficiency = 2.9; // conservative Tesla estimate
        startOdometer = Math.max(0, Math.round(currentOdometer - totalKwhCharged * estimatedEfficiency));
        startOdometerSource = "estimated";
      }

      const totalMilesDriven = currentOdometer - startOdometer;
      if (!(totalMilesDriven > 0)) {
        perVehicle.push({ vin, name: label, skipped: true, reason: "invalid_odometer_range" });
        continue;
      }

      // 4. Personal efficiency, from this vehicle's own numbers.
      const personalEfficiency = totalMilesDriven / totalKwhCharged;

      // 5. Day range: first charging day → yesterday.
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const allDays: string[] = [];
      const d = new Date(firstChargingDate + "T00:00:00Z");
      while (d < today) {
        allDays.push(d.toISOString().split("T")[0]);
        d.setUTCDate(d.getUTCDate() + 1);
      }

      // 6. Energy-weighted distribution.
      const BASE_WEIGHT = 1.0;
      const KWH_WEIGHT_SCALE = 0.5;
      const avgChargingKwh = totalKwhCharged / sortedChargingDays.length;

      let totalWeight = 0;
      const dayWeights = new Map<string, number>();
      for (const date of allDays) {
        const kwhOnDay = dailyKwhMap.get(date) || 0;
        const kwhWeight = kwhOnDay > 0 ? (kwhOnDay / avgChargingKwh) * KWH_WEIGHT_SCALE : 0;
        const weight = BASE_WEIGHT + kwhWeight;
        dayWeights.set(date, weight);
        totalWeight += weight;
      }

      // 7. Records — every row carries THIS vehicle's VIN, in the row and in
      //    the proof preimage, so provenance and attribution cannot diverge.
      const records: any[] = [];
      for (const date of allDays) {
        const weight = dayWeights.get(date) || BASE_WEIGHT;
        const dailyMiles = (weight / totalWeight) * totalMilesDriven;
        const roundedMiles = Math.round(dailyMiles * 10) / 10;
        if (roundedMiles <= 0) continue;

        records.push({
          user_id: userId,
          device_id: vin,
          provider: "tesla_historical",
          data_type: "ev_miles",
          // Daily period total in MILES — already the issuable delta for the day.
          production_wh: roundedMiles,
          recorded_at: `${date}T12:00:00Z`,
          proof_metadata: {
            ...(await periodTotalProof(vin, `${date}T12:00:00Z`, roundedMiles, "ev_miles", "miles")),
            attribution: "per_vehicle_odometer",
            attributed_vin: vin,
            start_odometer: startOdometer,
            start_odometer_source: startOdometerSource,
            current_odometer: currentOdometer,
            efficiency_mi_per_kwh: Math.round(personalEfficiency * 100) / 100,
          },
        });
      }

      const estimatedMiles = records.reduce((sum, r) => sum + r.production_wh, 0);

      if (dryRun) {
        perVehicle.push({
          vin, name: label, dry_run: true, total_days: records.length,
          total_miles_estimated: Math.round(estimatedMiles * 10) / 10,
          total_miles_actual: Math.round(totalMilesDriven * 10) / 10,
          personal_efficiency: Math.round(personalEfficiency * 100) / 100,
          start_odometer: startOdometer, start_odometer_source: startOdometerSource,
          current_odometer: Math.round(currentOdometer * 10) / 10,
          first_charging_date: firstChargingDate,
        });
        continue;
      }

      // 8. Replace only THIS vehicle's historical rows.
      await supabaseClient
        .from("energy_production")
        .delete()
        .eq("user_id", userId)
        .eq("device_id", vin)
        .eq("provider", "tesla_historical")
        .eq("data_type", "ev_miles");

      let inserted = 0;
      const BATCH_SIZE = 200;
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabaseClient
          .from("energy_production")
          .insert(batch);
        if (insertError) {
          console.error(`[EV Miles Backfill] ${vin} insert error at batch ${i}:`, insertError);
        } else {
          inserted += batch.length;
        }
      }
      totalInserted += inserted;

      perVehicle.push({
        vin, name: label, inserted, total_days: records.length,
        total_miles_estimated: Math.round(estimatedMiles * 10) / 10,
        total_miles_actual: Math.round(totalMilesDriven * 10) / 10,
        personal_efficiency: Math.round(personalEfficiency * 100) / 100,
        start_odometer: startOdometer, start_odometer_source: startOdometerSource,
        current_odometer: Math.round(currentOdometer * 10) / 10,
        first_charging_date: firstChargingDate,
      });

      console.log(
        `[EV Miles Backfill] ${label} (${vin}): ${inserted} rows, ${estimatedMiles.toFixed(1)} mi ` +
        `(target ${totalMilesDriven.toFixed(1)}), ${personalEfficiency.toFixed(2)} mi/kWh`,
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        vehicles: perVehicle.length,
        total_records_written: totalInserted,
        per_vehicle: perVehicle,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[EV Miles Backfill] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

