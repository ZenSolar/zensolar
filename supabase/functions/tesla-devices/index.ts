import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_API_BASE = "https://fleet-api.prd.na.vn.cloud.tesla.com";

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

    // Get user's Tesla tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("energy_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "tesla")
      .single();

    if (tokenError || !tokenData) {
      console.error("No Tesla tokens found:", tokenError);
      return new Response(JSON.stringify({ error: "Tesla not connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = tokenData.access_token;

    // Fetch vehicles
    const vehiclesResponse = await fetch(`${TESLA_API_BASE}/api/1/vehicles`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    let vehicles: any[] = [];
    if (vehiclesResponse.ok) {
      const vehiclesData = await vehiclesResponse.json();
      vehicles = vehiclesData.response || [];
      console.log("Tesla vehicles:", JSON.stringify(vehicles));
      
      // For each vehicle that's online, try to fetch current odometer
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i];
        if (v.state === 'online') {
          try {
            const vehicleDataResponse = await fetch(
              `${TESLA_API_BASE}/api/1/vehicles/${v.vin}/vehicle_data?endpoints=vehicle_state`,
              { headers: { "Authorization": `Bearer ${accessToken}` } }
            );
            
            if (vehicleDataResponse.ok) {
              const vehicleData = await vehicleDataResponse.json();
              const odometer = vehicleData.response?.vehicle_state?.odometer;
              if (odometer) {
                vehicles[i].odometer = Math.round(odometer);
                console.log(`Vehicle ${v.vin} odometer: ${vehicles[i].odometer}`);
              }
            }
          } catch (odometerError) {
            console.log(`Could not fetch odometer for ${v.vin}:`, odometerError);
          }
        }
      }
    } else {
      console.error("Failed to fetch vehicles:", await vehiclesResponse.text());
    }

    // Fetch energy products (Powerwall, Solar) using /products endpoint
    const productsResponse = await fetch(`${TESLA_API_BASE}/api/1/products`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });

    let energySites: any[] = [];
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      // Filter for energy sites (Powerwalls, Solar) - they have energy_site_id
      energySites = (productsData.response || []).filter(
        (p: any) => p.energy_site_id || p.resource_type
      );
      console.log("Tesla energy products:", JSON.stringify(energySites));
    } else {
      console.error("Failed to fetch products:", await productsResponse.text());
    }

    // Format devices for selection UI
    const devices = [
      ...vehicles.map((v: any) => ({
        device_id: v.vin,
        device_type: "vehicle",
        device_name: v.display_name || `${v.vehicle_type || "Tesla Vehicle"}`,
        metadata: {
          vin: v.vin,
          model: v.vehicle_type,
          state: v.state,
          odometer: v.odometer || null, // Will be populated if vehicle was online
        },
      })),
      ...energySites.map((s: any) => ({
        device_id: String(s.energy_site_id),
        device_type: s.resource_type === "battery" ? "powerwall" : "solar",
        device_name: s.site_name || `Tesla ${s.resource_type}`,
        metadata: {
          site_id: s.energy_site_id,
          resource_type: s.resource_type,
        },
      })),
    ];

    // Check which devices are already claimed
    const deviceIds = devices.map(d => d.device_id);
    const { data: claimedDevices } = await supabaseClient
      .from("connected_devices")
      .select("device_id, user_id")
      .eq("provider", "tesla")
      .in("device_id", deviceIds);

    const devicesWithStatus = devices.map(device => {
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
    console.error("Tesla devices error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch devices. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
