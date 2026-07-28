// redeem-invite — public, no JWT. Rate-limited by hashed IP.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const PEPPER = Deno.env.get("INVITE_IP_PEPPER") ?? "";

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0].trim() || "unknown";
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse(405, { ok: false, reason: "method_not_allowed" });

  let body: { code?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }
  const rawCode = (body.code ?? "").trim();
  if (!rawCode || rawCode.length > 64) return jsonResponse(200, { ok: false, reason: "invalid" });

  const ipHash = await sha256(PEPPER + "|" + clientIp(req));
  const codeHash = await sha256(rawCode.toLowerCase());

  const now = Date.now();
  const since15 = new Date(now - 15 * 60_000).toISOString();
  const since60 = new Date(now - 60 * 60_000).toISOString();

  const { data: recent } = await supabase
    .from("invite_redeem_attempts")
    .select("success, attempted_at")
    .eq("ip_hash", ipHash)
    .eq("kind", "invite")
    .gte("attempted_at", since60);

  const rows = recent ?? [];
  const fails15 = rows.filter((r) => !r.success && r.attempted_at >= since15).length;
  if (fails15 >= 5 || rows.length >= 20) return jsonResponse(429, { ok: false, reason: "rate_limited" });

  const { data: codeRow } = await supabase
    .from("invite_codes")
    .select("id, code, active, expires_at, redeem_count")
    .eq("code", rawCode)
    .maybeSingle();

  const valid =
    !!codeRow &&
    codeRow.active === true &&
    (!codeRow.expires_at || new Date(codeRow.expires_at).getTime() > now) &&
    constantTimeEqual(String(codeRow.code).toLowerCase(), rawCode.toLowerCase());

  await supabase.from("invite_redeem_attempts").insert({
    kind: "invite",
    ip_hash: ipHash,
    code_tried_hash: codeHash,
    success: valid,
  });

  if (!valid) return jsonResponse(200, { ok: false, reason: "invalid" });

  await supabase
    .from("invite_codes")
    .update({
      redeem_count: (codeRow!.redeem_count ?? 0) + 1,
      last_redeemed_at: new Date().toISOString(),
    })
    .eq("id", codeRow!.id);

  return jsonResponse(200, { ok: true });
});
