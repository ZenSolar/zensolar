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

// On initial device claim, we set baseline to 0 so that the FIRST mint 
// includes ALL lifetime activity. After each mint, the baseline is reset
// to current lifetime values so subsequent mints only include new activity.
//
// Example flow for a vehicle with 69,000 miles:
// 1. User claims device → baseline.odometer = 0
// 2. Dashboard shows pending = 69,000 - 0 = 69,000 miles
// 3. User mints → gets 69,000 tokens, baseline reset to 69,000
// 4. User drives 100 more miles → pending = 69,100 - 69,000 = 100 miles
// 5. User mints → gets 100 tokens, baseline reset to 69,100

async function fetchVehicleLifetimeData(
  vin: string,
  accessToken: string
): Promise<BaselineData> {
  // CRITICAL: Set baseline to 0 on initial claim so first mint includes all lifetime activity
  const baseline: BaselineData = { 
    captured_at: new Date().toISOString(),
    odometer: 0,  // First mint = ALL lifetime miles
    last_known_odometer: 0,
    total_charge_energy_added_kwh: 0,  // First mint = ALL lifetime charging
  };
  
  try {
    // Still fetch current odometer to store as last_known_odometer for reference
    const response = await fetch(
      `${TESLA_API_BASE}/api/1/vehicles/${vin}/vehicle_data?endpoints=vehicle_state;charge_state`,
      { headers: { "Authorization": `Bearer ${accessToken}` } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const vehicleState = data.response?.vehicle_state || {};
      
      // Store current odometer as last_known for reference, but baseline stays at 0
      baseline.last_known_odometer = vehicleState.odometer || 0;
      
      console.log(`Vehicle ${vin} claimed with baseline=0, current odometer=${baseline.last_known_odometer}`);
    } else if (response.status === 408) {
      // Vehicle asleep - try to get data from /vehicles list endpoint
      console.log(`Vehicle ${vin} is asleep during claim, baseline set to 0`);
    } else {
      console.log(`Vehicle ${vin} could not fetch current odometer, baseline set to 0`);
    }
  } catch (error) {
    console.error(`Error fetching vehicle ${vin} data during claim:`, error);
  }
  
  return baseline;
}

// Fetch lifetime data for a Tesla energy site (Powerwall/Solar)
// On initial claim, baseline is set to 0 so first mint includes all lifetime production
async function fetchEnergySiteLifetimeData(
  siteId: string,
  accessToken: string
): Promise<BaselineData> {
  // CRITICAL: Set baseline to 0 on initial claim so first mint includes all lifetime activity
  const baseline: BaselineData = { 
    captured_at: new Date().toISOString(),
    total_energy_discharged_wh: 0,  // First mint = ALL lifetime battery discharge
    total_solar_produced_wh: 0,     // First mint = ALL lifetime solar production
  };
  
  console.log(`Energy site ${siteId} claimed with baseline=0 (first mint = all lifetime)`);
  
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
