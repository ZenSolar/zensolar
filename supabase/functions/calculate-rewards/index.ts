import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

// Reward rates - tokens per kWh
const REWARD_RATES = {
  solar_production: 10, // 10 $ZSOLAR per kWh produced
  battery_discharge: 5,  // 5 $ZSOLAR per kWh discharged from battery
  ev_efficiency: 2,      // 2 $ZSOLAR per efficient mile driven
};

// NFT thresholds
const NFT_THRESHOLDS = {
  "Solar Pioneer": 100,      // 100 kWh produced
  "Energy Saver": 500,       // 500 kWh produced
  "Green Champion": 1000,    // 1000 kWh produced
  "Solar Master": 5000,      // 5000 kWh produced
  "Climate Hero": 10000,     // 10000 kWh produced
};

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
      // Get total production from energy_production table
      const { data: productionData, error: prodError } = await supabaseClient
        .from("energy_production")
        .select("production_wh, consumption_wh, recorded_at")
        .eq("user_id", user.id);

      if (prodError) {
        console.error("Error fetching production data:", prodError);
      }

      // Calculate totals
      const totalProductionWh = productionData?.reduce((sum, row) => sum + Number(row.production_wh || 0), 0) || 0;
      const totalProductionKwh = totalProductionWh / 1000;

      // Calculate tokens earned
      const tokensFromProduction = Math.floor(totalProductionKwh * REWARD_RATES.solar_production);

      // Get already claimed rewards
      const { data: claimedRewards } = await supabaseClient
        .from("user_rewards")
        .select("tokens_earned")
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

      // Calculate new tokens to award (not yet in rewards table)
      const totalTokensEarned = tokensFromProduction;
      const newTokensToAward = Math.max(0, totalTokensEarned - totalClaimedTokens - pendingTokens);

      // Create new reward entry if there are new tokens
      if (newTokensToAward > 0) {
        await supabaseClient
          .from("user_rewards")
          .insert({
            user_id: user.id,
            tokens_earned: newTokensToAward,
            energy_wh_basis: totalProductionWh,
            reward_type: "production",
          });
      }

      // Check NFT eligibility
      const earnedNFTs: string[] = [];
      for (const [nftName, threshold] of Object.entries(NFT_THRESHOLDS)) {
        if (totalProductionKwh >= threshold) {
          earnedNFTs.push(nftName);
        }
      }

      // Calculate CO2 offset (0.92 lbs per kWh is US average)
      const co2OffsetLbs = totalProductionKwh * 0.92;

      return new Response(JSON.stringify({
        total_production_kwh: totalProductionKwh,
        total_tokens_earned: totalTokensEarned,
        tokens_claimed: totalClaimedTokens,
        tokens_pending: pendingTokens + newTokensToAward,
        new_tokens_awarded: newTokensToAward,
        earned_nfts: earnedNFTs,
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
