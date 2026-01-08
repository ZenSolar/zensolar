import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeviceToClaim {
  device_id: string;
  device_type: string;
  device_name: string;
  metadata?: Record<string, any>;
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

    const { provider, devices } = await req.json() as { 
      provider: string; 
      devices: DeviceToClaim[] 
    };

    if (!provider || !devices || devices.length === 0) {
      return new Response(JSON.stringify({ error: "Provider and devices required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = {
      claimed: [] as string[],
      already_claimed: [] as string[],
      errors: [] as string[],
    };

    // Process each device
    for (const device of devices) {
      // Check if already claimed by another user
      const { data: existing } = await supabaseClient
        .from("connected_devices")
        .select("user_id")
        .eq("provider", provider)
        .eq("device_id", device.device_id)
        .single();

      if (existing) {
        if (existing.user_id === user.id) {
          // Already claimed by this user - skip
          results.claimed.push(device.device_id);
        } else {
          // Claimed by someone else
          results.already_claimed.push(device.device_id);
        }
        continue;
      }

      // Claim the device
      const { error: insertError } = await supabaseClient
        .from("connected_devices")
        .insert({
          user_id: user.id,
          provider,
          device_id: device.device_id,
          device_type: device.device_type,
          device_name: device.device_name,
          device_metadata: device.metadata || null,
        });

      if (insertError) {
        console.error("Failed to claim device:", insertError);
        // Check if it's a unique constraint violation
        if (insertError.code === "23505") {
          results.already_claimed.push(device.device_id);
        } else {
          results.errors.push(device.device_id);
        }
      } else {
        results.claimed.push(device.device_id);
      }
    }

    // Update profile connection status if any devices were claimed
    if (results.claimed.length > 0) {
      const columnName = `${provider}_connected`;
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ [columnName]: true })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Failed to update profile:", updateError);
      }
    }

    const success = results.claimed.length > 0;
    const message = results.claimed.length > 0
      ? `Successfully claimed ${results.claimed.length} device(s)`
      : results.already_claimed.length > 0
        ? "Selected devices are already claimed by other users"
        : "No devices were claimed";

    return new Response(JSON.stringify({ 
      success,
      message,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Claim devices error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
