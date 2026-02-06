import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENPHASE_API_BASE = "https://api.enphaseenergy.com/api/v4";
const ENPHASE_TOKEN_URL = "https://api.enphaseenergy.com/oauth/token";

async function refreshEnphaseToken(
  supabaseClient: any,
  userId: string,
  refreshToken: string
): Promise<string | null> {
  const clientId = Deno.env.get("ENPHASE_CLIENT_ID");
  const clientSecret = Deno.env.get("ENPHASE_CLIENT_SECRET");

  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const credentials = btoa(`${clientId}:${clientSecret}`);
    const tokenUrl = new URL(ENPHASE_TOKEN_URL);
    tokenUrl.searchParams.set("grant_type", "refresh_token");
    tokenUrl.searchParams.set("refresh_token", refreshToken);

    const resp = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: { Authorization: `Basic ${credentials}` },
    });

    if (!resp.ok) {
      console.error("Token refresh failed:", await resp.text());
      return null;
    }

    const tokens = await resp.json();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    await supabaseClient
      .from("energy_tokens")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "enphase");

    return tokens.access_token;
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

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

    // Get Enphase tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "enphase")
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Enphase not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenData.access_token;

    // Refresh if needed
    if (tokenData.expires_at) {
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
        const newToken = await refreshEnphaseToken(supabaseClient, user.id, tokenData.refresh_token);
        if (newToken) {
          accessToken = newToken;
        } else {
          return new Response(JSON.stringify({ error: "Token expired", needsReauth: true }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Get connected Enphase devices
    const { data: devices } = await supabaseClient
      .from("connected_devices")
      .select("device_id, device_name")
      .eq("user_id", user.id)
      .eq("provider", "enphase");

    if (!devices || devices.length === 0) {
      return new Response(JSON.stringify({ error: "No Enphase devices found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalDaysImported = 0;
    let totalRecordsInserted = 0;
    const systemResults: Array<{ system_id: string; name: string; days_imported: number; start_date: string; end_date: string }> = [];

    for (const device of devices) {
      const systemId = String(device.device_id);
      console.log(`Fetching energy_lifetime for system ${systemId}...`);

      // The energy_lifetime endpoint returns daily production for the entire system lifetime
      // No date range restrictions!
      const url = `${ENPHASE_API_BASE}/systems/${systemId}/energy_lifetime?key=${apiKey}&production=all`;

      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (resp.status === 429) {
        console.warn("Rate limited by Enphase API");
        return new Response(JSON.stringify({
          error: "Rate limited by Enphase. Please try again in 15 minutes.",
          partial: true,
          systems_completed: systemResults,
          total_days_imported: totalDaysImported,
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`Failed to fetch energy_lifetime for ${systemId}:`, errorText);
        continue;
      }

      const data = await resp.json();
      // energy_lifetime returns: { system_id, start_date, production: [wh_day1, wh_day2, ...] }
      const startDate = data.start_date; // "YYYY-MM-DD"
      const production: number[] = data.production || [];

      if (!startDate || production.length === 0) {
        console.log(`No historical data for system ${systemId}`);
        continue;
      }

      console.log(`System ${systemId}: ${production.length} days of data starting from ${startDate}`);

      // Build records in batches
      const batchSize = 500;
      const records: Array<{
        user_id: string;
        device_id: string;
        provider: string;
        production_wh: number;
        recorded_at: string;
      }> = [];

      const start = new Date(startDate + "T12:00:00Z"); // noon UTC to avoid timezone issues

      for (let i = 0; i < production.length; i++) {
        const dayDate = new Date(start);
        dayDate.setDate(dayDate.getDate() + i);
        const whValue = production[i];

        // Skip days with 0 or negative production
        if (whValue <= 0) continue;

        records.push({
          user_id: user.id,
          device_id: systemId,
          provider: "enphase",
          production_wh: whValue,
          recorded_at: dayDate.toISOString(),
        });
      }

      // Upsert in batches
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error: upsertError } = await supabaseClient
          .from("energy_production")
          .upsert(batch, { onConflict: "device_id,provider,recorded_at" });

        if (upsertError) {
          console.error(`Upsert error for batch starting at ${i}:`, upsertError);
        } else {
          totalRecordsInserted += batch.length;
        }
      }

      const endDate = new Date(start);
      endDate.setDate(endDate.getDate() + production.length - 1);

      totalDaysImported += records.length;
      systemResults.push({
        system_id: systemId,
        name: device.device_name || "Enphase System",
        days_imported: records.length,
        start_date: startDate,
        end_date: endDate.toISOString().split("T")[0],
      });
    }

    console.log(`Historical import complete: ${totalDaysImported} days, ${totalRecordsInserted} records`);

    return new Response(JSON.stringify({
      success: true,
      total_days_imported: totalDaysImported,
      total_records_inserted: totalRecordsInserted,
      systems: systemResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Historical import error:", error);
    return new Response(JSON.stringify({ error: "Failed to import historical data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
