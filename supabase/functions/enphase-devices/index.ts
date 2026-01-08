import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENPHASE_API_BASE = "https://api.enphaseenergy.com/api/v4";

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

    // Get user's Enphase tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "enphase")
      .single();

    if (tokenError || !tokenData) {
      console.error("No Enphase tokens found:", tokenError);
      return new Response(JSON.stringify({ error: "Enphase not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = tokenData.access_token;

    // Fetch systems
    const systemsResponse = await fetch(`${ENPHASE_API_BASE}/systems?key=${apiKey}`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    if (!systemsResponse.ok) {
      const errorText = await systemsResponse.text();
      console.error("Failed to fetch Enphase systems:", errorText);
      return new Response(JSON.stringify({ error: "Failed to fetch systems", details: errorText }), {
        status: systemsResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemsData = await systemsResponse.json();
    console.log("Enphase systems:", JSON.stringify(systemsData));

    // Format devices for selection UI
    const devices = (systemsData.systems || []).map((s: any) => ({
      device_id: String(s.system_id),
      device_type: "solar_system",
      device_name: s.name || s.public_name || `Enphase System`,
      metadata: {
        system_id: s.system_id,
        public_name: s.public_name,
        timezone: s.timezone,
        status: s.status,
        address: s.address,
        size_w: s.system_size,
      },
    }));

    // Check which devices are already claimed
    const deviceIds = devices.map((d: any) => d.device_id);
    const { data: claimedDevices } = await supabaseClient
      .from("connected_devices")
      .select("device_id, user_id")
      .eq("provider", "enphase")
      .in("device_id", deviceIds);

    const devicesWithStatus = devices.map((device: any) => {
      const claimed = claimedDevices?.find(c => c.device_id === device.device_id);
      return {
        ...device,
        is_claimed: !!claimed,
        claimed_by_current_user: claimed?.user_id === user.id,
      };
    });

    return new Response(JSON.stringify({ devices: devicesWithStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Enphase devices error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
