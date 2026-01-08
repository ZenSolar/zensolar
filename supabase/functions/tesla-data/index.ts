import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Get user's Tesla tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", user.id)
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

    // Get user's claimed devices with baseline data
    const { data: claimedDevices } = await supabaseClient
      .from("connected_devices")
      .select("device_id, device_type, device_metadata, baseline_data, last_minted_at")
      .eq("user_id", user.id)
      .eq("provider", "tesla");

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
          // Need to use a date range from installation to now
          let lifetimeSolar = 0;
          let lifetimeBatteryDischarge = 0;
          let wallConnectorChargingWh = 0;
          
          try {
            // Get site info for installation date
            const siteInfoResponse = await fetch(
              `${TESLA_API_BASE}/api/1/energy_sites/${site.id}/site_info`,
              { headers: { "Authorization": `Bearer ${accessToken}` } }
            );

            let startDate = "2020-01-01"; // Default fallback
            if (siteInfoResponse.ok) {
              const siteInfo = await siteInfoResponse.json();
              if (siteInfo.response?.installation_date) {
                startDate = String(siteInfo.response.installation_date).split("T")[0];
              }
            }

            const endDate = new Date().toISOString().split("T")[0];
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago";

            // Tesla energy history expects RFC3339 timestamps (must include a "T")
            const startDateTime = new Date(`${startDate}T00:00:00`).toISOString();
            const endDateTime = new Date(`${endDate}T23:59:59`).toISOString();

            // Fetch energy history for solar and battery
            const historyResponse = await fetch(
              `${TESLA_API_BASE}/api/1/energy_sites/${site.id}/calendar_history?kind=energy&start_date=${encodeURIComponent(startDateTime)}&end_date=${encodeURIComponent(endDateTime)}&period=month&time_zone=${encodeURIComponent(timezone)}`,
              { headers: { "Authorization": `Bearer ${accessToken}` } }
            );

            if (historyResponse.ok) {
              const historyData = await historyResponse.json();
              const timeSeries = historyData.response?.time_series || [];

              if (timeSeries.length > 0) {
                console.log(`Sample history period for site ${site.id}:`, JSON.stringify(timeSeries[0]));
              }

              // Sum up all monthly data for lifetime totals
              // Use consumer_energy_imported_from_battery for actual home usage from battery
              for (const period of timeSeries) {
                lifetimeSolar += (period.solar_energy_exported || 0);
                lifetimeBatteryDischarge += (period.consumer_energy_imported_from_battery || period.battery_energy_exported || 0);
              }
              console.log(`Site ${site.id} lifetime from history:`, JSON.stringify({ lifetimeSolar, lifetimeBatteryDischarge, periods: timeSeries.length }));
            } else {
              console.error(`Failed to fetch history for site ${site.id}:`, await historyResponse.text());
            }
            
            // Fetch Wall Connector charging history (home EV charging)
            try {
              const wallConnectorResponse = await fetch(
                `${TESLA_API_BASE}/api/1/energy_sites/${site.id}/telemetry_history?kind=charge&start_date=${encodeURIComponent(startDateTime)}&end_date=${encodeURIComponent(endDateTime)}&time_zone=${encodeURIComponent(timezone)}`,
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
          const baselineSolar = site.baseline?.total_solar_produced_wh || 0;
          const baselineBattery = site.baseline?.total_energy_discharged_wh || 0;
          
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
    let totalSessions = 0;
    
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

            totalChargingKwh += Number(directKwh || kwhFromFees || 0);
            totalSessions++;
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
        baselineChargingKwh = vehicleDevices[0]?.baseline?.total_charge_energy_added_kwh || 0;
      } catch (error) {
        console.error("Error fetching charging history:", error);
      }
    }

    // Fetch vehicle data
    for (const vehicle of vehicleDevices) {
      try {
        const vehicleResponse = await fetch(
          `${TESLA_API_BASE}/api/1/vehicles/${vehicle.id}/vehicle_data?endpoints=vehicle_state;drive_state;charge_state`,
          { headers: { "Authorization": `Bearer ${accessToken}` } }
        );

        const baselineOdometer = vehicle.baseline?.odometer || 0;

        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json();
          const response = vehicleData.response || {};
          
          const chargeState = response.charge_state || {};
          const vehicleState = response.vehicle_state || {};
          
          const currentOdometer = vehicleState.odometer || 0;
          const pendingMiles = Math.max(0, currentOdometer - baselineOdometer);
          
          console.log(`Vehicle ${vehicle.id} data:`, JSON.stringify({
            odometer: currentOdometer,
            baseline_odometer: baselineOdometer,
            pending_miles: pendingMiles,
            battery_level: chargeState.battery_level,
            charging_state: chargeState.charging_state,
          }));
          
          vehiclesData.push({
            vin: vehicle.id,
            odometer: currentOdometer,
            pending_miles: pendingMiles,
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
          // Vehicle is asleep - use baseline odometer as current since we can't get live data
          console.log(`Vehicle ${vehicle.id} is asleep, using baseline odometer: ${baselineOdometer}`);
          vehiclesData.push({ 
            vin: vehicle.id, 
            status: "asleep", 
            odometer: baselineOdometer, 
            pending_miles: 0 // No new miles since we can't verify
          });
          totalEvMiles += baselineOdometer;
          // Don't add pending miles since we can't confirm new driving
        } else {
          const errorText = await vehicleResponse.text();
          console.error(`Failed to fetch vehicle ${vehicle.id} (${vehicleResponse.status}):`, errorText);
        }
      } catch (error) {
        console.error(`Error fetching vehicle ${vehicle.id}:`, error);
      }
    }
    
    // Calculate pending charging kWh
    const pendingChargingKwh = Math.max(0, totalChargingKwh - baselineChargingKwh);

    // Store production data for rewards calculation (using pending amounts)
    if (pendingSolarProduction > 0 || pendingBatteryDischarge > 0) {
      const now = new Date();
      const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
      
      for (const site of energySitesData) {
        if (site.pending_solar_wh > 0 || site.pending_battery_discharge_wh > 0) {
          await supabaseClient
            .from("energy_production")
            .upsert({
              user_id: user.id,
              device_id: site.site_id,
              provider: "tesla",
              production_wh: site.pending_solar_wh || 0,
              recorded_at: recordedAt,
            }, { onConflict: "device_id,provider,recorded_at" });
        }
      }
    }

    // Total EV charging = Supercharger sessions + Home (Wall Connector) charging
    const totalEvChargingKwh = totalChargingKwh + (totalHomeChargingWh / 1000);
    const pendingEvChargingKwh = Math.max(0, totalEvChargingKwh - baselineChargingKwh);

    return new Response(JSON.stringify({
      energy_sites: energySitesData,
      vehicles: vehiclesData,
      totals: {
        // Lifetime totals
        solar_production_wh: totalSolarProduction,
        battery_discharge_wh: totalBatteryDischarge,
        ev_miles: totalEvMiles,
        ev_charging_kwh: totalEvChargingKwh,
        home_charging_kwh: totalHomeChargingWh / 1000,
        supercharger_kwh: totalChargingKwh,
        // Pending (since last mint)
        pending_solar_wh: pendingSolarProduction,
        pending_battery_discharge_wh: pendingBatteryDischarge,
        pending_ev_miles: pendingEvMiles,
        pending_ev_charging_kwh: pendingEvChargingKwh,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Tesla data error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
