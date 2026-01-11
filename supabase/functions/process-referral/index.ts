import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to send push notification to a user
async function sendPushNotification(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  notificationType: string = "referral"
) {
  try {
    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subError || !subscriptions?.length) {
      console.log(`No push subscriptions found for user ${userId}`);
      return;
    }

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return;
    }

    const payload = {
      title,
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: notificationType,
      url: "/profile",
    };

    for (const sub of subscriptions) {
      try {
        const result = await sendPushToEndpoint(
          sub.endpoint,
          sub.p256dh,
          sub.auth,
          payload,
          vapidPublicKey,
          vapidPrivateKey
        );
        console.log(`Push sent to ${userId}: ${result.success ? "success" : result.error}`);
      } catch (err) {
        console.error(`Push error for ${userId}:`, err);
      }
    }

    // Log the notification
    await supabase.from("notification_logs").insert({
      user_id: userId,
      notification_type: notificationType,
      title,
      body,
      status: "sent",
    });
  } catch (error) {
    console.error("sendPushNotification error:", error);
  }
}

// Base64 URL decode
function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = base64.length % 4;
  if (padding) {
    base64 += "=".repeat(4 - padding);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Base64 URL encode
function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Concatenate Uint8Arrays
function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Convert Uint8Array to proper ArrayBuffer
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(arr.length);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

// HKDF implementation
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const saltBuffer = salt.length ? toArrayBuffer(salt) : new ArrayBuffer(32);
  const key = await crypto.subtle.importKey("raw", saltBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", key, toArrayBuffer(ikm)));

  const infoKey = await crypto.subtle.importKey("raw", toArrayBuffer(prk), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const infoWithCounter = concat(info, new Uint8Array([1]));
  const result = new Uint8Array(await crypto.subtle.sign("HMAC", infoKey, toArrayBuffer(infoWithCounter)));

  return result.slice(0, length);
}

// Encrypt payload using Web Push encryption (aes128gcm)
async function encryptPayload(
  payload: string,
  clientPublicKeyBase64: string,
  clientAuthBase64: string
): Promise<{ encrypted: Uint8Array; serverPublicKey: Uint8Array; salt: Uint8Array }> {
  const clientPublicKey = base64UrlDecode(clientPublicKeyBase64);
  const clientAuth = base64UrlDecode(clientAuthBase64);

  const serverKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);

  const serverPublicKeyBuffer = await crypto.subtle.exportKey("raw", serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyBuffer);

  const clientKey = await crypto.subtle.importKey("raw", toArrayBuffer(clientPublicKey), { name: "ECDH", namedCurve: "P-256" }, false, []);

  const sharedSecretBuffer = await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, serverKeyPair.privateKey, 256);
  const sharedSecret = new Uint8Array(sharedSecretBuffer);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const encoder = new TextEncoder();
  const authInfo = concat(encoder.encode("WebPush: info\0"), clientPublicKey, serverPublicKey);

  const prk = await hkdf(clientAuth, sharedSecret, authInfo, 32);

  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");

  const cek = await hkdf(salt, prk, cekInfo, 16);
  const nonce = await hkdf(salt, prk, nonceInfo, 12);

  const payloadBytes = encoder.encode(payload);
  const plaintext = concat(payloadBytes, new Uint8Array([2]));

  const aesKey = await crypto.subtle.importKey("raw", toArrayBuffer(cek), { name: "AES-GCM" }, false, ["encrypt"]);

  const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(nonce) }, aesKey, toArrayBuffer(plaintext));

  const encryptedPayload = new Uint8Array(encryptedBuffer);

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);

  const header = concat(salt, recordSize, new Uint8Array([65]), serverPublicKey);

  const encrypted = concat(header, encryptedPayload);

  return { encrypted, serverPublicKey, salt };
}

