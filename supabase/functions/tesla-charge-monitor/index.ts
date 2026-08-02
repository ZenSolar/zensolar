import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { bucketIsClosed, getPreviousProof, periodTotalProof } from "../_shared/proofDelta.ts";

// KILL SWITCH — issuance-row writes for home charging day buckets.
// Re-enabled 2026-08-01 after the period-total patch.
const ISSUANCE_WRITES_ENABLED = true;
import { encode as hexEncode } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_TOKEN_URL =
  "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const OVERLAP_CONTINUATION_WINDOW_MS = 90 * 60 * 1000;

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

/**
 * FALLBACK ONLY — a Nominatim geocode of a free-text address.
 *
 * Known failure modes, all of which argue against it being primary evidence:
 *   · Rural driveways — the house sits hundreds of yards off a road whose
 *     centroid is the only thing Nominatim knows; the 0.5 mi radius may miss
 *     the car or swallow a whole hamlet.
 *   · Apartment blocks / condos — one centroid for dozens of units and a
 *     shared garage. Presence is proven for the building, not the meter.
 *   · A neighbour inside the radius — 0.5 mi covers roughly 500 acres in a
 *     dense suburb. Charging at a friend's house two streets over reads as
 *     home, and their kWh would be credited to this member's site.
 *   · Address typos, unit numbers and PO boxes geocode to city centroids
 *     with no error signal — the call succeeds and returns a confident,
 *     wrong point.
 *   · Nominatim is a third-party best-effort service with a 1 req/s courtesy
 *     limit; a failure returns null and is indistinguishable from "unknown".
 */
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

/**
 * WALL CONNECTOR PRESENCE — the strongest location evidence we have, and it
 * needs no geocoding.
 *
 * `/api/1/energy_sites/{id}/live_status` returns a `wall_connectors[]` array,
 * each entry carrying `din`, `wall_connector_state`, `wall_connector_power`
 * and — critically — `vin`. A wall connector is physically bolted to the
 * member's wall, so a connector at THIS site reporting THIS vin at non-zero
 * power is direct proof of co-location.
 *
 * This respects the authority rule exactly: the charger says WHERE, it never
 * says HOW MUCH. Quantity still comes from the vehicle's own meter. The
 * connector stays an observer for issuance.
 *
 * Returns a map of VIN → observed connector power in kW for every VIN a
 * connector at this account currently reports.
 */
async function fetchWallConnectorVins(
  accessToken: string,
  energySiteIds: string[],
): Promise<Map<string, number>> {
  const vins = new Map<string, number>();
  for (const id of energySiteIds) {
    try {
      const r = await fetch(
        `${TESLA_API_BASE}/api/1/energy_sites/${id}/live_status`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!r.ok) {
        console.log(`[ChargeMonitor][WC-RAW] site ${id} live_status HTTP ${r.status}`);
        continue;
      }
      const body = await r.json();
      const wcs = body?.response?.wall_connectors || [];
      // TEMPORARY DIAGNOSTIC: raw, unedited wall_connectors payload.
      console.log(
        `[ChargeMonitor][WC-RAW] site ${id} wall_connectors=${JSON.stringify(body?.response?.wall_connectors ?? null)}`,
      );

      for (const wc of wcs) {
        const vin = typeof wc?.vin === "string" ? wc.vin.trim() : "";
        if (!vin) continue;
        const powerW = Number(wc?.wall_connector_power ?? 0);
        const state = Number(wc?.wall_connector_state ?? 0);
        // State 4 == connected/charging in Tesla's enum; power > 0 is the
        // unambiguous signal. Either one, with a VIN attached, proves the car
        // is on this wall.
        if (powerW > 0 || state === 4) {
          // Tesla reports connector power in watts on live_status.
          const kw = powerW > 1000 ? powerW / 1000 : powerW;
          vins.set(vin, Math.max(vins.get(vin) ?? 0, Number.isFinite(kw) ? kw : 0));
        }
      }
    } catch {
      // A live_status failure is silence, not evidence. Fail closed.
    }
  }
  return vins;
}

/**
 * OBSERVER-MEASURED PRESENCE SESSION.
 *
 * The vehicle is the authority for HOW MUCH — always. But a parked Tesla stops
 * answering (408) or serves a stale cached `charging_state: "Complete"` while
 * the wall it is bolted to reports its VIN drawing kilowatts. In that window the
 * member is charging and the cockpit showed nothing at all.
 *
 * This opens/holds a session marked as a DISTINCT evidence class —
 * `wall_connector_measured`, `issuance_eligible: false` — so it renders live in
 * the cockpit and stays trivially separable in the issuance audit. Quantity
 * from this row must never be minted; when the vehicle wakes, the normal path
 * takes over and overwrites power/energy with the vehicle's own meter.
 */
