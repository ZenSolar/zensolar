import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3/authorize";
const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const TESLA_AUDIENCE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

type TeslaDevice = {
  device_id: string;
  device_type: "vehicle" | "powerwall" | "solar";
  device_name: string;
  metadata: Record<string, unknown>;
};

async function fetchTeslaDevices(accessToken: string): Promise<TeslaDevice[]> {
  const devices: TeslaDevice[] = [];

  const vehiclesResponse = await fetch(`${TESLA_API_BASE}/api/1/vehicles`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (vehiclesResponse.ok) {
    const vehiclesData = await vehiclesResponse.json();
    for (const v of vehiclesData.response || []) {
      if (!v.vin) continue;
      devices.push({
        device_id: String(v.vin),
        device_type: "vehicle",
        device_name: v.display_name || v.vehicle_type || "Tesla Vehicle",
        metadata: {
          vin: v.vin,
          model: v.vehicle_type,
          state: v.state,
        },
      });
    }
  } else {
    console.warn("Tesla vehicle discovery failed:", await vehiclesResponse.text());
  }

  const productsResponse = await fetch(`${TESLA_API_BASE}/api/1/products`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (productsResponse.ok) {
    const productsData = await productsResponse.json();
    for (const p of productsData.response || []) {
      if (!p.energy_site_id && !p.resource_type) continue;
      const siteId = p.energy_site_id;
      if (!siteId) continue;
      devices.push({
        device_id: String(siteId),
        device_type: p.resource_type === "battery" ? "powerwall" : "solar",
        device_name: p.site_name || `Tesla ${p.resource_type || "Energy"}`,
        metadata: {
          site_id: siteId,
          resource_type: p.resource_type,
        },
      });
    }
  } else {
    console.warn("Tesla product discovery failed:", await productsResponse.text());
  }

  const unique = new Map<string, TeslaDevice>();
  for (const device of devices) unique.set(`${device.device_type}:${device.device_id}`, device);
  return Array.from(unique.values());
}

function baselineForDevice(device: TeslaDevice) {
  const captured_at = new Date().toISOString();
  if (device.device_type === "vehicle") {
    return {
      captured_at,
      odometer: 0,
      last_known_odometer: 0,
      total_charge_energy_added_kwh: 0,
    };
  }

  return {
    captured_at,
    total_energy_discharged_wh: 0,
    total_solar_produced_wh: 0,
  };
}

async function autoClaimTeslaDevices(supabaseClient: any, userId: string, accessToken: string) {
  const devices = await fetchTeslaDevices(accessToken);
  const claimed: string[] = [];
  const alreadyClaimed: string[] = [];
  const errors: string[] = [];

  for (const device of devices) {
    const { data: existing, error: existingError } = await supabaseClient
      .from("connected_devices")
      .select("user_id")
      .eq("provider", "tesla")
      .eq("device_id", device.device_id)
      .maybeSingle();

    if (existingError) {
      console.warn("Tesla auto-claim lookup failed:", existingError);
    }

    if (existing) {
      if (existing.user_id === userId) {
        claimed.push(device.device_id);
      } else {
        alreadyClaimed.push(device.device_id);
      }
      continue;
    }

    const { error: insertError } = await supabaseClient.from("connected_devices").insert({
      user_id: userId,
      provider: "tesla",
      device_id: device.device_id,
      device_type: device.device_type,
      device_name: device.device_name,
      device_metadata: device.metadata,
      baseline_data: baselineForDevice(device),
    });

    if (insertError) {
      console.error("Tesla auto-claim insert failed:", insertError);
      errors.push(device.device_id);
    } else {
      claimed.push(device.device_id);
    }
  }

  if (claimed.length > 0) {
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .update({ tesla_connected: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (profileError) console.error("Tesla auto-claim profile update failed:", profileError);
  }

  return { discovered: devices.length, claimed, alreadyClaimed, errors };
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

      const autoClaimResult = await autoClaimTeslaDevices(supabaseClient, user.id, tokens.access_token).catch((error) => {
        console.error("Tesla auto-claim failed:", error);
        return { discovered: 0, claimed: [], alreadyClaimed: [], errors: ["auto_claim_failed"] };
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: autoClaimResult.claimed.length > 0
          ? "Tesla authorization successful - devices connected"
          : "Tesla authorization successful - please select your devices",
        needsDeviceSelection: autoClaimResult.claimed.length === 0,
        autoClaim: autoClaimResult,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if tokens exist for the current user (used by OAuth callback polling)
    if (action === "check-tokens") {
      const { data: tokenCheck } = await supabaseClient
        .from("energy_tokens")
        .select("id, provider, access_token")
        .eq("user_id", user.id)
        .eq("provider", "tesla")
        .maybeSingle();

      let autoClaim = null;
      if (tokenCheck?.access_token) {
        const { count } = await supabaseClient
          .from("connected_devices")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("provider", "tesla");

        if (!count || count === 0) {
          autoClaim = await autoClaimTeslaDevices(supabaseClient, user.id, tokenCheck.access_token).catch((error) => {
            console.error("Tesla check-tokens auto-claim failed:", error);
            return { discovered: 0, claimed: [], alreadyClaimed: [], errors: ["auto_claim_failed"] };
          });
        }
      }

      return new Response(JSON.stringify({ 
        exists: !!tokenCheck,
        autoClaim,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "auto-claim-devices") {
      const { data: tokenData, error: tokenError } = await supabaseClient
        .from("energy_tokens")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("provider", "tesla")
        .maybeSingle();

      if (tokenError || !tokenData?.access_token) {
        return new Response(JSON.stringify({ error: "Tesla not connected" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const autoClaim = await autoClaimTeslaDevices(supabaseClient, user.id, tokenData.access_token);
      return new Response(JSON.stringify({ success: true, autoClaim }), {
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
