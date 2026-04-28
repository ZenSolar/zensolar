import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PIN_REGEX = /^\d{4}$/;
const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;
const ALLOWED_ROLES = new Set(["admin", "founder"]);
const PIN_DENY_EMAILS = new Set(["todd@zen.solar"]);

async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${pin}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = (user.email ?? "").toLowerCase();
    if (PIN_DENY_EMAILS.has(email)) {
      return new Response(
        JSON.stringify({ error: "no_pin_access", message: "This account does not have PIN access to the Founders area." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceRole);

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleSet = new Set((roles ?? []).map((r) => r.role));
    const allowed = [...roleSet].some((r) => ALLOWED_ROLES.has(r));
    if (!allowed) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const pin = String(body?.pin ?? "");
    if (!PIN_REGEX.test(pin)) {
      return new Response(JSON.stringify({ error: "invalid_pin" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: row } = await admin
      .from("founder_pins")
      .select("pin_hash, salt, failed_attempts, locked_until")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!row) {
      return new Response(JSON.stringify({ error: "no_pin_set" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    if (row.locked_until && new Date(row.locked_until) > now) {
      const minsLeft = Math.ceil((new Date(row.locked_until).getTime() - now.getTime()) / 60000);
      return new Response(
        JSON.stringify({ error: "locked", minutes_remaining: minsLeft }),
        { status: 423, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const candidate = await hashPin(pin, row.salt);
    if (candidate === row.pin_hash) {
      await admin
        .from("founder_pins")
        .update({ failed_attempts: 0, locked_until: null, updated_at: now.toISOString() })
        .eq("user_id", user.id);

      await admin.from("vault_access_log").insert({
        user_id: user.id,
        event_type: "pin_unlock",
        success: true,
      });

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newAttempts = (row.failed_attempts ?? 0) + 1;
    const shouldLock = newAttempts >= MAX_ATTEMPTS;
    const lockUntil = shouldLock
      ? new Date(now.getTime() + LOCKOUT_MINUTES * 60_000).toISOString()
      : null;

    await admin
      .from("founder_pins")
      .update({
        failed_attempts: shouldLock ? 0 : newAttempts,
        locked_until: lockUntil,
        updated_at: now.toISOString(),
      })
      .eq("user_id", user.id);

    await admin.from("vault_access_log").insert({
      user_id: user.id,
      event_type: shouldLock ? "pin_lockout" : "pin_failed",
      success: false,
      metadata: { attempts: newAttempts },
    });

    if (shouldLock) {
      return new Response(
        JSON.stringify({ error: "locked", minutes_remaining: LOCKOUT_MINUTES }),
        { status: 423, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "wrong_pin", attempts_remaining: MAX_ATTEMPTS - newAttempts }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("vault-pin-verify error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
