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

// NFT thresholds - must match frontend src/lib/nftMilestones.ts
const SOLAR_THRESHOLDS = [
  { name: "Welcome", threshold: 0 },
  { name: "First Harvest", threshold: 500 },
  { name: "Solar Pioneer", threshold: 1000 },
  { name: "Energy Guardian", threshold: 2500 },
  { name: "Eco Warrior", threshold: 5000 },
  { name: "Green Innovator", threshold: 10000 },
  { name: "Sustainability Champion", threshold: 25000 },
  { name: "Renewable Hero", threshold: 50000 },
  { name: "Solar Zen Master", threshold: 100000 },
];

const EV_MILES_THRESHOLDS = [
  { name: "First Drive", threshold: 100 },
  { name: "Road Tripper", threshold: 500 },
  { name: "Highway Hero", threshold: 1000 },
  { name: "Cross Country", threshold: 5000 },
  { name: "Electric Explorer", threshold: 10000 },
  { name: "Mile Master", threshold: 25000 },
  { name: "EV Legend", threshold: 50000 },
];

const EV_CHARGING_THRESHOLDS = [
  { name: "First Charge", threshold: 100 },
  { name: "Charging Champion", threshold: 500 },
  { name: "Power Player", threshold: 1000 },
  { name: "Energy Enthusiast", threshold: 2500 },
  { name: "Charging Pro", threshold: 5000 },
  { name: "Megawatt Master", threshold: 10000 },
];

const BATTERY_THRESHOLDS = [
  { name: "Grid Guardian", threshold: 500 },
  { name: "Power Backup Pro", threshold: 1000 },
  { name: "Storage Specialist", threshold: 2500 },
  { name: "Energy Reserve Hero", threshold: 5000 },
  { name: "Battery Boss", threshold: 10000 },
  { name: "Powerwall Prodigy", threshold: 25000 },
];

const COMBO_THRESHOLDS = [
  { name: "Dual Achiever", categoriesRequired: 2 },
  { name: "Triple Threat", categoriesRequired: 3 },
  { name: "Quad Champion", categoriesRequired: 4 },
  { name: "Rising Star", totalNftsRequired: 5 },
  { name: "Sustainability Legend", totalNftsRequired: 10 },
  { name: "Category Master", categoriesMaxed: 1 },
  { name: "Ultimate Zen Master", categoriesMaxed: 4 },
];

function calculateEarnedForCategory(
  value: number,
  thresholds: { name: string; threshold: number }[],
  isWelcome: boolean = false
): string[] {
  return thresholds
    .filter((t) => {
      if (t.threshold === 0) return isWelcome;
      return value >= t.threshold;
    })
    .map((t) => t.name);
}

function calculateComboNFTs(
  solarEarned: string[],
  evMilesEarned: string[],
  evChargingEarned: string[],
  batteryEarned: string[]
): string[] {
  const combos: string[] = [];
  
  // Count categories with at least one earned NFT (excluding welcome)
  const solarCount = solarEarned.filter(n => n !== "Welcome").length;
  const categoriesWithNFTs = [
    solarCount > 0,
    evMilesEarned.length > 0,
    evChargingEarned.length > 0,
    batteryEarned.length > 0,
  ].filter(Boolean).length;
  
  // Total NFTs earned (excluding welcome)
  const totalNFTs = solarCount + evMilesEarned.length + evChargingEarned.length + batteryEarned.length;
  
  // Check if category is maxed out
  const solarMaxed = solarEarned.length === SOLAR_THRESHOLDS.length;
  const evMilesMaxed = evMilesEarned.length === EV_MILES_THRESHOLDS.length;
  const evChargingMaxed = evChargingEarned.length === EV_CHARGING_THRESHOLDS.length;
  const batteryMaxed = batteryEarned.length === BATTERY_THRESHOLDS.length;
  const categoriesMaxed = [solarMaxed, evMilesMaxed, evChargingMaxed, batteryMaxed].filter(Boolean).length;
  
  // Award combo milestones
  if (categoriesWithNFTs >= 2) combos.push("Dual Achiever");
  if (categoriesWithNFTs >= 3) combos.push("Triple Threat");
  if (categoriesWithNFTs >= 4) combos.push("Quad Champion");
  if (totalNFTs >= 5) combos.push("Rising Star");
  if (totalNFTs >= 10) combos.push("Sustainability Legend");
  if (categoriesMaxed >= 1) combos.push("Category Master");
  if (categoriesMaxed >= 4) combos.push("Ultimate Zen Master");
  
  return combos;
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

      // For now, we need to get the actual lifetime data from the tesla-data function
      // The pending activity is stored in the dashboard - here we calculate based on claimed devices
      
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

      // Calculate total activity for NFT thresholds
      const totalActivity = totalClaimedTokens + pendingTokens;

      // Calculate NFTs for each category
      const solarEarned = calculateEarnedForCategory(totalSolarKwh, SOLAR_THRESHOLDS, true);
      const evMilesEarned = calculateEarnedForCategory(totalEvMiles, EV_MILES_THRESHOLDS);
      const evChargingEarned = calculateEarnedForCategory(totalEvChargingKwh, EV_CHARGING_THRESHOLDS);
      const batteryEarned = calculateEarnedForCategory(totalBatteryKwh, BATTERY_THRESHOLDS);
      
      // Calculate combo achievements
      const comboEarned = calculateComboNFTs(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
      
      // Combine all earned NFTs
      const earnedNFTs = [
        ...solarEarned,
        ...evMilesEarned,
        ...evChargingEarned,
        ...batteryEarned,
        ...comboEarned,
      ];

      // Calculate CO2 offset (0.92 lbs per kWh solar + 0.4 lbs per EV mile)
      const co2OffsetLbs = (totalSolarKwh * 0.92) + (totalEvMiles * 0.4);

      console.log("Rewards calculation:", {
        totalClaimedTokens,
        pendingTokens,
        totalActivity,
        solarEarned: solarEarned.length,
        evMilesEarned: evMilesEarned.length,
        evChargingEarned: evChargingEarned.length,
        batteryEarned: batteryEarned.length,
        comboEarned: comboEarned.length,
        earnedNFTs,
      });

      return new Response(JSON.stringify({
        total_tokens_earned: totalActivity,
        tokens_claimed: totalClaimedTokens,
        tokens_pending: pendingTokens,
        earned_nfts: earnedNFTs,
        nfts_by_category: {
          solar: solarEarned,
          ev_miles: evMilesEarned,
          ev_charging: evChargingEarned,
          battery: batteryEarned,
          combos: comboEarned,
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
      // This ensures pending activity resets to 0 after minting
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

      // TODO: Here you would trigger the actual blockchain transfer
      // For now, we just mark them as claimed in the database

      return new Response(JSON.stringify({
        success: true,
        tokens_claimed: totalToClaim,
        message: `Successfully claimed ${totalToClaim} $ZSOLAR tokens`,
        baselines_reset: true,
        // transaction_hash: would be here after blockchain integration
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
