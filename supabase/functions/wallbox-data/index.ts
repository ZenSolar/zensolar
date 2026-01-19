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

    // Fetch detailed data for each charger using the v2 endpoint
    // The /v2/charger/{id} endpoint returns the most complete data including lifetime addedEnergy
    for (const chargerId of chargerIds) {
      console.log(`Fetching detailed data for charger ${chargerId}`);
      
      // Try the v2 charger endpoint first - this returns the most complete data
      let chargerData: any = null;
      
      // Try /v2/charger/{id} - most reliable for lifetime data
      const v2Response = await fetch(`${WALLBOX_API_BASE}/v2/charger/${chargerId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });

      if (v2Response.ok) {
        const v2Data = await v2Response.json();
        console.log(`Charger ${chargerId} v2 response:`, JSON.stringify(v2Data));
        chargerData = v2Data?.data?.chargerData || v2Data;
      } else {
        console.log(`v2/charger failed (${v2Response.status}), trying status endpoint`);
      }
      
      // Fallback to /chargers/status/{id} 
      if (!chargerData) {
        const statusResponse = await fetch(`${WALLBOX_API_BASE}/chargers/status/${chargerId}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
          },
        });

        if (statusResponse.ok) {
          chargerData = await statusResponse.json();
          console.log(`Charger ${chargerId} status response:`, JSON.stringify(chargerData));
        } else {
          console.error(`Failed to fetch charger ${chargerId} status:`, statusResponse.status);
          continue;
        }
      }

      if (!chargerData) {
        console.error(`No data available for charger ${chargerId}`);
        continue;
      }

      // Extract the addedEnergy (lifetime total in kWh)
      // The Wallbox API returns this as a float in kWh directly
      // Check multiple possible field names since API versions differ
      let lifetimeEnergyKwh = 0;
      
      // Try different field names used by Wallbox API
      const possibleFields = [
        chargerData.addedEnergy,
        chargerData.added_energy,
        chargerData.totalEnergy,
        chargerData.total_energy,
        chargerData.lifetimeEnergy,
        chargerData.lifetime_energy,
      ];
      
      for (const value of possibleFields) {
        if (typeof value === 'number' && value > 0) {
          lifetimeEnergyKwh = value;
          break;
        }
      }
      
      // Also check nested data structures
      if (lifetimeEnergyKwh === 0 && chargerData.data) {
        const nestedData = chargerData.data;
        const nestedFields = [
          nestedData.addedEnergy,
          nestedData.added_energy,
          nestedData.totalEnergy,
        ];
        for (const value of nestedFields) {
          if (typeof value === 'number' && value > 0) {
            lifetimeEnergyKwh = value;
            break;
          }
        }
      }

      // The value should already be in kWh, but verify it's reasonable
      // If the value is very large (>10000), it might be in Wh
      if (lifetimeEnergyKwh > 10000) {
        console.log(`Converting ${lifetimeEnergyKwh} Wh to kWh`);
        lifetimeEnergyKwh = lifetimeEnergyKwh / 1000;
      }
      
      console.log(`Charger ${chargerId} lifetime energy: ${lifetimeEnergyKwh} kWh`);

      totalEnergyKwh += lifetimeEnergyKwh;

      // Get charger name and status
      const chargerName = chargerData.name || chargerData.chargerName || `Charger ${chargerId}`;
      const chargerStatus = chargerData.status_description || 
                           chargerData.statusDescription || 
                           chargerData.status?.toString() || 
                           'Unknown';

      chargerDetails.push({
        id: chargerId,
        name: chargerName,
        status: chargerStatus,
        addedEnergy: lifetimeEnergyKwh,
        addedRange: chargerData.addedRange || chargerData.added_range || 0,
      });
    }

    // Store or update connected device with lifetime totals
    const primaryChargerId = chargerDetails[0]?.id?.toString() || "unknown";
    const primaryChargerName = chargerDetails[0]?.name || "Wallbox Charger";
    
    console.log(`Total across all chargers: ${totalEnergyKwh} kWh`);
    
    // First, try to get existing device with this specific charger ID
    const { data: existingDevice } = await supabaseClient
      .from("connected_devices")
      .select("id, baseline_data, lifetime_totals")
      .eq("user_id", targetUserId)
      .eq("provider", "wallbox")
      .eq("device_id", primaryChargerId)
      .maybeSingle();

    const now = new Date().toISOString();
    
    if (existingDevice) {
      // Update existing device with lifetime totals
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
      // Check if there's an "unknown" device we should clean up or a mismatched device_id
      const { data: anyWallboxDevice } = await supabaseClient
        .from("connected_devices")
        .select("id, device_id")
        .eq("user_id", targetUserId)
        .eq("provider", "wallbox")
        .maybeSingle();
      
      if (anyWallboxDevice) {
        // Update the existing record with the correct device_id
        const updateResult = await supabaseClient
          .from("connected_devices")
          .update({
            device_id: primaryChargerId,
            device_name: primaryChargerName,
            lifetime_totals: {
              charging_kwh: totalEnergyKwh,
              lifetime_charging_kwh: totalEnergyKwh,
              total_sessions: totalSessions,
              updated_at: now,
            },
            updated_at: now,
          })
          .eq("id", anyWallboxDevice.id);
        
        if (updateResult.error) {
          console.error(`Failed to update Wallbox device:`, updateResult.error);
        } else {
          console.log(`Updated mismatched Wallbox device to ${primaryChargerId} with ${totalEnergyKwh} kWh`);
        }
      } else {
        // Create new device record
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
