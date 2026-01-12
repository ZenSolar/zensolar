import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function sends push notifications to all admin users when a user connects
// an energy account (Tesla, Enphase, SolarEdge, Wallbox)

const providerNames: Record<string, string> = {
  tesla: "Tesla",
  enphase: "Enphase",
  solaredge: "SolarEdge", 
  wallbox: "Wallbox",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("Account connected notification request:", body);

    const { user_id, user_email, provider, device_count } = body;
    
    if (!user_id || !provider) {
      console.log("Missing required fields");
      return new Response(JSON.stringify({ error: "user_id and provider required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const providerDisplay = providerNames[provider] || provider;
    const deviceInfo = device_count ? ` (${device_count} device${device_count > 1 ? 's' : ''})` : '';

    console.log(`User ${user_email || user_id} connected ${providerDisplay}${deviceInfo}`);

    // Get all admin users
    const { data: adminRoles, error: adminError } = await supabaseClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admin users:", adminError);
      return new Response(JSON.stringify({ error: "Failed to fetch admins" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found to notify");
      return new Response(JSON.stringify({ message: "No admins to notify" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserIds = adminRoles.map(r => r.user_id);
    console.log(`Found ${adminUserIds.length} admin(s) to notify`);

    // Get push subscriptions for all admins
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("push_subscriptions")
      .select("*")
      .in("user_id", adminUserIds);

    if (subError) {
      console.error("Error fetching admin subscriptions:", subError);
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for admins");
      return new Response(JSON.stringify({ message: "No admin subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${subscriptions.length} admin subscription(s)`);

    // Get VAPID keys
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(JSON.stringify({ error: "Push not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send push notifications to each admin subscription
    const results = [];
    const notificationTitle = `⚡ ${providerDisplay} Connected!`;
    const notificationBody = user_email 
      ? `${user_email} connected their ${providerDisplay} account${deviceInfo}`
      : `A user connected their ${providerDisplay} account${deviceInfo}`;
    
    for (const sub of subscriptions) {
      try {
        const result = await sendPushNotification(
          sub.endpoint,
          sub.p256dh,
          sub.auth,
          {
            title: notificationTitle,
            body: notificationBody,
            icon: "/pwa-192x192.png",
            badge: "/pwa-192x192.png",
            data: { 
              url: "/admin",
              type: "account_connected",
              user_id: user_id,
              user_email: user_email,
              provider: provider
            },
            tag: `account-connected-${provider}`,
          },
          vapidPublicKey,
          vapidPrivateKey
        );
        
        results.push({ user_id: sub.user_id, success: result.success, error: result.error });
        
        // Clean up expired subscriptions
        if (result.error === "subscription_expired") {
          await supabaseClient
            .from("push_subscriptions")
            .delete()
            .eq("id", sub.id);
        }
      } catch (error) {
        console.error(`Failed to send to subscription ${sub.id}:`, error);
        results.push({ user_id: sub.user_id, success: false, error: String(error) });
      }
    }

    // Log notification for each admin
    for (const adminId of adminUserIds) {
      await supabaseClient.from("notification_logs").insert({
        user_id: adminId,
        notification_type: "account_connected",
        title: notificationTitle,
        body: notificationBody,
        data: { user_id, user_email, provider, device_count },
        status: "sent",
      });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Sent ${successCount}/${results.length} notifications successfully`);

    return new Response(JSON.stringify({ 
      success: true, 
      sent: successCount,
      total: results.length,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Account connected notification error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================================
// Push notification helpers (copied from notify-new-user for standalone use)
// ============================================================================

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

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

function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(arr.length);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const saltBuffer = salt.length ? toArrayBuffer(salt) : new ArrayBuffer(32);
  const key = await crypto.subtle.importKey('raw', saltBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', key, toArrayBuffer(ikm)));
  
  const infoKey = await crypto.subtle.importKey('raw', toArrayBuffer(prk), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const infoWithCounter = concat(info, new Uint8Array([1]));
  const result = new Uint8Array(await crypto.subtle.sign('HMAC', infoKey, toArrayBuffer(infoWithCounter)));
  
  return result.slice(0, length);
}

async function encryptPayload(
  payload: string,
  clientPublicKeyBase64: string,
  clientAuthBase64: string
): Promise<{ encrypted: Uint8Array; serverPublicKey: Uint8Array; salt: Uint8Array }> {
  const clientPublicKey = base64UrlDecode(clientPublicKeyBase64);
  const clientAuth = base64UrlDecode(clientAuthBase64);
  
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  const serverPublicKeyBuffer = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyBuffer);
  
  const clientKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(clientPublicKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  const sharedSecretBuffer = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientKey },
    serverKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBuffer);
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const encoder = new TextEncoder();
  const authInfo = concat(
    encoder.encode('WebPush: info\0'),
    clientPublicKey,
    serverPublicKey
  );
  
  const prk = await hkdf(clientAuth, sharedSecret, authInfo, 32);
  
  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = encoder.encode('Content-Encoding: nonce\0');
  
  const cek = await hkdf(salt, prk, cekInfo, 16);
  const nonce = await hkdf(salt, prk, nonceInfo, 12);
  
  const payloadBytes = encoder.encode(payload);
  const plaintext = concat(payloadBytes, new Uint8Array([2]));

  const aesKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(cek),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(nonce) },
    aesKey,
    toArrayBuffer(plaintext)
  );

  const encryptedPayload = new Uint8Array(encryptedBuffer);

  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false);

  const header = concat(
    salt,
    recordSize,
    new Uint8Array([65]),
    serverPublicKey
  );

  const encrypted = concat(header, encryptedPayload);

  return { encrypted, serverPublicKey, salt };
}

function ecdsaSigToJose(sig: Uint8Array): Uint8Array {
  if (sig.length === 64) return sig;

  let offset = 0;
  const readByte = () => sig[offset++];

  const seq = readByte();
  if (seq !== 0x30) throw new Error('Invalid ECDSA DER signature');

  readByte(); // seqLen

  const int1 = readByte();
  if (int1 !== 0x02) throw new Error('Invalid ECDSA DER signature');
  const rLen = readByte();
  let r = sig.slice(offset, offset + rLen);
  offset += rLen;

  const int2 = readByte();
  if (int2 !== 0x02) throw new Error('Invalid ECDSA DER signature');
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

  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
    ext: true,
  };

  const privateKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const signatureBuffer = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const joseSig = ecdsaSigToJose(new Uint8Array(signatureBuffer));
  const signatureB64 = base64UrlEncode(joseSig);

  return `${unsignedToken}.${signatureB64}`;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  tag?: string;
  url?: string;
}

async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Push] Sending to endpoint: ${endpoint.substring(0, 60)}...`);

    const payloadString = JSON.stringify(payload);
    const { encrypted } = await encryptPayload(payloadString, p256dh, auth);

    const endpointUrl = new URL(endpoint);
    const audience = endpointUrl.origin;

    const jwt = await createVapidJwt(
      audience,
      'mailto:notifications@zensolar.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '3600',
      'Urgency': 'normal',
      'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: toArrayBuffer(encrypted),
    });

    console.log(`[Push] Response: ${response.status}`);

    if (response.status === 201 || response.status === 200) {
      return { success: true };
    }

    if (response.status === 410 || response.status === 404) {
      return { success: false, error: 'subscription_expired' };
    }

    const responseText = await response.text();
    return { success: false, error: `${response.status}: ${responseText}` };
  } catch (error) {
    console.error('[Push] send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
