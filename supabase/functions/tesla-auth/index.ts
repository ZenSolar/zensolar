import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3/authorize";
const TESLA_TOKEN_URL = "https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token";
const TESLA_AUDIENCE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";
const TESLA_REDIRECT_URI = "https://zensolar.com/oauth/callback";
const RETURN_ORIGIN_HOSTS = new Set([
  "zensolar.com",
  "www.zensolar.com",
  "beta.zensolar.com",
  "www.beta.zensolar.com",
  "zen.solar",
  "www.zen.solar",
  "beta.zen.solar",
]);

// Tesla scopes ZenSolar requests. Read-only. Keep in sync with the auth URL below.
const REQUIRED_TESLA_SCOPES = [
  "openid",
  "offline_access",
  "vehicle_device_data",
  "vehicle_location",
  "vehicle_charging_cmds",
  "energy_device_data",
] as const;

// Only DATA scopes participate in the missing_scopes diff. openid + offline_access
// are inferred from tokens.id_token / tokens.refresh_token, not from the granted
// scope string (Tesla frequently omits them from `scope` even when granted).
const DATA_SCOPES = [
  "vehicle_device_data",
  "vehicle_location",
  "vehicle_charging_cmds",
  "energy_device_data",
] as const;

const BLOCKING_DATA_SCOPES = new Set<string>([
  "vehicle_device_data",
]);

function classifyMissingScopes(grantedScope: string | null | undefined, hasRefreshToken: boolean) {
  const granted = new Set((grantedScope ?? "").split(/\s+/).filter(Boolean));
  const missing = DATA_SCOPES.filter((s) => !granted.has(s));
  const blocking = missing.filter((s) => BLOCKING_DATA_SCOPES.has(s));
  const degraded = missing.filter((s) => !BLOCKING_DATA_SCOPES.has(s));
  const noRefresh = !hasRefreshToken;
  const severity: "blocking" | "degraded" | "ok" =
    (blocking.length || noRefresh) ? "blocking" : (degraded.length ? "degraded" : "ok");
  return { missing, blocking, degraded, severity, no_refresh_token: noRefresh };
}

