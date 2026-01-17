import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOLAREDGE_API_BASE = "https://monitoringapi.solaredge.com";

// Cache duration in minutes - SolarEdge has daily request limits
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

    // Get user's SolarEdge credentials
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "solaredge")
      .single();

    if (tokenError || !tokenData) {
      console.error("No SolarEdge credentials found:", tokenError);
      return new Response(JSON.stringify({ error: "SolarEdge not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = tokenData.access_token;
    const extraData = tokenData.extra_data as Record<string, unknown> || {};
    const siteId = extraData.site_id as string;

    if (!apiKey || !siteId) {
      return new Response(JSON.stringify({ error: "Invalid SolarEdge credentials" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if we have cached data that's still fresh
    const cachedData = extraData.cached_response as Record<string, unknown> | undefined;
    const cachedAt = extraData.cached_at as string | undefined;
    
    if (cachedData && cachedAt) {
      const cacheAge = Date.now() - new Date(cachedAt).getTime();
      const cacheMaxAge = CACHE_DURATION_MINUTES * 60 * 1000;
      
      if (cacheAge < cacheMaxAge) {
        console.log(`Returning cached SolarEdge data (${Math.round(cacheAge / 1000)}s old)`);
        return new Response(JSON.stringify({
          ...cachedData,
          cached: true,
          cache_age_seconds: Math.round(cacheAge / 1000),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`Fetching SolarEdge data for site ${siteId}...`);

    // Fetch site overview (includes lifetime energy, current power, etc.)
    const overviewUrl = `${SOLAREDGE_API_BASE}/site/${siteId}/overview?api_key=${apiKey}`;
    const overviewResponse = await fetch(overviewUrl);

    if (!overviewResponse.ok) {
      const errorText = await overviewResponse.text();
      console.error("SolarEdge overview fetch failed:", overviewResponse.status, errorText);
      
      // If rate limited, return cached data if available
      if (overviewResponse.status === 429 && cachedData) {
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
      
      return new Response(JSON.stringify({ error: "Failed to fetch SolarEdge data" }), {
        status: overviewResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const overviewData = await overviewResponse.json();
    console.log("SolarEdge overview:", JSON.stringify(overviewData));

    // Fetch power flow (real-time power distribution)
    let powerFlowData = null;
    try {
      const powerFlowUrl = `${SOLAREDGE_API_BASE}/site/${siteId}/currentPowerFlow?api_key=${apiKey}`;
      const powerFlowResponse = await fetch(powerFlowUrl);
      
      if (powerFlowResponse.ok) {
        powerFlowData = await powerFlowResponse.json();
        console.log("SolarEdge power flow:", JSON.stringify(powerFlowData));
      } else {
        console.warn("Power flow fetch failed:", await powerFlowResponse.text());
      }
    } catch (err) {
      console.warn("Power flow fetch error:", err);
    }

    // Fetch site details for additional info
    let siteDetails = null;
    try {
      const detailsUrl = `${SOLAREDGE_API_BASE}/site/${siteId}/details?api_key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      
      if (detailsResponse.ok) {
        siteDetails = await detailsResponse.json();
        console.log("SolarEdge details:", JSON.stringify(siteDetails));
      }
    } catch (err) {
      console.warn("Site details fetch error:", err);
    }

    // Extract key metrics from overview
    const overview = overviewData.overview || {};
    const lifetimeEnergyWh = (overview.lifeTimeData?.energy || 0); // Already in Wh
    const todayEnergyWh = (overview.lastDayData?.energy || 0);
    const currentPowerW = overview.currentPower?.power || 0;
    const monthEnergyWh = (overview.lastMonthData?.energy || 0);
    const yearEnergyWh = (overview.lastYearData?.energy || 0);

    // Get baseline from connected_devices to calculate pending
    let pendingSolarWh = lifetimeEnergyWh; // Default to lifetime if no baseline
    const { data: deviceData } = await supabaseClient
      .from("connected_devices")
      .select("baseline_data")
      .eq("user_id", user.id)
      .eq("device_id", siteId)
      .eq("provider", "solaredge")
      .single();
    
    if (deviceData?.baseline_data) {
      const baseline = deviceData.baseline_data as Record<string, number>;
      // Check all possible baseline keys used across the app
      const baselineSolarWh = baseline.solar_wh || baseline.solar_production_wh || baseline.total_solar_produced_wh || baseline.lifetime_solar_wh || 0;
      pendingSolarWh = Math.max(0, lifetimeEnergyWh - baselineSolarWh);
      console.log(`SolarEdge pending calculation: lifetime=${lifetimeEnergyWh}, baseline=${baselineSolarWh}, pending=${pendingSolarWh}`);
    }

    // Store production data for rewards calculation
    if (todayEnergyWh > 0) {
      const now = new Date();
      const recordedAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString();
      
      await supabaseClient
        .from("energy_production")
        .upsert({
          user_id: user.id,
          device_id: siteId,
          provider: "solaredge",
          production_wh: todayEnergyWh,
          recorded_at: recordedAt,
        }, { onConflict: "device_id,provider,recorded_at" });
    }

    // Store lifetime totals in connected_devices
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
        .eq("user_id", user.id)
        .eq("device_id", siteId)
        .eq("provider", "solaredge");
    }

    const responseData = {
      site: {
        id: siteId,
        name: siteDetails?.details?.name || extraData.site_name,
        status: siteDetails?.details?.status || extraData.site_status,
        peakPower: siteDetails?.details?.peakPower || extraData.peak_power,
        installationDate: siteDetails?.details?.installationDate || extraData.installation_date,
      },
      overview: {
        currentPowerW,
        todayEnergyWh,
        monthEnergyWh,
        yearEnergyWh,
        lifetimeEnergyWh,
        lastUpdateTime: overview.lastUpdateTime,
      },
      powerFlow: powerFlowData?.siteCurrentPowerFlow || null,
      totals: {
        lifetime_solar_wh: lifetimeEnergyWh,
        pending_solar_wh: pendingSolarWh,
        energy_today_wh: todayEnergyWh,
        current_power_w: currentPowerW,
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
      .eq("user_id", user.id)
      .eq("provider", "solaredge");
    
    console.log("Cached SolarEdge data for future requests");

    return new Response(JSON.stringify({
      ...responseData,
      cached: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("SolarEdge data error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch energy data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
