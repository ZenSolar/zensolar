import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENPHASE_API_BASE = "https://api.enphaseenergy.com/api/v4";

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

    const apiKey = Deno.env.get("ENPHASE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Enphase API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's Enphase tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "enphase")
      .single();

    if (tokenError || !tokenData) {
      console.error("No Enphase tokens found:", tokenError);
      return new Response(JSON.stringify({ error: "Enphase not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = tokenData.access_token;

    // First, get list of systems
    const systemsResponse = await fetch(`${ENPHASE_API_BASE}/systems?key=${apiKey}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!systemsResponse.ok) {
      const errorText = await systemsResponse.text();
      console.error("Failed to fetch Enphase systems:", errorText);
      return new Response(JSON.stringify({ error: "Failed to fetch systems", details: errorText }), {
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

    return new Response(JSON.stringify({
      system: systemsData.systems[0],
      summary: summaryData,
      energy: energyData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Enphase data error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
