import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * notify-mint-access-request
 *
 * Triggered when a VIP demo viewer taps the "Want to mint? Text Joe" FAB.
 * Inserts a row into mint_access_requests, then sends push + email to admins.
 *
 * The SMS link is opened client-side — this function only handles logging + notification.
 */

const ADMIN_EMAIL = "jo@zen.solar";

interface RequestBody {
  access_code?: string;
  requester_email?: string;
  requester_name?: string;
  source?: string;
  user_agent?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as RequestBody;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const { data: inserted, error: insertErr } = await supabase
      .from("mint_access_requests")
      .insert({
        access_code: body.access_code ?? null,
        requester_email: body.requester_email ?? null,
        requester_name: body.requester_name ?? null,
        source: body.source ?? "live_mirror_fab",
        user_agent: body.user_agent ?? null,
        ip_address: ip,
      })
      .select("id, created_at")
      .single();

    if (insertErr) {
      console.error("mint_access_requests insert failed:", insertErr);
      return new Response(JSON.stringify({ error: "insert_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requesterLabel = body.requester_name || body.requester_email || body.access_code || "A VIP";

    // Find admin user_ids
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminIds = (adminRoles ?? []).map((r) => r.user_id);

    // Push notification
    if (adminIds.length > 0) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            user_ids: adminIds,
            title: `⚡ ${requesterLabel} wants to mint`,
            body: `Mint access requested from ${body.access_code || "demo"}. Tap to follow up.`,
            notification_type: "mint_access_request",
            data: { url: "/admin", request_id: inserted.id },
          }),
        });
      } catch (e) {
        console.error("push failed:", e);
      }
    }

    // Email via supabase-js to handle auth correctly across signing-key formats.
    try {
      const { data: emailData, error: emailErr } = await supabase.functions.invoke(
        "send-transactional-email",
        {
          body: {
            templateName: "mint-access-request",
            recipientEmail: ADMIN_EMAIL,
            idempotencyKey: `mint-request-${inserted.id}`,
            templateData: {
              requesterName: body.requester_name,
              requesterEmail: body.requester_email,
              accessCode: body.access_code,
              requestedAt: inserted.created_at,
              source: body.source ?? "live_mirror_fab",
            },
          },
        }
      );
      if (emailErr) {
        console.error("[notify-mint-access-request] email error:", emailErr);
      } else {
        console.log(`[notify-mint-access-request] email queued:`, JSON.stringify(emailData).slice(0, 200));
      }
    } catch (e) {
      console.error("email failed:", e);
    }

    return new Response(JSON.stringify({ success: true, request_id: inserted.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[notify-mint-access-request] error:", e);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
