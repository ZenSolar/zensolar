import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3/authorize";
const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const TESLA_AUDIENCE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

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
    const action = body.action;
    console.log("Tesla auth action:", action);

    // Generate OAuth URL for user to authorize
    if (action === "get-auth-url") {
      const { redirectUri, state } = body;
      
      // Scopes based on Tesla Developer Portal configuration
      // Profile Information, Vehicle Information, Vehicle Charging Management, 
      // Energy Product Information, Energy Product Commands, Vehicle Specs
      const scopes = [
        "openid",
        "offline_access", 
        "user_data",
        "vehicle_device_data",
        "vehicle_charging_cmds",
        "energy_device_data",
        "energy_cmds"
      ].join(" ");
      
      const authUrl = new URL(TESLA_AUTH_URL);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("state", state);

      // Force Tesla to show the login screen (do not auto-use an existing Tesla session)
      authUrl.searchParams.set("prompt", "login");
      // Ensure Tesla prompts for any missing scopes and requires the full set we request
      authUrl.searchParams.set("prompt_missing_scopes", "true");
      authUrl.searchParams.set("require_requested_scopes", "true");

      return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange authorization code for tokens
    if (action === "exchange-code") {
      const { code, redirectUri } = body;

      const tokenResponse = await fetch(TESLA_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code,
          audience: TESLA_AUDIENCE,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Tesla token exchange failed:", errorText);
        return new Response(JSON.stringify({ error: "Token exchange failed. Please try again." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();
      console.log("Tesla tokens received:", { 
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in
      });

      // Store tokens in database
      const expiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      const { error: tokenStoreError } = await supabaseClient
        .from("energy_tokens")
        .upsert({
          user_id: user.id,
          provider: "tesla",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: expiresAt,
          extra_data: null
        }, { onConflict: "user_id,provider" });

      if (tokenStoreError) {
        console.error("Failed to store Tesla tokens:", tokenStoreError);
      }

      // Note: Don't mark tesla_connected here - that happens when devices are claimed
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Tesla authorization successful - please select your devices",
        needsDeviceSelection: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh access token
    if (action === "refresh-token") {
      const { refreshToken } = body;

      const tokenResponse = await fetch(TESLA_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: clientId,
          refresh_token: refreshToken,
        }),
      });

      if (!tokenResponse.ok) {
        return new Response(JSON.stringify({ error: "Token refresh failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();
      return new Response(JSON.stringify({ success: true, tokens }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Tesla auth error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
