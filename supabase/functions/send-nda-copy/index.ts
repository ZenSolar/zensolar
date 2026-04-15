import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1).max(255),
  signedAt: z.string(),
  ndaVersion: z.string(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { recipientEmail, recipientName, signedAt, ndaVersion } = parsed.data;

    // Use the transactional email system to send the NDA copy
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Invoke the transactional email sender with the NDA template
    const idempotencyKey = `nda-copy-${recipientEmail}-${signedAt}`;
    const { error: invokeError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'nda-signed-copy',
        recipientEmail: recipientEmail,
        idempotencyKey,
        templateData: {
          recipientName,
          recipientEmail,
          signedAt,
          ndaVersion,
        },
      },
    });

    if (invokeError) {
      console.error("send-transactional-email invoke error:", invokeError);
      // Still return success — NDA was recorded, email is best-effort
      return new Response(
        JSON.stringify({ success: true, emailQueued: false, message: "NDA recorded. Email delivery pending domain verification." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("NDA copy email queued:", { recipientEmail, recipientName, signedAt, ndaVersion });

    return new Response(
      JSON.stringify({ success: true, emailQueued: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-nda-copy error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
