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

    if (!resp.ok) return null;

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
  } catch {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
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

    // Get connected Enphase devices (system IDs)
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

    // Fetch inverter summary for each system
    const allInverters: any[] = [];

    for (const device of devices) {
      const systemId = String(device.device_id);
      const url = `${ENPHASE_API_BASE}/systems/${systemId}/inverters_summary_by_envoy_or_site?key=${apiKey}`;

      console.log(`Fetching inverter summary for system ${systemId}...`);

      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`Failed for system ${systemId}: ${resp.status} ${errText}`);
        continue;
      }

      const data = await resp.json();
      // Response shape: { micro_inverters: [...] } or array directly
      const inverters = data.micro_inverters || data || [];

      for (const inv of inverters) {
        allInverters.push({
          serial_number: inv.serial_number || inv.id?.toString() || "unknown",
          model: inv.model_name || inv.model || "Unknown",
          status: inv.status || "unknown",
          last_report_date: inv.last_report_date || null,
          last_report_watts: inv.last_report_watts ?? 0,
          energy_wh: inv.energy?.value ?? 0,
          energy_units: inv.energy?.units || "Wh",
          system_id: systemId,
          system_name: device.device_name || "Enphase System",
        });
      }
    }

    // Sort by serial number for consistent ordering
    allInverters.sort((a, b) => a.serial_number.localeCompare(b.serial_number));

    // Compute summary stats
    const totalEnergyWh = allInverters.reduce((sum, inv) => sum + inv.energy_wh, 0);
    const avgEnergyWh = allInverters.length > 0 ? totalEnergyWh / allInverters.length : 0;
    const bestInverter = allInverters.reduce((best, inv) => 
      inv.energy_wh > (best?.energy_wh || 0) ? inv : best, null as any);
    const worstInverter = allInverters.reduce((worst, inv) => 
      (worst === null || inv.energy_wh < worst.energy_wh) ? inv : worst, null as any);

    return new Response(JSON.stringify({
      inverters: allInverters,
      summary: {
        total_panels: allInverters.length,
        total_energy_wh: totalEnergyWh,
        avg_energy_wh: Math.round(avgEnergyWh),
        best_serial: bestInverter?.serial_number,
        worst_serial: worstInverter?.serial_number,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Enphase inverters error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch inverter data" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
