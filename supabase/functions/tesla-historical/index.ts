import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-target-user-id",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";

/**
 * Extract the street name from an address string, ignoring house numbers.
 */
function extractStreetName(address: string): string {
  const normalized = address.toLowerCase().trim();
  const cleaned = normalized.replace(/[,#].*/g, "").replace(/\b(apt|suite|ste|unit|bldg)\b.*/gi, "").trim();
  const withoutNumber = cleaned.replace(/^\d+[\s-]*/, "").trim();
  return withoutNumber;
}

/**
 * Classify a charging session as "home" or "supercharger" based on street-name matching.
 */
function classifyChargingType(
  location: string | null,
  homeAddress: string,
  totalFee: number,
  sessionType: string,
): string {
  if (homeAddress && location) {
    const homeStreet = extractStreetName(homeAddress);
    const locStreet = extractStreetName(location);
    if (homeStreet.length > 3 && locStreet.length > 3) {
      if (locStreet.includes(homeStreet) || homeStreet.includes(locStreet)) {
        return "home";
      }
      const homeCore = homeStreet.replace(/\b(dr|drive|st|street|ave|avenue|blvd|boulevard|ln|lane|ct|court|cir|circle|way|pl|place|rd|road)\b/g, "").trim();
      const locCore = locStreet.replace(/\b(dr|drive|st|street|ave|avenue|blvd|boulevard|ln|lane|ct|court|cir|circle|way|pl|place|rd|road)\b/g, "").trim();
      if (homeCore.length > 3 && locCore.length > 3 && (locCore.includes(homeCore) || homeCore.includes(locCore))) {
        return "home";
      }
    }
  }
  if (totalFee === 0) {
    const st = String(sessionType).toLowerCase();
    if (!st.includes("supercharger") && !st.includes("dc_fast")) {
      return "home";
    }
  }
  return "supercharger";
}

async function refreshTeslaToken(
  supabaseClient: any,
  userId: string,
  refreshToken: string
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let targetUserId = user.id;
    const targetUserIdHeader = req.headers.get("X-Target-User-Id");
    if (targetUserIdHeader && targetUserIdHeader !== user.id) {
      const { data: isAdmin } = await supabaseClient.rpc("is_admin", { _user_id: user.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = targetUserIdHeader;
      console.log(`Admin ${user.id} running Tesla historical backfill for user ${targetUserId}`);
    }

    // Get Tesla tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("provider", "tesla")
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Tesla not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenData.access_token;

    // Refresh if needed
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
        const newToken = await refreshTeslaToken(supabaseClient, targetUserId, tokenData.refresh_token);
        if (newToken) {
          accessToken = newToken;
        } else {
          return new Response(JSON.stringify({ error: "Token expired", needsReauth: true }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Get connected Tesla devices and home address for charging classification
    const [{ data: devices }, { data: profileData }] = await Promise.all([
      supabaseClient
        .from("connected_devices")
        .select("device_id, device_type, device_name")
        .eq("user_id", targetUserId)
        .eq("provider", "tesla"),
      supabaseClient
        .from("profiles")
        .select("home_address")
        .eq("user_id", targetUserId)
        .single(),
    ]);
    const homeAddress = (profileData?.home_address || "").toLowerCase().trim();

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ error: "No Tesla devices found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timezone = "America/Chicago";
    let totalBatteryDaysImported = 0;
    let totalChargingSessionsImported = 0;
    let totalSolarDaysImported = 0;
    const results: any[] = [];

    // ── PART 1: Energy Sites — solar + battery daily history ──
    const energySites = devices.filter(
      (d: any) => d.device_type === "solar" || d.device_type === "powerwall"
    );

    for (const site of energySites) {
      const siteId = site.device_id;
      console.log(`[Tesla Historical] Fetching calendar history for site ${siteId}...`);

      // Get site info for installation date
      let startDate = "2020-01-01";
      try {
        const siteInfoResp = await fetch(
          `${TESLA_API_BASE}/api/1/energy_sites/${siteId}/site_info`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (siteInfoResp.ok) {
          const siteInfo = await siteInfoResp.json();
          if (siteInfo.response?.installation_date) {
            startDate = String(siteInfo.response.installation_date).split("T")[0];
          }
        }
      } catch (e) {
        console.warn(`Could not fetch site_info for ${siteId}:`, e);
      }

      const endDate = new Date().toISOString().split("T")[0];
      const startYear = parseInt(startDate.split("-")[0]);
      const endYear = parseInt(endDate.split("-")[0]);

      console.log(`[Tesla Historical] Site ${siteId}: fetching daily data from ${startDate} to ${endDate}`);

      const solarRecords: any[] = [];
      const batteryRecords: any[] = [];

      // Track unique timestamps for diagnostics
      let loggedSampleBattery = false;
      let loggedSampleSolar = false;

      // Fetch month-by-month using period=month to get daily aggregates
      // Note: period=day returns 5-minute intervals for a single day, not daily aggregates
      for (let year = startYear; year <= endYear; year++) {
        const monthStart = year === startYear ? parseInt(startDate.split("-")[1]) : 1;
        const monthEnd = year === endYear ? new Date().getMonth() + 1 : 12;

        for (let month = monthStart; month <= monthEnd; month++) {
          const mStart = `${year}-${String(month).padStart(2, "0")}-01T00:00:00-06:00`;
          // Last day of month
          const lastDay = new Date(year, month, 0).getDate();
          const mEnd = `${year}-${String(month).padStart(2, "0")}-${lastDay}T23:59:59-06:00`;

          try {
            const histResp = await fetch(
              `${TESLA_API_BASE}/api/1/energy_sites/${siteId}/calendar_history?kind=energy&start_date=${encodeURIComponent(mStart)}&end_date=${encodeURIComponent(mEnd)}&period=month&time_zone=${encodeURIComponent(timezone)}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!histResp.ok) {
              if (histResp.status === 429) {
                console.warn(`Rate limited fetching ${year}-${month} for site ${siteId}`);
                await new Promise(r => setTimeout(r, 2000));
                continue;
              }
              console.warn(`Failed ${year}-${month} for site ${siteId}: ${histResp.status}`);
              await histResp.text();
              continue;
            }

            const histData = await histResp.json();
            const timeSeries = histData.response?.time_series || [];

            // Log first month's raw response for diagnostics
            if (!loggedSampleSolar && timeSeries.length > 0) {
              loggedSampleSolar = true;
              console.log(`[Tesla Historical] Sample API response for ${year}-${String(month).padStart(2, "0")} (${timeSeries.length} entries):`);
              const sample = timeSeries.slice(0, 3);
              for (const s of sample) {
                console.log(`  timestamp=${s.timestamp}, solar_exported=${s.solar_energy_exported}, battery_exported=${s.battery_energy_exported}, battery_imported=${s.battery_energy_imported_from_grid}, consumer_energy=${s.consumer_energy_imported_from_grid}`);
              }
            }

            for (const day of timeSeries) {
              const dayTimestamp = day.timestamp;
              if (!dayTimestamp) continue;

              // Parse to get a clean date at noon UTC
              const dateStr = dayTimestamp.split("T")[0];
              const recordedAt = dateStr + "T12:00:00Z";

              // Solar production (values from Tesla calendar_history are in Wh)
              const solarWh = day.solar_energy_exported || 0;
              if (solarWh > 0 && solarWh < 500000) {
                solarRecords.push({
                  user_id: targetUserId,
                  device_id: siteId,
                  provider: "tesla_historical",
                  production_wh: solarWh,
                  data_type: "solar",
                  recorded_at: recordedAt,
                });
              }

              // Battery discharge (battery_energy_exported = energy discharged from battery to home)
              const batteryWh = day.battery_energy_exported || 0;
              if (batteryWh > 0 && batteryWh < 500000) {
                if (!loggedSampleBattery) {
                  loggedSampleBattery = true;
                  console.log(`[Tesla Historical] First battery record: date=${dateStr}, battery_energy_exported=${batteryWh} Wh, raw_timestamp=${dayTimestamp}`);
                }
                batteryRecords.push({
                  user_id: targetUserId,
                  device_id: siteId,
                  provider: "tesla_historical",
                  production_wh: batteryWh,
                  data_type: "battery_discharge",
                  recorded_at: recordedAt,
                });
              }
            }
          } catch (e) {
            console.error(`Error fetching ${year}-${month} for site ${siteId}:`, e);
          }
        }
      }

      // Deduplicate records by key: SUM sub-daily intervals into daily totals
      // The Tesla calendar_history API returns 30-minute interval data, not daily aggregates
      const dedupSum = (records: any[]) => {
        const seen = new Map<string, any>();
        for (const r of records) {
          const key = `${r.device_id}|${r.provider}|${r.recorded_at}|${r.data_type}`;
          const existing = seen.get(key);
          if (!existing) {
            seen.set(key, { ...r });
          } else {
            existing.production_wh += r.production_wh;
          }
        }
        return [...seen.values()];
      };

      const BATCH_SIZE = 500;

      // Batch upsert solar records (SUM dedup — aggregate 30-min intervals into daily totals)
      const dedupedSolar = dedupSum(solarRecords);
      for (let i = 0; i < dedupedSolar.length; i += BATCH_SIZE) {
        const batch = dedupedSolar.slice(i, i + BATCH_SIZE);
        const { error } = await supabaseClient
          .from("energy_production")
          .upsert(batch, { onConflict: "device_id,provider,recorded_at,data_type" });
        if (error) console.error(`Solar upsert error batch ${i}:`, error);
      }

      // Batch upsert battery records (SUM dedup — aggregate sub-daily intervals)
      const dedupedBattery = dedupSum(batteryRecords);
      for (let i = 0; i < dedupedBattery.length; i += BATCH_SIZE) {
        const batch = dedupedBattery.slice(i, i + BATCH_SIZE);
        const { error } = await supabaseClient
          .from("energy_production")
          .upsert(batch, { onConflict: "device_id,provider,recorded_at,data_type" });
        if (error) console.error(`Battery upsert error batch ${i}:`, error);
      }

      totalSolarDaysImported += dedupedSolar.length;
      totalBatteryDaysImported += dedupedBattery.length;

      results.push({
        type: "energy_site",
        device_id: siteId,
        name: site.device_name || siteId,
        solar_days_raw: solarRecords.length,
        solar_days_deduped: dedupedSolar.length,
        battery_days_raw: batteryRecords.length,
        battery_days_deduped: dedupedBattery.length,
        date_range: `${startDate} → ${endDate}`,
      });

      console.log(
        `[Tesla Historical] Site ${siteId}: solar=${solarRecords.length} raw → ${dedupedSolar.length} deduped, battery=${batteryRecords.length} raw → ${dedupedBattery.length} deduped`
      );
    }

    // ── PART 2: EV Charging — session-level history → daily aggregates ──
    const vehicles = devices.filter((d: any) => d.device_type === "vehicle");

    if (vehicles.length > 0) {
      console.log(`[Tesla Historical] Fetching charging history for ${vehicles.length} vehicle(s)...`);

      // Paginate through all charging sessions
      const dailyChargingMap = new Map<string, number>();
      const sessionDetailRecords: any[] = [];
      let offset = 0;
      const pageSize = 50;
      let hasMore = true;
      let totalSessions = 0;

      while (hasMore) {
        try {
          const chResp = await fetch(
            `${TESLA_API_BASE}/api/1/dx/charging/history?pageSize=${pageSize}&pageNo=${Math.floor(offset / pageSize) + 1}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!chResp.ok) {
            if (chResp.status === 429) {
              console.warn("Rate limited on charging history, waiting...");
              await new Promise(r => setTimeout(r, 3000));
              continue;
            }
            console.error("Charging history failed:", chResp.status);
            await chResp.text();
            break;
          }

          const chData = await chResp.json();
          const sessions = chData.data || chData.results || chData.response || [];
          const totalResults = chData.totalResults || 0;

          for (const session of Array.isArray(sessions) ? sessions : []) {
            const directKwh =
              session.chargeEnergyAdded ||
              session.charge_energy_added ||
              session.energy_added ||
              session.energyAdded;

            let kwhFromFees = 0;
            let totalFee = 0;
            let feeCurrency = "USD";
            if (Array.isArray(session.fees)) {
              for (const fee of session.fees) {
                const isChargingFee = String(fee.feeType || "").toUpperCase() === "CHARGING";
                const isKwh = String(fee.uom || "").toLowerCase() === "kwh";
                if (isChargingFee && isKwh) {
                  kwhFromFees += Number(fee.usageBase || 0);
                  kwhFromFees += Number(fee.usageTier1 || 0);
                  kwhFromFees += Number(fee.usageTier2 || 0);
                  kwhFromFees += Number(fee.usageTier3 || 0);
                  kwhFromFees += Number(fee.usageTier4 || 0);
                }
                totalFee += Number(fee.totalDue || fee.amount || 0);
                if (fee.currencyCode) feeCurrency = fee.currencyCode;
              }
            }

            const sessionKwh = Number(directKwh || kwhFromFees || 0);
            if (sessionKwh <= 0) continue;

            const sessionDate =
              session.chargeStartDateTime ||
              session.charge_start_date_time ||
              session.startDateTime ||
              session.sessionStartTime;

            if (!sessionDate) continue;

            const dateStr = String(sessionDate).split("T")[0];
            if (!dateStr || dateStr.length !== 10) continue;

            dailyChargingMap.set(
              dateStr,
              (dailyChargingMap.get(dateStr) || 0) + sessionKwh * 1000
            );

            // Collect per-session detail with home address classification
            const location = session.siteLocationName || session.chargeLocationName || session.superchargerName || null;
            
            // Classify charging type via street-name matching
            const chargingType = classifyChargingType(location, homeAddress, totalFee, session.sessionType || "");

            sessionDetailRecords.push({
              user_id: targetUserId,
              provider: "tesla",
              device_id: vehicles[0].device_id,
              session_date: dateStr,
              energy_kwh: sessionKwh,
              location,
              fee_amount: totalFee > 0 ? totalFee : null,
              fee_currency: totalFee > 0 ? feeCurrency : null,
              charging_type: chargingType,
              session_metadata: {
                vin: session.vin || null,
                charger_type: session.sessionType || null,
                chargeStartDateTime: session.chargeStartDateTime || session.charge_start_date_time || session.startDateTime || null,
                chargeStopDateTime: session.chargeStopDateTime || session.charge_stop_date_time || session.endDateTime || null,
              },
            });

            totalSessions++;
          }

          offset += (Array.isArray(sessions) ? sessions.length : 0);
          hasMore = Array.isArray(sessions) && sessions.length > 0 && offset < totalResults;

          if (offset > 10000) {
            console.warn("Charging history pagination limit reached");
            break;
          }
        } catch (e) {
          console.error("Charging history pagination error:", e);
          break;
        }
      }

      // Write daily charging aggregates
      const primaryVin = vehicles[0].device_id;
      const chargingRecords: any[] = [];

      for (const [dateStr, totalWh] of dailyChargingMap) {
        if (totalWh <= 0) continue;
        chargingRecords.push({
          user_id: targetUserId,
          device_id: primaryVin,
          provider: "tesla_historical",
          production_wh: totalWh,
          data_type: "ev_charging",
          recorded_at: dateStr + "T12:00:00Z",
        });
      }

      // Batch upsert
      const EV_BATCH = 500;
      for (let i = 0; i < chargingRecords.length; i += EV_BATCH) {
        const batch = chargingRecords.slice(i, i + EV_BATCH);
        const { error } = await supabaseClient
          .from("energy_production")
          .upsert(batch, { onConflict: "device_id,provider,recorded_at,data_type" });
        if (error) console.error(`Charging upsert error batch ${i}:`, error);
      }

      // Write per-session charging details
      if (sessionDetailRecords.length > 0) {
        console.log(`[Tesla Historical] Writing ${sessionDetailRecords.length} charging session records`);
        for (let i = 0; i < sessionDetailRecords.length; i += EV_BATCH) {
          const batch = sessionDetailRecords.slice(i, i + EV_BATCH);
          const { error } = await supabaseClient
            .from("charging_sessions")
            .insert(batch)
            .select();
          if (error && error.code !== '23505') console.error(`Session insert error batch ${i}:`, error);
        }
      }

      totalChargingSessionsImported = totalSessions;

      results.push({
        type: "ev_charging",
        device_id: primaryVin,
        name: vehicles[0].device_name || primaryVin,
        total_sessions: totalSessions,
        unique_days: chargingRecords.length,
      });

      console.log(
        `[Tesla Historical] EV Charging: ${totalSessions} sessions → ${chargingRecords.length} unique days`
      );
    }

    console.log(
      `[Tesla Historical] Complete: ${totalSolarDaysImported} solar days, ${totalBatteryDaysImported} battery days, ${totalChargingSessionsImported} charging sessions`
    );

    return new Response(
      JSON.stringify({
        success: true,
        total_solar_days: totalSolarDaysImported,
        total_battery_days: totalBatteryDaysImported,
        total_charging_sessions: totalChargingSessionsImported,
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Tesla Historical] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to import historical data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
