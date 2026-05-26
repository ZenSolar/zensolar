// Public PIN gate for the seed pitch deck (/deck).
// Accepts a 4-digit PIN, checks it against founder_pins rows for users
// holding a 'founder' or 'admin' role (excluding the explicit deny list).
// No auth required — the PIN itself is the credential.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PIN_REGEX = /^\d{4}$/;
const ALLOWED_ROLES = new Set(["admin", "founder"]);
const PIN_DENY_EMAILS = new Set(["jo@zen.solar", "todd@zen.solar"]);

// Per-IP throttle: max attempts in a rolling window. Stored in vault_access_log.
const WINDOW_MIN = 15;
const MAX_PER_WINDOW = 8;

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRole);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") ?? "";

    // Throttle by IP
    const sinceIso = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
    const { count: recentFails } = await admin
      .from("vault_access_log")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "deck_pin_failed")
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

    // Find candidate PIN rows for users with founder/admin role,
    // excluding the deny list.
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("user_id, role");
    const allowedUserIds = new Set(
      (roleRows ?? [])
        .filter((r) => ALLOWED_ROLES.has(r.role))
        .map((r) => r.user_id),
    );

    if (allowedUserIds.size === 0) {
      return new Response(JSON.stringify({ error: "no_eligible_pins" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull all founder_pin rows for those users.
    const { data: pinRows } = await admin
      .from("founder_pins")
      .select("user_id, pin_hash, salt")
      .in("user_id", Array.from(allowedUserIds));

    // Exclude users whose email is in the deny list.
    const { data: denyUsers } = await admin
      .schema("auth" as any)
      .from("users" as any)
      .select("id, email")
      .in("id", (pinRows ?? []).map((p) => p.user_id));
    const denyIds = new Set(
      (denyUsers ?? [])
        .filter((u: any) => PIN_DENY_EMAILS.has((u.email ?? "").toLowerCase()))
        .map((u: any) => u.id),
    );

    let matched: string | null = null;
    for (const row of pinRows ?? []) {
      if (denyIds.has(row.user_id)) continue;
      const candidate = await hashPin(pin, row.salt);
      if (candidate === row.pin_hash) {
        matched = row.user_id;
        break;
      }
    }

    if (matched) {
      await admin.from("vault_access_log").insert({
        user_id: matched,
        event_type: "deck_pin_unlock",
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
      event_type: "deck_pin_failed",
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
    console.error("deck-pin-verify error", e);
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
