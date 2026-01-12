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

    const clientId = Deno.env.get("ENPHASE_CLIENT_ID");
    const clientSecret = Deno.env.get("ENPHASE_CLIENT_SECRET");
    const apiKey = Deno.env.get("ENPHASE_API_KEY");

    if (!clientId || !clientSecret) {
      console.error("Enphase credentials missing");
      return new Response(JSON.stringify({ error: "Enphase credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action;
    console.log("Enphase auth action:", action);

    // Generate OAuth URL for user to authorize (uses Enphase default redirect)
    if (action === "get-auth-url") {
      // Enphase requires using their default redirect URI for apps without public endpoints
      const enphaseDefaultRedirect = "https://api.enphaseenergy.com/oauth/redirect_uri";
      
      const authUrl = new URL(ENPHASE_AUTH_URL);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", enphaseDefaultRedirect);

      return new Response(JSON.stringify({ 
        authUrl: authUrl.toString(),
        useManualCode: true // Indicates user must manually copy the code
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange authorization code for tokens
    if (action === "exchange-code") {
      const { code } = body;
      
      // Must use the same redirect URI that was used for authorization
      const enphaseDefaultRedirect = "https://api.enphaseenergy.com/oauth/redirect_uri";

      // Create Basic auth header: base64(client_id:client_secret)
      const credentials = btoa(`${clientId}:${clientSecret}`);

      const tokenUrl = new URL(ENPHASE_TOKEN_URL);
      tokenUrl.searchParams.set("grant_type", "authorization_code");
      tokenUrl.searchParams.set("redirect_uri", enphaseDefaultRedirect);
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
        return new Response(JSON.stringify({ error: "Token exchange failed. Please try again." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();
      console.log("Enphase tokens received:", { 
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in
      });

      // Store tokens in database
      const expiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      const { error: tokenError } = await supabaseClient
        .from("energy_tokens")
        .upsert({
          user_id: user.id,
          provider: "enphase",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: expiresAt,
          extra_data: { system_id: tokens.system_id || null }
        }, { onConflict: "user_id,provider" });

      if (tokenError) {
        console.error("Failed to store tokens:", tokenError);
      }

      // Update user profile to mark Enphase as connected
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ enphase_connected: true })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
      }

      // Notify admins of the new account connection
      try {
        const notifyUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-account-connected`;
        await fetch(notifyUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            user_email: user.email,
            provider: "enphase",
          }),
        });
        console.log("Sent Enphase account connected notification to admins");
      } catch (notifyError) {
        console.error("Failed to send account connected notification:", notifyError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Enphase account connected successfully",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh access token
    if (action === "refresh-token") {
      const { refreshToken } = body;
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
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
