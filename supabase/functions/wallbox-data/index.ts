import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-target-user-id",
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

    // Check for admin override - allows admins to sync on behalf of other users
    let targetUserId = user.id;
    const targetUserIdHeader = req.headers.get("X-Target-User-Id");
    
    if (targetUserIdHeader && targetUserIdHeader !== user.id) {
      // Verify the caller is an admin
      const { data: isAdmin } = await supabaseClient.rpc('is_admin', { _user_id: user.id });
      
      if (!isAdmin) {
        console.log(`User ${user.id} attempted admin override but is not admin`);
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      targetUserId = targetUserIdHeader;
      console.log(`Admin ${user.id} syncing Wallbox data for user ${targetUserId}`);
    }

    // Get stored Wallbox tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("provider", "wallbox")
      .single();

    if (tokenError || !tokenData) {
      console.log(`No Wallbox tokens found for user ${targetUserId}`);
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
    // Per Wallbox API docs: /chargers/status/{charger_id} returns cumulative_added_energy in Wh
    for (const chargerId of chargerIds) {
      console.log(`Fetching data for charger ${chargerId}`);
      
      let lifetimeEnergyKwh = 0;
      let chargerName = `Charger ${chargerId}`;
      let chargerStatus = 'Unknown';
      let addedRange = 0;
      
      // PRIMARY: Call /chargers/status/{charger_id} - this has cumulative_added_energy in Wh
      console.log(`Calling /chargers/status/${chargerId} for lifetime data`);
      const statusResponse = await fetch(`${WALLBOX_API_BASE}/chargers/status/${chargerId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Charger ${chargerId} /chargers/status response:`, JSON.stringify(statusData));
        
        // The key field: cumulative_added_energy is in Wh, divide by 1000 for kWh
        if (typeof statusData.cumulative_added_energy === 'number' && statusData.cumulative_added_energy > 0) {
          lifetimeEnergyKwh = statusData.cumulative_added_energy / 1000;
          console.log(`Found cumulative_added_energy=${statusData.cumulative_added_energy} Wh = ${lifetimeEnergyKwh} kWh`);
        }
        
        // Extract name/status from status endpoint if available
        chargerName = statusData.name || statusData.charger_name || chargerName;
        chargerStatus = statusData.status_description || statusData.statusDescription || 
                       (statusData.status_id ? `Status ${statusData.status_id}` : chargerStatus);
        addedRange = statusData.added_range || statusData.addedRange || 0;
      } else {
        console.error(`/chargers/status/${chargerId} failed:`, statusResponse.status);
      }
      
      // FALLBACK: If /chargers/status didn't work or returned 0, try /v2/charger/{id}
      if (lifetimeEnergyKwh === 0) {
        console.log(`Trying fallback /v2/charger/${chargerId}`);
        const v2Response = await fetch(`${WALLBOX_API_BASE}/v2/charger/${chargerId}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
          },
        });

        if (v2Response.ok) {
          const v2Data = await v2Response.json();
          console.log(`Charger ${chargerId} /v2/charger response:`, JSON.stringify(v2Data));
          const chargerData = v2Data?.data?.chargerData || v2Data;
          
          // Check resume.totalEnergy (string in Wh despite saying kWh)
          if (chargerData?.resume?.totalEnergy) {
            const totalEnergyVal = parseFloat(chargerData.resume.totalEnergy);
            if (Number.isFinite(totalEnergyVal) && totalEnergyVal > 0) {
              // If > 1000, it's definitely Wh
              lifetimeEnergyKwh = totalEnergyVal >= 1000 ? totalEnergyVal / 1000 : totalEnergyVal;
              console.log(`Found resume.totalEnergy=${totalEnergyVal}, treating as ${lifetimeEnergyKwh} kWh`);
            }
            
            // Sessions from resume
            const sessionsVal = parseInt(chargerData.resume.totalSessions, 10);
            if (Number.isFinite(sessionsVal) && sessionsVal > 0) {
              totalSessions = Math.max(totalSessions, sessionsVal);
            }
          }
          
          // Fallback to addedEnergy field (typically kWh)
          if (lifetimeEnergyKwh === 0 && typeof chargerData?.addedEnergy === 'number' && chargerData.addedEnergy > 0) {
            lifetimeEnergyKwh = chargerData.addedEnergy;
            console.log(`Found addedEnergy=${chargerData.addedEnergy} kWh`);
          }
          
          // Get name/status if not already set
          if (chargerName === `Charger ${chargerId}`) {
            chargerName = chargerData?.name || chargerData?.chargerName || chargerName;
          }
          if (chargerStatus === 'Unknown') {
            chargerStatus = chargerData?.status_description || chargerData?.statusDescription || chargerStatus;
          }
          addedRange = chargerData?.addedRange || chargerData?.added_range || addedRange;
        } else {
          console.error(`/v2/charger/${chargerId} failed:`, v2Response.status);
        }
      }
      
      console.log(`Charger ${chargerId} final lifetime energy: ${lifetimeEnergyKwh} kWh`);
      totalEnergyKwh += lifetimeEnergyKwh;

      chargerDetails.push({
        id: chargerId,
        name: chargerName,
        status: chargerStatus,
        addedEnergy: lifetimeEnergyKwh,
        addedRange: addedRange,
      });
    }

    // Store or update connected device(s) with lifetime totals
    const primaryChargerId = chargerDetails[0]?.id?.toString() || "unknown";
    const primaryChargerName = chargerDetails[0]?.name || "Wallbox Charger";

    console.log(`Total across all chargers: ${totalEnergyKwh} kWh`);

    const now = new Date().toISOString();

    // Update ALL existing Wallbox devices for the user (older versions created duplicates).
    const { data: existingWallboxDevices, error: existingWallboxDevicesError } = await supabaseClient
      .from("connected_devices")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("provider", "wallbox");

    if (existingWallboxDevicesError) {
      console.error('Failed to list existing Wallbox devices:', existingWallboxDevicesError);
    }

    const lifetimeTotals = {
      charging_kwh: totalEnergyKwh,
      lifetime_charging_kwh: totalEnergyKwh,
      total_sessions: totalSessions,
      updated_at: now,
    };

    if (existingWallboxDevices && existingWallboxDevices.length > 0) {
      const updateResult = await supabaseClient
        .from("connected_devices")
        .update({
          device_id: primaryChargerId,
          device_type: "home_charger",
          device_name: primaryChargerName,
          lifetime_totals: lifetimeTotals,
          device_metadata: {
            charger_count: chargerDetails.length,
          },
          updated_at: now,
        })
        .eq("user_id", targetUserId)
        .eq("provider", "wallbox");

      if (updateResult.error) {
        console.error(`Failed to update Wallbox devices:`, updateResult.error);
      } else {
        console.log(`Updated ${existingWallboxDevices.length} Wallbox device record(s) with ${totalEnergyKwh} kWh lifetime charging`);
      }
    } else {
      const { error: deviceError } = await supabaseClient
        .from("connected_devices")
        .insert({
          user_id: targetUserId,
          provider: "wallbox",
          device_id: primaryChargerId,
          device_type: "home_charger",
          device_name: primaryChargerName,
          baseline_data: {
            charging_kwh: 0,
            captured_at: now,
          },
          lifetime_totals: lifetimeTotals,
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
        user_id: targetUserId,
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
        lifetime_charging_kwh: totalEnergyKwh,
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
