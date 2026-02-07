import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-target-user-id",
};

const ENPHASE_API_BASE = "https://api.enphaseenergy.com/api/v4";
const ENPHASE_TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";

// Helper to refresh Enphase token
async function refreshEnphaseToken(
  supabaseClient: any,
  userId: string,
  refreshToken: string
): Promise<string | null> {
  const clientId = Deno.env.get("ENPHASE_CLIENT_ID");
  const clientSecret = Deno.env.get("ENPHASE_CLIENT_SECRET");

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Enphase credentials for refresh");
    return null;
  }

  try {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const tokenUrl = new URL(ENPHASE_TOKEN_URL);
    tokenUrl.searchParams.set("grant_type", "refresh_token");
    tokenUrl.searchParams.set("refresh_token", refreshToken);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: { "Authorization": `Basic ${credentials}` },
    });

    if (!tokenResponse.ok) {
      console.error("Enphase token refresh failed:", await tokenResponse.text());
      return null;
    }

    const tokens = await tokenResponse.json();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Update tokens in database
    await supabaseClient
      .from("energy_tokens")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "enphase");

    console.log("Enphase token refreshed successfully");
    return tokens.access_token;
  } catch (error) {
    console.error("Enphase token refresh error:", error);
    return null;
  }
}

// Cache duration in minutes - Enphase Watt plan has very limited API calls
const CACHE_DURATION_MINUTES = 15;

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
      console.log(`Admin ${user.id} syncing Enphase data for user ${targetUserId}`);
    }

    const apiKey = Deno.env.get("ENPHASE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Enphase API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's Enphase tokens with cached data
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("provider", "enphase")
      .single();

    if (tokenError || !tokenData) {
      console.error("No Enphase tokens found:", tokenError);
      return new Response(JSON.stringify({ error: "Enphase not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if we have cached data that's still fresh
    const extraData = tokenData.extra_data as Record<string, unknown> || {};
    const cachedData = extraData.cached_response as Record<string, unknown> | undefined;
    const cachedAt = extraData.cached_at as string | undefined;
    
    if (cachedData && cachedAt) {
      const cacheAge = Date.now() - new Date(cachedAt).getTime();
      const cacheMaxAge = CACHE_DURATION_MINUTES * 60 * 1000;
      
      if (cacheAge < cacheMaxAge) {
        console.log(`Returning cached Enphase data (${Math.round(cacheAge / 1000)}s old)`);
        return new Response(JSON.stringify({
          ...cachedData,
          cached: true,
          cache_age_seconds: Math.round(cacheAge / 1000),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let accessToken = tokenData.access_token;

    // Check if token is expired and refresh if needed
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at);
      const now = new Date();
      // Refresh if expired or expiring in next 5 minutes
      if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
        console.log("Enphase token expired or expiring soon, refreshing...");
        const newToken = await refreshEnphaseToken(
          supabaseClient,
          targetUserId,
          tokenData.refresh_token
        );
        if (newToken) {
          accessToken = newToken;
        } else {
          return new Response(JSON.stringify({ 
            error: "Token expired", 
            needsReauth: true 
          }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Prefer using already-known system IDs from connected_devices to reduce API calls.
    // This avoids the expensive /systems call (which is the most likely to hit rate limits).
    const { data: enphaseDevices, error: enphaseDevicesError } = await supabaseClient
      .from("connected_devices")
      .select("id, device_id, device_name, baseline_data, lifetime_totals")
      .eq("user_id", targetUserId)
      .eq("provider", "enphase");

    if (enphaseDevicesError) {
      console.error("Failed to fetch connected Enphase devices:", enphaseDevicesError);
    }

    const deviceBySystemId = new Map<string, any>();
    for (const d of enphaseDevices ?? []) {
      deviceBySystemId.set(String(d.device_id), d);
    }

    // Build systems list to fetch
    let systemsToFetch: Array<{ system_id: string; name: string }> = [];
    if (enphaseDevices && enphaseDevices.length > 0) {
      systemsToFetch = enphaseDevices.map((d: any) => ({
        system_id: String(d.device_id),
        name: d.device_name || "Enphase System",
      }));
    } else {
      // Fallback: if connected_devices isn't populated for some reason, fall back to /systems.
      const systemsResponse = await fetch(`${ENPHASE_API_BASE}/systems?key=${apiKey}`, {
        headers: { "Authorization": `Bearer ${accessToken}` },
      });

      if (!systemsResponse.ok) {
        const errorText = await systemsResponse.text();
        console.error("Failed to fetch Enphase systems:", errorText);

        // If rate limited, return cached data if available
        if (systemsResponse.status === 429 && cachedData) {
          console.log("Rate limited, returning stale cached data");
          return new Response(JSON.stringify({
            ...cachedData,
            cached: true,
            stale: true,
            rate_limited: true,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // If rate limited and no cache, try to get data from connected_devices table
        if (systemsResponse.status === 429) {
          console.log("Rate limited, no cache - checking connected_devices for fallback data");
          const { data: devices } = await supabaseClient
            .from("connected_devices")
            .select("lifetime_totals, baseline_data, device_name")
            .eq("user_id", targetUserId)
            .eq("provider", "enphase");

          if (devices && devices.length > 0) {
            let totalLifetimeSolarWh = 0;
            let totalPendingSolarWh = 0;
            let systemName = "Enphase System";

            for (const device of devices) {
              const lifetime = (device.lifetime_totals as Record<string, number>) || {};
              const baseline = (device.baseline_data as Record<string, number>) || {};
              const solarWh = lifetime.solar_wh || lifetime.lifetime_solar_wh || 0;
              const baselineWh = baseline.solar_wh || baseline.solar_production_wh || 0;
              totalLifetimeSolarWh += solarWh;
              totalPendingSolarWh += Math.max(0, solarWh - baselineWh);
              if (device.device_name) systemName = device.device_name;
            }

            console.log("Returning fallback data from connected_devices:", { totalLifetimeSolarWh, totalPendingSolarWh });
            return new Response(JSON.stringify({
              systems: [{ system_id: "fallback", name: systemName }],
              totals: {
                lifetime_solar_wh: totalLifetimeSolarWh,
                pending_solar_wh: totalPendingSolarWh,
              },
              cached: true,
              stale: true,
              rate_limited: true,
              fallback: true,
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        return new Response(JSON.stringify({ error: "Failed to fetch systems. Please try again." }), {
          status: systemsResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const systemsData = await systemsResponse.json();
      console.log("Enphase systems:", JSON.stringify(systemsData));

      if (!systemsData.systems || systemsData.systems.length === 0) {
        return new Response(JSON.stringify({
          systems: [],
          message: "No Enphase systems found",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Keep it simple: fetch the first system if we had to fall back to /systems
      systemsToFetch = [{
        system_id: String(systemsData.systems[0].system_id),
        name: String(systemsData.systems[0].name || "Enphase System"),
      }];
    }

    let totalLifetimeWh = 0;
    let totalPendingWh = 0;
    let totalEnergyTodayWh = 0;
    let rateLimited = false;
    const perSystem: Array<{ system_id: string; name: string; lifetime_wh: number; pending_wh: number; energy_today_wh: number }> = [];

    for (const system of systemsToFetch) {
      const systemId = system.system_id;

      const summaryResponse = await fetch(
        `${ENPHASE_API_BASE}/systems/${systemId}/summary?key=${apiKey}`,
        { headers: { "Authorization": `Bearer ${accessToken}` } }
      );

      if (summaryResponse.status === 429) {
        rateLimited = true;
        console.warn(`Enphase rate limited fetching summary for system ${systemId}`);
        continue;
      }

      if (!summaryResponse.ok) {
        console.error(`Failed to fetch Enphase summary for system ${systemId}:`, await summaryResponse.text());
        continue;
      }

      const summaryData = await summaryResponse.json();
      const lifetimeEnergyWh = Number(summaryData?.energy_lifetime || 0);
      const energyTodayWh = Number(summaryData?.energy_today || 0);

      // Baseline is stored in connected_devices
      const deviceRow = deviceBySystemId.get(String(systemId));
      const baseline = (deviceRow?.baseline_data as Record<string, any> | null) ?? {};
      const baselineSolarWh = Number(
        baseline.solar_wh || baseline.solar_production_wh || baseline.total_solar_produced_wh || baseline.lifetime_solar_wh || 0
      );
      const pendingSolarWh = Math.max(0, lifetimeEnergyWh - baselineSolarWh);

      totalLifetimeWh += lifetimeEnergyWh;
      totalPendingWh += pendingSolarWh;
      totalEnergyTodayWh += energyTodayWh;
      perSystem.push({
        system_id: systemId,
        name: system.name,
        lifetime_wh: lifetimeEnergyWh,
        pending_wh: pendingSolarWh,
        energy_today_wh: energyTodayWh,
      });

      // Store production data for rewards calculation
      if (energyTodayWh > 0) {
        const now = new Date();
        const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
        await supabaseClient
          .from("energy_production")
          .upsert({
            user_id: targetUserId,
            device_id: String(systemId),
            provider: "enphase",
            production_wh: energyTodayWh,
            data_type: "solar",
            recorded_at: recordedAt,
          }, { onConflict: "device_id,provider,recorded_at,data_type" });
      }

      // Persist lifetime totals so the dashboard can still show values when rate limited later.
      if (lifetimeEnergyWh > 0) {
        await supabaseClient
          .from("connected_devices")
          .update({
            lifetime_totals: {
              solar_wh: lifetimeEnergyWh,
              lifetime_solar_wh: lifetimeEnergyWh,
              updated_at: new Date().toISOString(),
            },
          })
          .eq("user_id", targetUserId)
          .eq("device_id", String(systemId))
          .eq("provider", "enphase");
      }

      // --- Historical backfill verification ---
      // Check if this user has sufficient historical data. If not, trigger backfill.
      // This is a self-healing mechanism: if the initial backfill failed or was incomplete,
      // the next dashboard sync will automatically retry it.
      if (lifetimeEnergyWh > 0) {
        const { count: histRecordCount } = await supabaseClient
          .from("energy_production")
          .select("id", { count: "exact", head: true })
          .eq("user_id", targetUserId)
          .eq("device_id", String(systemId))
          .eq("provider", "enphase")
          .eq("data_type", "solar");

        // If the user has lifetime production but fewer than 30 historical records,
        // their backfill likely failed. Trigger it in the background.
        const MIN_EXPECTED_RECORDS = 30;
        if ((histRecordCount ?? 0) < MIN_EXPECTED_RECORDS) {
          console.log(`[Backfill Check] User ${targetUserId} system ${systemId}: only ${histRecordCount} records, expected ${MIN_EXPECTED_RECORDS}+. Triggering historical backfill...`);
          
          // Fire-and-forget: call enphase-historical via internal HTTP
          const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
          const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
          fetch(`${supabaseUrl}/functions/v1/enphase-historical`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
              "X-Target-User-Id": targetUserId,
            },
            body: JSON.stringify({ user_id: targetUserId }),
          }).then(async (res) => {
            if (res.ok) {
              const result = await res.json();
              console.log(`[Backfill Check] Historical backfill completed for user ${targetUserId}: ${result.total_days_imported} days imported`);
            } else {
              const errText = await res.text();
              console.error(`[Backfill Check] Historical backfill failed for user ${targetUserId}: ${res.status} ${errText}`);
            }
          }).catch((err) => {
            console.error(`[Backfill Check] Historical backfill error for user ${targetUserId}:`, err);
          });
        }
      }
    }

    // If we couldn't fetch anything and we're rate-limited, fall back to cached/DB values.
    if (perSystem.length === 0) {
      if (cachedData) {
        console.log("Enphase rate limited, returning cached data");
        return new Response(JSON.stringify({
          ...cachedData,
          cached: true,
          stale: true,
          rate_limited: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // No cache; attempt DB fallback
      const { data: devices } = await supabaseClient
        .from("connected_devices")
        .select("lifetime_totals, baseline_data, device_name")
        .eq("user_id", targetUserId)
        .eq("provider", "enphase");

      if (devices && devices.length > 0) {
        let totalLifetimeSolarWh = 0;
        let totalPendingSolarWh = 0;
        let systemName = "Enphase System";

        for (const device of devices) {
          const lifetime = (device.lifetime_totals as Record<string, number>) || {};
          const baseline = (device.baseline_data as Record<string, number>) || {};
          const solarWh = lifetime.solar_wh || lifetime.lifetime_solar_wh || 0;
          const baselineWh = baseline.solar_wh || baseline.solar_production_wh || 0;
          totalLifetimeSolarWh += solarWh;
          totalPendingSolarWh += Math.max(0, solarWh - baselineWh);
          if (device.device_name) systemName = device.device_name;
        }

        console.log("Returning fallback data from connected_devices:", { totalLifetimeSolarWh, totalPendingSolarWh });
        return new Response(JSON.stringify({
          systems: [{ system_id: "fallback", name: systemName }],
          totals: {
            lifetime_solar_wh: totalLifetimeSolarWh,
            pending_solar_wh: totalPendingSolarWh,
          },
          cached: true,
          stale: true,
          rate_limited: true,
          fallback: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const responseData = {
      systems: systemsToFetch,
      per_system: perSystem,
      totals: {
        lifetime_solar_wh: totalLifetimeWh,
        pending_solar_wh: totalPendingWh,
        energy_today_wh: totalEnergyTodayWh,
      },
      rate_limited: rateLimited,
    };
    
    // Cache the response for future requests
    await supabaseClient
      .from("energy_tokens")
      .update({
        extra_data: {
          ...extraData,
          cached_response: responseData,
          cached_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", targetUserId)
      .eq("provider", "enphase");
    
    console.log("Cached Enphase data for future requests");
    
    return new Response(JSON.stringify({
      ...responseData,
      cached: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Enphase data error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch energy data. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
