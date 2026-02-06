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

async function getAuthenticatedUser(supabaseClient: any, req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

async function getAccessToken(supabaseClient: any, userId: string) {
  const { data: tokenData, error } = await supabaseClient
    .from("energy_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "enphase")
    .single();

  if (error || !tokenData) return { accessToken: null, error: "Enphase not connected" };

  let accessToken = tokenData.access_token;

  if (tokenData.expires_at) {
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      const newToken = await refreshEnphaseToken(supabaseClient, userId, tokenData.refresh_token);
      if (newToken) {
        accessToken = newToken;
      } else {
        return { accessToken: null, error: "Token expired", needsReauth: true };
      }
    }
  }

  return { accessToken, error: null };
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

    const user = await getAuthenticatedUser(supabaseClient, req);
    if (!user) {
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

    const { accessToken, error: tokenError, ...tokenExtra } = await getAccessToken(supabaseClient, user.id);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: tokenError, ...tokenExtra }), {
        status: tokenError === "Token expired" ? 401 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Fetch data for each system
    const arrays: any[] = [];
    const allInverters: any[] = [];
    let systemSizeW = 0;

    for (const device of devices) {
      const systemId = String(device.device_id);

      const [sysResp, invResp] = await Promise.all([
        fetch(`${ENPHASE_API_BASE}/systems/${systemId}?key=${apiKey}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${ENPHASE_API_BASE}/systems/inverters_summary_by_envoy_or_site?key=${apiKey}&site_id=${systemId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      // Parse system size
      if (sysResp.ok) {
        const sysData = await sysResp.json();
        const size = sysData.system_size;
        if (size && size > 0) systemSizeW += size;
      } else {
        await sysResp.text();
      }

      // Parse inverters grouped by envoy (array)
      if (!invResp.ok) {
        const errText = await invResp.text();
        console.error(`Failed inverters for system ${systemId}: ${invResp.status} ${errText}`);
        continue;
      }

      const data = await invResp.json();
      const envoys = Array.isArray(data) ? data : [data];

      for (const envoy of envoys) {
        const envoySerial = envoy.envoy_serial_number || envoy.serial_number || "unknown";
        const inverters = envoy.micro_inverters || [];
        const arrayInverters: any[] = [];

        for (const inv of inverters) {
          const inverterData = {
            serial_number: inv.serial_number || "unknown",
            model: inv.model || "Unknown",
            status: inv.status || "unknown",
            last_report_date: inv.last_report_date || null,
            last_report_watts: inv.power_produced?.value ?? 0,
            energy_wh: inv.energy?.value ?? 0,
          };
          arrayInverters.push(inverterData);
          allInverters.push(inverterData);
        }

        // Sort inverters within array
        arrayInverters.sort((a, b) => a.serial_number.localeCompare(b.serial_number));

        // Compute array-level stats
        const totalEnergy = arrayInverters.reduce((s, i) => s + i.energy_wh, 0);
        const avgEnergy = arrayInverters.length > 0 ? totalEnergy / arrayInverters.length : 0;
        const best = arrayInverters.reduce((b, i) => i.energy_wh > (b?.energy_wh || 0) ? i : b, null as any);
        const worst = arrayInverters.reduce((w, i) => (w === null || i.energy_wh < w.energy_wh) ? i : w, null as any);

        const reportDates = arrayInverters
          .map(i => i.last_report_date)
          .filter(Boolean)
          .map(d => new Date(d).getTime());

        arrays.push({
          envoy_serial: envoySerial,
          system_id: systemId,
          system_name: device.device_name || "Enphase System",
          panel_count: arrayInverters.length,
          total_energy_wh: totalEnergy,
          avg_energy_wh: Math.round(avgEnergy),
          best_serial: best?.serial_number || null,
          worst_serial: worst?.serial_number || null,
          last_report_date: reportDates.length > 0
            ? new Date(Math.max(...reportDates)).toISOString()
            : null,
          inverters: arrayInverters,
        });
      }
    }

    // System-level summary
    const totalEnergyWh = allInverters.reduce((s, i) => s + i.energy_wh, 0);
    const reportDates = allInverters
      .map(i => i.last_report_date)
      .filter(Boolean)
      .map(d => new Date(d).getTime());

    return new Response(JSON.stringify({
      system: {
        total_panels: allInverters.length,
        total_energy_wh: totalEnergyWh,
        system_size_w: systemSizeW,
        array_count: arrays.length,
        last_report_date: reportDates.length > 0
          ? new Date(Math.max(...reportDates)).toISOString()
          : null,
      },
      arrays,
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
