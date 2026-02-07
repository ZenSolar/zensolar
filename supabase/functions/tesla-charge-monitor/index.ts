import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_TOKEN_URL =
  "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";

// ── Helpers ──────────────────────────────────────────────────────────────────

function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "ZenSolar/1.0" },
    });
    if (!resp.ok) return null;
    const results = await resp.json();
    if (results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
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
    if (!resp.ok) return null;
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
    return tokens.access_token;
  } catch {
    return null;
  }
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

    // Two modes: cron (no auth → all Tesla users) or single-user (with auth)
    const authHeader = req.headers.get("Authorization");
    let targetUserIds: string[] = [];

    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      // Skip auth validation for cron calls using anon key
      if (authHeader === `Bearer ${anonKey}`) {
        const { data: tokens } = await supabase
          .from("energy_tokens")
          .select("user_id")
          .eq("provider", "tesla");
        targetUserIds = (tokens || []).map((t: any) => t.user_id);
      } else {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        if (error || !user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        targetUserIds = [user.id];
      }
    } else {
      const { data: tokens } = await supabase
        .from("energy_tokens")
        .select("user_id")
        .eq("provider", "tesla");
      targetUserIds = (tokens || []).map((t: any) => t.user_id);
    }

    console.log(`[ChargeMonitor] Processing ${targetUserIds.length} user(s)`);
    const results: any[] = [];

    for (const userId of targetUserIds) {
      try {
        await processUser(supabase, userId, results);
      } catch (err) {
        console.error(`[ChargeMonitor] Error for user ${userId.slice(0, 8)}:`, err);
        results.push({ userId: userId.slice(0, 8), error: String(err) });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: targetUserIds.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[ChargeMonitor] Fatal error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Per-user processing ──────────────────────────────────────────────────────

async function processUser(supabase: any, userId: string, results: any[]) {
  // Get Tesla token
  const { data: tokenData } = await supabase
    .from("energy_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "tesla")
    .single();
  if (!tokenData) return;

  let accessToken = tokenData.access_token;

  // Refresh if needed
  if (tokenData.expires_at) {
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      const newToken = await refreshTeslaToken(supabase, userId, tokenData.refresh_token);
      if (newToken) {
        accessToken = newToken;
      } else {
        console.log(`[ChargeMonitor] Token refresh failed for ${userId.slice(0, 8)}`);
        return;
      }
    }
  }

  // Get vehicles + home address
  const [{ data: vehicles }, { data: profile }] = await Promise.all([
    supabase
      .from("connected_devices")
      .select("device_id")
      .eq("user_id", userId)
      .eq("provider", "tesla")
      .eq("device_type", "vehicle"),
    supabase
      .from("profiles")
      .select("home_address")
      .eq("user_id", userId)
      .single(),
  ]);

  if (!vehicles || vehicles.length === 0) return;

  const homeAddress = (profile?.home_address || "").trim();
  let homeCoords: { lat: number; lng: number } | null = null;
  if (homeAddress) {
    homeCoords = await geocodeAddress(homeAddress);
    if (homeCoords) {
      console.log(`[ChargeMonitor] Home coords for ${userId.slice(0, 8)}: ${homeCoords.lat.toFixed(4)}, ${homeCoords.lng.toFixed(4)}`);
    }
  }

  for (const vehicle of vehicles) {
    const vin = vehicle.device_id;
    await processVehicle(supabase, userId, vin, accessToken, homeAddress, homeCoords, results);
  }
}

async function processVehicle(
  supabase: any,
  userId: string,
  vin: string,
  accessToken: string,
  homeAddress: string,
  homeCoords: { lat: number; lng: number } | null,
  results: any[],
) {
  // Fetch vehicle data
  const vResp = await fetch(
    `${TESLA_API_BASE}/api/1/vehicles/${vin}/vehicle_data?endpoints=charge_state;drive_state`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (vResp.status === 408) {
    // Vehicle asleep — check if we have an active session to finalize
    await finalizeStaleSession(supabase, userId, vin, "vehicle_asleep");
    results.push({ vin, status: "asleep", action: "checked_stale" });
    return;
  }
  if (vResp.status === 429) {
    console.warn(`[ChargeMonitor] Rate limited for ${vin}`);
    return;
  }
  if (!vResp.ok) {
    await vResp.text();
    return;
  }

  const vData = await vResp.json();
  const chargeState = vData.response?.charge_state || {};
  const driveState = vData.response?.drive_state || {};

  const chargingState = chargeState.charging_state; // "Charging", "Complete", "Stopped", "Disconnected"
  const chargeEnergyAdded = chargeState.charge_energy_added || 0;
  const fastChargerPresent = chargeState.fast_charger_present;
  const chargerPower = chargeState.charger_power || 0;
  const batteryLevel = chargeState.battery_level || 0;
  const vehicleLat = driveState.latitude;
  const vehicleLng = driveState.longitude;

  console.log(
    `[ChargeMonitor] ${vin}: state=${chargingState}, energy=${chargeEnergyAdded}kWh, fast=${fastChargerPresent}, power=${chargerPower}kW, bat=${batteryLevel}%`,
  );

  // Check if at home
  let isNearHome = false;
  let distFromHome: number | null = null;
  if (homeCoords && vehicleLat && vehicleLng) {
    distFromHome = haversineDistanceMiles(homeCoords.lat, homeCoords.lng, vehicleLat, vehicleLng);
    isNearHome = distFromHome < 0.5;
  }

  const isAcCharging = fastChargerPresent === false;

  // Get any active (status='charging') session for this vehicle
  const { data: activeSessions } = await supabase
    .from("home_charging_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("device_id", vin)
    .eq("status", "charging")
    .order("created_at", { ascending: false })
    .limit(1);

  const activeSession = activeSessions?.[0] || null;

  // ── STATE MACHINE ──────────────────────────────────────────────────────

  if (chargingState === "Charging" && isAcCharging) {
    // Vehicle is AC charging
    const isHome = isNearHome || (!homeCoords && isAcCharging);

    if (!isHome) {
      // AC charging but NOT at home — skip (destination charger)
      results.push({ vin, action: "ac_not_home", dist: distFromHome });
      return;
    }

    if (!activeSession) {
      // ── START new session ──
      const { error } = await supabase.from("home_charging_sessions").insert({
        user_id: userId,
        device_id: vin,
        start_time: new Date().toISOString(),
        start_kwh_added: chargeEnergyAdded,
        end_kwh_added: chargeEnergyAdded,
        total_session_kwh: 0,
        status: "charging",
        location: homeAddress || "Home",
        latitude: vehicleLat,
        longitude: vehicleLng,
        charger_power_kw: chargerPower,
        session_metadata: {
          battery_level_start: batteryLevel,
          distance_from_home_mi: distFromHome,
        },
      });

      if (error) {
        console.error(`[ChargeMonitor] Insert error:`, error);
      } else {
        console.log(`[ChargeMonitor] ▶ STARTED session for ${vin}: ${chargeEnergyAdded} kWh`);
      }
      results.push({ vin, action: "started", energy: chargeEnergyAdded });
    } else {
      // ── UPDATE existing session ──
      const { error } = await supabase
        .from("home_charging_sessions")
        .update({
          end_kwh_added: chargeEnergyAdded,
          total_session_kwh: Math.max(0, chargeEnergyAdded - activeSession.start_kwh_added),
          charger_power_kw: chargerPower,
          session_metadata: {
            ...activeSession.session_metadata,
            battery_level_latest: batteryLevel,
            last_poll: new Date().toISOString(),
          },
        })
        .eq("id", activeSession.id);

      if (error) console.error(`[ChargeMonitor] Update error:`, error);

      const totalSoFar = Math.max(0, chargeEnergyAdded - activeSession.start_kwh_added);
      console.log(`[ChargeMonitor] ⟳ UPDATED session ${activeSession.id.slice(0, 8)}: ${totalSoFar.toFixed(1)} kWh so far`);
      results.push({ vin, action: "updated", energy: totalSoFar });
    }
  } else if (
    chargingState === "Complete" ||
    chargingState === "Stopped" ||
    chargingState === "Disconnected" ||
    (chargingState === "Charging" && !isAcCharging) // switched to DC
  ) {
    // ── END session if one is active ──
    if (activeSession) {
      const finalEnergy = chargeEnergyAdded > 0
        ? chargeEnergyAdded
        : activeSession.end_kwh_added;
      const totalKwh = Math.max(0, finalEnergy - activeSession.start_kwh_added);

      const { error } = await supabase
        .from("home_charging_sessions")
        .update({
          end_time: new Date().toISOString(),
          end_kwh_added: finalEnergy,
          total_session_kwh: totalKwh,
          status: "completed",
          session_metadata: {
            ...activeSession.session_metadata,
            battery_level_end: batteryLevel,
            end_reason: chargingState,
          },
        })
        .eq("id", activeSession.id);

      if (error) console.error(`[ChargeMonitor] Complete error:`, error);

      console.log(`[ChargeMonitor] ✓ COMPLETED session ${activeSession.id.slice(0, 8)}: ${totalKwh.toFixed(1)} kWh`);

      // Also write to energy_production for Energy Log daily view
      if (totalKwh > 0) {
        await writeToEnergyProduction(supabase, userId, vin, activeSession.start_time, totalKwh);
        // Also write to charging_sessions for unified session list
        await writeToChargingSessions(supabase, userId, vin, activeSession, totalKwh, homeAddress);
      }

      results.push({ vin, action: "completed", total_kwh: totalKwh });
    } else {
      results.push({ vin, action: "no_active_session", state: chargingState });
    }
  } else {
    results.push({ vin, action: "idle", state: chargingState });
  }
}

/**
 * Finalize any stale "charging" sessions (e.g., vehicle went to sleep mid-charge).
 */
async function finalizeStaleSession(supabase: any, userId: string, vin: string, reason: string) {
  const { data: active } = await supabase
    .from("home_charging_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("device_id", vin)
    .eq("status", "charging")
    .limit(1);

  if (active && active.length > 0) {
    const session = active[0];
    const totalKwh = Math.max(0, session.end_kwh_added - session.start_kwh_added);

    await supabase
      .from("home_charging_sessions")
      .update({
        end_time: new Date().toISOString(),
        total_session_kwh: totalKwh,
        status: "completed",
        session_metadata: {
          ...session.session_metadata,
          end_reason: reason,
        },
      })
      .eq("id", session.id);

    console.log(`[ChargeMonitor] ✓ Finalized stale session ${session.id.slice(0, 8)}: ${totalKwh.toFixed(1)} kWh (${reason})`);

    if (totalKwh > 0) {
      await writeToEnergyProduction(supabase, userId, vin, session.start_time, totalKwh);
      await writeToChargingSessions(supabase, userId, vin, session, totalKwh, session.location);
    }
  }
}

/**
 * Write completed home charging to energy_production for Energy Log daily aggregation.
 */
async function writeToEnergyProduction(
  supabase: any,
  userId: string,
  vin: string,
  startTime: string,
  totalKwh: number,
) {
  const dateStr = new Date(startTime).toISOString().split("T")[0];
  const recordedAt = `${dateStr}T12:00:00Z`;

  // Get existing daily total
  const { data: existing } = await supabase
    .from("energy_production")
    .select("production_wh")
    .eq("user_id", userId)
    .eq("device_id", vin)
    .eq("provider", "tesla_home_charging")
    .eq("data_type", "ev_charging")
    .eq("recorded_at", recordedAt);

  const existingWh = existing?.[0]?.production_wh || 0;
  const newTotal = existingWh + totalKwh * 1000;

  await supabase.from("energy_production").upsert(
    {
      user_id: userId,
      device_id: vin,
      provider: "tesla_home_charging",
      production_wh: newTotal,
      data_type: "ev_charging",
      recorded_at: recordedAt,
    },
    { onConflict: "device_id,provider,recorded_at,data_type" },
  );

  console.log(`[ChargeMonitor] Wrote ${totalKwh.toFixed(1)} kWh to energy_production for ${dateStr} (total: ${(newTotal / 1000).toFixed(1)} kWh)`);
}

/**
 * Write completed session to charging_sessions for unified session list.
 */
async function writeToChargingSessions(
  supabase: any,
  userId: string,
  vin: string,
  session: any,
  totalKwh: number,
  homeAddress: string,
) {
  const dateStr = new Date(session.start_time).toISOString().split("T")[0];

  const { error } = await supabase.from("charging_sessions").insert({
    user_id: userId,
    provider: "tesla",
    device_id: vin,
    session_date: dateStr,
    energy_kwh: totalKwh,
    location: homeAddress || "Home",
    fee_amount: null,
    fee_currency: null,
    charging_type: "home",
    session_metadata: {
      source: "charge_monitor",
      home_session_id: session.id,
      ...session.session_metadata,
    },
  });

  if (error && error.code !== "23505") {
    console.error(`[ChargeMonitor] charging_sessions insert error:`, error);
  }
}
