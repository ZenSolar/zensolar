import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

// Reward rates - 1 $ZSOLAR per unit
const REWARD_RATES = {
  solar_production: 1,    // 1 $ZSOLAR per kWh produced
  battery_discharge: 1,   // 1 $ZSOLAR per kWh discharged from battery
  ev_miles: 1,            // 1 $ZSOLAR per mile driven
  ev_charging: 1,         // 1 $ZSOLAR per kWh charged
};

// NFT thresholds - aligned with final_milestones.docx (January 14, 2026)

// Solar Energy Produced (8 tiers: 500-100,000 kWh)
const SOLAR_THRESHOLDS = [
  { name: "Sunlink", threshold: 500 },
  { name: "Photon", threshold: 1000 },
  { name: "Rayfield", threshold: 2500 },
  { name: "Solarflare", threshold: 5000 },
  { name: "Heliogen", threshold: 10000 },
  { name: "Sunvault", threshold: 25000 },
  { name: "Gigasol", threshold: 50000 },
  { name: "Starpower", threshold: 100000 },
];

// Battery Storage Discharged (7 tiers: 500-50,000 kWh)
const BATTERY_THRESHOLDS = [
  { name: "Powerwall", threshold: 500 },
  { name: "Gridlink", threshold: 1000 },
  { name: "Megapack", threshold: 2500 },
  { name: "Reservoir", threshold: 5000 },
  { name: "Dynamo", threshold: 10000 },
  { name: "Gigabank", threshold: 25000 },
  { name: "Ultrabank", threshold: 50000 },
];

// EV Charging - combined supercharger + home (8 tiers: 100-25,000 kWh)
const EV_CHARGING_THRESHOLDS = [
  { name: "Spark", threshold: 100 },
  { name: "Supercharger", threshold: 500 },
  { name: "Megavolt", threshold: 1000 },
  { name: "Amperage", threshold: 1500 },
  { name: "Destination", threshold: 2500 },
  { name: "Gigawatt", threshold: 5000 },
  { name: "Megawatt", threshold: 10000 },
  { name: "Terawatt", threshold: 25000 },
];

// EV Miles Driven (10 tiers: 100-200,000 miles)
const EV_MILES_THRESHOLDS = [
  { name: "Ignition", threshold: 100 },
  { name: "Cruiser", threshold: 500 },
  { name: "Autobahn", threshold: 1000 },
  { name: "Hyperlane", threshold: 5000 },
  { name: "Roadster", threshold: 10000 },
  { name: "Plaid", threshold: 25000 },
  { name: "Ludicrous", threshold: 50000 },
  { name: "Centurion", threshold: 100000 },
  { name: "Voyager", threshold: 150000 },
  { name: "Legend", threshold: 200000 },
];

