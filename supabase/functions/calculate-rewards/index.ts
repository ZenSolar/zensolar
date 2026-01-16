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

// ==============================================================================
// NFT MILESTONE THRESHOLDS - ALIGNED WITH SMART CONTRACT (ZenSolar.sol)
// ==============================================================================
// These MUST match exactly with:
// - src/lib/nftMilestones.ts (frontend)
// - contracts/ZenSolar.sol (smart contract)
// - public/nft-metadata-flat/*.json (IPFS metadata)
// - docs/NFT_MILESTONES_REFERENCE.md
// ==============================================================================

// Solar Energy Produced (8 tiers: 500-100,000 kWh) - Token IDs 1-8
const SOLAR_THRESHOLDS = [
  { tokenId: 1, name: "Sunspark", threshold: 500 },
  { tokenId: 2, name: "Photonic", threshold: 1000 },
  { tokenId: 3, name: "Rayforge", threshold: 2500 },
  { tokenId: 4, name: "Solaris", threshold: 5000 },
  { tokenId: 5, name: "Helios", threshold: 10000 },
  { tokenId: 6, name: "Sunforge", threshold: 25000 },
  { tokenId: 7, name: "Gigasun", threshold: 50000 },
  { tokenId: 8, name: "Starforge", threshold: 100000 },
];

// Battery Storage Discharged (7 tiers: 500-50,000 kWh) - Token IDs 9-15
const BATTERY_THRESHOLDS = [
  { tokenId: 9, name: "Voltbank", threshold: 500 },
  { tokenId: 10, name: "Gridpulse", threshold: 1000 },
  { tokenId: 11, name: "Megacell", threshold: 2500 },
  { tokenId: 12, name: "Reservex", threshold: 5000 },
  { tokenId: 13, name: "Dynamax", threshold: 10000 },
  { tokenId: 14, name: "Ultracell", threshold: 25000 },
  { tokenId: 15, name: "Gigavolt", threshold: 50000 },
];

// EV Charging - combined supercharger + home (8 tiers: 100-25,000 kWh) - Token IDs 16-23
const EV_CHARGING_THRESHOLDS = [
  { tokenId: 16, name: "Ignite", threshold: 100 },
  { tokenId: 17, name: "Voltcharge", threshold: 500 },
  { tokenId: 18, name: "Kilovolt", threshold: 1000 },
  { tokenId: 19, name: "Ampforge", threshold: 1500 },
  { tokenId: 20, name: "Chargeon", threshold: 2500 },
  { tokenId: 21, name: "Gigacharge", threshold: 5000 },
  { tokenId: 22, name: "Megacharge", threshold: 10000 },
  { tokenId: 23, name: "Teracharge", threshold: 25000 },
];

// EV Miles Driven (10 tiers: 100-200,000 miles) - Token IDs 24-33
const EV_MILES_THRESHOLDS = [
  { tokenId: 24, name: "Ignitor", threshold: 100 },
  { tokenId: 25, name: "Velocity", threshold: 500 },
  { tokenId: 26, name: "Autobahn", threshold: 1000 },
  { tokenId: 27, name: "Hyperdrive", threshold: 5000 },
  { tokenId: 28, name: "Electra", threshold: 10000 },
  { tokenId: 29, name: "Velocity Pro", threshold: 25000 },
  { tokenId: 30, name: "Mach One", threshold: 50000 },
  { tokenId: 31, name: "Centaurion", threshold: 100000 },
  { tokenId: 32, name: "Voyager", threshold: 150000 },
  { tokenId: 33, name: "Odyssey", threshold: 200000 },
];

