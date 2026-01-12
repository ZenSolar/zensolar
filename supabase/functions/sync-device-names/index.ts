import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENPHASE_API_BASE = "https://api.enphaseenergy.com/api/v4";
const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

interface DeviceRecord {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  provider: string;
  device_type: string;
}

interface TokenRecord {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  extra_data: any;
}

async function refreshEnphaseToken(
  supabaseClient: any,
  userId: string,
  refreshToken: string
): Promise<string | null> {
  const clientId = Deno.env.get("ENPHASE_CLIENT_ID");
  const clientSecret = Deno.env.get("ENPHASE_CLIENT_SECRET");

  if (!clientId || !clientSecret) return null;

  try {
    const response = await fetch("https://api.enphaseenergy.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

    await supabaseClient
      .from("energy_tokens")
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "enphase");

    return data.access_token;
  } catch (error) {
    console.error("Failed to refresh Enphase token:", error);
    return null;
  }
}

async function syncEnphaseDevices(
  supabaseClient: any,
  devices: DeviceRecord[],
  tokens: Map<string, TokenRecord>
): Promise<number> {
  const apiKey = Deno.env.get("ENPHASE_API_KEY");
  if (!apiKey) {
    console.log("Enphase API key not configured, skipping");
    return 0;
  }

  let updatedCount = 0;

  // Group devices by user
  const devicesByUser = new Map<string, DeviceRecord[]>();
  for (const device of devices) {
    const userDevices = devicesByUser.get(device.user_id) || [];
    userDevices.push(device);
    devicesByUser.set(device.user_id, userDevices);
  }

  for (const [userId, userDevices] of devicesByUser) {
    const tokenRecord = tokens.get(`enphase:${userId}`);
    if (!tokenRecord) continue;

    let accessToken = tokenRecord.access_token;

    // Check if token needs refresh
    if (tokenRecord.expires_at) {
      const expiresAt = new Date(tokenRecord.expires_at);
      if (expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
        if (tokenRecord.refresh_token) {
          const newToken = await refreshEnphaseToken(
            supabaseClient,
            userId,
            tokenRecord.refresh_token
          );
          if (newToken) accessToken = newToken;
        }
      }
    }

    try {
      const response = await fetch(`${ENPHASE_API_BASE}/systems?key=${apiKey}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        console.error(`Enphase API error for user ${userId}:`, response.status);
        continue;
      }

      const data = await response.json();
      const systems = data.systems || [];

      for (const device of userDevices) {
        const system = systems.find(
          (s: any) => String(s.system_id) === device.device_id
        );
        if (system) {
          const newName = system.name || system.public_name;
          if (newName && newName !== device.device_name) {
            console.log(
              `Updating Enphase device ${device.device_id}: "${device.device_name}" -> "${newName}"`
            );
            await supabaseClient
              .from("connected_devices")
              .update({ device_name: newName, updated_at: new Date().toISOString() })
              .eq("id", device.id);
            updatedCount++;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to sync Enphase devices for user ${userId}:`, error);
    }
  }

  return updatedCount;
}

