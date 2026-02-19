import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as hexEncode } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_TOKEN_URL =
  "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";

// ── Cryptographic Helpers ────────────────────────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Build a snapshot hash: SHA-256(vin | timestamp | kWh | battery% | prevHash) */
async function buildSnapshotHash(
  vin: string,
  timestamp: string,
  chargeEnergyAdded: number,
  batteryLevel: number,
  prevHash: string,
): Promise<string> {
  const preimage = `${vin}|${timestamp}|${chargeEnergyAdded}|${batteryLevel}|${prevHash}`;
  return sha256Hex(preimage);
}

/** Build a delta proof: SHA-256(sessionId | startKwh | endKwh | totalKwh | firstHash | lastHash) */
async function buildDeltaProof(
  sessionId: string,
  startKwh: number,
  endKwh: number,
  totalKwh: number,
  firstHash: string,
  lastHash: string,
): Promise<string> {
  const preimage = `${sessionId}|${startKwh}|${endKwh}|${totalKwh}|${firstHash}|${lastHash}`;
  return sha256Hex(preimage);
}

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

// ── Push Notification Helper ─────────────────────────────────────────────────

/**
 * Send a push notification to all of a user's registered devices.
 * Called server-side using the service role key, so no user JWT is needed.
 */
async function sendChargingCompleteNotification(
  userId: string,
  totalKwh: number,
  location: string,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return;

  // Fetch push subscriptions directly — bypasses auth requirement
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) {
    console.log(`[ChargeMonitor] No push subscriptions for ${userId.slice(0, 8)}`);
    return;
  }

  const kwhText = totalKwh > 0 ? `${totalKwh.toFixed(1)} kWh added` : "Session complete";
  const locationText = location && location !== "Home" ? ` at ${location}` : " at home";

  const payload = {
    title: "⚡ Charging Complete",
    body: `${kwhText}${locationText}. Your Tesla is ready!`,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: "home_charging_complete",
    url: "/dashboard",
    data: { url: "/dashboard", total_kwh: totalKwh },
  };

  // Re-use the same VAPID logic via the send-push-notification function
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use service role key as bearer — send-push-notification validates via getClaims
        // which works with the service role JWT. We pass user_id explicitly so it targets the right user.
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        title: payload.title,
        body: payload.body,
        notification_type: "home_charging_complete",
        url: "/dashboard",
        data: { total_kwh: totalKwh },
      }),
    });

    if (resp.ok) {
      console.log(`[ChargeMonitor] 🔔 Push notification sent to ${userId.slice(0, 8)}: ${payload.body}`);
    } else {
      const errText = await resp.text();
      console.warn(`[ChargeMonitor] Push notification failed (${resp.status}): ${errText.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn(`[ChargeMonitor] Push notification error:`, err);
  }
}

async function sendChargingStartNotification(
  userId: string,
  chargerPower: number,
  location: string,
): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return;

  const locationText = location && location !== "Home" ? ` at ${location}` : " at home";
  const powerText = chargerPower > 0 ? ` (${chargerPower} kW)` : "";

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        title: "🔌 Charging Started",
        body: `Your Tesla is now charging${locationText}${powerText}.`,
        notification_type: "home_charging_started",
        url: "/dashboard",
        data: { charger_power: chargerPower },
      }),
    });

    if (resp.ok) {
      console.log(`[ChargeMonitor] 🔔 Charging START notification sent to ${userId.slice(0, 8)}`);
    } else {
      const errText = await resp.text();
      console.warn(`[ChargeMonitor] Start notification failed (${resp.status}): ${errText.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn(`[ChargeMonitor] Start notification error:`, err);
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

    // Two modes: single-user (valid user JWT) or cron/system (everything else → all Tesla users)
    const authHeader = req.headers.get("Authorization");
    let targetUserIds: string[] = [];

    const fetchAllTeslaUsers = async () => {
      const { data: tokens } = await supabase
        .from("energy_tokens")
        .select("user_id")
        .eq("provider", "tesla");
      return (tokens || []).map((t: any) => t.user_id);
    };

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      // Try to authenticate as a specific user
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        // Valid user JWT — single-user mode
        targetUserIds = [user.id];
        console.log(`[ChargeMonitor] User call for ${user.id.slice(0, 8)}`);
      } else {
        // Not a valid user JWT — treat as cron/system call
        targetUserIds = await fetchAllTeslaUsers();
        console.log(`[ChargeMonitor] Cron/system call — processing all ${targetUserIds.length} Tesla users`);
      }
    } else {
      targetUserIds = await fetchAllTeslaUsers();
      console.log(`[ChargeMonitor] No auth — processing all ${targetUserIds.length} Tesla users`);
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
      .select("home_address, timezone")
      .eq("user_id", userId)
      .single(),
  ]);

  if (!vehicles || vehicles.length === 0) return;

  const homeAddress = (profile?.home_address || "").trim();
  const userTimezone = (profile?.timezone || "").trim() || null;
  let homeCoords: { lat: number; lng: number } | null = null;
  if (homeAddress) {
    homeCoords = await geocodeAddress(homeAddress);
    if (homeCoords) {
      console.log(`[ChargeMonitor] Home coords for ${userId.slice(0, 8)}: ${homeCoords.lat.toFixed(4)}, ${homeCoords.lng.toFixed(4)}`);
    }
  }

  for (const vehicle of vehicles) {
    const vin = vehicle.device_id;
    await processVehicle(supabase, userId, vin, accessToken, homeAddress, homeCoords, results, userTimezone);
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
  userTimezone: string | null,
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

  const isAcCharging = fastChargerPresent === false;

  // Check if at home
  let isNearHome = false;
  let distFromHome: number | null = null;
  if (homeCoords && vehicleLat && vehicleLng) {
    distFromHome = haversineDistanceMiles(homeCoords.lat, homeCoords.lng, vehicleLat, vehicleLng);
    isNearHome = distFromHome < 0.5;
  } else if (homeCoords && (!vehicleLat || !vehicleLng) && isAcCharging) {
    // Vehicle coordinates unavailable (partial sleep) but AC charging with home address set
    // Assume home — AC charging is overwhelmingly at home
    isNearHome = true;
    console.log(`[ChargeMonitor] ${vin}: No GPS coords during AC charge — assuming home (address on file)`);
  }

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
      const now = new Date().toISOString();
      const genesisHash = await buildSnapshotHash(vin, now, chargeEnergyAdded, batteryLevel, "genesis");
      const proofChain = [{ ts: now, kwh: chargeEnergyAdded, bat: batteryLevel, hash: genesisHash }];

      const { error } = await supabase.from("home_charging_sessions").insert({
        user_id: userId,
        device_id: vin,
        start_time: now,
        start_kwh_added: chargeEnergyAdded,
        end_kwh_added: chargeEnergyAdded,
        total_session_kwh: 0,
        status: "charging",
        location: homeAddress || "Home",
        latitude: vehicleLat,
        longitude: vehicleLng,
        charger_power_kw: chargerPower,
        proof_chain: proofChain,
        verified: false,
        session_metadata: {
          battery_level_start: batteryLevel,
          distance_from_home_mi: distFromHome,
        },
      });

      if (error) {
        console.error(`[ChargeMonitor] Insert error:`, error);
      } else {
        console.log(`[ChargeMonitor] ▶ STARTED session for ${vin}: ${chargeEnergyAdded} kWh (hash: ${genesisHash.slice(0, 12)}…)`);
        // Send push notification that charging has started
        await sendChargingStartNotification(userId, chargerPower, homeAddress || "Home");
      }
      results.push({ vin, action: "started", energy: chargeEnergyAdded });
    } else {
      // ── UPDATE existing session with new hash chain link ──
      const now = new Date().toISOString();
      const existingChain = activeSession.proof_chain || [];
      const prevHash = existingChain.length > 0 ? existingChain[existingChain.length - 1].hash : "genesis";
      const newHash = await buildSnapshotHash(vin, now, chargeEnergyAdded, batteryLevel, prevHash);
      const updatedChain = [...existingChain, { ts: now, kwh: chargeEnergyAdded, bat: batteryLevel, hash: newHash }];

      const { error } = await supabase
        .from("home_charging_sessions")
        .update({
          end_kwh_added: chargeEnergyAdded,
          total_session_kwh: Math.max(0, chargeEnergyAdded - activeSession.start_kwh_added),
          charger_power_kw: chargerPower,
          proof_chain: updatedChain,
          session_metadata: {
            ...activeSession.session_metadata,
            battery_level_latest: batteryLevel,
            last_poll: now,
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

      // Build final hash chain link + delta proof
      const now = new Date().toISOString();
      const existingChain = activeSession.proof_chain || [];
      const prevHash = existingChain.length > 0 ? existingChain[existingChain.length - 1].hash : "genesis";
      const finalHash = await buildSnapshotHash(vin, now, finalEnergy, batteryLevel, prevHash);
      const finalChain = [...existingChain, { ts: now, kwh: finalEnergy, bat: batteryLevel, hash: finalHash }];
      const firstHash = finalChain[0].hash;
      const deltaProof = await buildDeltaProof(activeSession.id, activeSession.start_kwh_added, finalEnergy, totalKwh, firstHash, finalHash);

      const { error } = await supabase
        .from("home_charging_sessions")
        .update({
          end_time: now,
          end_kwh_added: finalEnergy,
          total_session_kwh: totalKwh,
          status: "completed",
          proof_chain: finalChain,
          delta_proof: deltaProof,
          verified: totalKwh > 0 && finalChain.length >= 2,
          session_metadata: {
            ...activeSession.session_metadata,
            battery_level_end: batteryLevel,
            end_reason: chargingState,
          },
        })
        .eq("id", activeSession.id);

      if (error) console.error(`[ChargeMonitor] Complete error:`, error);

      console.log(`[ChargeMonitor] ✓ COMPLETED session ${activeSession.id.slice(0, 8)}: ${totalKwh.toFixed(1)} kWh | proof: ${deltaProof.slice(0, 12)}… | chain: ${finalChain.length} links`);

      // Also write to energy_production for Energy Log daily view
      if (totalKwh > 0) {
        await writeToEnergyProduction(supabase, userId, vin, activeSession.start_time, totalKwh, userTimezone);
        // Also write to charging_sessions for unified session list
        await writeToChargingSessions(supabase, userId, vin, activeSession, totalKwh, homeAddress, userTimezone);
        // Send push notification to user's devices
        await sendChargingCompleteNotification(userId, totalKwh, homeAddress || "Home");
      }

      results.push({ vin, action: "completed", total_kwh: totalKwh, verified: totalKwh > 0, delta_proof: deltaProof.slice(0, 16) });
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
    const now = new Date().toISOString();

    // Build final proof from existing chain
    const existingChain = session.proof_chain || [];
    const prevHash = existingChain.length > 0 ? existingChain[existingChain.length - 1].hash : "genesis";
    const finalHash = await buildSnapshotHash(vin, now, session.end_kwh_added, 0, prevHash);
    const finalChain = [...existingChain, { ts: now, kwh: session.end_kwh_added, bat: 0, hash: finalHash, stale: true }];
    const firstHash = finalChain[0].hash;
    const deltaProof = await buildDeltaProof(session.id, session.start_kwh_added, session.end_kwh_added, totalKwh, firstHash, finalHash);

    await supabase
      .from("home_charging_sessions")
      .update({
        end_time: now,
        total_session_kwh: totalKwh,
        status: "completed",
        proof_chain: finalChain,
        delta_proof: deltaProof,
        verified: totalKwh > 0 && finalChain.length >= 2,
        session_metadata: {
          ...session.session_metadata,
          end_reason: reason,
        },
      })
      .eq("id", session.id);

    console.log(`[ChargeMonitor] ✓ Finalized stale session ${session.id.slice(0, 8)}: ${totalKwh.toFixed(1)} kWh | proof: ${deltaProof.slice(0, 12)}… (${reason})`);

    if (totalKwh > 0) {
      await writeToEnergyProduction(supabase, userId, vin, session.start_time, totalKwh);
      await writeToChargingSessions(supabase, userId, vin, session, totalKwh, session.location);
      await sendChargingCompleteNotification(userId, totalKwh, session.location || "Home");
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
  userTimezone: string | null,
) {
  // Use user's timezone for local date attribution, fallback to UTC
  let dateStr: string;
  if (userTimezone) {
    try {
      dateStr = new Date(startTime).toLocaleDateString('en-CA', { timeZone: userTimezone });
    } catch {
      dateStr = new Date(startTime).toISOString().split("T")[0];
    }
  } else {
    dateStr = new Date(startTime).toISOString().split("T")[0];
  }
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
  userTimezone: string | null,
) {
  // Use user's timezone for local date attribution, fallback to UTC
  let dateStr: string;
  if (userTimezone) {
    try {
      const localDate = new Date(session.start_time).toLocaleDateString('en-CA', { timeZone: userTimezone });
      dateStr = localDate; // en-CA gives YYYY-MM-DD format
    } catch {
      dateStr = new Date(session.start_time).toISOString().split("T")[0];
    }
  } else {
    dateStr = new Date(session.start_time).toISOString().split("T")[0];
  }

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
