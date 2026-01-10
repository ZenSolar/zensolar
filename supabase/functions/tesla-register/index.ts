import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const TESLA_FLEET_API = "https://fleet-api.prd.na.vn.cloud.tesla.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user is admin
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

    // Check if user is admin using the has_role function
    const { data: isAdminUser, error: adminError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (adminError || !isAdminUser) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("TESLA_CLIENT_ID");
    const clientSecret = Deno.env.get("TESLA_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("Tesla credentials missing");
      return new Response(JSON.stringify({ error: "Tesla credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, domain } = body;
    console.log("Tesla register action:", action);

    // Step 1: Get Partner Token (client_credentials grant)
    if (action === "get-partner-token") {
      console.log("Getting partner token...");
      
      const tokenResponse = await fetch(TESLA_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "openid vehicle_device_data vehicle_cmds vehicle_charging_cmds energy_device_data energy_cmds",
          audience: TESLA_FLEET_API,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Partner token request failed:", errorText);
        return new Response(JSON.stringify({ 
          error: "Failed to get partner token. Please check your Tesla credentials."
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();
      console.log("Partner token received:", { 
        hasAccessToken: !!tokens.access_token,
        expiresIn: tokens.expires_in
      });

      return new Response(JSON.stringify({ 
        success: true, 
        partnerToken: tokens.access_token,
        expiresIn: tokens.expires_in
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Register with Tesla Fleet API
    if (action === "register") {
      const { partnerToken } = body;
      
      if (!partnerToken) {
        return new Response(JSON.stringify({ error: "Partner token required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!domain) {
        return new Response(JSON.stringify({ error: "Domain required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Sanitize domain: remove https://, http://, paths, and ensure lowercase
      const cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .split('/')[0]
        .toLowerCase()
        .trim();

      console.log("Registering with Tesla Fleet API for domain:", cleanDomain);

      const registerResponse = await fetch(`${TESLA_FLEET_API}/api/1/partner_accounts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${partnerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain: cleanDomain }),
      });

      const registerResult = await registerResponse.text();
      console.log("Registration response:", registerResponse.status, registerResult);

      if (!registerResponse.ok) {
        console.error("Registration failed:", registerResult);
        return new Response(JSON.stringify({ 
          error: "Registration failed. Please check your domain and Tesla configuration.",
          status: registerResponse.status
        }), {
          status: registerResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Successfully registered with Tesla Fleet API",
        result: JSON.parse(registerResult)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Check registration status
    if (action === "check-registration") {
      const { partnerToken } = body;
      
      if (!partnerToken || !domain) {
        return new Response(JSON.stringify({ error: "Partner token and domain required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Checking registration for domain:", domain);

      const checkResponse = await fetch(
        `${TESLA_FLEET_API}/api/1/partner_accounts/public_key?domain=${encodeURIComponent(domain)}`,
        {
          headers: {
            "Authorization": `Bearer ${partnerToken}`,
          },
        }
      );

      const checkResult = await checkResponse.text();
      console.log("Check registration response:", checkResponse.status, checkResult);

      return new Response(JSON.stringify({ 
        registered: checkResponse.ok,
        status: checkResponse.status,
        result: checkResponse.ok ? JSON.parse(checkResult) : checkResult
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Tesla register error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
