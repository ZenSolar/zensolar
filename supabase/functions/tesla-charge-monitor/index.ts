import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";

/**
 * Haversine distance between two lat/lng points in miles.
 */
function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Simple geocoding: extract approximate lat/lng from a US street address.
 * Uses Nominatim (OpenStreetMap) — free, no API key required.
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "ZenSolar/1.0" },
    });
    if (!resp.ok) return null;
    const results = await resp.json();
    if (results.length > 0) {
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

async function refreshTeslaToken(
  supabaseClient: any,
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

    await supabaseClient
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // This function can be called two ways:
    // 1. By cron (no auth header) — processes ALL Tesla-connected users
    // 2. By a logged-in user (with auth header) — processes only that user
    const authHeader = req.headers.get("Authorization");
    let targetUserIds: string[] = [];

    if (authHeader) {
      // Single user mode
      const { data: { user }, error } = await supabaseClient.auth.getUser(
        authHeader.replace("Bearer ", ""),
      );
      if (error || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserIds = [user.id];
    } else {
      // Cron mode: get all users with Tesla tokens
      const { data: tokens } = await supabaseClient
        .from("energy_tokens")
        .select("user_id")
        .eq("provider", "tesla");
      targetUserIds = (tokens || []).map((t: any) => t.user_id);
    }

    console.log(`[ChargeMonitor] Processing ${targetUserIds.length} user(s)`);

    const results: any[] = [];

    for (const userId of targetUserIds) {
      try {
        // Get Tesla token
        const { data: tokenData } = await supabaseClient
          .from("energy_tokens")
          .select("access_token, refresh_token, expires_at")
          .eq("user_id", userId)
          .eq("provider", "tesla")
          .single();

        if (!tokenData) continue;

        let accessToken = tokenData.access_token;

        // Refresh if needed
        if (tokenData.expires_at) {
          const expiresAt = new Date(tokenData.expires_at);
          if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
            const newToken = await refreshTeslaToken(supabaseClient, userId, tokenData.refresh_token);
            if (newToken) {
              accessToken = newToken;
            } else {
              console.log(`[ChargeMonitor] Token refresh failed for user ${userId}`);
              continue;
            }
          }
        }

        // Get user's Tesla vehicles and home address
        const [{ data: vehicles }, { data: profile }] = await Promise.all([
          supabaseClient
            .from("connected_devices")
            .select("device_id")
            .eq("user_id", userId)
            .eq("provider", "tesla")
            .eq("device_type", "vehicle"),
          supabaseClient
            .from("profiles")
            .select("home_address")
            .eq("user_id", userId)
            .single(),
        ]);

        if (!vehicles || vehicles.length === 0) continue;

        const homeAddress = (profile?.home_address || "").trim();

        // Geocode home address (cached in memory for this run)
        let homeCoords: { lat: number; lng: number } | null = null;
        if (homeAddress) {
          homeCoords = await geocodeAddress(homeAddress);
          if (homeCoords) {
            console.log(`[ChargeMonitor] User ${userId.slice(0, 8)} home: ${homeCoords.lat}, ${homeCoords.lng}`);
          }
        }

        for (const vehicle of vehicles) {
          const vin = vehicle.device_id;

          // Fetch vehicle data — charge_state + drive_state (for location)
          const vResp = await fetch(
            `${TESLA_API_BASE}/api/1/vehicles/${vin}/vehicle_data?endpoints=charge_state;drive_state`,
            { headers: { Authorization: `Bearer ${accessToken}` } },
          );

          if (vResp.status === 408) {
            // Vehicle asleep — not charging
            console.log(`[ChargeMonitor] Vehicle ${vin} asleep, skipping`);
            continue;
          }

          if (vResp.status === 429) {
            console.warn(`[ChargeMonitor] Rate limited for vehicle ${vin}`);
            continue;
          }

          if (!vResp.ok) {
            const errText = await vResp.text();
            console.error(`[ChargeMonitor] Vehicle ${vin} error ${vResp.status}: ${errText.slice(0, 200)}`);
            continue;
          }

          const vData = await vResp.json();
          const chargeState = vData.response?.charge_state || {};
          const driveState = vData.response?.drive_state || {};

          const chargingState = chargeState.charging_state; // "Charging", "Complete", "Disconnected", "Stopped"
          const chargeEnergyAdded = chargeState.charge_energy_added || 0; // kWh added in current session
          const fastChargerPresent = chargeState.fast_charger_present; // true = DC, false = AC
          const chargerPower = chargeState.charger_power || 0; // kW
          const vehicleLat = driveState.latitude;
          const vehicleLng = driveState.longitude;

          console.log(`[ChargeMonitor] Vehicle ${vin}: state=${chargingState}, energy=${chargeEnergyAdded}kWh, fastCharger=${fastChargerPresent}, power=${chargerPower}kW, lat=${vehicleLat}, lng=${vehicleLng}`);

          // Only process if actively charging or just completed
          if (chargingState !== "Charging" && chargingState !== "Complete") {
            results.push({ vin, status: chargingState, action: "skipped" });
            continue;
          }

          // Skip if no energy added (nothing to record)
          if (chargeEnergyAdded <= 0) {
            results.push({ vin, status: chargingState, action: "no_energy" });
            continue;
          }

          // Determine if this is home charging
          // Method 1: AC charging (fast_charger_present === false)
          const isAcCharging = fastChargerPresent === false;

          // Method 2: Location proximity to home address
          let isNearHome = false;
          let distanceFromHome: number | null = null;
          if (homeCoords && vehicleLat && vehicleLng) {
            distanceFromHome = haversineDistanceMiles(homeCoords.lat, homeCoords.lng, vehicleLat, vehicleLng);
            isNearHome = distanceFromHome < 0.5; // Within 0.5 miles of home
            console.log(`[ChargeMonitor] Vehicle ${vin} distance from home: ${distanceFromHome.toFixed(2)} mi, nearHome=${isNearHome}`);
          }

          // Classify: Home if AC + near home, or AC + no home coords (assume home)
          let chargingType: string;
          let location: string | null;

          if (isAcCharging && (isNearHome || !homeCoords)) {
            chargingType = "home";
            location = homeAddress || "Home";
          } else if (isAcCharging && !isNearHome) {
            chargingType = "other_ac"; // AC but not at home (destination charger)
            location = `${vehicleLat?.toFixed(4)}, ${vehicleLng?.toFixed(4)}`;
          } else {
            // DC fast charging — already captured by /dx/charging/history
            chargingType = "supercharger";
            location = null;
          }

          // Only save home and other_ac sessions (supercharger is handled by charging/history)
          if (chargingType === "supercharger") {
            results.push({ vin, status: chargingState, type: "dc", action: "skipped_dc" });
            continue;
          }

          const today = new Date().toISOString().split("T")[0];

          // Upsert: update energy_kwh if we already have a session for this vehicle+date+type
          // This handles the case where we poll multiple times during one charging session
          const { data: existing } = await supabaseClient
            .from("charging_sessions")
            .select("id, energy_kwh")
            .eq("user_id", userId)
            .eq("device_id", vin)
            .eq("session_date", today)
            .eq("charging_type", chargingType)
            .order("created_at", { ascending: false })
            .limit(1);

          if (existing && existing.length > 0) {
            // Update if energy increased (same session progressing)
            // Or if it decreased (new session started today — Tesla resets charge_energy_added)
            const prev = existing[0];
            if (chargeEnergyAdded !== prev.energy_kwh) {
              // If energy is less than before, a new session started — add to existing
              const newEnergy = chargeEnergyAdded < prev.energy_kwh
                ? prev.energy_kwh + chargeEnergyAdded
                : chargeEnergyAdded;

              await supabaseClient
                .from("charging_sessions")
                .update({
                  energy_kwh: newEnergy,
                  session_metadata: {
                    charger_power_kw: chargerPower,
                    fast_charger: fastChargerPresent,
                    distance_from_home_mi: distanceFromHome,
                    last_updated: new Date().toISOString(),
                    charging_state: chargingState,
                  },
                })
                .eq("id", prev.id);

              console.log(`[ChargeMonitor] Updated session ${prev.id}: ${prev.energy_kwh} → ${newEnergy} kWh`);
              results.push({ vin, type: chargingType, action: "updated", energy_kwh: newEnergy });
            } else {
              results.push({ vin, type: chargingType, action: "unchanged", energy_kwh: chargeEnergyAdded });
            }
          } else {
            // Create new session
            const { error: insertError } = await supabaseClient
              .from("charging_sessions")
              .insert({
                user_id: userId,
                provider: "tesla",
                device_id: vin,
                session_date: today,
                energy_kwh: chargeEnergyAdded,
                location,
                fee_amount: null,
                fee_currency: null,
                charging_type: chargingType,
                session_metadata: {
                  charger_power_kw: chargerPower,
                  fast_charger: fastChargerPresent,
                  distance_from_home_mi: distanceFromHome,
                  detected_at: new Date().toISOString(),
                  charging_state: chargingState,
                },
              });

            if (insertError) {
              console.error(`[ChargeMonitor] Insert error for ${vin}:`, insertError);
            } else {
              console.log(`[ChargeMonitor] New ${chargingType} session for ${vin}: ${chargeEnergyAdded} kWh`);
              results.push({ vin, type: chargingType, action: "created", energy_kwh: chargeEnergyAdded });
            }
          }

          // Also upsert to energy_production for the Energy Log daily view
          const recordedAt = `${today}T12:00:00Z`;
          
          // Get existing daily total for this vehicle+date
          const { data: existingProd } = await supabaseClient
            .from("energy_production")
            .select("production_wh")
            .eq("user_id", userId)
            .eq("device_id", vin)
            .eq("provider", "tesla_home_charging")
            .eq("data_type", "ev_charging")
            .eq("recorded_at", recordedAt);

          // Sum all home charging sessions for today
          const { data: todaySessions } = await supabaseClient
            .from("charging_sessions")
            .select("energy_kwh")
            .eq("user_id", userId)
            .eq("device_id", vin)
            .eq("session_date", today)
            .in("charging_type", ["home", "other_ac"]);

          const totalHomeKwhToday = (todaySessions || []).reduce(
            (sum: number, s: any) => sum + (s.energy_kwh || 0),
            0,
          );

          if (totalHomeKwhToday > 0) {
            await supabaseClient
              .from("energy_production")
              .upsert(
                {
                  user_id: userId,
                  device_id: vin,
                  provider: "tesla_home_charging",
                  production_wh: totalHomeKwhToday * 1000,
                  data_type: "ev_charging",
                  recorded_at: recordedAt,
                },
                { onConflict: "device_id,provider,recorded_at,data_type" },
              );
          }
        }
      } catch (err) {
        console.error(`[ChargeMonitor] Error processing user ${userId}:`, err);
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
