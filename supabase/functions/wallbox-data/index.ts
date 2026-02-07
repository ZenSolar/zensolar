import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-target-user-id",
};

// Wallbox API endpoints
const WALLBOX_API_BASE = "https://api.wall-box.com";

// ── Cryptographic Helpers (Proof-of-Delta™) ──────────────────────────────────

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function buildEnergyHash(deviceId: string, timestamp: string, value: number, prevHash: string): Promise<string> {
  return sha256Hex(`${deviceId}|${timestamp}|${value}|${prevHash}`);
}

async function getPreviousProof(supabaseClient: any, deviceId: string, dataType: string, userId: string) {
  const { data: prevRecord } = await supabaseClient
    .from("energy_production")
    .select("proof_metadata, production_wh")
    .eq("device_id", deviceId)
    .eq("provider", "wallbox")
    .eq("data_type", dataType)
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return {
    prevHash: (prevRecord?.proof_metadata as any)?.hash || "genesis",
    prevValue: Number(prevRecord?.production_wh || 0),
  };
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

    let accessToken = tokenData.access_token;

    // Helper: attempt to re-authenticate using stored credentials
    async function tryAutoRefresh(): Promise<string | null> {
      const encCreds = tokenData.refresh_token;
      if (!encCreds) {
        console.log("No stored credentials for auto-refresh");
        return null;
      }
      try {
        const { e: email, p: password } = JSON.parse(atob(encCreds));
        const credentials = btoa(`${email}:${password}`);
        console.log(`Auto-refreshing Wallbox token for ${email}`);
        
        const authResponse = await fetch(`${WALLBOX_API_BASE}/auth/token/user`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        });
        
        if (!authResponse.ok) {
          console.error("Wallbox auto-refresh failed:", authResponse.status);
          return null;
        }
        
        const authData = await authResponse.json();
        if (!authData.jwt) return null;
        
        // Update stored token
        await supabaseClient
          .from("energy_tokens")
          .update({
            access_token: authData.jwt,
            expires_at: authData.ttl
              ? new Date(Date.now() + authData.ttl * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", targetUserId)
          .eq("provider", "wallbox");
        
        console.log("Wallbox token auto-refreshed successfully");
        return authData.jwt;
      } catch (err) {
        console.error("Auto-refresh parse/fetch error:", err);
        return null;
      }
    }

    // Check if token is expired locally — try auto-refresh first
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      console.log("Wallbox token expired locally, attempting auto-refresh");
      const newToken = await tryAutoRefresh();
      if (newToken) {
        accessToken = newToken;
      } else {
        return new Response(JSON.stringify({ error: "Token expired", needsReauth: true }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fetch user's chargers via groups endpoint
    console.log("Fetching Wallbox chargers via groups endpoint");
    let groupsResponse = await fetch(`${WALLBOX_API_BASE}/v3/chargers/groups`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    // If 401 from API, try auto-refresh and retry once
    if (groupsResponse.status === 401) {
      console.log("Wallbox API returned 401, attempting auto-refresh");
      const newToken = await tryAutoRefresh();
      if (newToken) {
        accessToken = newToken;
        groupsResponse = await fetch(`${WALLBOX_API_BASE}/v3/chargers/groups`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
          },
        });
      }
    }

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
          
          // Check resume.totalEnergy - TRUST the energyUnit field from the API
          if (chargerData?.resume?.totalEnergy) {
            const totalEnergyVal = parseFloat(chargerData.resume.totalEnergy);
            const energyUnit = chargerData?.resume?.energyUnit?.toLowerCase() || 'kwh';
            
            if (Number.isFinite(totalEnergyVal) && totalEnergyVal > 0) {
              // Trust the API's unit label
              if (energyUnit === 'wh') {
                lifetimeEnergyKwh = totalEnergyVal / 1000;
                console.log(`Found resume.totalEnergy=${totalEnergyVal} Wh = ${lifetimeEnergyKwh} kWh`);
              } else {
                // API says kWh, trust it
                lifetimeEnergyKwh = totalEnergyVal;
                console.log(`Found resume.totalEnergy=${totalEnergyVal} kWh (unit: ${energyUnit})`);
              }
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
      
      // PRIMARY SOURCE: Use /v4/sessions/stats to get accurate session history totals
      // Sum individual session energies for the TRUE lifetime total
      // Using 10-year range to capture all historical data
      console.log(`Fetching session stats from /v4/sessions/stats for charger ${chargerId}`);
      const now = Math.floor(Date.now() / 1000);
      const tenYearsAgo = now - (10 * 365 * 24 * 60 * 60); // Go back 10 years for maximum coverage
      const statsUrl = `${WALLBOX_API_BASE}/v4/sessions/stats?charger=${chargerId}&start_date=${tenYearsAgo}&end_date=${now}&limit=10000`;
      
      const statsResponse = await fetch(statsUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const sessionCountFromMeta = statsData?.meta?.count || 0;
        console.log(`Charger ${chargerId} /v4/sessions/stats: meta.count=${sessionCountFromMeta}`);
        
        // Sum up energy from all sessions - THIS IS THE AUTHORITATIVE SOURCE
        let sessionsTotalEnergyKwh = 0;
        let sessionCount = 0;
        
        if (Array.isArray(statsData?.data)) {
          for (const session of statsData.data) {
            // Each session has attributes.energy in kWh (confirmed from API response)
            const sessionEnergy = session?.attributes?.energy;
            if (typeof sessionEnergy === 'number' && sessionEnergy > 0) {
              sessionsTotalEnergyKwh += sessionEnergy;
              sessionCount++;
            }
          }
          
          console.log(`Computed from ${sessionCount} sessions (meta said ${sessionCountFromMeta}): ${sessionsTotalEnergyKwh.toFixed(3)} kWh total`);
          
          // ALWAYS use the session-computed total - it's the sum of all actual charging sessions
          // The resume/totalEnergy fields are often incorrectly formatted or wrong
          if (sessionsTotalEnergyKwh > 0) {
            console.log(`Using session-computed total: ${sessionsTotalEnergyKwh.toFixed(3)} kWh (replacing previous ${lifetimeEnergyKwh} kWh)`);
            lifetimeEnergyKwh = sessionsTotalEnergyKwh;
          }
          
          // Use the actual session count
          const actualSessionCount = Math.max(sessionCount, sessionCountFromMeta);
          if (actualSessionCount > 0) {
            console.log(`Setting session count to ${actualSessionCount}`);
            totalSessions = actualSessionCount;
          }
        }
      } else {
        console.warn(`/v4/sessions/stats failed for charger ${chargerId}:`, statsResponse.status);
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

    // IMPORTANT: connected_devices has a unique constraint on (provider, device_id).
    // Older versions could leave multiple Wallbox rows per user (e.g. device_id="unknown").
    // We must update exactly ONE row to the real charger id and then clean up the rest.
    const { data: existingWallboxDevices, error: existingWallboxDevicesError } = await supabaseClient
      .from("connected_devices")
      .select("id, device_id")
      .eq("user_id", targetUserId)
      .eq("provider", "wallbox");

    if (existingWallboxDevicesError) {
      console.error("Failed to list existing Wallbox devices:", existingWallboxDevicesError);
    }

    const lifetimeTotals = {
      charging_kwh: totalEnergyKwh,
      lifetime_charging_kwh: totalEnergyKwh,
      total_sessions: totalSessions,
      updated_at: now,
    };

    const devicePayload = {
      device_id: primaryChargerId,
      device_type: "home_charger",
      device_name: primaryChargerName,
      lifetime_totals: lifetimeTotals,
      device_metadata: {
        charger_count: chargerDetails.length,
      },
      updated_at: now,
    };

    if (existingWallboxDevices && existingWallboxDevices.length > 0) {
      // Prefer updating the row that already has the real device_id to avoid unique constraint collisions
      const rowWithPrimary = existingWallboxDevices.find((d) => d.device_id === primaryChargerId);
      const primaryRowId = rowWithPrimary?.id ?? existingWallboxDevices[0].id;

      const updateResult = await supabaseClient
        .from("connected_devices")
        .update(devicePayload)
        .eq("id", primaryRowId);

      if (updateResult.error) {
        console.error("Failed to update Wallbox device:", updateResult.error);

        // If the device_id is already claimed elsewhere, surface a useful error
        if (updateResult.error.code === "23505") {
          return new Response(
            JSON.stringify({
              error: "Wallbox charger already claimed by another account",
              code: "DEVICE_ALREADY_CLAIMED",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(JSON.stringify({ error: "Failed to update Wallbox device" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clean up any extra rows for this user/provider (e.g. device_id="unknown")
      const cleanupResult = await supabaseClient
        .from("connected_devices")
        .delete()
        .eq("user_id", targetUserId)
        .eq("provider", "wallbox")
        .neq("id", primaryRowId);

      if (cleanupResult.error) {
        console.error("Failed to cleanup duplicate Wallbox device rows:", cleanupResult.error);
      } else {
        console.log("Cleaned up duplicate Wallbox device rows (if any)");
      }

      console.log(
        `Updated Wallbox device ${primaryChargerId} with ${totalEnergyKwh} kWh lifetime charging (sessions=${totalSessions})`
      );
    } else {
      const { error: deviceError } = await supabaseClient
        .from("connected_devices")
        .insert({
          user_id: targetUserId,
          provider: "wallbox",
          ...devicePayload,
          baseline_data: {
            charging_kwh: 0,
            captured_at: now,
          },
        });

      if (deviceError) {
        console.error("Failed to create Wallbox device:", deviceError);

        if (deviceError.code === "23505") {
          return new Response(
            JSON.stringify({
              error: "Wallbox charger already claimed by another account",
              code: "DEVICE_ALREADY_CLAIMED",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(JSON.stringify({ error: "Failed to create Wallbox device" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Created Wallbox device ${primaryChargerId} with ${totalEnergyKwh} kWh lifetime charging`);
    }

    // Store energy production data: write per-session daily granular rows
    // Instead of one cumulative row, write daily aggregates from sessions
    {
      const primaryId = primaryChargerId;
      const dailyChargingMap = new Map<string, number>(); // date → Wh
      const sessionRecords: any[] = [];

      // Re-fetch sessions to get per-session data with dates
      const now2 = Math.floor(Date.now() / 1000);
      const tenYearsAgo2 = now2 - (10 * 365 * 24 * 60 * 60);
      const sessUrl = `${WALLBOX_API_BASE}/v4/sessions/stats?charger=${primaryId}&start_date=${tenYearsAgo2}&end_date=${now2}&limit=10000`;
      
      const sessResp = await fetch(sessUrl, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });

      if (sessResp.ok) {
        const sessData = await sessResp.json();
        const sessions = Array.isArray(sessData?.data) ? sessData.data : [];
        
        for (const session of sessions) {
          const attrs = session?.attributes || {};
          const sessionKwh = attrs.energy || 0;
          if (sessionKwh <= 0) continue;

          // Get session date from start time
          const startTime = attrs.start || attrs.startedAt || attrs.start_time;
          if (!startTime) continue;
          const dateStr = String(startTime).split("T")[0];
          if (!dateStr || dateStr.length !== 10) continue;

          // Aggregate for daily row
          dailyChargingMap.set(dateStr, (dailyChargingMap.get(dateStr) || 0) + sessionKwh * 1000);

          // Per-session record for charging_sessions table
          sessionRecords.push({
            user_id: targetUserId,
            provider: "wallbox",
            device_id: primaryId,
            session_date: dateStr,
            energy_kwh: sessionKwh,
            location: attrs.location || null,
            fee_amount: attrs.cost || null,
            fee_currency: attrs.cost ? "USD" : null,
            session_metadata: {
              duration_seconds: attrs.time || attrs.duration || null,
              charger_id: primaryId,
            },
          });
        }
      }

      // Write daily granular rows with Proof-of-Delta™ cryptographic verification
      for (const [dateStr, totalWh] of dailyChargingMap) {
        if (totalWh <= 0) continue;
        const tsNow = new Date().toISOString();
        const { prevHash, prevValue } = await getPreviousProof(supabaseClient, primaryId, "ev_charging", targetUserId);
        const hash = await buildEnergyHash(primaryId, tsNow, totalWh, prevHash);
        console.log(`[Proof-of-Delta] Wallbox charging for ${primaryId} on ${dateStr}: ${hash.slice(0, 16)}... (val: ${totalWh} Wh)`);

        const { error: dayError } = await supabaseClient
          .from("energy_production")
          .upsert({
            user_id: targetUserId,
            provider: "wallbox",
            device_id: primaryId,
            production_wh: totalWh,
            data_type: "ev_charging",
            recorded_at: dateStr + "T12:00:00Z",
            proof_metadata: {
              hash,
              prev_hash: prevHash,
              device_id: primaryId,
              value: totalWh,
              prev_value: prevValue,
              delta: Math.max(0, totalWh - prevValue),
              data_type: "ev_charging",
              unit: "wh",
              timestamp: tsNow,
              algorithm: "SHA-256",
              preimage_format: "device_id|timestamp|value|prevHash",
            },
          }, { onConflict: "device_id,provider,recorded_at,data_type" });
        if (dayError) console.error(`Wallbox daily upsert error for ${dateStr}:`, dayError);
      }

      console.log(`Wallbox: wrote ${dailyChargingMap.size} daily charging rows`);

      // Write per-session details
      if (sessionRecords.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < sessionRecords.length; i += batchSize) {
          const batch = sessionRecords.slice(i, i + batchSize);
          const { error } = await supabaseClient
            .from("charging_sessions")
            .insert(batch)
            .select();
          if (error && error.code !== '23505') console.error(`Wallbox sessions insert error batch ${i}:`, error);
        }
        console.log(`Wallbox: wrote ${sessionRecords.length} charging session records`);
      }
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
