import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Wallbox API endpoints
const WALLBOX_API_BASE = "https://api.wall-box.com";
const WALLBOX_USER_API = "https://user-api.wall-box.com";

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

    // Fetch user's chargers via groups endpoint (correct API)
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
      // Get charger status
      const statusResponse = await fetch(`${WALLBOX_API_BASE}/chargers/status/${chargerId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Charger ${chargerId} status:`, JSON.stringify(statusData));
        
        // Fetch ALL session history to get true lifetime total
        // Use a very early start date to capture all historical sessions
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = "2020-01-01"; // Wallbox launched around 2015, this captures all history
        
        console.log(`Fetching sessions for charger ${chargerId} from ${startDate} to ${endDate}`);
        
        let allSessions: any[] = [];
        let page = 1;
        let hasMore = true;
        
        // Paginate through all sessions
        while (hasMore) {
          const sessionsResponse = await fetch(
            `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/sessions?start_date=${startDate}&end_date=${endDate}&page=${page}&per_page=100`,
            {
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Accept": "application/json",
              },
            }
          );

          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json();
            const sessions = sessionsData?.data || [];
            console.log(`Page ${page}: found ${sessions.length} sessions`);
            
            if (sessions.length === 0) {
              hasMore = false;
            } else {
              allSessions = allSessions.concat(sessions);
              page++;
              // Safety limit to prevent infinite loops
              if (page > 50) hasMore = false;
            }
          } else {
            console.log(`Sessions fetch failed on page ${page}, trying v3 endpoint`);
            // Fallback to v3 endpoint if v4 fails
            const v3Response = await fetch(
              `${WALLBOX_API_BASE}/chargers/${chargerId}/sessions?start_date=${startDate}&end_date=${endDate}`,
              {
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Accept": "application/json",
                },
              }
            );
            if (v3Response.ok) {
              const v3Data = await v3Response.json();
              allSessions = v3Data?.data || [];
              console.log(`V3 fallback: found ${allSessions.length} sessions`);
            }
            hasMore = false;
          }
        }

        // Sum up energy from ALL sessions for true lifetime total
        let lifetimeEnergyKwh = 0;
        for (const session of allSessions) {
          // Energy is typically in Wh, convert to kWh
          const sessionEnergy = session.energy || 0;
          lifetimeEnergyKwh += sessionEnergy > 100 ? sessionEnergy / 1000 : sessionEnergy; // Handle both Wh and kWh
        }
        
        console.log(`Charger ${chargerId} lifetime total: ${lifetimeEnergyKwh} kWh from ${allSessions.length} sessions`);

        totalEnergyKwh += lifetimeEnergyKwh;
        totalSessions += allSessions.length;

        chargerDetails.push({
          id: chargerId,
          name: statusData.name || `Charger ${chargerId}`,
          status: statusData.status_description || 'Unknown',
          addedEnergy: lifetimeEnergyKwh,
          addedRange: statusData.added_range || 0,
        });
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
    
    if (existingDevice) {
      // Update existing device with lifetime totals AND sync the charger name
      const currentBaseline = (existingDevice.baseline_data as Record<string, any>) || {};
      const baselineCharging = currentBaseline.charging_kwh || 0;
      
      await supabaseClient
        .from("connected_devices")
        .update({
          device_name: primaryChargerName, // Always sync the charger name from Wallbox
          lifetime_totals: {
            charging_kwh: totalEnergyKwh,
            lifetime_charging_kwh: totalEnergyKwh,
            total_sessions: totalSessions,
            updated_at: now,
          },
          updated_at: now,
        })
        .eq("id", existingDevice.id);
      
      console.log(`Updated Wallbox device ${primaryChargerId} "${primaryChargerName}" with ${totalEnergyKwh} kWh lifetime charging`);
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
        production_wh: 0, // Wallbox doesn't produce energy, only consumes
        consumption_wh: totalEnergyKwh * 1000, // Convert kWh to Wh
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
