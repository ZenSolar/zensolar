import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Wallbox API endpoints (community-documented)
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

    const body = await req.json();
    const action = body.action;
    console.log("Wallbox auth action:", action);

    // Authenticate with Wallbox using email/password
    if (action === "authenticate") {
      const { email, password } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create Basic auth header: base64(email:password)
      const credentials = btoa(`${email}:${password}`);

      console.log("Attempting Wallbox authentication for:", email);

      const authResponse = await fetch(`${WALLBOX_API_BASE}/auth/token/user`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error("Wallbox auth failed:", authResponse.status, errorText);
        
        if (authResponse.status === 401) {
          return new Response(JSON.stringify({ error: "Invalid email or password" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ error: "Authentication failed. Please try again." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const authData = await authResponse.json();
      console.log("Wallbox auth successful, has JWT:", !!authData.jwt);

      if (!authData.jwt) {
        return new Response(JSON.stringify({ error: "No token received from Wallbox" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Store the JWT token in the database
      const { error: tokenError } = await supabaseClient
        .from("energy_tokens")
        .upsert({
          user_id: user.id,
          provider: "wallbox",
          access_token: authData.jwt,
          refresh_token: authData.refresh_token || null,
          expires_at: authData.ttl 
            ? new Date(Date.now() + authData.ttl * 1000).toISOString() 
            : null,
          extra_data: { 
            user_id: authData.user_id,
            email: email 
          }
        }, { onConflict: "user_id,provider" });

      if (tokenError) {
        console.error("Failed to store Wallbox tokens:", tokenError);
      }

      // Update user profile to mark Wallbox as connected
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ wallbox_connected: true })
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
            provider: "wallbox",
          }),
        });
        console.log("Sent Wallbox account connected notification to admins");
      } catch (notifyError) {
        console.error("Failed to send account connected notification:", notifyError);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Wallbox account connected successfully",
        userId: authData.user_id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh the access token
    if (action === "refresh-token") {
      const { refreshToken } = body;

      const refreshResponse = await fetch(`${WALLBOX_API_BASE}/auth/token/refresh`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${refreshToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!refreshResponse.ok) {
        return new Response(JSON.stringify({ error: "Token refresh failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await refreshResponse.json();
      return new Response(JSON.stringify({ success: true, tokens }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Wallbox auth error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