// Combo Achievements (8 NFTs) - Token IDs 34-41
// These are calculated based on category NFT counts, NOT direct activity values
const COMBO_DEFINITIONS = [
  { tokenId: 34, name: "Duality", type: "categories", value: 2 },      // 2 categories with ≥1 NFT
  { tokenId: 35, name: "Trifecta", type: "categories", value: 3 },    // 3 categories with ≥1 NFT
  { tokenId: 36, name: "Quadrant", type: "total", value: 5 },          // 5 total category NFTs
  { tokenId: 37, name: "Constellation", type: "total", value: 10 },    // 10 total category NFTs
  { tokenId: 38, name: "Cyber Echo", type: "total", value: 20 },       // 20 total category NFTs
  { tokenId: 39, name: "Zenith", type: "total", value: 30 },           // 30 total category NFTs
  { tokenId: 40, name: "ZenMaster", type: "maxed", value: 1 },         // 1 category maxed out
  { tokenId: 41, name: "Total Eclipse", type: "maxed", value: 4 },     // All 4 categories maxed
];

// Category max counts for "maxed" calculations
const CATEGORY_MAX_COUNTS = {
  solar: 8,      // 8 solar NFTs total
  battery: 7,    // 7 battery NFTs total  
  charging: 8,   // 8 charging NFTs total
  evMiles: 10,   // 10 EV miles NFTs total
};

function calculateEarnedForCategory(
  value: number,
  thresholds: { tokenId: number; name: string; threshold: number }[]
): { tokenId: number; name: string }[] {
  return thresholds
    .filter((t) => value >= t.threshold)
    .map((t) => ({ tokenId: t.tokenId, name: t.name }));
}

