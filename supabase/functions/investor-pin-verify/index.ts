// Public PIN gate for /investor. Accepts a 4-digit PIN and validates
// against the INVESTOR_ACCESS_PIN secret. Per-IP throttling via
// vault_access_log (event_type: investor_pin_failed / investor_pin_unlock).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PIN_REGEX = /^\d{4}$/;
const WINDOW_MIN = 15;
const MAX_PER_WINDOW = 8;

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const expected = (Deno.env.get("INVESTOR_ACCESS_PIN") ?? "").trim();
    if (!PIN_REGEX.test(expected)) {
      return new Response(
        JSON.stringify({ error: "pin_not_configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") ?? "";

    const sinceIso = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
    const { count: recentFails } = await admin
      .from("vault_access_log")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "investor_pin_failed")
      .eq("ip_address", ip)
      .gte("created_at", sinceIso);

    if ((recentFails ?? 0) >= MAX_PER_WINDOW) {
      return new Response(
        JSON.stringify({ error: "throttled", minutes_remaining: WINDOW_MIN }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const pin = String(body?.pin ?? "");
    if (!PIN_REGEX.test(pin)) {
      return new Response(JSON.stringify({ error: "invalid_pin" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (timingSafeEqual(pin, expected)) {
      await admin.from("vault_access_log").insert({
        user_id: null,
        event_type: "investor_pin_unlock",
        success: true,
        ip_address: ip,
        user_agent: ua,
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("vault_access_log").insert({
      user_id: null,
      event_type: "investor_pin_failed",
      success: false,
      ip_address: ip,
      user_agent: ua,
    });

    const remaining = Math.max(0, MAX_PER_WINDOW - ((recentFails ?? 0) + 1));
    return new Response(
      JSON.stringify({ error: "wrong_pin", attempts_remaining: remaining }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("investor-pin-verify error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
