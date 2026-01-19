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

      // Extract lifetime energy (best-effort across multiple API versions)
      // NOTE: Some endpoints return lifetime cumulative energy in Wh (e.g. cumulative_added_energy)
      // while others return lifetime in kWh (e.g. addedEnergy / totalEnergyKwh).
      const kwhCandidates: number[] = [];
      const whCandidates: number[] = [];

      const pushKwh = (v: unknown) => {
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) kwhCandidates.push(v);
      };
      const pushWh = (v: unknown) => {
        if (typeof v === 'number' && Number.isFinite(v) && v > 0) whCandidates.push(v);
      };

      // Common kWh fields
      pushKwh(chargerData.addedEnergy);
      pushKwh(chargerData.added_energy);
      pushKwh(chargerData.totalEnergyKwh);
      pushKwh(chargerData.total_energy_kwh);
      pushKwh(chargerData.totalEnergy);
      pushKwh(chargerData.total_energy);
      pushKwh(chargerData.addedEnergyTotal);
      pushKwh(chargerData.added_energy_total);
      pushKwh(chargerData.lifetimeEnergy);
      pushKwh(chargerData.lifetime_energy);

      // Common Wh cumulative fields (convert later)
      pushWh(chargerData.cumulativeAddedEnergy);
      pushWh(chargerData.cumulative_added_energy);
      pushWh(chargerData.cumulative_added_energy_wh);
      pushWh(chargerData.totalEnergyWh);
      pushWh(chargerData.total_energy_wh);

      // Nested variants
      if (chargerData.data) {
        const d = chargerData.data;
        pushKwh(d.addedEnergy);
        pushKwh(d.added_energy);
        pushKwh(d.totalEnergyKwh);
        pushKwh(d.total_energy_kwh);
        pushWh(d.cumulativeAddedEnergy);
        pushWh(d.cumulative_added_energy);
        pushWh(d.totalEnergyWh);
        pushWh(d.total_energy_wh);
      }
      if (chargerData.statistics) {
        const s = chargerData.statistics;
        pushKwh(s.addedEnergy);
        pushKwh(s.totalEnergyKwh);
        pushWh(s.cumulativeAddedEnergy);
        pushWh(s.cumulative_added_energy);
      }

      // CRITICAL: The /v2/charger/{id} response nests lifetime totals in chargerData.resume
      // resume.totalEnergy is a STRING representing Wh (despite energyUnit saying "kWh")
      // e.g. {"resume":{"totalEnergy":"87419","totalSessions":2,"energyUnit":"kWh"}}
      if (chargerData.resume) {
        const r = chargerData.resume;
        // totalEnergy is often a string; parse and treat as Wh
        const totalEnergyVal = parseFloat(r.totalEnergy);
        if (Number.isFinite(totalEnergyVal) && totalEnergyVal > 0) {
          // If energyUnit says kWh but value > 1000, it's likely Wh
          // If value < 1000, assume it's already kWh
          if (totalEnergyVal >= 1000) {
            whCandidates.push(totalEnergyVal);
            console.log(`Found resume.totalEnergy=${totalEnergyVal} (treating as Wh)`);
          } else {
            kwhCandidates.push(totalEnergyVal);
            console.log(`Found resume.totalEnergy=${totalEnergyVal} (treating as kWh)`);
          }
        }
        // Also check totalSessions
        const sessionsVal = parseInt(r.totalSessions, 10);
        if (Number.isFinite(sessionsVal) && sessionsVal > 0) {
          totalSessions = Math.max(totalSessions, sessionsVal);
        }
      }


      const lifetimeFromKwh = kwhCandidates.length ? Math.max(...kwhCandidates) : 0;
      const lifetimeFromWhKwh = whCandidates.length ? Math.max(...whCandidates) / 1000 : 0;

      let lifetimeEnergyKwh = Math.max(lifetimeFromKwh, lifetimeFromWhKwh);

      // Final sanity fallback: if something was returned in Wh but not tagged as such
      if (lifetimeEnergyKwh > 0 && lifetimeEnergyKwh > 100000) {
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