function calculateComboNFTs(
  solarEarned: number,
  batteryEarned: number,
  chargingEarned: number,
  evMilesEarned: number
): { tokenId: number; name: string }[] {
  const combos: { tokenId: number; name: string }[] = [];
  
  // Count categories with at least 1 NFT
  const categoriesWithNFTs = [
    solarEarned > 0,
    batteryEarned > 0,
    chargingEarned > 0,
    evMilesEarned > 0,
  ].filter(Boolean).length;
  
  // Total category NFTs (combos don't count toward combos)
  const totalCategoryNFTs = solarEarned + batteryEarned + chargingEarned + evMilesEarned;
  
  // Check maxed categories
  const solarMaxed = solarEarned >= CATEGORY_MAX_COUNTS.solar;
  const batteryMaxed = batteryEarned >= CATEGORY_MAX_COUNTS.battery;
  const chargingMaxed = chargingEarned >= CATEGORY_MAX_COUNTS.charging;
  const evMilesMaxed = evMilesEarned >= CATEGORY_MAX_COUNTS.evMiles;
  const categoriesMaxed = [solarMaxed, batteryMaxed, chargingMaxed, evMilesMaxed].filter(Boolean).length;
  
  // Award combos
  if (categoriesWithNFTs >= 2) combos.push({ tokenId: 34, name: "Duality" });
  if (categoriesWithNFTs >= 3) combos.push({ tokenId: 35, name: "Trifecta" });
  if (totalCategoryNFTs >= 5) combos.push({ tokenId: 36, name: "Quadrant" });
  if (totalCategoryNFTs >= 10) combos.push({ tokenId: 37, name: "Constellation" });
  if (totalCategoryNFTs >= 20) combos.push({ tokenId: 38, name: "Cyber Echo" });
  if (totalCategoryNFTs >= 30) combos.push({ tokenId: 39, name: "Zenith" });
  if (categoriesMaxed >= 1) combos.push({ tokenId: 40, name: "ZenMaster" });
  if (categoriesMaxed >= 4) combos.push({ tokenId: 41, name: "Total Eclipse" });
  
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
        .select("device_id, device_type, provider, baseline_data, lifetime_totals")
        .eq("user_id", user.id);

      let totalSolarKwh = 0;
      let totalBatteryKwh = 0;
      let totalEvMiles = 0;
      let totalEvChargingKwh = 0;

      // Calculate totals from lifetime_totals
      for (const device of (devices || [])) {
        const lifetime = device.lifetime_totals as Record<string, number> | null;
        if (!lifetime) continue;

        if (device.device_type === "solar" || device.device_type === "solar_system") {
          const solarWh = lifetime.solar_wh || lifetime.lifetime_solar_wh || 0;
          totalSolarKwh += Math.floor(solarWh / 1000);
        } else if (device.device_type === "powerwall" || device.device_type === "battery") {
          // Powerwalls may have both solar and battery
          const solarWh = lifetime.solar_wh || 0;
          const batteryWh = lifetime.battery_discharge_wh || lifetime.lifetime_battery_discharge_wh || 0;
          totalSolarKwh += Math.floor(solarWh / 1000);
          totalBatteryKwh += Math.floor(batteryWh / 1000);
        } else if (device.device_type === "vehicle") {
          const odometer = lifetime.odometer || 0;
          const chargingKwh = lifetime.charging_kwh || Math.floor((lifetime.charging_wh || 0) / 1000);
          totalEvMiles += Math.floor(odometer);
          totalEvChargingKwh += Math.floor(chargingKwh);
        } else if (device.device_type === "wall_connector") {
          const chargingWh = lifetime.charging_wh || lifetime.lifetime_charging_wh || 0;
          totalEvChargingKwh += Math.floor(chargingWh / 1000);
        }
      }

      console.log("Lifetime totals from devices:", { totalSolarKwh, totalBatteryKwh, totalEvMiles, totalEvChargingKwh });

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

      // Calculate NFTs for each category (returns array of {tokenId, name})
      const solarEarned = calculateEarnedForCategory(totalSolarKwh, SOLAR_THRESHOLDS);
      const batteryEarned = calculateEarnedForCategory(totalBatteryKwh, BATTERY_THRESHOLDS);
      const evChargingEarned = calculateEarnedForCategory(totalEvChargingKwh, EV_CHARGING_THRESHOLDS);
      const evMilesEarned = calculateEarnedForCategory(totalEvMiles, EV_MILES_THRESHOLDS);
      
      // Calculate combo NFTs based on category NFT counts
      const comboEarned = calculateComboNFTs(
        solarEarned.length,
        batteryEarned.length,
        evChargingEarned.length,
        evMilesEarned.length
      );
      
      // Welcome NFT (Token ID 0) is always earned for registered users
      const welcomeNft = { tokenId: 0, name: "Welcome" };
      
      // All earned NFTs with token IDs for on-chain minting
      const allEarnedNFTs = [
        welcomeNft,
        ...solarEarned,
        ...batteryEarned,
        ...evChargingEarned,
        ...evMilesEarned,
        ...comboEarned,
      ];
      
      // Legacy format: just names for backward compatibility
      const earnedNFTNames = allEarnedNFTs.map(nft => nft.name);

      // Calculate CO2 offset (EPA values) - display only, no NFTs
      const co2OffsetLbs = (totalSolarKwh * 0.868) + (totalEvMiles * 0.891);

      console.log("Rewards calculation:", {
        totalClaimedTokens,
        pendingTokens,
        solarEarned: solarEarned.length,
        batteryEarned: batteryEarned.length,
        evChargingEarned: evChargingEarned.length,
        evMilesEarned: evMilesEarned.length,
        comboEarned: comboEarned.length,
        totalNFTs: allEarnedNFTs.length,
      });

      return new Response(JSON.stringify({
        total_tokens_earned: totalClaimedTokens + pendingTokens,
        tokens_claimed: totalClaimedTokens,
        tokens_pending: pendingTokens,
        // Full NFT data with token IDs (for smart contract minting)
        earned_nfts_full: allEarnedNFTs,
        // Legacy format: just names (for backward compatibility)
        earned_nfts: earnedNFTNames,
        nfts_by_category: {
          welcome: [welcomeNft],
          solar: solarEarned,
          battery: batteryEarned,
          ev_charging: evChargingEarned,
          ev_miles: evMilesEarned,
          combo: comboEarned,
        },
        // Category counts for combo calculations
        nft_counts: {
          solar: solarEarned.length,
          battery: batteryEarned.length,
          charging: evChargingEarned.length,
          ev_miles: evMilesEarned.length,
          combo: comboEarned.length,
          total_category: solarEarned.length + batteryEarned.length + evChargingEarned.length + evMilesEarned.length,
          total_all: allEarnedNFTs.length,
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
