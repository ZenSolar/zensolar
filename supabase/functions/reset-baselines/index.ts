import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  categories: ('solar' | 'ev_miles' | 'battery' | 'charging' | 'all')[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[reset-baselines] Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user token to get user info
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("[reset-baselines] User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[reset-baselines] User ${user.id} (${user.email}) requesting baseline reset`);

    // Create service client to check admin role
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: isAdminResult, error: adminError } = await serviceClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (adminError || !isAdminResult) {
      console.error("[reset-baselines] Admin check failed:", adminError, "result:", isAdminResult);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[reset-baselines] Admin check passed");

    // Parse request body
    const { categories = ['all'] }: ResetRequest = await req.json();
    console.log("[reset-baselines] Categories to reset:", categories);

    // Fetch all connected devices for this user
    const { data: devices, error: devicesError } = await serviceClient
      .from('connected_devices')
      .select('*')
      .eq('user_id', user.id);

    if (devicesError) {
      console.error("[reset-baselines] Error fetching devices:", devicesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch devices" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!devices || devices.length === 0) {
      console.log("[reset-baselines] No devices found for user");
      return new Response(
        JSON.stringify({ message: "No devices to reset", devicesUpdated: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shouldResetAll = categories.includes('all');
    const resetResults: { deviceId: string; deviceType: string; category: string; baselineSet: Record<string, number> }[] = [];

    // Process each device and reset its baseline to current lifetime
    for (const device of devices) {
      const lifetime = device.lifetime_totals || {};
      const baseline = device.baseline_data || {};
      const deviceType = device.device_type;
      const newBaseline: Record<string, any> = { ...baseline, reset_at: new Date().toISOString() };
      let updated = false;

      // Determine which categories this device contributes to
      if (deviceType === 'solar_system' || deviceType === 'solar') {
        // Solar devices
        if (shouldResetAll || categories.includes('solar')) {
          // Set baseline to current lifetime (makes pending = 0)
          // IMPORTANT: Write all known baseline keys used across the app (legacy + new)
          const lifetimeSolarWh =
            (lifetime.lifetime_solar_wh ?? lifetime.solar_production_wh ?? lifetime.solar_wh ?? 0) as number;

          newBaseline.solar_production_wh = lifetimeSolarWh;
          newBaseline.lifetime_solar_wh = lifetimeSolarWh;
          newBaseline.solar_wh = lifetimeSolarWh;
          newBaseline.total_solar_produced_wh = lifetimeSolarWh;

          updated = true;
          resetResults.push({
            deviceId: device.device_id,
            deviceType,
            category: 'solar',
            baselineSet: { solar_wh: lifetimeSolarWh }
          });
        }
      }

      if (deviceType === 'vehicle') {
        // EV Miles
        if (shouldResetAll || categories.includes('ev_miles')) {
          const lifetimeOdometer = lifetime.odometer || lifetime.last_known_odometer || 0;
          newBaseline.odometer = lifetimeOdometer;
          updated = true;
          resetResults.push({
            deviceId: device.device_id,
            deviceType,
            category: 'ev_miles',
            baselineSet: { odometer: lifetimeOdometer }
          });
        }

        // EV Charging (supercharger portion)
        if (shouldResetAll || categories.includes('charging')) {
          // IMPORTANT: Tesla-related code paths historically use multiple baseline keys.
          // To keep dashboard pending + minting deltas consistent, write all commonly-used keys.
          let lifetimeChargingKwh = 0;
          if (lifetime.charging_kwh != null) {
            lifetimeChargingKwh = Number(lifetime.charging_kwh);
          } else if (lifetime.charging_wh != null) {
            lifetimeChargingKwh = Number(lifetime.charging_wh) / 1000;
          }

          newBaseline.charging_kwh = lifetimeChargingKwh;
          newBaseline.charging_wh = lifetimeChargingKwh * 1000;

          // Keys used by tesla-data pending charging calculations
          newBaseline.total_charge_energy_added_kwh = lifetimeChargingKwh;
          newBaseline.supercharger_kwh = lifetimeChargingKwh;

          updated = true;
          resetResults.push({
            deviceId: device.device_id,
            deviceType,
            category: 'charging',
            baselineSet: { charging_kwh: lifetimeChargingKwh }
          });
        }
      }

      if (deviceType === 'powerwall') {
        // Battery storage
        if (shouldResetAll || categories.includes('battery')) {
          // IMPORTANT: Write all known baseline keys used across the app (legacy + new)
          const lifetimeBatteryWh = (lifetime.battery_discharge_wh ?? lifetime.lifetime_battery_discharge_wh ?? 0) as number;

          newBaseline.battery_discharge_wh = lifetimeBatteryWh;
          newBaseline.lifetime_battery_discharge_wh = lifetimeBatteryWh;
          newBaseline.total_energy_discharged_wh = lifetimeBatteryWh;

          updated = true;
          resetResults.push({
            deviceId: device.device_id,
            deviceType,
            category: 'battery',
            baselineSet: { battery_discharge_wh: lifetimeBatteryWh }
          });
        }
      }

      if (deviceType === 'wall_connector') {
        // Wall connector charging
        if (shouldResetAll || categories.includes('charging')) {
          let lifetimeChargingKwh = 0;
          if (lifetime.charging_kwh != null) {
            lifetimeChargingKwh = Number(lifetime.charging_kwh);
          } else if (lifetime.charging_wh != null) {
            lifetimeChargingKwh = Number(lifetime.charging_wh) / 1000;
          } else if (lifetime.lifetime_charging_wh != null) {
            lifetimeChargingKwh = Number(lifetime.lifetime_charging_wh) / 1000;
          } else if (lifetime.wall_connector_wh != null) {
            lifetimeChargingKwh = Number(lifetime.wall_connector_wh) / 1000;
          }

          newBaseline.charging_kwh = lifetimeChargingKwh;
          newBaseline.charging_wh = lifetimeChargingKwh * 1000;

          // Keys used by tesla-data pending charging calculations
          newBaseline.wall_connector_kwh = lifetimeChargingKwh;
          newBaseline.wall_connector_wh = lifetimeChargingKwh * 1000;

          updated = true;
          resetResults.push({
            deviceId: device.device_id,
            deviceType,
            category: 'charging',
            baselineSet: { charging_kwh: lifetimeChargingKwh }
          });
        }
      }

      if (deviceType === 'charger' && device.provider === 'wallbox') {
        // Wallbox charger
        if (shouldResetAll || categories.includes('charging')) {
          const lifetimeChargingKwh = lifetime.home_charger_kwh || lifetime.charging_kwh || 0;
          newBaseline.charging_kwh = lifetimeChargingKwh;
          newBaseline.home_charger_kwh = lifetimeChargingKwh;
          updated = true;
          resetResults.push({
            deviceId: device.device_id,
            deviceType,
            category: 'charging',
            baselineSet: { charging_kwh: lifetimeChargingKwh }
          });
        }
      }

      // Update the device if any category was reset
      if (updated) {
        console.log(`[reset-baselines] Updating device ${device.device_id} (${deviceType}) with new baseline:`, newBaseline);
        
        const { error: updateError } = await serviceClient
          .from('connected_devices')
          .update({
            baseline_data: newBaseline,
            last_minted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', device.id);

        if (updateError) {
          console.error(`[reset-baselines] Error updating device ${device.id}:`, updateError);
        }
      }
    }

    console.log(`[reset-baselines] Reset complete. Updated ${resetResults.length} device/category combinations`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Baselines reset successfully. Updated ${resetResults.length} device/category combinations.`,
        devicesUpdated: resetResults.length,
        details: resetResults
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[reset-baselines] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