function calculateEarnedForCategory(
  value: number,
  thresholds: { name: string; threshold: number }[]
): string[] {
  return thresholds
    .filter((t) => value >= t.threshold)
    .map((t) => t.name);
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

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "calculate";

    if (action === "calculate") {
      // Get user's connected devices to calculate activity-based rewards
      const { data: devices } = await supabaseClient
        .from("connected_devices")
        .select("device_id, device_type, provider, baseline_data")
        .eq("user_id", user.id);

      let totalSolarKwh = 0;
      let totalBatteryKwh = 0;
      let totalEvMiles = 0;
      let totalEvChargingKwh = 0;

      // Get already claimed rewards
      const { data: claimedRewards } = await supabaseClient
        .from("user_rewards")
        .select("tokens_earned, reward_type, energy_wh_basis")
        .eq("user_id", user.id)
        .eq("claimed", true);

      const totalClaimedTokens = claimedRewards?.reduce((sum, r) => sum + Number(r.tokens_earned), 0) || 0;

      // Get unclaimed rewards
      const { data: unclaimedRewards } = await supabaseClient
        .from("user_rewards")
        .select("id, tokens_earned")
        .eq("user_id", user.id)
        .eq("claimed", false);

      const pendingTokens = unclaimedRewards?.reduce((sum, r) => sum + Number(r.tokens_earned), 0) || 0;

      // Calculate NFTs for each category
      const solarEarned = calculateEarnedForCategory(totalSolarKwh, SOLAR_THRESHOLDS);
      const batteryEarned = calculateEarnedForCategory(totalBatteryKwh, BATTERY_THRESHOLDS);
      const evChargingEarned = calculateEarnedForCategory(totalEvChargingKwh, EV_CHARGING_THRESHOLDS);
      const evMilesEarned = calculateEarnedForCategory(totalEvMiles, EV_MILES_THRESHOLDS);
      
      // Welcome NFT is always earned for registered users
      const earnedNFTs = [
        "Welcome", // Auto-minted on registration
        ...solarEarned,
        ...batteryEarned,
        ...evChargingEarned,
        ...evMilesEarned,
      ];

      // Calculate CO2 offset (0.92 lbs per kWh solar + 0.4 lbs per EV mile) - display only, no NFTs
      const co2OffsetLbs = (totalSolarKwh * 0.92) + (totalEvMiles * 0.4);

      console.log("Rewards calculation:", {
        totalClaimedTokens,
        pendingTokens,
        solarEarned: solarEarned.length,
        batteryEarned: batteryEarned.length,
        evChargingEarned: evChargingEarned.length,
        evMilesEarned: evMilesEarned.length,
        earnedNFTs,
      });

      return new Response(JSON.stringify({
        total_tokens_earned: totalClaimedTokens + pendingTokens,
        tokens_claimed: totalClaimedTokens,
        tokens_pending: pendingTokens,
        earned_nfts: earnedNFTs,
        nfts_by_category: {
          welcome: ["Welcome"],
          solar: solarEarned,
          battery: batteryEarned,
          ev_charging: evChargingEarned,
          ev_miles: evMilesEarned,
        },
        co2_offset_lbs: co2OffsetLbs,
        reward_rates: REWARD_RATES,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "claim") {
      // Get all unclaimed rewards
      const { data: unclaimedRewards, error: fetchError } = await supabaseClient
        .from("user_rewards")
        .select("*")
        .eq("user_id", user.id)
        .eq("claimed", false);

      if (fetchError) {
        return new Response(JSON.stringify({ error: "Failed to fetch rewards" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!unclaimedRewards || unclaimedRewards.length === 0) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: "No unclaimed rewards" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const totalToClaim = unclaimedRewards.reduce((sum, r) => sum + Number(r.tokens_earned), 0);

      // Mark rewards as claimed
      const rewardIds = unclaimedRewards.map(r => r.id);
      const { error: updateError } = await supabaseClient
        .from("user_rewards")
        .update({ 
          claimed: true, 
          claimed_at: new Date().toISOString() 
        })
        .in("id", rewardIds);

      if (updateError) {
        return new Response(JSON.stringify({ error: "Failed to claim rewards" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Reset baselines on all connected devices to current lifetime values
      const { data: devices } = await supabaseClient
        .from("connected_devices")
        .select("id, device_id, device_type, provider, baseline_data")
        .eq("user_id", user.id);

      if (devices && devices.length > 0) {
        const now = new Date().toISOString();
        
        // Get Tesla tokens if any Tesla devices exist
        const teslaDevices = devices.filter(d => d.provider === "tesla");
        if (teslaDevices.length > 0) {
          const { data: tokenData } = await supabaseClient
            .from("energy_tokens")
            .select("access_token")
            .eq("user_id", user.id)
            .eq("provider", "tesla")
            .single();
          
          const accessToken = tokenData?.access_token;
          
          if (accessToken) {
            // Update baselines for each Tesla device with current lifetime values
            for (const device of teslaDevices) {
              try {
                let newBaseline: Record<string, any> = { captured_at: now };
                
                if (device.device_type === "vehicle") {
                  // Fetch current odometer
                  const response = await fetch(
                    `${TESLA_API_BASE}/api/1/vehicles/${device.device_id}/vehicle_data?endpoints=vehicle_state`,
                    { headers: { "Authorization": `Bearer ${accessToken}` } }
                  );
                  
                  if (response.ok) {
                    const data = await response.json();
                    newBaseline.odometer = data.response?.vehicle_state?.odometer || 0;
                    console.log(`Updated vehicle ${device.device_id} baseline odometer: ${newBaseline.odometer}`);
                  }
                } else if (device.device_type === "powerwall" || device.device_type === "solar") {
                  // Fetch current lifetime energy data
                  const response = await fetch(
                    `${TESLA_API_BASE}/api/1/energy_sites/${device.device_id}/calendar_history?kind=energy&period=lifetime`,
                    { headers: { "Authorization": `Bearer ${accessToken}` } }
                  );
                  
                  if (response.ok) {
                    const data = await response.json();
                    const histResponse = data.response || {};
                    newBaseline.total_solar_produced_wh = (histResponse.total_solar_energy_exported || 0) + (histResponse.total_solar_energy_consumed || 0);
                    newBaseline.total_energy_discharged_wh = histResponse.total_battery_energy_exported || 0;
                    console.log(`Updated site ${device.device_id} baseline:`, JSON.stringify(newBaseline));
                  }
                }
                
                // Update the device with new baseline
                await supabaseClient
                  .from("connected_devices")
                  .update({ 
                    baseline_data: newBaseline, 
                    last_minted_at: now 
                  })
                  .eq("id", device.id);
                  
              } catch (error) {
                console.error(`Error updating baseline for device ${device.device_id}:`, error);
              }
            }
          }
        }
        
        // Update last_minted_at for non-Tesla devices
        const nonTeslaDevices = devices.filter(d => d.provider !== "tesla");
        if (nonTeslaDevices.length > 0) {
          await supabaseClient
            .from("connected_devices")
            .update({ last_minted_at: now })
            .in("id", nonTeslaDevices.map(d => d.id));
        }
        
        console.log(`Reset baselines for ${devices.length} devices after minting`);
      }

      // TODO: Trigger blockchain minting here

      return new Response(JSON.stringify({
        success: true,
        tokens_claimed: totalToClaim,
        message: `Successfully claimed ${totalToClaim} $ZSOLAR tokens`,
        baselines_reset: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Calculate rewards error:", error);
    return new Response(JSON.stringify({ error: "Failed to calculate rewards. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
