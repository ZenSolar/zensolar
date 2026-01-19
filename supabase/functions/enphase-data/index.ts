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
          user.id,
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

    // First, get list of systems
    const systemsResponse = await fetch(`${ENPHASE_API_BASE}/systems?key=${apiKey}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
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
            const lifetime = device.lifetime_totals as Record<string, number> || {};
            const baseline = device.baseline_data as Record<string, number> || {};
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
        message: "No Enphase systems found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemId = systemsData.systems[0].system_id;

    // Get summary data for the system
    const summaryResponse = await fetch(
      `${ENPHASE_API_BASE}/systems/${systemId}/summary?key=${apiKey}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    let summaryData = null;
    if (summaryResponse.ok) {
      summaryData = await summaryResponse.json();
      console.log("Enphase summary:", JSON.stringify(summaryData));
    } else {
      console.error("Failed to fetch summary:", await summaryResponse.text());
    }

    // Get energy production for today
    const today = new Date().toISOString().split('T')[0];
    const energyResponse = await fetch(
      `${ENPHASE_API_BASE}/systems/${systemId}/energy_lifetime?key=${apiKey}&start_date=${today}`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    let energyData = null;
    if (energyResponse.ok) {
      energyData = await energyResponse.json();
      console.log("Enphase energy data:", JSON.stringify(energyData));
    } else {
      console.error("Failed to fetch energy:", await energyResponse.text());
    }

    // Store production data for rewards calculation
    const productionWh = summaryData?.energy_today || 0;
    if (productionWh > 0) {
      const now = new Date();
      const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
      
      await supabaseClient
        .from("energy_production")
        .upsert({
          user_id: targetUserId,
          device_id: String(systemId),
          provider: "enphase",
          production_wh: productionWh,
          recorded_at: recordedAt,
        }, { onConflict: "device_id,provider,recorded_at" });
    }

    // Return lifetime energy from summary (in Wh)
    const lifetimeEnergyWh = summaryData?.energy_lifetime || 0;
    
    // Get baseline from connected_devices to calculate pending
    let pendingSolarWh = lifetimeEnergyWh; // Default to lifetime if no baseline
    const { data: deviceData } = await supabaseClient
      .from("connected_devices")
      .select("baseline_data")
      .eq("user_id", targetUserId)
      .eq("device_id", String(systemId))
      .eq("provider", "enphase")
      .single();
    
    if (deviceData?.baseline_data) {
      const baseline = deviceData.baseline_data as Record<string, number>;
      // Check all possible baseline keys used across the app
      const baselineSolarWh = baseline.solar_wh || baseline.solar_production_wh || baseline.total_solar_produced_wh || baseline.lifetime_solar_wh || 0;
      pendingSolarWh = Math.max(0, lifetimeEnergyWh - baselineSolarWh);
      console.log(`Enphase pending calculation: lifetime=${lifetimeEnergyWh}, baseline=${baselineSolarWh}, pending=${pendingSolarWh}`);
    }
    
    // Store lifetime totals in connected_devices for admin reporting
    if (lifetimeEnergyWh > 0) {
      await supabaseClient
        .from("connected_devices")
        .update({
          lifetime_totals: {
            solar_wh: lifetimeEnergyWh,
            lifetime_solar_wh: lifetimeEnergyWh,
            updated_at: new Date().toISOString(),
          }
        })
        .eq("user_id", targetUserId)
        .eq("device_id", String(systemId))
        .eq("provider", "enphase");
      
      console.log(`Stored Enphase lifetime total: ${lifetimeEnergyWh} Wh`);
    }
    
    const responseData = {
      system: systemsData.systems[0],
      summary: summaryData,
      energy: energyData,
      totals: {
        lifetime_solar_wh: lifetimeEnergyWh,
        pending_solar_wh: pendingSolarWh,
        energy_today_wh: summaryData?.energy_today || 0,
      },
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