async function syncTeslaDevices(
  supabaseClient: any,
  devices: DeviceRecord[],
  tokens: Map<string, TokenRecord>
): Promise<number> {
  let updatedCount = 0;

  // Group devices by user
  const devicesByUser = new Map<string, DeviceRecord[]>();
  for (const device of devices) {
    const userDevices = devicesByUser.get(device.user_id) || [];
    userDevices.push(device);
    devicesByUser.set(device.user_id, userDevices);
  }

  for (const [userId, userDevices] of devicesByUser) {
    const tokenRecord = tokens.get(`tesla:${userId}`);
    if (!tokenRecord) continue;

    try {
      // Fetch vehicles
      const vehiclesResponse = await fetch(`${TESLA_API_BASE}/api/1/vehicles`, {
        headers: { Authorization: `Bearer ${tokenRecord.access_token}` },
      });

      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        const vehicles = vehiclesData.response || [];

        for (const device of userDevices.filter((d) => d.device_type === "vehicle")) {
          const vehicle = vehicles.find(
            (v: any) => String(v.id) === device.device_id || String(v.vin) === device.device_id
          );
          if (vehicle) {
            const newName = vehicle.display_name;
            if (newName && newName !== device.device_name) {
              console.log(
                `Updating Tesla vehicle ${device.device_id}: "${device.device_name}" -> "${newName}"`
              );
              await supabaseClient
                .from("connected_devices")
                .update({ device_name: newName, updated_at: new Date().toISOString() })
                .eq("id", device.id);
              updatedCount++;
            }
          }
        }
      }

      // Fetch energy sites (Powerwall, Solar)
      const energyResponse = await fetch(`${TESLA_API_BASE}/api/1/products`, {
        headers: { Authorization: `Bearer ${tokenRecord.access_token}` },
      });

      if (energyResponse.ok) {
        const energyData = await energyResponse.json();
        const products = energyData.response || [];

        for (const device of userDevices.filter(
          (d) => d.device_type === "powerwall" || d.device_type === "solar"
        )) {
          const product = products.find(
            (p: any) =>
              String(p.energy_site_id) === device.device_id ||
              String(p.id) === device.device_id
          );
          if (product) {
            const newName = product.site_name;
            if (newName && newName !== device.device_name) {
              console.log(
                `Updating Tesla energy device ${device.device_id}: "${device.device_name}" -> "${newName}"`
              );
              await supabaseClient
                .from("connected_devices")
                .update({ device_name: newName, updated_at: new Date().toISOString() })
                .eq("id", device.id);
              updatedCount++;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Failed to sync Tesla devices for user ${userId}:`, error);
    }
  }

  return updatedCount;
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

    console.log("Starting device name sync...");

    // Fetch all connected devices
    const { data: devices, error: devicesError } = await supabaseClient
      .from("connected_devices")
      .select("id, user_id, device_id, device_name, provider, device_type");

    if (devicesError) {
      console.error("Failed to fetch devices:", devicesError);
      return new Response(JSON.stringify({ error: "Failed to fetch devices" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!devices || devices.length === 0) {
      console.log("No devices to sync");
      return new Response(JSON.stringify({ message: "No devices to sync", updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${devices.length} devices to check`);

    // Get unique user IDs
    const userIds = [...new Set(devices.map((d: DeviceRecord) => d.user_id))];

    // Fetch tokens for all users
    const { data: allTokens, error: tokensError } = await supabaseClient
      .from("energy_tokens")
      .select("user_id, provider, access_token, refresh_token, expires_at, extra_data")
      .in("user_id", userIds);

    if (tokensError) {
      console.error("Failed to fetch tokens:", tokensError);
    }

    // Create a map for quick token lookup
    const tokenMap = new Map<string, TokenRecord>();
    for (const token of allTokens || []) {
      tokenMap.set(`${token.provider}:${token.user_id}`, token);
    }

    // Group devices by provider
    const enphaseDevices = devices.filter((d: DeviceRecord) => d.provider === "enphase");
    const teslaDevices = devices.filter((d: DeviceRecord) => d.provider === "tesla");

    let totalUpdated = 0;

    // Sync Enphase devices
    if (enphaseDevices.length > 0) {
      console.log(`Syncing ${enphaseDevices.length} Enphase devices...`);
      const enphaseUpdated = await syncEnphaseDevices(supabaseClient, enphaseDevices, tokenMap);
      totalUpdated += enphaseUpdated;
      console.log(`Updated ${enphaseUpdated} Enphase devices`);
    }

    // Sync Tesla devices
    if (teslaDevices.length > 0) {
      console.log(`Syncing ${teslaDevices.length} Tesla devices...`);
      const teslaUpdated = await syncTeslaDevices(supabaseClient, teslaDevices, tokenMap);
      totalUpdated += teslaUpdated;
      console.log(`Updated ${teslaUpdated} Tesla devices`);
    }

    console.log(`Device name sync complete. Total updated: ${totalUpdated}`);

    return new Response(
      JSON.stringify({
        message: "Device name sync complete",
        checked: devices.length,
        updated: totalUpdated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: "Sync failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
