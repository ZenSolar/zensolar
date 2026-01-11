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

    // Fetch user's chargers list
    console.log("Fetching Wallbox chargers list");
    const chargersResponse = await fetch(`${WALLBOX_USER_API}/users/${tokenData.extra_data?.user_id}/chargers`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (!chargersResponse.ok) {
      const errorText = await chargersResponse.text();
      console.error("Wallbox chargers fetch failed:", chargersResponse.status, errorText);
      
      if (chargersResponse.status === 401) {
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

    const chargersData = await chargersResponse.json();
    console.log("Wallbox chargers data received:", { 
      chargerCount: chargersData?.data?.length || 0 
    });

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
    for (const charger of (chargersData?.data || [])) {
      const chargerId = charger.id;
      
      // Get charger status
      const statusResponse = await fetch(`${WALLBOX_API_BASE}/chargers/status/${chargerId}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        
        // Get session history for last 30 days
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const sessionsResponse = await fetch(
          `${WALLBOX_API_BASE}/chargers/${chargerId}/sessions?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Accept": "application/json",
            },
          }
        );

        let sessionEnergy = 0;
        let sessionCount = 0;

        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          sessionCount = sessionsData?.data?.length || 0;
          
          // Sum up energy from all sessions
          for (const session of (sessionsData?.data || [])) {
            sessionEnergy += session.energy || 0;
          }
        }

        totalEnergyKwh += statusData.added_energy || sessionEnergy / 1000;
        totalSessions += sessionCount;

        chargerDetails.push({
          id: chargerId,
          name: statusData.name || `Charger ${chargerId}`,
          status: statusData.status_description || 'Unknown',
          addedEnergy: statusData.added_energy || sessionEnergy / 1000,
          addedRange: statusData.added_range || 0,
        });
      }
    }

    // Store energy production data
    const { error: insertError } = await supabaseClient
      .from("energy_production")
      .insert({
        user_id: user.id,
        provider: "wallbox",
        device_id: chargerDetails[0]?.id?.toString() || "unknown",
        production_wh: 0, // Wallbox doesn't produce energy, only consumes
        consumption_wh: totalEnergyKwh * 1000, // Convert kWh to Wh
        recorded_at: new Date().toISOString(),
      });

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
