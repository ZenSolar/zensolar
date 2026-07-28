// submit-access-request — public, no JWT. Honeypot + IP throttle.
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SOURCES = new Set(["investor", "hardware", "other", "unspecified"]);

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  return xff.split(",")[0].trim() || "unknown";
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { ok: false, reason: "method_not_allowed" });

  let body: {
    name?: string;
    email?: string;
    source?: string;
    note?: string;
    hp?: string;
  } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  // Honeypot: silent success.
  if (body.hp && body.hp.trim().length > 0) return json(200, { ok: true });

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const source = VALID_SOURCES.has(body.source ?? "") ? body.source! : "unspecified";
  const note = (body.note ?? "").trim();

  if (!name || name.length > 100) return json(200, { ok: false, reason: "invalid" });
  if (!EMAIL_RE.test(email) || email.length > 255) return json(200, { ok: false, reason: "invalid" });
  if (note.length > 1000) return json(200, { ok: false, reason: "invalid" });

  const ipHash = await sha256(PEPPER + "|" + clientIp(req));
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 500);

  const since60 = new Date(Date.now() - 60 * 60_000).toISOString();
  const { count } = await supabase
    .from("invite_redeem_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("kind", "access")
    .gte("attempted_at", since60);

  if ((count ?? 0) >= 3) return json(429, { ok: false, reason: "rate_limited" });

  const { error } = await supabase.from("access_requests").insert({
    name,
    email,
    source,
    note: note || null,
    ip_hash: ipHash,
    user_agent: ua,
  });

  await supabase.from("invite_redeem_attempts").insert({
    kind: "access",
    ip_hash: ipHash,
    success: !error,
  });

  if (error) return json(500, { ok: false, reason: "internal" });
  return json(200, { ok: true });
});
