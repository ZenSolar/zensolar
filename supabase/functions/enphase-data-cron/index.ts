// enphase-data-cron — server-side sync for ALL Enphase-connected users,
// so solar/battery rows keep flowing without requiring the user to open the app.
//
// Cron drives this every 6h (see pg_cron job `enphase-data-cron-6h`).
// Per user:
//   - Skip if profiles.last_seen_at is older than 30 days (cost control).
//   - Invoke enphase-data internally with service-role + X-Target-User-Id.
//
// verify_jwt = false — invoked by pg_cron with service-role header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  let body: any = {};
  try { body = await req.json(); } catch { /* cron sends empty body */ }
  const onlyUser: string | null = body?.user_id ?? null;
  const force: boolean = body?.force === true;

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let attempted = 0;
  let synced = 0;
  let skipped = 0;
  let errors = 0;
  const results: any[] = [];

  try {
    // Users with an Enphase token.
    let tq = supabase
      .from("energy_tokens")
      .select("user_id")
      .eq("provider", "enphase");
    if (onlyUser) tq = tq.eq("user_id", onlyUser);
    const { data: tokens, error: tErr } = await tq;
    if (tErr) throw tErr;

    const userIds = Array.from(new Set((tokens || []).map((t: any) => t.user_id)));

    // Smart-skip: only active users unless force / onlyUser.
    let activeSet: Set<string> | null = null;
    if (!onlyUser && !force) {
      const { data: activeProfiles } = await supabase
        .from("profiles")
        .select("user_id")
        .gte("last_seen_at", cutoff)
        .in("user_id", userIds);
      activeSet = new Set((activeProfiles || []).map((p: any) => p.user_id));
    }

    for (const uid of userIds) {
      if (activeSet && !activeSet.has(uid)) { skipped += 1; continue; }
      attempted += 1;
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/enphase-data`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SERVICE_ROLE}`,
            "X-Target-User-Id": uid,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ source: "enphase-data-cron" }),
        });
        if (r.ok) {
          synced += 1;
          results.push({ user_id: uid, ok: true });
        } else {
          errors += 1;
          const txt = await r.text().catch(() => "");
          results.push({ user_id: uid, ok: false, status: r.status, body: txt.slice(0, 200) });
        }
      } catch (e) {
        errors += 1;
        results.push({ user_id: uid, ok: false, error: String((e as Error).message || e) });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, attempted, synced, skipped, errors, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("enphase-data-cron error", err);
    return new Response(
      JSON.stringify({ error: String((err as Error).message || err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
