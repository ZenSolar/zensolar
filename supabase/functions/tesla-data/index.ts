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

    // Get user's claimed devices
    const { data: claimedDevices } = await supabaseClient
      .from("connected_devices")
      .select("device_id, device_type, device_metadata")
      .eq("user_id", user.id)
      .eq("provider", "tesla");

    const energySiteIds = claimedDevices
      ?.filter(d => d.device_type === "solar" || d.device_type === "powerwall")
      .map(d => d.device_id) || [];

    const vehicleIds = claimedDevices
      ?.filter(d => d.device_type === "vehicle")
      .map(d => d.device_id) || [];

    let totalSolarProduction = 0;
    let totalBatteryDischarge = 0;
    let totalEvMiles = 0;
    const energySitesData: any[] = [];
    const vehiclesData: any[] = [];

    // Fetch energy site data
    for (const siteId of energySiteIds) {
      try {
        // Get live status
        const liveResponse = await fetch(
          `${TESLA_API_BASE}/api/1/energy_sites/${siteId}/live_status`,
          { headers: { "Authorization": `Bearer ${accessToken}` } }
        );

        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          const response = liveData.response || {};
          
          energySitesData.push({
            site_id: siteId,
            solar_power: response.solar_power || 0,
            battery_power: response.battery_power || 0,
            grid_power: response.grid_power || 0,
            load_power: response.load_power || 0,
          });

          // Accumulate production (convert W to Wh assuming 1 hour sample)
          if (response.solar_power > 0) {
            totalSolarProduction += response.solar_power;
          }
          if (response.battery_power < 0) {
            totalBatteryDischarge += Math.abs(response.battery_power);
          }
        } else if (liveResponse.status === 429) {
          console.warn("Tesla API rate limited for site:", siteId);
        } else {
          console.error(`Failed to fetch site ${siteId}:`, await liveResponse.text());
        }
      } catch (error) {
        console.error(`Error fetching site ${siteId}:`, error);
      }
    }

    // Fetch vehicle data
    for (const vin of vehicleIds) {
      try {
        const vehicleResponse = await fetch(
          `${TESLA_API_BASE}/api/1/vehicles/${vin}/vehicle_data?endpoints=vehicle_state;drive_state;charge_state`,
          { headers: { "Authorization": `Bearer ${accessToken}` } }
        );

        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json();
          const response = vehicleData.response || {};
          
          vehiclesData.push({
            vin,
            odometer: response.vehicle_state?.odometer || 0,
            battery_level: response.charge_state?.battery_level || 0,
            charging_state: response.charge_state?.charging_state || "Unknown",
          });

          totalEvMiles += response.vehicle_state?.odometer || 0;
        } else if (vehicleResponse.status === 429) {
          console.warn("Tesla API rate limited for vehicle:", vin);
        } else if (vehicleResponse.status === 408) {
          // Vehicle is sleeping - this is normal
          vehiclesData.push({ vin, status: "asleep" });
        } else {
          console.error(`Failed to fetch vehicle ${vin}:`, await vehicleResponse.text());
        }
      } catch (error) {
        console.error(`Error fetching vehicle ${vin}:`, error);
      }
    }

    // Store production data for rewards calculation
    if (totalSolarProduction > 0 || totalBatteryDischarge > 0) {
      const now = new Date();
      const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
      
      for (const site of energySitesData) {
        await supabaseClient
          .from("energy_production")
          .upsert({
            user_id: user.id,
            device_id: site.site_id,
            provider: "tesla",
            production_wh: site.solar_power || 0,
            recorded_at: recordedAt,
          }, { onConflict: "device_id,provider,recorded_at" });
      }
    }

    return new Response(JSON.stringify({
      energy_sites: energySitesData,
      vehicles: vehiclesData,
      totals: {
        solar_production_w: totalSolarProduction,
        battery_discharge_w: totalBatteryDischarge,
        ev_miles: totalEvMiles,
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
