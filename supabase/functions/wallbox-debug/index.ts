import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-target-user-id",
};

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

    // Check for admin override
    let targetUserId = user.id;
    const targetUserIdHeader = req.headers.get("X-Target-User-Id");
    
    if (targetUserIdHeader && targetUserIdHeader !== user.id) {
      const { data: isAdmin } = await supabaseClient.rpc('is_admin', { _user_id: user.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin access required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      targetUserId = targetUserIdHeader;
      console.log(`Admin ${user.id} debugging Wallbox for user ${targetUserId}`);
    }

    // Get stored Wallbox tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("provider", "wallbox")
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Wallbox not connected" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = tokenData.access_token;
    const allEndpointResults: Record<string, any> = {};

    // Helper to call an endpoint and capture raw response
    async function callEndpoint(name: string, url: string, method = "GET", body?: any): Promise<any> {
      try {
        console.log(`Calling ${name}: ${url}`);
        const options: RequestInit = {
          method,
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(url, options);
        const status = response.status;
        const statusText = response.statusText;
        
        let data: any = null;
        let rawText = "";
        try {
          rawText = await response.text();
          data = JSON.parse(rawText);
        } catch {
          data = rawText;
        }
        
        return { status, statusText, data, url };
      } catch (error) {
        return { error: String(error), url };
      }
    }

    // 1. First get charger IDs from groups
    console.log("=== WALLBOX DEBUG: Calling all endpoints ===");
    
    const groupsResult = await callEndpoint("groups", `${WALLBOX_API_BASE}/v3/chargers/groups`);
    allEndpointResults["GET /v3/chargers/groups"] = groupsResult;
    
    // Extract charger IDs
    const chargerIds: number[] = [];
    if (groupsResult?.data?.result?.groups) {
      for (const group of groupsResult.data.result.groups) {
        for (const charger of (group?.chargers || [])) {
          if (charger?.id) {
            chargerIds.push(charger.id);
          }
        }
      }
    }
    
    console.log(`Found charger IDs: ${chargerIds.join(", ")}`);
    allEndpointResults["_charger_ids"] = chargerIds;

    // 2. Call user-level endpoints (not per-charger)
    allEndpointResults["GET /v3/users/me"] = await callEndpoint("users/me", `${WALLBOX_API_BASE}/v3/users/me`);
    allEndpointResults["GET /v4/users/profile"] = await callEndpoint("users/profile", `${WALLBOX_API_BASE}/v4/users/profile`);
    allEndpointResults["GET /v3/user"] = await callEndpoint("user", `${WALLBOX_API_BASE}/v3/user`);

    // 3. For each charger, call ALL known endpoints
    for (const chargerId of chargerIds) {
      const chargerKey = `charger_${chargerId}`;
      allEndpointResults[chargerKey] = {};
      
      // Basic info endpoints
      allEndpointResults[chargerKey]["GET /v2/charger/{id}"] = await callEndpoint(
        "v2/charger", 
        `${WALLBOX_API_BASE}/v2/charger/${chargerId}`
      );
      
      // Status endpoint (PUT is used to GET data per docs)
      allEndpointResults[chargerKey]["PUT /v2/charger/{id}"] = await callEndpoint(
        "v2/charger PUT", 
        `${WALLBOX_API_BASE}/v2/charger/${chargerId}`,
        "PUT"
      );
      
      // Status endpoint (different from /v2/charger)
      allEndpointResults[chargerKey]["GET /chargers/status/{id}"] = await callEndpoint(
        "chargers/status", 
        `${WALLBOX_API_BASE}/chargers/status/${chargerId}`
      );
      
      // Config endpoint
      allEndpointResults[chargerKey]["GET /chargers/config/{id}"] = await callEndpoint(
        "chargers/config", 
        `${WALLBOX_API_BASE}/chargers/config/${chargerId}`
      );
      
      // V3 charger endpoints
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}"] = await callEndpoint(
        "v3/chargers", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}`
      );
      
      // V4 charger endpoints
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}"] = await callEndpoint(
        "v4/chargers", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}`
      );
      
      // Eco-smart mode
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}/eco-smart"] = await callEndpoint(
        "eco-smart", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/eco-smart`
      );
      
      // Sessions endpoints - try multiple date ranges
      const now = Math.floor(Date.now() / 1000);
      const oneMonthAgo = now - (30 * 24 * 60 * 60);
      const oneYearAgo = now - (365 * 24 * 60 * 60);
      const fiveYearsAgo = now - (5 * 365 * 24 * 60 * 60);
      const tenYearsAgo = now - (10 * 365 * 24 * 60 * 60);
      
      // V4 sessions stats (this should have historical data)
      allEndpointResults[chargerKey]["GET /v4/sessions/stats (1 month)"] = await callEndpoint(
        "v4/sessions/stats 1mo", 
        `${WALLBOX_API_BASE}/v4/sessions/stats?charger=${chargerId}&start_date=${oneMonthAgo}&end_date=${now}&limit=10000`
      );
      
      allEndpointResults[chargerKey]["GET /v4/sessions/stats (1 year)"] = await callEndpoint(
        "v4/sessions/stats 1yr", 
        `${WALLBOX_API_BASE}/v4/sessions/stats?charger=${chargerId}&start_date=${oneYearAgo}&end_date=${now}&limit=10000`
      );
      
      allEndpointResults[chargerKey]["GET /v4/sessions/stats (5 years)"] = await callEndpoint(
        "v4/sessions/stats 5yr", 
        `${WALLBOX_API_BASE}/v4/sessions/stats?charger=${chargerId}&start_date=${fiveYearsAgo}&end_date=${now}&limit=10000`
      );
      
      allEndpointResults[chargerKey]["GET /v4/sessions/stats (10 years)"] = await callEndpoint(
        "v4/sessions/stats 10yr", 
        `${WALLBOX_API_BASE}/v4/sessions/stats?charger=${chargerId}&start_date=${tenYearsAgo}&end_date=${now}&limit=10000`
      );
      
      // Try sessions list endpoint
      allEndpointResults[chargerKey]["GET /v4/sessions (5 years)"] = await callEndpoint(
        "v4/sessions 5yr", 
        `${WALLBOX_API_BASE}/v4/sessions?charger=${chargerId}&start_date=${fiveYearsAgo}&end_date=${now}&limit=10000`
      );
      
      // Try v3 sessions
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/sessions"] = await callEndpoint(
        "v3/chargers/sessions", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/sessions`
      );
      
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/sessions?limit=10000"] = await callEndpoint(
        "v3/chargers/sessions limit", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/sessions?limit=10000`
      );
      
      // Statistics/analytics endpoints
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/statistics"] = await callEndpoint(
        "v3/chargers/statistics", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/statistics`
      );
      
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}/statistics"] = await callEndpoint(
        "v4/chargers/statistics", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/statistics`
      );
      
      // Energy data endpoints
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/energy"] = await callEndpoint(
        "v3/chargers/energy", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/energy`
      );
      
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}/energy"] = await callEndpoint(
        "v4/chargers/energy", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/energy`
      );
      
      // History endpoints
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/history"] = await callEndpoint(
        "v3/chargers/history", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/history`
      );
      
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}/history"] = await callEndpoint(
        "v4/chargers/history", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/history`
      );
      
      // Usage / consumption endpoints
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/consumption"] = await callEndpoint(
        "v3/chargers/consumption", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/consumption`
      );
      
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/usage"] = await callEndpoint(
        "v3/chargers/usage", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/usage`
      );
      
      // Reports endpoints
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/reports"] = await callEndpoint(
        "v3/chargers/reports", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/reports`
      );
      
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}/reports"] = await callEndpoint(
        "v4/chargers/reports", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/reports`
      );
      
      // Resume/summary endpoint
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/resume"] = await callEndpoint(
        "v3/chargers/resume", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/resume`
      );
      
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}/resume"] = await callEndpoint(
        "v4/chargers/resume", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/resume`
      );
      
      // Data endpoints with different paths
      allEndpointResults[chargerKey]["GET /chargers/{id}/data"] = await callEndpoint(
        "chargers/data", 
        `${WALLBOX_API_BASE}/chargers/${chargerId}/data`
      );
      
      allEndpointResults[chargerKey]["GET /chargers/{id}/sessions"] = await callEndpoint(
        "chargers/sessions", 
        `${WALLBOX_API_BASE}/chargers/${chargerId}/sessions`
      );
      
      // Lifetime/totals endpoints
      allEndpointResults[chargerKey]["GET /chargers/{id}/totals"] = await callEndpoint(
        "chargers/totals", 
        `${WALLBOX_API_BASE}/chargers/${chargerId}/totals`
      );
      
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/totals"] = await callEndpoint(
        "v3/chargers/totals", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/totals`
      );
      
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}/totals"] = await callEndpoint(
        "v4/chargers/totals", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/totals`
      );
      
      // Power data
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/power"] = await callEndpoint(
        "v3/chargers/power", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/power`
      );
      
      // Live data
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/live"] = await callEndpoint(
        "v3/chargers/live", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/live`
      );
      
      // Users on this charger
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/users"] = await callEndpoint(
        "v3/chargers/users", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/users`
      );
      
      // Analytics
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/analytics"] = await callEndpoint(
        "v3/chargers/analytics", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/analytics`
      );
      
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}/analytics"] = await callEndpoint(
        "v4/chargers/analytics", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/analytics`
      );
      
      // Charging records
      allEndpointResults[chargerKey]["GET /v3/chargers/{id}/charging-records"] = await callEndpoint(
        "v3/chargers/charging-records", 
        `${WALLBOX_API_BASE}/v3/chargers/${chargerId}/charging-records`
      );
      
      // Monthly summary
      allEndpointResults[chargerKey]["GET /v4/chargers/{id}/monthly-summary"] = await callEndpoint(
        "v4/chargers/monthly-summary", 
        `${WALLBOX_API_BASE}/v4/chargers/${chargerId}/monthly-summary`
      );
    }

    // Summary of what worked vs failed
    const summary = {
      successfulEndpoints: [] as string[],
      failedEndpoints: [] as string[],
      endpointsWithData: [] as string[],
    };

    function analyzeSummary(results: Record<string, any>, prefix = "") {
      for (const [key, value] of Object.entries(results)) {
        if (key.startsWith("_")) continue;
        
        const fullKey = prefix ? `${prefix} > ${key}` : key;
        
        if (typeof value === "object" && !value?.status && !value?.error && !value?.url) {
          // Nested object (per-charger results)
          analyzeSummary(value, fullKey);
        } else if (value?.status) {
          if (value.status >= 200 && value.status < 300) {
            summary.successfulEndpoints.push(fullKey);
            // Check if it has meaningful data
            if (value.data && typeof value.data === "object" && Object.keys(value.data).length > 0) {
              summary.endpointsWithData.push(fullKey);
            }
          } else {
            summary.failedEndpoints.push(`${fullKey} (${value.status})`);
          }
        }
      }
    }

    analyzeSummary(allEndpointResults);

    console.log("=== WALLBOX DEBUG COMPLETE ===");
    console.log(`Successful: ${summary.successfulEndpoints.length}, Failed: ${summary.failedEndpoints.length}`);

    return new Response(JSON.stringify({
      debug: true,
      timestamp: new Date().toISOString(),
      targetUserId,
      summary,
      endpoints: allEndpointResults,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Wallbox debug error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
