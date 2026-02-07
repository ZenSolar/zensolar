import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-target-user-id",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";

// Helper to refresh Tesla token
async function refreshTeslaToken(
  supabaseClient: any,
  userId: string,
  refreshToken: string
): Promise<string | null> {
  const clientId = Deno.env.get("TESLA_CLIENT_ID");
  const clientSecret = Deno.env.get("TESLA_CLIENT_SECRET");

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Tesla credentials for refresh");
    return null;
  }

  try {
    const tokenResponse = await fetch(TESLA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Tesla token refresh failed:", await tokenResponse.text());
      return null;
    }

    const tokens = await tokenResponse.json();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Update tokens in database
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

    console.log("Tesla token refreshed successfully");
    return tokens.access_token;
  } catch (error) {
    console.error("Tesla token refresh error:", error);
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

    // Check for admin override - allows admins to sync on behalf of other users
    let targetUserId = user.id;
    const targetUserIdHeader = req.headers.get("X-Target-User-Id");
    
    if (targetUserIdHeader && targetUserIdHeader !== user.id) {
      // Verify the caller is an admin
      const { data: isAdmin } = await supabaseClient.rpc('is_admin', { _user_id: user.id });
      
      if (!isAdmin) {
        console.log(`User ${user.id} attempted admin override but is not admin`);
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      targetUserId = targetUserIdHeader;
      console.log(`Admin ${user.id} syncing Tesla data for user ${targetUserId}`);
    }

    // Get user's Tesla tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("provider", "tesla")
      .single();

    if (tokenError || !tokenData) {
      console.error("No Tesla tokens found:", tokenError);
      return new Response(JSON.stringify({ error: "Tesla not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenData.access_token;

    // Check if token is expired and refresh if needed
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      // Refresh if expired or expiring in next 5 minutes
      if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
        console.log("Tesla token expired or expiring soon, refreshing...");
        const newToken = await refreshTeslaToken(
          supabaseClient,
          user.id,
          tokenData.refresh_token
        );
        if (newToken) {
          accessToken = newToken;
        } else {
          return new Response(JSON.stringify({ 
            error: "Token expired", 
            needsReauth: true 
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Get user's claimed devices with baseline data and home address for charging classification
    const [{ data: claimedDevices }, { data: profileData }] = await Promise.all([
      supabaseClient
        .from("connected_devices")
        .select("device_id, device_type, device_metadata, baseline_data, last_minted_at")
        .eq("user_id", targetUserId)
        .eq("provider", "tesla"),
      supabaseClient
        .from("profiles")
        .select("home_address")
        .eq("user_id", targetUserId)
        .single(),
    ]);
    const homeAddress = (profileData?.home_address || "").toLowerCase().trim();

    const energySiteIds = claimedDevices
      ?.filter(d => d.device_type === "solar" || d.device_type === "powerwall")
      .map(d => ({ id: d.device_id, baseline: d.baseline_data || {}, last_minted_at: d.last_minted_at })) || [];

    const vehicleDevices = claimedDevices
      ?.filter(d => d.device_type === "vehicle")
      .map(d => ({ id: d.device_id, baseline: d.baseline_data || {}, last_minted_at: d.last_minted_at })) || [];

    let totalSolarProduction = 0;
    let totalBatteryDischarge = 0;
    let totalEvMiles = 0;
    let totalHomeChargingWh = 0;
    let pendingSolarProduction = 0;
    let pendingBatteryDischarge = 0;
    let pendingEvMiles = 0;
    const energySitesData: any[] = [];
    const vehiclesData: any[] = [];

    // Fetch energy site data
    for (const site of energySiteIds) {
      try {
        // Get live status
        const liveResponse = await fetch(
          `${TESLA_API_BASE}/api/1/energy_sites/${site.id}/live_status`,
          { headers: { "Authorization": `Bearer ${accessToken}` } }
        );

        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          const response = liveData.response || {};
          
          // Get lifetime totals from calendar history
          let lifetimeSolar = 0;
          let lifetimeBatteryDischarge = 0;
          let wallConnectorChargingWh = 0;
          
          try {
            // Get site info for installation date and lifetime stats
            const siteInfoResponse = await fetch(
              `${TESLA_API_BASE}/api/1/energy_sites/${site.id}/site_info`,
              { headers: { "Authorization": `Bearer ${accessToken}` } }
            );

            let startDate = "2020-01-01"; // Default fallback
            if (siteInfoResponse.ok) {
              const siteInfo = await siteInfoResponse.json();
              const siteResponse = siteInfo.response || {};
              
              if (siteResponse.installation_date) {
                startDate = String(siteResponse.installation_date).split("T")[0];
              }
              
              // Check for lifetime stats in site_info (some Tesla APIs provide this directly)
              if (siteResponse.energy_left !== undefined) {
                console.log(`Site ${site.id} site_info energy data:`, JSON.stringify({
                  energy_left: siteResponse.energy_left,
                  total_pack_energy: siteResponse.total_pack_energy,
                }));
              }
            }

            const endDate = new Date().toISOString().split("T")[0];
            const timezone = "America/Chicago"; // Central Time zone

            // Tesla API seems to limit results with period=month
            // Fetch year-by-year with period=year to get actual lifetime totals
            const startYear = parseInt(startDate.split("-")[0]);
            const endYear = parseInt(endDate.split("-")[0]);
            
            console.log(`Site ${site.id} fetching history from ${startYear} to ${endYear}`);
            
            // First try period=lifetime which some versions of the API support
            const lifetimeResponse = await fetch(
              `${TESLA_API_BASE}/api/1/energy_sites/${site.id}/calendar_history?kind=energy&period=lifetime&time_zone=${encodeURIComponent(timezone)}`,
              { headers: { "Authorization": `Bearer ${accessToken}` } }
            );
            
            if (lifetimeResponse.ok) {
              const lifetimeData = await lifetimeResponse.json();
              const lifetimeResp = lifetimeData.response || {};
              const timeSeries = lifetimeResp.time_series || [];
              
              if (timeSeries.length > 0) {
                console.log(`Site ${site.id} lifetime period data:`, JSON.stringify(timeSeries[0]));
                for (const period of timeSeries) {
                  lifetimeSolar += (period.solar_energy_exported || 0);
                  lifetimeBatteryDischarge += (period.battery_energy_exported || 0);
                }
              }
              console.log(`Site ${site.id} lifetime totals from period=lifetime:`, JSON.stringify({ 
                lifetimeSolar, 
                lifetimeBatteryDischarge 
              }));
            } else {
              console.log(`Site ${site.id} period=lifetime not supported, fetching year by year`);
              
              // Fetch each year separately to avoid API data truncation
              for (let year = startYear; year <= endYear; year++) {
                const yearStart = `${year}-01-01T00:00:00-06:00`;
                const yearEnd = year === endYear 
                  ? `${endDate}T23:59:59-06:00`
                  : `${year}-12-31T23:59:59-06:00`;
                
                const historyResponse = await fetch(
                  `${TESLA_API_BASE}/api/1/energy_sites/${site.id}/calendar_history?kind=energy&start_date=${encodeURIComponent(yearStart)}&end_date=${encodeURIComponent(yearEnd)}&period=year&time_zone=${encodeURIComponent(timezone)}`,
                  { headers: { "Authorization": `Bearer ${accessToken}` } }
                );

                if (historyResponse.ok) {
                  const historyData = await historyResponse.json();
                  const historyResp = historyData.response || {};
                  const timeSeries = historyResp.time_series || [];

                  for (const period of timeSeries) {
                    lifetimeSolar += (period.solar_energy_exported || 0);
                    lifetimeBatteryDischarge += (period.battery_energy_exported || 0);
                  }
                  
                  if (timeSeries.length > 0) {
                    console.log(`Site ${site.id} year ${year}:`, JSON.stringify(timeSeries[0]));
                  }
                } else {
                  console.error(`Failed to fetch year ${year} for site ${site.id}:`, await historyResponse.text());
                }
              }
              
              console.log(`Site ${site.id} lifetime totals (year-by-year sum):`, JSON.stringify({ 
                lifetimeSolar, 
                lifetimeBatteryDischarge 
              }));
            }
            
            // Fetch Wall Connector charging history (home EV charging)
            // Use start and end from installation to now
            const wcStartDateTime = `${startDate}T00:00:00-06:00`;
            const wcEndDateTime = `${endDate}T23:59:59-06:00`;
            try {
              const wallConnectorResponse = await fetch(
                `${TESLA_API_BASE}/api/1/energy_sites/${site.id}/telemetry_history?kind=charge&start_date=${encodeURIComponent(wcStartDateTime)}&end_date=${encodeURIComponent(wcEndDateTime)}&time_zone=${encodeURIComponent(timezone)}`,
                { headers: { "Authorization": `Bearer ${accessToken}` } }
              );
              
              if (wallConnectorResponse.ok) {
                const wallConnectorData = await wallConnectorResponse.json();
                const chargeSeries = wallConnectorData.response?.time_series || wallConnectorData.response?.data || [];
                
                if (chargeSeries.length > 0) {
                  console.log(`Sample wall connector charge for site ${site.id}:`, JSON.stringify(chargeSeries[0]));
                }
                
                // Sum up all wall connector charging (values are in Wh)
                for (const charge of chargeSeries) {
                  wallConnectorChargingWh += (charge.energy_charged || charge.charge_energy_added || charge.energy || 0);
                }
                console.log(`Site ${site.id} wall connector charging: ${wallConnectorChargingWh} Wh (${chargeSeries.length} records)`);
              } else {
                console.log(`Wall connector history not available for site ${site.id}:`, wallConnectorResponse.status);
              }
            } catch (wcError) {
              console.log(`Wall connector history error for site ${site.id}:`, wcError);
            }
          } catch (histError) {
            console.error(`Error fetching history for site ${site.id}:`, histError);
          }
          
          // Calculate pending (since last mint or initial connection)
          // Check all possible baseline keys used across the app
          const baselineSolar = site.baseline?.total_solar_produced_wh || site.baseline?.solar_wh || site.baseline?.solar_production_wh || 0;
          const baselineBattery = site.baseline?.total_energy_discharged_wh || site.baseline?.battery_discharge_wh || 0;
          
          const pendingSolar = Math.max(0, lifetimeSolar - baselineSolar);
          const pendingBattery = Math.max(0, lifetimeBatteryDischarge - baselineBattery);
          
          energySitesData.push({
            site_id: site.id,
            solar_power: response.solar_power || 0,
            battery_power: response.battery_power || 0,
            grid_power: response.grid_power || 0,
            load_power: response.load_power || 0,
            lifetime_solar_wh: lifetimeSolar,
            lifetime_battery_discharge_wh: lifetimeBatteryDischarge,
            wall_connector_charging_wh: wallConnectorChargingWh,
            pending_solar_wh: pendingSolar,
            pending_battery_discharge_wh: pendingBattery,
          });

          console.log(`Site ${site.id} live data:`, JSON.stringify(response));

          // Accumulate totals
          totalSolarProduction += lifetimeSolar;
          totalBatteryDischarge += lifetimeBatteryDischarge;
          totalHomeChargingWh += wallConnectorChargingWh;
          pendingSolarProduction += pendingSolar;
          pendingBatteryDischarge += pendingBattery;
        } else if (liveResponse.status === 429) {
          console.warn("Tesla API rate limited for site:", site.id);
        } else {
          console.error(`Failed to fetch site ${site.id}:`, await liveResponse.text());
        }
      } catch (error) {
        console.error(`Error fetching site ${site.id}:`, error);
      }
    }

    // Fetch charging history for EV charging kWh totals - paginate through all results
    let totalChargingKwh = 0;
    let baselineChargingKwh = 0;
    let baselineSuperchargerKwh = 0;
    let baselineWallConnectorKwh = 0;
    let totalSessions = 0;
    let chargingSessionDetails: any[] | null = null;
    
    if (vehicleDevices.length > 0) {
      try {
        let offset = 0;
        const pageSize = 50; // Request more per page
        let hasMore = true;
        let loggedSample = false;
        
        while (hasMore) {
          const chargingHistoryResponse = await fetch(
            `${TESLA_API_BASE}/api/1/dx/charging/history?pageSize=${pageSize}&pageNo=${Math.floor(offset / pageSize) + 1}`,
            { headers: { "Authorization": `Bearer ${accessToken}` } }
          );
          
          if (!chargingHistoryResponse.ok) {
            const errorText = await chargingHistoryResponse.text();
            console.error("Failed to fetch charging history:", chargingHistoryResponse.status, errorText);
            break;
          }
          
          const chargingData = await chargingHistoryResponse.json();
          const sessions = chargingData.data || chargingData.results || chargingData.response || [];
          const totalResults = chargingData.totalResults || 0;
          
          if (!loggedSample) {
            console.log(`Charging history: totalResults=${totalResults}, pageSize=${pageSize}`);
            if (Array.isArray(sessions) && sessions.length > 0) {
              console.log("Sample charging session:", JSON.stringify(sessions[0]));
            }
            loggedSample = true;
          }
          
          // Sum up all charging energy from this page (kWh)
          for (const session of (Array.isArray(sessions) ? sessions : [])) {
            // Some sessions expose kWh directly; others only expose billing "fees" with kWh usage
            const directKwh = session.chargeEnergyAdded 
              || session.charge_energy_added 
              || session.energy_added 
              || session.energyAdded;

            let kwhFromFees = 0;
            if (Array.isArray(session.fees)) {
              for (const fee of session.fees) {
                const isChargingFee = String(fee.feeType || '').toUpperCase() === 'CHARGING';
                const isKwh = String(fee.uom || '').toLowerCase() === 'kwh';
                if (isChargingFee && isKwh) {
                  kwhFromFees += Number(fee.usageBase || 0);
                  kwhFromFees += Number(fee.usageTier1 || 0);
                  kwhFromFees += Number(fee.usageTier2 || 0);
                  kwhFromFees += Number(fee.usageTier3 || 0);
                  kwhFromFees += Number(fee.usageTier4 || 0);
                }
              }
            }

             const sessionKwh = Number(directKwh || kwhFromFees || 0);
            totalChargingKwh += sessionKwh;
            totalSessions++;

            // Collect per-session detail for charging_sessions table
            if (sessionKwh > 0) {
              const sessionDate = session.chargeStartDateTime || session.charge_start_date_time || session.startDateTime || session.sessionStartTime;
              const dateStr = sessionDate ? String(sessionDate).split("T")[0] : null;
              if (dateStr && dateStr.length === 10) {
                const location = session.siteLocationName || session.chargeLocationName || session.superchargerName || null;
                let totalFee = 0;
                let feeCurrency = "USD";
                if (Array.isArray(session.fees)) {
                  for (const fee of session.fees) {
                    totalFee += Number(fee.totalDue || fee.amount || 0);
                    if (fee.currencyCode) feeCurrency = fee.currencyCode;
                  }
                }
                if (!chargingSessionDetails) chargingSessionDetails = [];
                // Classify charging type based on location vs home address
                let chargingType = "supercharger";
                if (homeAddress && location) {
                  const locLower = location.toLowerCase();
                  // Check if location contains part of the home address or vice versa
                  // Compare street number + street name for fuzzy match
                  const homeWords = homeAddress.split(/[\s,]+/).filter((w: string) => w.length > 2);
                  const matchCount = homeWords.filter((w: string) => locLower.includes(w)).length;
                  if (matchCount >= 2 || locLower.includes(homeAddress) || homeAddress.includes(locLower)) {
                    chargingType = "home";
                  }
                }
                // If no fees at all and no "supercharger" in session type, likely home
                if (chargingType === "supercharger" && totalFee === 0) {
                  const sessionType = String(session.sessionType || session.chargerType || "").toLowerCase();
                  if (!sessionType.includes("supercharger") && !sessionType.includes("dc_fast")) {
                    chargingType = "home";
                  }
                }

                chargingSessionDetails.push({
                  user_id: targetUserId,
                  provider: "tesla",
                  device_id: vehicleDevices[0]?.id || "unknown",
                  session_date: dateStr,
                  energy_kwh: sessionKwh,
                  location: location,
                  fee_amount: totalFee > 0 ? totalFee : null,
                  fee_currency: totalFee > 0 ? feeCurrency : null,
                  charging_type: chargingType,
                  session_metadata: {
                    vin: session.vin || null,
                    charger_type: session.sessionType || session.chargerType || null,
                  },
                });
              }
            }
          }
          
          // Check if we have more pages
          offset += sessions.length;
          hasMore = Array.isArray(sessions) && sessions.length > 0 && offset < totalResults;
          
          // Safety limit to prevent infinite loops
          if (offset > 10000) {
            console.warn("Charging history pagination limit reached");
            break;
          }
        }
        
        console.log(`Charging history complete: ${totalSessions} sessions, total kWh: ${totalChargingKwh}`);
        
        // Get baseline from first vehicle's baseline data
        // Check all possible baseline keys used across the app
        const vehicleBaseline = vehicleDevices[0]?.baseline || {};
        baselineChargingKwh = vehicleBaseline.total_charge_energy_added_kwh || vehicleBaseline.charging_kwh || 0;
        baselineSuperchargerKwh = vehicleBaseline.supercharger_kwh || vehicleBaseline.charging_kwh || 0;
        baselineWallConnectorKwh = vehicleBaseline.wall_connector_kwh || 0;
      } catch (error) {
        console.error("Error fetching charging history:", error);
      }
    }

    // Write per-session charging details to charging_sessions
    if (chargingSessionDetails && chargingSessionDetails.length > 0) {
      console.log(`Writing ${chargingSessionDetails.length} charging sessions to charging_sessions table`);
      const batchSize = 500;
      for (let i = 0; i < chargingSessionDetails.length; i += batchSize) {
        const batch = chargingSessionDetails.slice(i, i + batchSize);
        const { error } = await supabaseClient
          .from("charging_sessions")
          .insert(batch)
          .select();
        // Ignore unique constraint violations (duplicates)
        if (error && error.code !== '23505') console.error(`Charging sessions insert error batch ${i}:`, error);
      }
    }

    // Fetch vehicle data
    for (const vehicle of vehicleDevices) {
      try {
        const vehicleResponse = await fetch(
          `${TESLA_API_BASE}/api/1/vehicles/${vehicle.id}/vehicle_data?endpoints=vehicle_state;drive_state;charge_state`,
          { headers: { "Authorization": `Bearer ${accessToken}` } }
        );

        // CRITICAL: If baseline is null/0, use 0 so first mint = ALL lifetime miles
        // After minting, baseline is reset to current odometer for delta tracking
        const baselineOdometer = vehicle.baseline?.odometer || 0;
        // Get last known odometer from baseline (stored from previous successful fetches)
        const lastKnownOdometer = vehicle.baseline?.last_known_odometer || 0;

        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json();
          const response = vehicleData.response || {};
          
          const chargeState = response.charge_state || {};
          const vehicleState = response.vehicle_state || {};
          
          const currentOdometer = vehicleState.odometer || 0;
          
          // Pending = current lifetime - baseline
          // If baseline is 0 (first mint), pending = full lifetime
          // If baseline is set (after mint), pending = delta since last mint
          const pendingMiles = Math.max(0, currentOdometer - baselineOdometer);
          
          console.log(`Vehicle ${vehicle.id} data:`, JSON.stringify({
            odometer: currentOdometer,
            baseline_odometer: baselineOdometer,
            baseline_is_null: vehicle.baseline === null,
            pending_miles: pendingMiles,
            battery_level: chargeState.battery_level,
            charging_state: chargeState.charging_state,
          }));
          
          vehiclesData.push({
            vin: vehicle.id,
            odometer: currentOdometer,
            pending_miles: pendingMiles,
            baseline_odometer: baselineOdometer,
            battery_level: chargeState.battery_level || 0,
            charging_state: chargeState.charging_state || "Unknown",
            charge_energy_added: chargeState.charge_energy_added || 0,
            charge_rate: chargeState.charge_rate || 0,
            charger_power: chargeState.charger_power || 0,
          });

          totalEvMiles += currentOdometer;
          pendingEvMiles += pendingMiles;
        } else if (vehicleResponse.status === 429) {
          console.warn("Tesla API rate limited for vehicle:", vehicle.id);
        } else if (vehicleResponse.status === 408) {
          // Vehicle is asleep - try to wake it up first
          console.log(`Vehicle ${vehicle.id} is asleep, attempting to wake...`);
          
          let currentOdometer = lastKnownOdometer;
          let isAwake = false;
          
          // Try to wake the vehicle
          try {
            const wakeResponse = await fetch(
              `${TESLA_API_BASE}/api/1/vehicles/${vehicle.id}/wake_up`,
              { 
                method: "POST",
                headers: { "Authorization": `Bearer ${accessToken}` } 
              }
            );
            
            if (wakeResponse.ok) {
              console.log(`Wake command sent to vehicle ${vehicle.id}, waiting for vehicle to come online...`);
              
              // Wait a bit for the vehicle to wake (Tesla recommends up to 30 seconds)
              // We'll try 3 times with 5 second delays
              for (let attempt = 0; attempt < 3; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const retryResponse = await fetch(
                  `${TESLA_API_BASE}/api/1/vehicles/${vehicle.id}/vehicle_data?endpoints=vehicle_state`,
                  { headers: { "Authorization": `Bearer ${accessToken}` } }
                );
                
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json();
                  const vehicleState = retryData.response?.vehicle_state || {};
                  if (vehicleState.odometer && vehicleState.odometer > 0) {
                    currentOdometer = vehicleState.odometer;
                    isAwake = true;
                    console.log(`Vehicle ${vehicle.id} woke up! Odometer: ${currentOdometer}`);
                    break;
                  }
                } else if (retryResponse.status !== 408) {
                  console.log(`Retry ${attempt + 1} failed with status ${retryResponse.status}`);
                  break;
                }
              }
            } else {
              console.log(`Could not wake vehicle ${vehicle.id}: ${wakeResponse.status}`);
            }
          } catch (wakeError) {
            console.log(`Wake attempt failed for ${vehicle.id}:`, wakeError);
          }
          
          // If wake didn't work, try the /vehicles list for cached data
          if (!isAwake) {
            try {
              const vehiclesListResponse = await fetch(
                `${TESLA_API_BASE}/api/1/vehicles`,
                { headers: { "Authorization": `Bearer ${accessToken}` } }
              );
              
              if (vehiclesListResponse.ok) {
                const vehiclesList = await vehiclesListResponse.json();
                const thisVehicle = (vehiclesList.response || []).find((v: any) => v.vin === vehicle.id);
                
                if (thisVehicle) {
                  console.log(`Vehicle list data for ${vehicle.id}:`, JSON.stringify(thisVehicle));
                  const cachedState = thisVehicle.vehicle_state || thisVehicle.cached_data?.vehicle_state;
                  if (cachedState?.odometer && cachedState.odometer > 0) {
                    currentOdometer = cachedState.odometer;
                    console.log(`Got cached odometer from /vehicles list: ${currentOdometer}`);
                  }
                }
              }
            } catch (listError) {
              console.log("Could not fetch vehicles list for cached data:", listError);
            }
          }
          
          // If still no good odometer and we have charging data, estimate
          if (currentOdometer === 0 && totalChargingKwh > 0) {
            const estimatedMiles = Math.round(totalChargingKwh * 3.5);
            console.log(`Estimating odometer from charging: ${totalChargingKwh} kWh * 3.5 = ~${estimatedMiles} miles`);
            currentOdometer = estimatedMiles;
          }
          
          const pendingMiles = Math.max(0, currentOdometer - baselineOdometer);
          
          console.log(`Vehicle ${vehicle.id} final - odometer: ${currentOdometer}, baseline: ${baselineOdometer}, pending: ${pendingMiles}, isAwake: ${isAwake}`);
          
          vehiclesData.push({ 
            vin: vehicle.id, 
            status: isAwake ? "online" : "asleep", 
            odometer: currentOdometer, 
            pending_miles: pendingMiles,
            baseline_odometer: baselineOdometer,
            needs_wake: !isAwake && currentOdometer !== lastKnownOdometer
          });
          
          totalEvMiles += currentOdometer;
          pendingEvMiles += pendingMiles;
        } else {
          const errorText = await vehicleResponse.text();
          console.error(`Failed to fetch vehicle ${vehicle.id} (${vehicleResponse.status}):`, errorText);
        }
      } catch (error) {
        console.error(`Error fetching vehicle ${vehicle.id}:`, error);
      }
    }
    
    // Calculate pending charging kWh (total and per source)
    const pendingChargingKwh = Math.max(0, totalChargingKwh - baselineChargingKwh);

    // Total EV charging calculation:
    // - Supercharger (DC): From billing history - available for all users
    // - Wall Connector (AC): From energy site telemetry - only for users with Tesla Wall Connectors
    // - No estimation: Only report measured/verified data for accuracy
    
    const superchargerKwh = totalChargingKwh; // DC charging from billing
    const wallConnectorKwh = totalHomeChargingWh / 1000; // AC charging from Wall Connector telemetry
    
    // Total = Supercharger + Wall Connector (if available)
    const totalEvChargingKwh = superchargerKwh + wallConnectorKwh;

    // Calculate pending for each charging source
    const pendingSuperchargerKwh = Math.max(0, superchargerKwh - baselineSuperchargerKwh);
    const pendingWallConnectorKwh = Math.max(0, wallConnectorKwh - baselineWallConnectorKwh);
    const pendingEvChargingKwh = pendingSuperchargerKwh + pendingWallConnectorKwh;
    
    console.log(`EV Charging: Supercharger (DC)=${superchargerKwh.toFixed(1)} kWh (pending: ${pendingSuperchargerKwh.toFixed(1)}), Wall Connector (AC)=${wallConnectorKwh.toFixed(1)} kWh (pending: ${pendingWallConnectorKwh.toFixed(1)}), Total=${totalEvChargingKwh.toFixed(1)} kWh`);

    // Store production data for rewards calculation and Energy Log
    {
      const now = new Date();
      const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
      
      for (const site of energySitesData) {
        // Solar production (existing behavior - cumulative pending)
        if (site.pending_solar_wh > 0 || site.pending_battery_discharge_wh > 0) {
          await supabaseClient
            .from("energy_production")
            .upsert({
              user_id: targetUserId,
              device_id: site.site_id,
              provider: "tesla",
              production_wh: site.pending_solar_wh || 0,
              data_type: "solar",
              recorded_at: recordedAt,
            }, { onConflict: "device_id,provider,recorded_at,data_type" });
        }

        // Battery discharge (cumulative lifetime - useEnergyLog computes day-over-day deltas)
        if (site.lifetime_battery_discharge_wh > 0) {
          await supabaseClient
            .from("energy_production")
            .upsert({
              user_id: targetUserId,
              device_id: site.site_id,
              provider: "tesla",
              production_wh: site.lifetime_battery_discharge_wh,
              data_type: "battery_discharge",
              recorded_at: recordedAt,
            }, { onConflict: "device_id,provider,recorded_at,data_type" });
        }
      }

      // EV charging (cumulative lifetime kWh → Wh for consistency)
      if (totalEvChargingKwh > 0 && vehicleDevices.length > 0) {
        const primaryVin = vehicleDevices[0].id;
        await supabaseClient
          .from("energy_production")
          .upsert({
            user_id: targetUserId,
            device_id: primaryVin,
            provider: "tesla",
            production_wh: totalEvChargingKwh * 1000,
            data_type: "ev_charging",
            recorded_at: recordedAt,
          }, { onConflict: "device_id,provider,recorded_at,data_type" });
      }

      // EV miles (odometer snapshot - cumulative, useEnergyLog computes day-over-day deltas)
      for (const vehicle of vehiclesData) {
        if (vehicle.odometer > 0) {
          await supabaseClient
            .from("energy_production")
            .upsert({
              user_id: targetUserId,
              device_id: vehicle.vin,
              provider: "tesla",
              production_wh: vehicle.odometer, // storing miles in production_wh (cumulative)
              data_type: "ev_miles",
              recorded_at: recordedAt,
            }, { onConflict: "device_id,provider,recorded_at,data_type" });
        }
      }
    }

    // Store lifetime totals in connected_devices for admin reporting
    // Update energy sites with lifetime totals
    for (const site of energySitesData) {
      await supabaseClient
        .from("connected_devices")
        .update({
          lifetime_totals: {
            solar_wh: site.lifetime_solar_wh,
            battery_discharge_wh: site.lifetime_battery_discharge_wh,
            wall_connector_wh: site.wall_connector_charging_wh,
            updated_at: new Date().toISOString(),
          }
        })
        .eq("user_id", targetUserId)
        .eq("device_id", site.site_id)
        .eq("provider", "tesla");
    }
    
    // Update vehicles with lifetime totals and last known odometer (for future asleep states)
    for (const vehicle of vehiclesData) {
      const updateData: any = {
        lifetime_totals: {
          odometer: vehicle.odometer,
          charging_kwh: totalEvChargingKwh, // Total charging across all vehicles
          updated_at: new Date().toISOString(),
        }
      };
      
      // If we got a real odometer reading (not asleep/estimated), update baseline with last_known_odometer
      if (vehicle.status !== "asleep" && vehicle.odometer > 0) {
        // Get current baseline and update with last_known_odometer
        const { data: currentDevice } = await supabaseClient
          .from("connected_devices")
          .select("baseline_data")
          .eq("user_id", targetUserId)
          .eq("device_id", vehicle.vin)
          .eq("provider", "tesla")
          .single();
        
        if (currentDevice) {
          const currentBaseline = currentDevice.baseline_data || {};
          updateData.baseline_data = {
            ...currentBaseline,
            last_known_odometer: vehicle.odometer,
          };
          console.log(`Updated last_known_odometer for ${vehicle.vin}: ${vehicle.odometer}`);
        }
      }
      
      await supabaseClient
        .from("connected_devices")
        .update(updateData)
        .eq("user_id", targetUserId)
        .eq("device_id", vehicle.vin)
        .eq("provider", "tesla");
    }
    
    console.log("Stored lifetime totals in connected_devices for admin reporting");

    return new Response(JSON.stringify({
      energy_sites: energySitesData,
      vehicles: vehiclesData,
      totals: {
        // Lifetime totals
        solar_production_wh: totalSolarProduction,
        battery_discharge_wh: totalBatteryDischarge,
        ev_miles: totalEvMiles,
        ev_charging_kwh: totalEvChargingKwh,
        supercharger_kwh: superchargerKwh,
        wall_connector_kwh: wallConnectorKwh,
        // Pending (since last mint)
        pending_solar_wh: pendingSolarProduction,
        pending_battery_discharge_wh: pendingBatteryDischarge,
        pending_ev_miles: pendingEvMiles,
        pending_ev_charging_kwh: pendingEvChargingKwh,
        pending_supercharger_kwh: pendingSuperchargerKwh,
        pending_wall_connector_kwh: pendingWallConnectorKwh,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Tesla data error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch energy data. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
