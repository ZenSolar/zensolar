import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SOLAREDGE_API_BASE = "https://monitoringapi.solaredge.com";

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

    const body = await req.json();
    const { action, apiKey, siteId } = body;

    if (action === "validate-and-store") {
      if (!apiKey || !siteId) {
        return new Response(JSON.stringify({ error: "API key and Site ID are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate API key by fetching site details
      console.log(`Validating SolarEdge API key for site ${siteId}...`);
      const validateUrl = `${SOLAREDGE_API_BASE}/site/${siteId}/details?api_key=${apiKey}`;
      
      const validateResponse = await fetch(validateUrl);
      
      if (!validateResponse.ok) {
        const errorText = await validateResponse.text();
        console.error("SolarEdge validation failed:", validateResponse.status, errorText);
        
        if (validateResponse.status === 403) {
          return new Response(JSON.stringify({ 
            error: "Invalid API key or Site ID. Please check your credentials." 
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ 
          error: "Failed to validate SolarEdge credentials" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const siteDetails = await validateResponse.json();
      console.log("SolarEdge site validated:", siteDetails.details?.name);

      // Store the credentials - using access_token field for API key
      // and extra_data for site-specific information
      const { error: upsertError } = await supabaseClient
        .from("energy_tokens")
        .upsert({
          user_id: user.id,
          provider: "solaredge",
          access_token: apiKey,
          refresh_token: null, // SolarEdge doesn't use refresh tokens
          expires_at: null, // API keys don't expire
          extra_data: {
            site_id: siteId,
            site_name: siteDetails.details?.name,
            site_status: siteDetails.details?.status,
            peak_power: siteDetails.details?.peakPower,
            installation_date: siteDetails.details?.installationDate,
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,provider" });

      if (upsertError) {
        console.error("Failed to store SolarEdge credentials:", upsertError);
        return new Response(JSON.stringify({ error: "Failed to store credentials" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile to mark SolarEdge as connected
      await supabaseClient
        .from("profiles")
        .update({ solaredge_connected: true })
        .eq("user_id", user.id);

      console.log("SolarEdge credentials stored successfully for user:", user.id);

      return new Response(JSON.stringify({ 
        success: true,
        site: {
          id: siteId,
          name: siteDetails.details?.name,
          status: siteDetails.details?.status,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("SolarEdge auth error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
