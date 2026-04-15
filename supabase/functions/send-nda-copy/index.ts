const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const BodySchema = z.object({
  recipientEmail: z.string().email(),
  recipientName: z.string().min(1).max(255),
  signedAt: z.string(),
  ndaVersion: z.string(),
});

const NDA_TEXT = `CONFIDENTIALITY AGREEMENT

This Confidentiality Agreement ("Agreement") is entered into as of the date of electronic signature below, between ZenSolar, LLC, a Texas limited liability company ("ZenSolar"), and the undersigned recipient ("Recipient").

1. Purpose. ZenSolar is granting Recipient access to a confidential demonstration of its clean energy technology platform, including patent-pending systems and methods (collectively, the "Demo"), solely for evaluation purposes (the "Purpose").

2. Confidential Information. "Confidential Information" means all non-public information disclosed through or relating to the Demo, including but not limited to: software interfaces, system architecture, tokenization mechanisms, patent-pending technology (U.S. Patent Application No. 19/634,402), blockchain integrations, business strategies, and any materials marked or reasonably understood to be confidential. Confidential Information does not include information that: (a) becomes publicly available through no fault of Recipient; (b) was already known to Recipient prior to disclosure; or (c) is independently developed by Recipient without use of Confidential Information.

3. Obligations. Recipient shall: (a) use Confidential Information solely for the Purpose; (b) not disclose Confidential Information to any third party without ZenSolar's prior written consent; and (c) protect Confidential Information with at least the same degree of care used for its own confidential information, but no less than reasonable care.

4. No Reverse Engineering. Recipient shall not reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, algorithms, data structures, or underlying ideas of any software, technology, or systems demonstrated in or accessible through the Demo. Recipient shall not attempt to replicate, recreate, or build competing products or services based on the Confidential Information or the Demo.

5. Intellectual Property. No disclosure hereunder grants Recipient any license, right, or interest in ZenSolar's intellectual property, including its patent-pending technology, trademarks (Mint-on-Proof™, Proof-of-Delta™, Proof-of-Origin™), or trade secrets.

6. Term & Governing Law. This Agreement remains in effect for five (5) years from the date of signature. This Agreement is governed by the laws of the State of Texas, with exclusive jurisdiction in Travis County, Texas.

7. Remedies. Recipient acknowledges that breach of this Agreement may cause irreparable harm, and ZenSolar shall be entitled to equitable relief in addition to any other remedies available at law.`;

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
    const signedDate = new Date(signedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });

    // Build a simple HTML email with the NDA text
    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="font-size:20px;color:#1a1a2e;margin:0 0 4px;">ZenSolar</h1>
      <p style="font-size:12px;color:#666;margin:0;">Confidentiality Agreement — Signed Copy</p>
    </div>

    <div style="background:#f8faf9;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="font-size:13px;color:#333;margin:0 0 12px;">
        <strong>Signed by:</strong> ${recipientName}<br/>
        <strong>Email:</strong> ${recipientEmail}<br/>
        <strong>Date:</strong> ${signedDate}<br/>
        <strong>NDA Version:</strong> ${ndaVersion}
      </p>
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px;">
      <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:12px;color:#333;line-height:1.6;margin:0;">${NDA_TEXT}</pre>
    </div>

    <div style="text-align:center;padding-top:16px;border-top:1px solid #e2e8f0;">
      <p style="font-size:11px;color:#999;margin:0;">
        This is an automated copy of the confidentiality agreement you signed electronically.
        <br/>Please retain this email for your records.
      </p>
      <p style="font-size:11px;color:#999;margin:8px 0 0;">
        © ${new Date().getFullYear()} ZenSolar, LLC. All rights reserved.
        <br/>Patent Pending — U.S. Application No. 19/634,402
      </p>
    </div>
  </div>
</body>
</html>`;

    // Use the LOVABLE_API_KEY to send via Lovable's email gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For now, log the signature and return success — email sending will be
    // activated once the zen.solar domain is verified
    console.log("NDA signed:", { recipientEmail, recipientName, signedAt, ndaVersion });

    return new Response(
      JSON.stringify({ success: true, message: "NDA recorded. Email will be sent once domain is configured." }),
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
