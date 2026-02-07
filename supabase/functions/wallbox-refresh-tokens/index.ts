import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Get all Wallbox tokens that have stored credentials (refresh_token is not null)
    const { data: wallboxTokens, error: fetchError } = await supabaseClient
      .from("energy_tokens")
      .select("user_id, access_token, refresh_token, expires_at, extra_data, updated_at")
      .eq("provider", "wallbox")
      .not("refresh_token", "is", null);

    if (fetchError) {
      console.error("Failed to fetch Wallbox tokens:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch tokens" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!wallboxTokens || wallboxTokens.length === 0) {
      console.log("No Wallbox tokens with stored credentials found");
      return new Response(JSON.stringify({ success: true, refreshed: 0, total: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${wallboxTokens.length} Wallbox tokens to check`);

    let refreshed = 0;
    let failed = 0;
    let skipped = 0;

    for (const token of wallboxTokens) {
      // Refresh if token was last updated more than 10 days ago
      const lastUpdated = new Date(token.updated_at);
      const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate < 10) {
        skipped++;
        continue;
      }

      console.log(`Refreshing token for user ${token.user_id} (${daysSinceUpdate.toFixed(1)} days old)`);

      try {
        const { e: email, p: password } = JSON.parse(atob(token.refresh_token));
        const credentials = btoa(`${email}:${password}`);

        const authResponse = await fetch(`${WALLBOX_API_BASE}/auth/token/user`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${credentials}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        });

        if (!authResponse.ok) {
          console.error(`Refresh failed for user ${token.user_id}: ${authResponse.status}`);
          failed++;
          continue;
        }

        const authData = await authResponse.json();
        if (!authData.jwt) {
          console.error(`No JWT in refresh response for user ${token.user_id}`);
          failed++;
          continue;
        }

        await supabaseClient
          .from("energy_tokens")
          .update({
            access_token: authData.jwt,
            expires_at: authData.ttl
              ? new Date(Date.now() + authData.ttl * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", token.user_id)
          .eq("provider", "wallbox");

        console.log(`Token refreshed for user ${token.user_id}`);
        refreshed++;
      } catch (err) {
        console.error(`Error refreshing token for user ${token.user_id}:`, err);
        failed++;
      }
    }

    const summary = { success: true, total: wallboxTokens.length, refreshed, failed, skipped };
    console.log("Wallbox token refresh complete:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Wallbox refresh tokens error:", error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
