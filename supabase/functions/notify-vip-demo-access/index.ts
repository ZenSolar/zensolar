import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * notify-vip-demo-access
 *
 * Sends a ONE-TIME push + email alert when a VIP access code (TODD-2026, etc.)
 * is used for the first time. Idempotent via the vip_code_notifications table:
 * if a row already exists for this code, no notification is sent.
 *
 * Trigger: invoked from NdaSignatureStep.tsx after a successful NDA + demo_access_log insert.
 */

const VIP_CODES = new Set<string>(["TODD-2026"]);
const ADMIN_EMAIL = "jo@zen.solar";

interface RequestBody {
  access_code: string;
  signer_name?: string;
  signer_email?: string;
  signed_at?: string;
  city?: string;
  region?: string;
  country?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as RequestBody;
    const code = (body.access_code || "").trim().toUpperCase();

    if (!code || !VIP_CODES.has(code)) {
      // Not a VIP code — silently no-op so we can call this for every NDA without branching upstream.
      return new Response(JSON.stringify({ skipped: "not_vip_code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency check — only fire once per VIP code, ever.
    const { data: existing } = await supabase
      .from("vip_code_notifications")
      .select("id")
      .eq("access_code", code)
      .maybeSingle();

    if (existing) {
      console.log(`[notify-vip-demo-access] ${code} already notified — skipping`);
      return new Response(JSON.stringify({ skipped: "already_notified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert the lock row FIRST so concurrent calls can't double-fire.
    const { error: insertErr } = await supabase
      .from("vip_code_notifications")
      .insert({
        access_code: code,
        signer_email: body.signer_email ?? null,
        signer_name: body.signer_name ?? null,
      });

    if (insertErr) {
      // Most likely a unique-constraint race — another invocation won. Treat as already notified.
      console.log(`[notify-vip-demo-access] insert race for ${code}: ${insertErr.message}`);
      return new Response(JSON.stringify({ skipped: "race_lost" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signerLabel = body.signer_name || body.signer_email || "A VIP";

    // Find admin user_ids to push to.
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = (adminRoles ?? []).map((r) => r.user_id);

    // Send push notification (best-effort, non-blocking style)
    if (adminIds.length > 0) {
      try {
        const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            user_ids: adminIds,
            title: `🎯 ${signerLabel} opened the demo`,
            body: `${code} just used for the first time. They're viewing your live mirror now.`,
            notification_type: "vip_demo_access",
            data: { url: "/admin", access_code: code, signer_email: body.signer_email },
          }),
        });
        console.log(`[notify-vip-demo-access] push status: ${pushRes.status}`);
      } catch (e) {
        console.error("[notify-vip-demo-access] push failed:", e);
      }
    }

    // Send transactional email
    // send-transactional-email has verify_jwt=true, so we need BOTH apikey + Authorization headers.
    try {
      const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          templateName: "vip-access-alert",
          recipientEmail: ADMIN_EMAIL,
          idempotencyKey: `vip-alert-${code}`,
          templateData: {
            accessCode: code,
            signerName: body.signer_name,
            signerEmail: body.signer_email,
            signedAt: body.signed_at ?? new Date().toISOString(),
            city: body.city,
            region: body.region,
            country: body.country,
          },
        }),
      });
      const emailText = await emailRes.text().catch(() => "");
      console.log(`[notify-vip-demo-access] email status: ${emailRes.status} body: ${emailText.slice(0, 200)}`);
    } catch (e) {
      console.error("[notify-vip-demo-access] email failed:", e);
    }

    return new Response(JSON.stringify({ success: true, code }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[notify-vip-demo-access] error:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