// Convert ECDSA signature to JOSE format
function ecdsaSigToJose(sig: Uint8Array): Uint8Array {
  if (sig.length === 64) return sig;

  let offset = 0;
  const readByte = () => sig[offset++];

  const seq = readByte();
  if (seq !== 0x30) throw new Error("Invalid ECDSA DER signature");

  readByte(); // seqLen

  const int1 = readByte();
  if (int1 !== 0x02) throw new Error("Invalid ECDSA DER signature");
  const rLen = readByte();
  let r = sig.slice(offset, offset + rLen);
  offset += rLen;

  const int2 = readByte();
  if (int2 !== 0x02) throw new Error("Invalid ECDSA DER signature");
  const sLen = readByte();
  let s = sig.slice(offset, offset + sLen);

  while (r.length > 32 && r[0] === 0x00) r = r.slice(1);
  while (s.length > 32 && s[0] === 0x00) s = s.slice(1);

  const rOut = new Uint8Array(32);
  const sOut = new Uint8Array(32);
  rOut.set(r, 32 - r.length);
  sOut.set(s, 32 - s.length);

  return concat(rOut, sOut);
}

// Create VAPID JWT
async function createVapidJwt(
  audience: string,
  subject: string,
  publicKeyBase64: string,
  privateKeyBase64: string
): Promise<string> {
  const publicKeyBytes = base64UrlDecode(publicKeyBase64);
  const privateKeyBytes = base64UrlDecode(privateKeyBase64);

  const x = base64UrlEncode(publicKeyBytes.slice(1, 33));
  const y = base64UrlEncode(publicKeyBytes.slice(33, 65));
  const d = base64UrlEncode(privateKeyBytes);

  const jwk: JsonWebKey = { kty: "EC", crv: "P-256", x, y, d, ext: true };

  const privateKey = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 12 * 60 * 60, sub: subject };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signatureBuffer = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, new TextEncoder().encode(unsignedToken));

  const joseSig = ecdsaSigToJose(new Uint8Array(signatureBuffer));
  const signatureB64 = base64UrlEncode(joseSig);

  return `${unsignedToken}.${signatureB64}`;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

async function sendPushToEndpoint(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadString = JSON.stringify(payload);
    const { encrypted } = await encryptPayload(payloadString, p256dh, auth);

    const endpointUrl = new URL(endpoint);
    const audience = endpointUrl.origin;

    const jwt = await createVapidJwt(audience, "mailto:notifications@zensolar.app", vapidPublicKey, vapidPrivateKey);

    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "3600",
      Urgency: "normal",
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: toArrayBuffer(encrypted),
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true };
    }

    if (response.status === 410 || response.status === 404) {
      return { success: false, error: "subscription_expired" };
    }

    const responseText = await response.text();
    return { success: false, error: `${response.status}: ${responseText}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { referral_code } = await req.json();

    if (!referral_code) {
      return new Response(JSON.stringify({ error: "Referral code required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing referral code: ${referral_code} for user: ${user.id}`);

    // Look up the referrer by their referral code
    const { data: referrer, error: lookupError } = await supabase
      .from("profiles")
      .select("user_id, referral_code, display_name")
      .eq("referral_code", referral_code.toUpperCase())
      .single();

    if (lookupError || !referrer) {
      console.log(`Invalid referral code: ${referral_code}`);
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Can't refer yourself
    if (referrer.user_id === user.id) {
      return new Response(JSON.stringify({ error: "Cannot use your own referral code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has already been referred
    const { data: existingReferral } = await supabase.from("referrals").select("id").eq("referred_id", user.id).single();

    if (existingReferral) {
      return new Response(JSON.stringify({ error: "You have already been referred" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the referred user's display name
    const { data: referredProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    const referredName = referredProfile?.display_name || user.email?.split("@")[0] || "A new user";

    // Create the referral record
    const { error: insertError } = await supabase.from("referrals").insert({
      referrer_id: referrer.user_id,
      referred_id: user.id,
      tokens_rewarded: 1000,
    });

    if (insertError) {
      console.error("Referral insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to process referral" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the referred user's profile
    await supabase.from("profiles").update({ referred_by: referrer.user_id }).eq("user_id", user.id);

    console.log(`Referral processed: ${referrer.user_id} referred ${user.id}`);

    // Send push notification to the referrer (don't await - fire and forget)
    sendPushNotification(
      supabase,
      referrer.user_id,
      "🎉 Referral Reward!",
      `${referredName} just joined using your referral code! You earned 1,000 $ZSOLAR tokens.`,
      "referral"
    ).catch(err => console.error("Push notification error:", err));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Referral processed! You and your referrer each earned 1,000 $ZSOLAR!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process referral error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});