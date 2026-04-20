import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * notify-mint-access-request
 *
 * Logs a row into mint_access_requests when a VIP demo viewer taps the
 * "Want to mint? Text Joe" FAB. Notifications (email/push) are intentionally
 * skipped — the SMS link itself is the notification channel.
 */

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
