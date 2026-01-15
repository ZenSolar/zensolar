import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

interface DeviceToClaim {
  device_id: string;
  device_type: string;
  device_name: string;
  metadata?: Record<string, any>;
}

interface BaselineData {
  odometer?: number;
  last_known_odometer?: number;
  total_energy_discharged_wh?: number;
  total_solar_produced_wh?: number;
  total_charge_energy_added_kwh?: number;
  estimated?: boolean;
  captured_at: string;
}

// Fetch lifetime data for a Tesla vehicle
async function fetchVehicleLifetimeData(
  vin: string,
  accessToken: string
): Promise<BaselineData> {
  const baseline: BaselineData = { captured_at: new Date().toISOString() };
  
  try {
    const response = await fetch(
      `${TESLA_API_BASE}/api/1/vehicles/${vin}/vehicle_data?endpoints=vehicle_state;charge_state`,
      { headers: { "Authorization": `Bearer ${accessToken}` } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const vehicleState = data.response?.vehicle_state || {};
      const chargeState = data.response?.charge_state || {};
      
      baseline.odometer = vehicleState.odometer || 0;
      baseline.last_known_odometer = vehicleState.odometer || 0;
      // Note: Tesla doesn't provide lifetime charge energy directly
      // We'll track it incrementally from charge_energy_added per session
      baseline.total_charge_energy_added_kwh = 0;
      
      console.log(`Vehicle ${vin} baseline:`, JSON.stringify(baseline));
    } else if (response.status === 408) {
      // Vehicle asleep - try to get data from /vehicles list endpoint
      console.log(`Vehicle ${vin} is asleep, trying /vehicles list for cached data...`);
      
      try {
        const vehiclesListResponse = await fetch(
          `${TESLA_API_BASE}/api/1/vehicles`,
          { headers: { "Authorization": `Bearer ${accessToken}` } }
        );
        
        if (vehiclesListResponse.ok) {
          const vehiclesList = await vehiclesListResponse.json();
          const thisVehicle = (vehiclesList.response || []).find((v: any) => v.vin === vin);
          
          if (thisVehicle) {
            const cachedState = thisVehicle.vehicle_state || thisVehicle.cached_data?.vehicle_state;
            if (cachedState?.odometer && cachedState.odometer > 0) {
              baseline.odometer = cachedState.odometer;
              baseline.last_known_odometer = cachedState.odometer;
              console.log(`Got cached odometer from /vehicles list: ${baseline.odometer}`);
            }
          }
        }
      } catch (listError) {
        console.log("Could not fetch vehicles list for cached data:", listError);
      }
      
      // If still no odometer, try to estimate from charging history
      if (!baseline.odometer || baseline.odometer === 0) {
        try {
          const chargingResponse = await fetch(
            `${TESLA_API_BASE}/api/1/dx/charging/history?pageSize=100&pageNo=1`,
            { headers: { "Authorization": `Bearer ${accessToken}` } }
          );
          
          if (chargingResponse.ok) {
            const chargingData = await chargingResponse.json();
            const sessions = chargingData.data || [];
            let totalKwh = 0;
            
            for (const session of sessions) {
              if (session.vin === vin) {
                const directKwh = session.chargeEnergyAdded || session.charge_energy_added || 0;
                let kwhFromFees = 0;
                if (Array.isArray(session.fees)) {
                  for (const fee of session.fees) {
                    if (String(fee.feeType || '').toUpperCase() === 'CHARGING' && String(fee.uom || '').toLowerCase() === 'kwh') {
                      kwhFromFees += Number(fee.usageBase || 0) + Number(fee.usageTier1 || 0) + Number(fee.usageTier2 || 0);
                    }
                  }
                }
                totalKwh += Number(directKwh || kwhFromFees || 0);
              }
            }
            
            if (totalKwh > 0) {
              // Estimate: ~3.5 miles per kWh for typical Tesla
              const estimatedMiles = Math.round(totalKwh * 3.5);
              baseline.odometer = estimatedMiles;
              baseline.last_known_odometer = estimatedMiles;
              baseline.estimated = true;
              console.log(`Estimated baseline from charging history: ${totalKwh} kWh * 3.5 = ${estimatedMiles} miles`);
            }
          }
        } catch (chargingError) {
          console.log("Could not fetch charging history for estimate:", chargingError);
        }
      }
      
      // Final fallback: use 0 and update later
      if (!baseline.odometer) {
        baseline.odometer = 0;
        baseline.last_known_odometer = 0;
      }
      baseline.total_charge_energy_added_kwh = 0;
    } else {
      console.error(`Failed to fetch vehicle ${vin} baseline:`, await response.text());
      baseline.odometer = 0;
      baseline.last_known_odometer = 0;
      baseline.total_charge_energy_added_kwh = 0;
    }
  } catch (error) {
    console.error(`Error fetching vehicle ${vin} baseline:`, error);
    baseline.odometer = 0;
    baseline.last_known_odometer = 0;
    baseline.total_charge_energy_added_kwh = 0;
  }
  
  return baseline;
}

// Fetch lifetime data for a Tesla energy site (Powerwall/Solar)
async function fetchEnergySiteLifetimeData(
  siteId: string,
  accessToken: string
): Promise<BaselineData> {
  const baseline: BaselineData = { captured_at: new Date().toISOString() };
  
  try {
    // Get site info for lifetime data
    const infoResponse = await fetch(
      `${TESLA_API_BASE}/api/1/energy_sites/${siteId}/site_info`,
      { headers: { "Authorization": `Bearer ${accessToken}` } }
    );
    
    if (infoResponse.ok) {
      const infoData = await infoResponse.json();
      const response = infoData.response || {};
      
      // Tesla provides lifetime energy data in site_info
      baseline.total_energy_discharged_wh = response.total_pack_energy || 0;
      baseline.total_solar_produced_wh = response.nameplate_energy || 0;
      
      console.log(`Energy site ${siteId} info:`, JSON.stringify(response));
    }
    
    // Also try to get historical totals from calendar_history
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 5); // 5 years back
    
    const historyResponse = await fetch(
      `${TESLA_API_BASE}/api/1/energy_sites/${siteId}/calendar_history?kind=energy&period=lifetime`,
      { headers: { "Authorization": `Bearer ${accessToken}` } }
    );
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      const response = historyData.response || {};
      
      // Sum up lifetime totals from history
      if (response.total_battery_discharge_energy) {
        baseline.total_energy_discharged_wh = response.total_battery_discharge_energy;
      }
      if (response.total_solar_energy_exported !== undefined) {
        baseline.total_solar_produced_wh = response.total_solar_energy_exported + (response.total_solar_energy_consumed || 0);
      }
      
      console.log(`Energy site ${siteId} history baseline:`, JSON.stringify(baseline));
    } else {
      console.log(`Could not fetch lifetime history for site ${siteId}:`, historyResponse.status);
    }
    
  } catch (error) {
    console.error(`Error fetching energy site ${siteId} baseline:`, error);
  }
  
  return baseline;
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

    const { provider, devices } = await req.json() as { 
      provider: string; 
      devices: DeviceToClaim[] 
    };

    if (!provider || !devices || devices.length === 0) {
      return new Response(JSON.stringify({ error: "Provider and devices required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get access token for fetching baseline data
    let accessToken: string | null = null;
    if (provider === "tesla") {
      const { data: tokenData } = await supabaseClient
        .from("energy_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("provider", "tesla")
        .single();
      
      accessToken = tokenData?.access_token || null;
    }

    const results = {
      claimed: [] as string[],
      already_claimed: [] as string[],
      errors: [] as string[],
    };

    // Process each device
    for (const device of devices) {
      // Check if already claimed by another user
      const { data: existing } = await supabaseClient
        .from("connected_devices")
        .select("user_id")
        .eq("provider", provider)
        .eq("device_id", device.device_id)
        .single();

      if (existing) {
        if (existing.user_id === user.id) {
          // Already claimed by this user - skip
          results.claimed.push(device.device_id);
        } else {
          // Claimed by someone else
          results.already_claimed.push(device.device_id);
        }
        continue;
      }

      // Fetch baseline/lifetime data for Tesla devices
      let baselineData: BaselineData = { captured_at: new Date().toISOString() };
      
      if (provider === "tesla" && accessToken) {
        if (device.device_type === "vehicle") {
          baselineData = await fetchVehicleLifetimeData(device.device_id, accessToken);
        } else if (device.device_type === "powerwall" || device.device_type === "solar") {
          baselineData = await fetchEnergySiteLifetimeData(device.device_id, accessToken);
        }
      }

      // Claim the device with baseline data
      const { error: insertError } = await supabaseClient
        .from("connected_devices")
        .insert({
          user_id: user.id,
          provider,
          device_id: device.device_id,
          device_type: device.device_type,
          device_name: device.device_name,
          device_metadata: device.metadata || null,
          baseline_data: baselineData,
        });

      if (insertError) {
        console.error("Failed to claim device:", insertError);
        // Check if it's a unique constraint violation
        if (insertError.code === "23505") {
          results.already_claimed.push(device.device_id);
        } else {
          results.errors.push(device.device_id);
        }
      } else {
        results.claimed.push(device.device_id);
        console.log(`Claimed device ${device.device_id} with baseline:`, JSON.stringify(baselineData));
      }
    }

    // Update profile connection status if any devices were claimed
    if (results.claimed.length > 0) {
      const columnName = `${provider}_connected`;
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ [columnName]: true })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
      }

      // Get user email for notification
      const { data: authUser } = await supabaseClient.auth.admin.getUserById(user.id);
      const userEmail = authUser?.user?.email || null;

      // Notify admins of the new account connection
      try {
        const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-account-connected`;
        await fetch(notifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            user_email: userEmail,
            provider,
            device_count: results.claimed.length,
          }),
        });
        console.log("Sent account connected notification to admins");
      } catch (notifyError) {
        console.error("Failed to send account connected notification:", notifyError);
        // Don't fail the main operation if notification fails
      }
    }

    const success = results.claimed.length > 0;
    const message = results.claimed.length > 0
      ? `Successfully claimed ${results.claimed.length} device(s) with lifetime data`
      : results.already_claimed.length > 0
        ? "Selected devices are already claimed by other users"
        : "No devices were claimed";

    return new Response(JSON.stringify({ 
      success,
      message,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Claim devices error:", error);
    return new Response(JSON.stringify({ error: "Failed to claim devices. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