type TeslaDevice = {
  device_id: string;
  device_type: "vehicle" | "powerwall" | "solar" | "wall_connector";
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
      const rt = String(p.resource_type || "").toLowerCase();
      const mappedType: "powerwall" | "solar" | "wall_connector" =
        rt === "battery" ? "powerwall" : rt === "wall_connector" ? "wall_connector" : "solar";
      devices.push({
        device_id: String(siteId),
        device_type: mappedType,
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

function sanitizeReturnTo(returnOrigin: unknown, returnTo: unknown): string | null {
  if (typeof returnOrigin !== "string" || typeof returnTo !== "string") return null;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return null;

  try {
    const origin = new URL(returnOrigin);
    const hostAllowed = RETURN_ORIGIN_HOSTS.has(origin.hostname) || origin.hostname.endsWith(".lovable.app");
    if (!hostAllowed || origin.protocol !== "https:") return null;
    return new URL(returnTo, origin.origin).toString();
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

    const body = await req.json();
    const action = body.action;
    console.log("Tesla auth action:", action);

    const authHeader = req.headers.get("Authorization");
    let user: { id: string } | null = null;
    if (authHeader) {
      const authResult = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!authResult.error && authResult.data.user) user = authResult.data.user;
    }

    if (!user && action !== "exchange-code") {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user && action !== "exchange-code") {
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

    // Generate OAuth URL for user to authorize
    if (action === "get-auth-url") {
      const { state, returnOrigin, returnTo } = body;
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const safeReturnTo = sanitizeReturnTo(returnOrigin, returnTo);
      if (typeof state === "string" && state.length > 0) {
        await supabaseClient.from("tesla_oauth_states").upsert({
          state,
          user_id: user.id,
          redirect_uri: TESLA_REDIRECT_URI,
          return_to: safeReturnTo,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          consumed_at: null,
        });
      }
      
      // Read-only Tesla scopes. We observe, never control.
      // - openid + offline_access → session + refresh token
      // - vehicle_device_data     → miles + FSD miles
      // - vehicle_location        → Home vs Supercharger classification
      // - vehicle_charging_cmds   → READ charging sessions / kWh added (no commands sent)
      // - energy_device_data      → solar production + Powerwall
      // (energy_cmds and user_data intentionally dropped — write-scope / unused.)
      const scopes = REQUIRED_TESLA_SCOPES.join(" ");

      const authUrl = new URL(TESLA_AUTH_URL);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", TESLA_REDIRECT_URI);
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
      const { code, state } = body;
      console.log("[tesla-auth] exchange-code:begin", {
        hasCode: !!code,
        hasState: !!state,
        hasAuthUser: !!user,
      });
      let exchangeUserId = user?.id ?? null;
      let exchangeRedirectUri = TESLA_REDIRECT_URI;
      let returnTo: string | null = null;

      if (!exchangeUserId && typeof state === "string") {
        const { data: stateRow, error: stateError } = await supabaseClient
          .from("tesla_oauth_states")
          .select("user_id, redirect_uri, return_to, expires_at, consumed_at")
          .eq("state", state)
          .maybeSingle();

        console.log("[tesla-auth] exchange-code:state-lookup", {
          found: !!stateRow,
          consumed: !!stateRow?.consumed_at,
          expired: stateRow ? new Date(stateRow.expires_at).getTime() < Date.now() : null,
          hasReturnTo: !!stateRow?.return_to,
          error: stateError?.message ?? null,
        });

        if (stateError || !stateRow || stateRow.consumed_at || new Date(stateRow.expires_at).getTime() < Date.now()) {
          return new Response(JSON.stringify({ error: "Authorization session expired. Please try again." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        exchangeUserId = stateRow.user_id;
        exchangeRedirectUri = stateRow.redirect_uri || TESLA_REDIRECT_URI;
        returnTo = stateRow.return_to ?? null;
      }

      if (!exchangeUserId) {
        console.warn("[tesla-auth] exchange-code:no-user");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
          redirect_uri: exchangeRedirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[tesla-auth] exchange-code:token-http-failed", {
          status: tokenResponse.status,
          body: errorText.slice(0, 300),
          redirect_uri: exchangeRedirectUri,
        });
        return new Response(JSON.stringify({ error: "Token exchange failed. Please try again." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();
      console.log("[tesla-auth] exchange-code:tokens-received", {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
        userId: exchangeUserId,
      });

      const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      const grantedScope: string = typeof tokens.scope === "string" ? tokens.scope : "";
      const scopeCheck = classifyMissingScopes(grantedScope);
      console.log("[tesla-auth] exchange-code:scope-check", scopeCheck);

      const { error: tokenStoreError } = await supabaseClient
        .from("energy_tokens")
        .upsert({
          user_id: exchangeUserId,
          provider: "tesla",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: expiresAt,
          extra_data: { granted_scope: grantedScope },
        }, { onConflict: "user_id,provider" });

      if (tokenStoreError) {
        console.error("[tesla-auth] exchange-code:token-store-failed", tokenStoreError);
      } else {
        console.log("[tesla-auth] exchange-code:token-store-ok", { userId: exchangeUserId });
      }

      if (typeof state === "string") {
        await supabaseClient
          .from("tesla_oauth_states")
          .update({ consumed_at: new Date().toISOString() })
          .eq("state", state)
          .is("consumed_at", null);
        console.log("[tesla-auth] exchange-code:state-consumed", { state });
      }

      console.log("[tesla-auth] exchange-code:done", {
        userId: exchangeUserId,
        needsDeviceSelection: true,
        hasReturnTo: !!returnTo,
        severity: scopeCheck.severity,
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Tesla authorization successful - please select your devices",
        needsDeviceSelection: true,
        returnTo,
        granted_scope: grantedScope,
        required_scopes: REQUIRED_TESLA_SCOPES,
        missing_scopes: scopeCheck.missing,
        blocking_scopes: scopeCheck.blocking,
        degraded_scopes: scopeCheck.degraded,
        scope_severity: scopeCheck.severity,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Unauthenticated helper: returns just the `return_to` URL for a state so
    // the callback page can bounce back to the beta subdomain BEFORE the token
    // exchange (session cookies live on the beta origin).
    if (action === "lookup-return-to") {
      const { state: lookupState } = body;
      if (typeof lookupState !== "string" || !lookupState) {
        return new Response(JSON.stringify({ error: "state required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: row } = await supabaseClient
        .from("tesla_oauth_states")
        .select("return_to, expires_at, consumed_at")
        .eq("state", lookupState)
        .maybeSingle();
      const fresh = row && !row.consumed_at && new Date(row.expires_at).getTime() >= Date.now();
      return new Response(JSON.stringify({ returnTo: fresh ? row?.return_to ?? null : null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if tokens exist for the current user (used by OAuth callback polling)
    if (action === "check-tokens") {
      const { data: tokenCheck } = await supabaseClient
        .from("energy_tokens")
        .select("id, provider, access_token, extra_data")
        .eq("user_id", user.id)
        .eq("provider", "tesla")
        .maybeSingle();

      const grantedScope: string =
        (tokenCheck?.extra_data && typeof (tokenCheck.extra_data as { granted_scope?: unknown }).granted_scope === "string")
          ? String((tokenCheck.extra_data as { granted_scope: string }).granted_scope)
          : "";
      const scopeCheck = classifyMissingScopes(grantedScope);

      console.log("[tesla-auth] check-tokens", {
        userId: user.id,
        exists: !!tokenCheck,
        severity: scopeCheck.severity,
      });

      return new Response(JSON.stringify({
        exists: !!tokenCheck,
        granted_scope: grantedScope,
        required_scopes: REQUIRED_TESLA_SCOPES,
        missing_scopes: scopeCheck.missing,
        blocking_scopes: scopeCheck.blocking,
        degraded_scopes: scopeCheck.degraded,
        scope_severity: scopeCheck.severity,
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
