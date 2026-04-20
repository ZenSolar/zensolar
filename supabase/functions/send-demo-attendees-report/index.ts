import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * send-demo-attendees-report
 *
 * One-off (and re-runnable) report email listing everyone who logged a demo
 * access entry with nda_signed=true. Joins demo_access_log + nda_signatures
 * by signature_id to attach names.
 *
 * Recipient: jo@zen.solar (admin email).
 */

const ADMIN_EMAIL = "jo@zen.solar";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Pull every logged demo access where they signed the NDA
    const { data: logs, error: logErr } = await supabase
      .from("demo_access_log")
      .select("access_code, accessed_at, city, region, country, nda_signature_id")
      .eq("nda_signed", true)
      .order("accessed_at", { ascending: false });

    if (logErr) {
      console.error("demo_access_log query failed:", logErr);
      return new Response(JSON.stringify({ error: "query_failed", details: logErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up names/emails from nda_signatures
    const sigIds = Array.from(
      new Set((logs ?? []).map((l) => l.nda_signature_id).filter((x): x is string => !!x)),
    );

    let sigMap = new Map<string, { name?: string; email?: string }>();
    if (sigIds.length > 0) {
      const { data: sigs } = await supabase
        .from("nda_signatures")
        .select("id, full_name, email")
        .in("id", sigIds);
      for (const s of sigs ?? []) {
        sigMap.set(s.id, { name: s.full_name, email: s.email });
      }
    }

    // Dedupe by email — keep most recent access
    const byEmail = new Map<string, any>();
    for (const log of logs ?? []) {
      const sig = log.nda_signature_id ? sigMap.get(log.nda_signature_id) : undefined;
      const key = sig?.email || `anon-${log.nda_signature_id || Math.random()}`;
      if (byEmail.has(key)) continue;
      byEmail.set(key, {
        name: sig?.name,
        email: sig?.email,
        accessCode: log.access_code,
        city: log.city,
        country: log.country,
        accessedAt: log.accessed_at,
      });
    }

    const attendees = Array.from(byEmail.values()).sort(
      (a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime(),
    );

    console.log(`[send-demo-attendees-report] ${attendees.length} attendees`);

    const { data: emailData, error: emailErr } = await supabase.functions.invoke(
      "send-transactional-email",
      {
        body: {
          templateName: "demo-attendees-report",
          recipientEmail: ADMIN_EMAIL,
          idempotencyKey: `demo-attendees-report-${new Date().toISOString().slice(0, 16)}`,
          templateData: {
            attendees,
            generatedAt: new Date().toISOString(),
          },
        },
      }
    );

    if (emailErr) {
      console.error("[send-demo-attendees-report] email error:", emailErr);
      return new Response(
        JSON.stringify({ success: false, attendee_count: attendees.length, error: emailErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-demo-attendees-report] email queued:`, JSON.stringify(emailData).slice(0, 200));
    return new Response(
      JSON.stringify({ success: true, attendee_count: attendees.length, email_data: emailData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[send-demo-attendees-report] error:", e);
    return new Response(JSON.stringify({ error: "internal_error", message: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
