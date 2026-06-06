// Edge function: founder-doc-download
// Issues a short-lived signed URL for a file in the private `founder-docs`
// storage bucket. Access requires either:
//   (a) an authenticated user with the `founder` role, OR
//   (b) an email address that has signed the NDA (check_nda_signed RPC).
//
// This replaces the previous public `/founder-docs/...` static-file path so
// direct URL access without authorization no longer works.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_FILES = new Set([
  "seed-ask-lyndon-v8.1final.pdf",
  "seed-ask-lyndon-v8final.pdf",
  "seed-ask-lyndon-v8.pdf",
  "seed-ask-lyndon-v7.pdf",
  "seed-ask-lyndon-v7-1.pdf",
  "seed-ask-lyndon-v7-2.pdf",
  "seed-ask-lyndon-v6.pdf",
  "seed-ask-lyndon-v5.pdf",
  "seed-ask-lyndon-v4.pdf",
  "seed-ask-lyndon-v2.pdf",
  "seed-ask-lyndon-v1.pdf",
]);

const SIGNED_URL_TTL_SEC = 300;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  let body: { filename?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const filename = (body.filename ?? "").trim();
  if (!filename || !ALLOWED_FILES.has(filename)) {
    return json(400, { error: "invalid_filename" });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  let authorized = false;
  let authMode: "founder" | "nda" | null = null;

  // (a) authenticated founder?
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    });
    const { data: claimsData } = await userClient.auth.getClaims(token);
    const uid = claimsData?.claims?.sub as string | undefined;
    if (uid) {
      const { data: isFounder } = await admin.rpc("is_founder", {
        _user_id: uid,
      });
      if (isFounder === true) {
        authorized = true;
        authMode = "founder";
      }
    }
  }

  // (b) NDA-signed email?
  if (!authorized) {
    const email = (body.email ?? "").toLowerCase().trim();
    if (email) {
      const { data: signed, error } = await admin.rpc("check_nda_signed", {
        _email: email,
      });
      if (!error && signed === true) {
        authorized = true;
        authMode = "nda";
      }
    }
  }

  if (!authorized) {
    return json(401, { error: "unauthorized" });
  }

  const { data: signedData, error: signedErr } = await admin.storage
    .from("founder-docs")
    .createSignedUrl(filename, SIGNED_URL_TTL_SEC);

  if (signedErr || !signedData?.signedUrl) {
    return json(500, { error: "sign_failed", detail: signedErr?.message });
  }

  return json(200, {
    url: signedData.signedUrl,
    expires_in: SIGNED_URL_TTL_SEC,
    auth_mode: authMode,
  });
});
