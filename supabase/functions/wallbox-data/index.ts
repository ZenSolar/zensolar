import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Wallbox API endpoints
const WALLBOX_API_BASE = "https://api.wall-box.com";

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

    // Get stored Wallbox tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "wallbox")
      .single();

    if (tokenError || !tokenData) {
      console.log("No Wallbox tokens found for user");
      return new Response(JSON.stringify({ error: "Wallbox not connected", needsReauth: true }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = tokenData.access_token;

    // Check if token is expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      console.log("Wallbox token expired, needs reauth");
      return new Response(JSON.stringify({ error: "Token expired", needsReauth: true }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's chargers via groups endpoint
    console.log("Fetching Wallbox chargers via groups endpoint");
    const groupsResponse = await fetch(`${WALLBOX_API_BASE}/v3/chargers/groups`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (!groupsResponse.ok) {
      const errorText = await groupsResponse.text();
      console.error("Wallbox groups fetch failed:", groupsResponse.status, errorText);
      
      if (groupsResponse.status === 401) {
        return new Response(JSON.stringify({ error: "Token expired", needsReauth: true }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to fetch charger data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groupsData = await groupsResponse.json();
    console.log("Wallbox groups response:", JSON.stringify(groupsData));
    
    // Extract charger IDs from groups
    const chargerIds: number[] = [];
    for (const group of (groupsData?.result?.groups || [])) {
      for (const charger of (group?.chargers || [])) {
        if (charger?.id) {
          chargerIds.push(charger.id);
        }
      }
    }
    
    console.log("Found charger IDs:", chargerIds);

    let totalEnergyKwh = 0;
    let totalSessions = 0;
    const chargerDetails: Array<{
      id: number;
      name: string;
      status: string;
      addedEnergy: number;
      addedRange: number;
    }> = [];

    // Fetch detailed data for each charger
    for (const chargerId of chargerIds) {
      // Get charger status - this includes added_energy which may be lifetime total
      const statusResponse = await fetch(`${WALLBOX_API_BASE}/chargers/status/${chargerId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Charger ${chargerId} status:`, JSON.stringify(statusData));
        
        // The status endpoint returns added_energy which is the LIFETIME total in kWh
        // This is the most reliable source for lifetime energy
        const statusAddedEnergy = statusData.added_energy || statusData.addedEnergy || 0;
        console.log(`Charger ${chargerId} status added_energy: ${statusAddedEnergy} kWh`);
        
        // Also try to get session stats for more detailed info
        // Using the correct endpoint: /v4/sessions/stats with timestamp parameters
        const endDate = Math.floor(Date.now() / 1000); // Current timestamp in seconds
        const startDate = Math.floor(new Date("2020-01-01").getTime() / 1000); // Early date to capture all history
        
        console.log(`Fetching session stats for charger ${chargerId} from ${startDate} to ${endDate}`);
        
        let sessionStats: any = null;
        let sessionsTotalEnergy = 0;
        let sessionsCount = 0;
        
        try {
          const statsUrl = `${WALLBOX_API_BASE}/v4/sessions/stats?charger=${chargerId}&start_date=${startDate}&end_date=${endDate}`;
          console.log(`Stats URL: ${statsUrl}`);
          
          const statsResponse = await fetch(statsUrl, {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/json",
            },
          });

          if (statsResponse.ok) {
            sessionStats = await statsResponse.json();
            console.log(`Session stats response:`, JSON.stringify(sessionStats));
            
            // Extract total energy from stats response
            // The response format may vary - try common patterns
            if (sessionStats?.data?.attributes) {
              sessionsTotalEnergy = sessionStats.data.attributes.total_energy || 
                                    sessionStats.data.attributes.totalEnergy || 
                                    sessionStats.data.attributes.energy || 0;
              sessionsCount = sessionStats.data.attributes.total_sessions ||
                             sessionStats.data.attributes.sessions_count ||
                             sessionStats.data.attributes.count || 0;
            } else if (sessionStats?.total_energy !== undefined) {
              sessionsTotalEnergy = sessionStats.total_energy;
              sessionsCount = sessionStats.total_sessions || sessionStats.sessions_count || 0;
            } else if (sessionStats?.energy !== undefined) {
              sessionsTotalEnergy = sessionStats.energy;
              sessionsCount = sessionStats.sessions || 0;
            }
            
            // Energy from stats may be in Wh - convert if needed
            if (sessionsTotalEnergy > 1000) {
              sessionsTotalEnergy = sessionsTotalEnergy / 1000; // Convert Wh to kWh
            }
            
            console.log(`Stats parsed: ${sessionsTotalEnergy} kWh from ${sessionsCount} sessions`);
          } else {
            const errorText = await statsResponse.text();
            console.log(`Session stats fetch failed (${statsResponse.status}):`, errorText);
          }
        } catch (statsError) {
          console.log(`Session stats error:`, statsError);
        }

        // Use the LARGER of status added_energy or session stats
        // Status added_energy is typically the lifetime total and most reliable
        const lifetimeEnergyKwh = Math.max(statusAddedEnergy, sessionsTotalEnergy);
        
        console.log(`Charger ${chargerId} final lifetime total: ${lifetimeEnergyKwh} kWh (status: ${statusAddedEnergy}, stats: ${sessionsTotalEnergy})`);

        totalEnergyKwh += lifetimeEnergyKwh;
        totalSessions += sessionsCount;

        chargerDetails.push({
          id: chargerId,
          name: statusData.name || `Charger ${chargerId}`,
          status: statusData.status_description || 'Unknown',
          addedEnergy: lifetimeEnergyKwh,
          addedRange: statusData.added_range || statusData.addedRange || 0,
        });
      } else {
        console.error(`Failed to fetch status for charger ${chargerId}:`, statusResponse.status);
      }
    }

    // Store or update connected device with lifetime totals
    const primaryChargerId = chargerDetails[0]?.id?.toString() || "unknown";
    const primaryChargerName = chargerDetails[0]?.name || "Wallbox Charger";
    
    // First, try to get existing device
    const { data: existingDevice } = await supabaseClient
      .from("connected_devices")
      .select("id, baseline_data, lifetime_totals")
      .eq("user_id", user.id)
      .eq("provider", "wallbox")
      .eq("device_id", primaryChargerId)
      .maybeSingle();

    const now = new Date().toISOString();
    
    console.log(`Total across all chargers: ${totalEnergyKwh} kWh, ${totalSessions} sessions`);
    
    if (existingDevice) {
      // Update existing device with lifetime totals AND sync the charger name
      const currentBaseline = (existingDevice.baseline_data as Record<string, any>) || {};
      const baselineCharging = currentBaseline.charging_kwh || 0;
      
      const updateResult = await supabaseClient
        .from("connected_devices")
        .update({
          device_name: primaryChargerName,
          lifetime_totals: {
            charging_kwh: totalEnergyKwh,
            lifetime_charging_kwh: totalEnergyKwh,
            total_sessions: totalSessions,
            updated_at: now,
          },
          updated_at: now,
        })
        .eq("id", existingDevice.id);
      
      if (updateResult.error) {
        console.error(`Failed to update Wallbox device:`, updateResult.error);
      } else {
        console.log(`Updated Wallbox device ${primaryChargerId} "${primaryChargerName}" with ${totalEnergyKwh} kWh lifetime charging`);
      }
    } else {
      // Create new device record
      const { error: deviceError } = await supabaseClient
        .from("connected_devices")
        .insert({
          user_id: user.id,
          provider: "wallbox",
          device_id: primaryChargerId,
          device_type: "home_charger",
          device_name: primaryChargerName,
          baseline_data: {
            charging_kwh: 0,
            captured_at: now,
          },
          lifetime_totals: {
            charging_kwh: totalEnergyKwh,
            lifetime_charging_kwh: totalEnergyKwh,
            total_sessions: totalSessions,
            updated_at: now,
          },
          device_metadata: {
            charger_count: chargerDetails.length,
          },
        });
      
      if (deviceError) {
        console.error("Failed to create Wallbox device:", deviceError);
      } else {
        console.log(`Created Wallbox device ${primaryChargerId} with ${totalEnergyKwh} kWh lifetime charging`);
      }
    }

    // Store energy production data for daily tracking
    const { error: insertError } = await supabaseClient
      .from("energy_production")
      .upsert({
        user_id: user.id,
        provider: "wallbox",
        device_id: primaryChargerId,
        production_wh: 0,
        consumption_wh: totalEnergyKwh * 1000,
        recorded_at: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      }, { onConflict: "device_id,provider,recorded_at" });

    if (insertError) {
      console.error("Failed to store energy data:", insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      chargers: chargerDetails,
      totals: {
        home_charger_kwh: totalEnergyKwh,
        total_sessions: totalSessions,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Wallbox data error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
