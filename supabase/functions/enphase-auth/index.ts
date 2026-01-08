import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENPHASE_AUTH_URL = "https://api.enphaseenergy.com/oauth/authorize";
const ENPHASE_TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";

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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const clientId = Deno.env.get("ENPHASE_CLIENT_ID");
    const clientSecret = Deno.env.get("ENPHASE_CLIENT_SECRET");
    const apiKey = Deno.env.get("ENPHASE_API_KEY");

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "Enphase credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate OAuth URL for user to authorize
    if (action === "get-auth-url") {
      const { redirectUri } = await req.json();
      
      const authUrl = new URL(ENPHASE_AUTH_URL);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);

      return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange authorization code for tokens
    if (action === "exchange-code") {
      const { code, redirectUri } = await req.json();

      // Create Basic auth header: base64(client_id:client_secret)
      const credentials = btoa(`${clientId}:${clientSecret}`);

      const tokenUrl = new URL(ENPHASE_TOKEN_URL);
      tokenUrl.searchParams.set("grant_type", "authorization_code");
      tokenUrl.searchParams.set("redirect_uri", redirectUri);
      tokenUrl.searchParams.set("code", code);

      const tokenResponse = await fetch(tokenUrl.toString(), {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
        },
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Enphase token exchange failed:", errorText);
        return new Response(JSON.stringify({ error: "Token exchange failed", details: errorText }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();

      // Update user profile to mark Enphase as connected
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ enphase_connected: true })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
      }

      // In production, store tokens securely (encrypted in database)
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Enphase account connected successfully",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh access token
    if (action === "refresh-token") {
      const { refreshToken } = await req.json();
      const credentials = btoa(`${clientId}:${clientSecret}`);

      const tokenUrl = new URL(ENPHASE_TOKEN_URL);
      tokenUrl.searchParams.set("grant_type", "refresh_token");
      tokenUrl.searchParams.set("refresh_token", refreshToken);

      const tokenResponse = await fetch(tokenUrl.toString(), {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
        },
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
    console.error("Enphase auth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