async function upsertObserverSession(
  supabase: any,
  userId: string,
  vin: string,
  connectorKw: number,
  homeAddress: string,
): Promise<"started" | "held"> {
  const now = new Date().toISOString();
  const { data: open } = await supabase
    .from("home_charging_sessions")
    .select("id, session_metadata")
    .eq("user_id", userId)
    .eq("device_id", vin)
    .eq("status", "charging")
    .order("created_at", { ascending: false })
    .limit(1);

  const existing = open?.[0];
  if (existing) {
    await supabase
      .from("home_charging_sessions")
      .update({
        charger_power_kw: connectorKw,
        session_metadata: {
          ...(existing.session_metadata ?? {}),
          presence_evidence: "wall_connector",
          evidence_class: "wall_connector_measured",
          quantity_source: "wall_connector_observer",
          issuance_eligible: false,
          connector_kw_latest: connectorKw,
          last_poll: now,
        },
      })
      .eq("id", existing.id);
    console.log(`[ChargeMonitor] ◈ HELD observer session for ${vin} at ${connectorKw} kW`);
    return "held";
  }

  await supabase.from("home_charging_sessions").insert({
    user_id: userId,
    device_id: vin,
    start_time: now,
    start_kwh_added: 0,
    end_kwh_added: 0,
    total_session_kwh: 0,
    status: "charging",
    location: homeAddress || "Home",
    charger_power_kw: connectorKw,
    proof_chain: [],
    verified: false,
    session_metadata: {
      presence_evidence: "wall_connector",
      evidence_class: "wall_connector_measured",
      quantity_source: "wall_connector_observer",
      issuance_eligible: false,
      connector_kw_latest: connectorKw,
      opened_by: "wall_connector_observer",
      last_poll: now,
    },
  });
  console.log(`[ChargeMonitor] ▶ STARTED observer session for ${vin} at ${connectorKw} kW (vehicle silent)`);
  return "started";
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

  // Get vehicles + energy sites (for wall-connector presence) + home address
  const [{ data: vehicles }, { data: sites }, { data: profile }] = await Promise.all([
    supabase
      .from("connected_devices")
      .select("device_id")
      .eq("user_id", userId)
      .eq("provider", "tesla")
      .eq("device_type", "vehicle"),
    supabase
      .from("connected_devices")
      .select("device_id, device_type")
      .eq("user_id", userId)
      .eq("provider", "tesla")
      .in("device_type", ["powerwall", "solar", "wall_connector"]),
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

  // Wall-connector presence, fetched once per user per run. Costs one
  // live_status call per energy site and never touches a vehicle, so it
  // cannot wake anything.
  const siteIds = Array.from(
    new Set((sites ?? []).map((s: { device_id: string }) => String(s.device_id))),
  );
  const wallConnectorVins = siteIds.length
    ? await fetchWallConnectorVins(accessToken, siteIds)
    : new Map<string, number>();
  if (wallConnectorVins.size > 0) {
    console.log(
      `[ChargeMonitor] Wall connector reports VIN(s) on-site for ${userId.slice(0, 8)}: ${[...wallConnectorVins.entries()].map(([v, kw]) => `${v}@${kw}kW`).join(", ")}`,
    );

  }

  for (const vehicle of vehicles) {
    const vin = vehicle.device_id;
    await processVehicle(
      supabase,
      userId,
      vin,
      accessToken,
      homeAddress,
      homeCoords,
      results,
      userTimezone,
      wallConnectorVins,
    );
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
  wallConnectorVins: Set<string> = new Set<string>(),
) {
  // NEVER WAKE. This reads `vehicle_data` only. There is no `/wake_up` call in
  // this function and there must never be one: a charging car is awake by
  // definition, so a 408 is itself the answer ("not charging") and costs the
  // member nothing. Waking cars on a schedule to ask whether they are charging
  // would drain packs to learn what the silence already tells us.
  const vResp = await fetch(
    `${TESLA_API_BASE}/api/1/vehicles/${vin}/vehicle_data?endpoints=charge_state;drive_state`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (vResp.status === 408) {
    // Asleep == not charging. Log it, close any dangling session, do NOT retry
    // and do NOT wake.
    console.log(`[ChargeMonitor] ${vin}: 408 asleep — treated as NOT CHARGING, no wake attempted`);
    await finalizeStaleSession(supabase, userId, vin, "vehicle_asleep");
    results.push({ vin, status: "asleep", action: "checked_stale", woke: false });
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

  // ── PRESENCE — FAIL CLOSED ────────────────────────────────────────────────
  // Ordered by evidential strength. Absence of evidence is NOT evidence of
  // presence: the old `no GPS + address on file → assume home` branch has been
  // removed. It was the only fail-open rule in the system, and it failed in
  // the direction that over-credits.
  let isNearHome = false;
  let distFromHome: number | null = null;
  let presenceEvidence: "wall_connector" | "gps_geofence" | "none" = "none";

  if (wallConnectorVins.has(vin)) {
    // PRIMARY — a connector bolted to this member's wall names this VIN.
    // Location proof only; the vehicle's own meter still supplies quantity.
    isNearHome = true;
    presenceEvidence = "wall_connector";
    if (homeCoords && vehicleLat && vehicleLng) {
      distFromHome = haversineDistanceMiles(homeCoords.lat, homeCoords.lng, vehicleLat, vehicleLng);
    }
    console.log(`[ChargeMonitor] ${vin}: presence=wall_connector (no geocode needed)`);
  } else if (homeCoords && vehicleLat && vehicleLng) {
    // FALLBACK — free-text geocode with a 0.5 mi radius. See geocodeAddress()
    // for its failure modes; it is corroboration of last resort.
    distFromHome = haversineDistanceMiles(homeCoords.lat, homeCoords.lng, vehicleLat, vehicleLng);
    isNearHome = distFromHome < 0.5;
    if (isNearHome) presenceEvidence = "gps_geofence";
    console.log(`[ChargeMonitor] ${vin}: presence=gps_geofence dist=${distFromHome.toFixed(3)}mi near=${isNearHome}`);
  } else if (isAcCharging) {
    console.log(
      `[ChargeMonitor] ${vin}: AC charging but NO location evidence (no wall-connector VIN match, no GPS or no geocode) — NOT opening a home session`,
    );
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
    // THIRD FAIL-OPEN, REMOVED: `|| (!homeCoords && isAcCharging)` meant a
    // member with no address on file had every AC charge counted as home.
    // Presence must now be positively proven.
    if (!isNearHome) {
      results.push({
        vin,
        action: presenceEvidence === "none" ? "ac_presence_unproven" : "ac_not_home",
        dist: distFromHome,
        presence_evidence: presenceEvidence,
      });
      return;
    }


    if (!activeSession) {
      const since = new Date(Date.now() - OVERLAP_CONTINUATION_WINDOW_MS).toISOString();
      const { data: recentCompleted } = await supabase
        .from("home_charging_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("device_id", vin)
        .eq("status", "completed")
        .gte("end_time", since)
        .order("end_time", { ascending: false })
        .limit(1);

      const previousSession = recentCompleted?.[0] || null;
      const previousKwh = Number(previousSession?.total_session_kwh || 0);
      if (previousSession && previousKwh > 0 && chargeEnergyAdded + 0.5 >= previousKwh) {
        const now = new Date().toISOString();
        const existingChain = previousSession.proof_chain || [];
        const prevHash = existingChain.length > 0 ? existingChain[existingChain.length - 1].hash : "genesis";
        const resumedHash = await buildSnapshotHash(vin, now, chargeEnergyAdded, batteryLevel, prevHash);
        const resumedChain = [...existingChain, { ts: now, kwh: chargeEnergyAdded, bat: batteryLevel, hash: resumedHash, resumed_after_gap: true }];

        const { error } = await supabase
          .from("home_charging_sessions")
          .update({
            end_time: null,
            end_kwh_added: chargeEnergyAdded,
            total_session_kwh: chargeEnergyAdded,
            status: "charging",
            charger_power_kw: chargerPower,
            proof_chain: resumedChain,
            verified: false,
            session_metadata: {
              ...previousSession.session_metadata,
              battery_level_latest: batteryLevel,
              continued_after_recovery: true,
              previous_end_time: previousSession.end_time,
              last_poll: now,
            },
          })
          .eq("id", previousSession.id);

        if (error) {
          console.error(`[ChargeMonitor] Resume previous session error:`, error);
        } else {
          console.log(`[ChargeMonitor] ↻ RESUMED session ${previousSession.id.slice(0, 8)} for ${vin}: ${chargeEnergyAdded} kWh (previous ${previousKwh} kWh)`);
          results.push({ vin, action: "resumed_existing", energy: chargeEnergyAdded, previous_kwh: previousKwh });
          return;
        }
      }

      // ── START new session ──
      const now = new Date().toISOString();
      const genesisHash = await buildSnapshotHash(vin, now, 0, batteryLevel, "genesis");
      const firstObservedHash = await buildSnapshotHash(vin, now, chargeEnergyAdded, batteryLevel, genesisHash);
      const proofChain = [
        { ts: now, kwh: 0, bat: batteryLevel, hash: genesisHash, inferred_start: true },
        { ts: now, kwh: chargeEnergyAdded, bat: batteryLevel, hash: firstObservedHash },
      ];

      const { error } = await supabase.from("home_charging_sessions").insert({
        user_id: userId,
        device_id: vin,
        start_time: now,
        start_kwh_added: 0,
        end_kwh_added: chargeEnergyAdded,
        total_session_kwh: chargeEnergyAdded,
        status: "charging",
        location: homeAddress || "Home",
        latitude: vehicleLat,
        longitude: vehicleLng,
        charger_power_kw: chargerPower,
        proof_chain: proofChain,
        verified: false,
        session_metadata: {
          battery_level_start: batteryLevel,
          first_observed_kwh: chargeEnergyAdded,
          distance_from_home_mi: distFromHome,
          presence_evidence: presenceEvidence,
        },
      });

      if (error) {
        console.error(`[ChargeMonitor] Insert error:`, error);
      } else {
        console.log(`[ChargeMonitor] ▶ STARTED session for ${vin}: ${chargeEnergyAdded} kWh already observed (hash: ${firstObservedHash.slice(0, 12)}…)`);
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
    // ── END session if one is active, or recover the retained last AC session ──
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
      // SECOND FAIL-OPEN, ALSO REMOVED. This branch recovers a session that
      // completed between polls, and it used to treat "no geocode" or "no GPS"
      // as home. It now requires the same positive presence evidence as the
      // live path: a wall connector naming this VIN, or a GPS fix inside the
      // geofence. No evidence, no recovered session.
      if (isAcCharging && isNearHome && chargeEnergyAdded >= 1) {
        const recovered = await recoverCompletedHomeSession(
          supabase,
          userId,
          vin,
          chargeEnergyAdded,
          batteryLevel,
          chargerPower,
          homeAddress,
          vehicleLat,
          vehicleLng,
          distFromHome,
          userTimezone,
          presenceEvidence,
        );
        results.push({ vin, ...recovered });
        return;
      }
      results.push({
        vin,
        action: "no_active_session",
        state: chargingState,
        presence_evidence: presenceEvidence,
      });
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

async function recoverCompletedHomeSession(
  supabase: any,
  userId: string,
  vin: string,
  totalKwh: number,
  batteryLevel: number,
  chargerPower: number,
  homeAddress: string,
  vehicleLat: number | null,
  vehicleLng: number | null,
  distFromHome: number | null,
  userTimezone: string | null,
  presenceEvidence: "wall_connector" | "gps_geofence" | "none" = "none",
) {

  const now = new Date();
  // Pillar 4 (same-provider replay guard): widened from 36h → 7d. Tesla's
  // chargeEnergyAdded counter resets on unplug, so the *same physical session*
  // can re-surface for days under a different timestamp if the vehicle stays
  // plugged in. Without this, the recovery path double-mints. Tolerance is
  // tight (±0.5 kWh) so genuinely separate same-size sessions still record.
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: duplicate } = await supabase
    .from("home_charging_sessions")
    .select("id, start_time, total_session_kwh")
    .eq("user_id", userId)
    .eq("device_id", vin)
    .gte("start_time", since)
    .gte("total_session_kwh", Math.max(0, totalKwh - 0.5))
    .lte("total_session_kwh", totalKwh + 0.5)
    .limit(1);

  if (duplicate && duplicate.length > 0) {
    console.log(
      `[ChargeMonitor] Skipped duplicate recovered session for ${vin}: ${totalKwh.toFixed(1)} kWh ` +
      `(matches existing ${duplicate[0].id} from ${duplicate[0].start_time} @ ${duplicate[0].total_session_kwh} kWh, within 7d window)`
    );
    return { action: "duplicate_recovered_session", total_kwh: totalKwh };
  }

  const endIso = now.toISOString();
  const startIso = new Date(now.getTime() - Math.max(30, Math.min(720, (totalKwh / 7.2) * 60)) * 60 * 1000).toISOString();
  const startHash = await buildSnapshotHash(vin, startIso, 0, batteryLevel, "genesis");
  const endHash = await buildSnapshotHash(vin, endIso, totalKwh, batteryLevel, startHash);
  const proofChain = [
    { ts: startIso, kwh: 0, bat: batteryLevel, hash: startHash, inferred_start: true },
    { ts: endIso, kwh: totalKwh, bat: batteryLevel, hash: endHash, recovered_after_disconnect: true },
  ];
  const deltaProof = await buildDeltaProof(`${vin}:${endIso}`, 0, totalKwh, totalKwh, startHash, endHash);

  const { data: inserted, error } = await supabase
    .from("home_charging_sessions")
    .insert({
      user_id: userId,
      device_id: vin,
      start_time: startIso,
      end_time: endIso,
      start_kwh_added: 0,
      end_kwh_added: totalKwh,
      total_session_kwh: totalKwh,
      status: "completed",
      location: homeAddress || "Home",
      latitude: vehicleLat,
      longitude: vehicleLng,
      charger_power_kw: chargerPower,
      proof_chain: proofChain,
      delta_proof: deltaProof,
      verified: true,
      session_metadata: {
        source: "charge_monitor_recovered",
        battery_level_end: batteryLevel,
        distance_from_home_mi: distFromHome,
        presence_evidence: presenceEvidence,
        end_reason: "recovered_after_disconnect",
      },
    })
    .select("*")
    .single();

  if (error) {
    console.error(`[ChargeMonitor] Recovery insert error:`, error);
    return { action: "recovery_insert_error", error: error.message };
  }

  await writeToEnergyProduction(supabase, userId, vin, startIso, totalKwh, userTimezone);
  await writeToChargingSessions(supabase, userId, vin, inserted, totalKwh, homeAddress, userTimezone);
  console.log(`[ChargeMonitor] ✓ RECOVERED completed home session for ${vin}: ${totalKwh.toFixed(1)} kWh | proof: ${deltaProof.slice(0, 12)}…`);
  return { action: "recovered_completed", total_kwh: totalKwh, verified: true, delta_proof: deltaProof.slice(0, 16) };
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

  // CONTAINMENT 2026-08-01: issuance writes DISABLED.
  // This writer previously wrote a RUNNING DAY ACCUMULATOR into
  // `production_wh` with no `proof_metadata` at all — no hash, no
  // `value_semantics` (Pillar 1 gap) — and re-staged the running total on
  // every session close. Patched to the period-total convention below.
  if (!ISSUANCE_WRITES_ENABLED) {
    console.warn(`[ChargeMonitor] issuance write suppressed (kill switch) for ${vin} ${recordedAt}`);
    return;
  }

  // A bucket already minted or quarantined is CLOSED — never rewrite it.
  if (await bucketIsClosed(supabase, {
    userId, deviceId: vin, provider: "tesla_home_charging",
    dataType: "ev_charging", recordedAt,
  })) {
    console.warn(`[ChargeMonitor] bucket closed, skipping rewrite for ${vin} ${recordedAt}`);
    return;
  }

  // Get existing daily total (this row IS the day; its total IS its delta)
  const { data: existing } = await supabase
    .from("energy_production")
    .select("production_wh")
    .eq("user_id", userId)
    .eq("device_id", vin)
    .eq("provider", "tesla_home_charging")
    .eq("data_type", "ev_charging")
    .eq("recorded_at", recordedAt);

  const existingWh = Number(existing?.[0]?.production_wh || 0);
  const newTotal = existingWh + totalKwh * 1000;

  const prev = await getPreviousProof(supabase, vin, "tesla_home_charging", "ev_charging", userId);
  const proof = await periodTotalProof({
    deviceId: vin,
    provider: "tesla_home_charging",
    dataType: "ev_charging",
    recordedAt,
    periodTotal: newTotal,
    prev,
    unit: "wh",
    sha256Hex,
    extra: { source: "tesla_charge_monitor", period: "local_day", local_date: dateStr },
  });

  await supabase.from("energy_production").upsert(
    {
      user_id: userId,
      device_id: vin,
      provider: "tesla_home_charging",
      production_wh: proof.production_wh,
      data_type: "ev_charging",
      recorded_at: recordedAt,
      proof_metadata: proof.proof_metadata,
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
