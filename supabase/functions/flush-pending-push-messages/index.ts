import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingPushMessage {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Backend is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);

    if (authError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { data: messages, error: messagesError } = await supabase
      .from("pending_push_messages")
      .select("id,user_id,title,body,data")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("[flush-pending-push-messages] queue read failed:", messagesError);
      return new Response(JSON.stringify({ error: "Failed to read pending messages" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ id: string; delivered: boolean; error?: string }> = [];

    for (const message of (messages ?? []) as PendingPushMessage[]) {
      try {
        const payloadData = message.data ?? {};
        const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            user_id: message.user_id,
            title: message.title,
            body: message.body,
            notification_type: "queued_message",
            data: payloadData,
            url: typeof payloadData.url === "string" ? payloadData.url : undefined,
          }),
        });

        const pushBody = await pushRes.json().catch(() => ({}));
        const delivered = pushRes.ok && pushBody?.success === true;

        await supabase
          .from("pending_push_messages")
          .update({
            status: delivered ? "sent" : "error",
            delivered_at: new Date().toISOString(),
            data: delivered
              ? payloadData
              : { ...payloadData, error: pushBody?.error ?? `Push failed with ${pushRes.status}` },
          })
          .eq("id", message.id);

        results.push({
          id: message.id,
          delivered,
          error: delivered ? undefined : pushBody?.error ?? `Push failed with ${pushRes.status}`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await supabase
          .from("pending_push_messages")
          .update({
            status: "error",
            delivered_at: new Date().toISOString(),
            data: { ...(message.data ?? {}), error: errorMessage },
          })
          .eq("id", message.id);

        results.push({ id: message.id, delivered: false, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: messages?.length ?? 0,
        delivered: results.filter((result) => result.delivered).length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[flush-pending-push-messages] error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
