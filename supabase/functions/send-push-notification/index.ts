import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64 URL decode
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

// Base64 URL encode
function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

// Convert Uint8Array to proper ArrayBuffer (avoids SharedArrayBuffer issues)
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(arr.length);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

// HKDF (HMAC-based Key Derivation Function)
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const saltBuffer = salt.length ? toArrayBuffer(salt) : new ArrayBuffer(32);
  const key = await crypto.subtle.importKey('raw', saltBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', key, toArrayBuffer(ikm)));
  
  const infoKey = await crypto.subtle.importKey('raw', toArrayBuffer(prk), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const infoWithCounter = concat(info, new Uint8Array([1]));
  const result = new Uint8Array(await crypto.subtle.sign('HMAC', infoKey, toArrayBuffer(infoWithCounter)));
  
  return result.slice(0, length);
}

// Create info for HKDF
function createInfo(type: string, clientPublicKey: Uint8Array, serverPublicKey: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const typeBytes = encoder.encode(type);
  const nul = new Uint8Array([0]);
  
  // For aes128gcm encoding (RFC 8291)
  const keyInfo = encoder.encode('Content-Encoding: aes128gcm' + String.fromCharCode(0));
  const nonceInfo = encoder.encode('Content-Encoding: nonce' + String.fromCharCode(0));
  
  if (type === 'aes128gcm') {
    return keyInfo;
  } else if (type === 'nonce') {
    return nonceInfo;
  }
  
  // For older aesgcm encoding
  return concat(
    encoder.encode('Content-Encoding: '),
    typeBytes,
    nul,
    encoder.encode('P-256'),
    nul,
    new Uint8Array([0, 65]),
    clientPublicKey,
    new Uint8Array([0, 65]),
    serverPublicKey
  );
}

// Encrypt payload using Web Push encryption (aes128gcm)
async function encryptPayload(
  payload: string,
  clientPublicKeyBase64: string,
  clientAuthBase64: string
): Promise<{ encrypted: Uint8Array; serverPublicKey: Uint8Array; salt: Uint8Array }> {
  const clientPublicKey = base64UrlDecode(clientPublicKeyBase64);
  const clientAuth = base64UrlDecode(clientAuthBase64);
  
  // Generate server ECDH key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
  // Export server public key
  const serverPublicKeyBuffer = await crypto.subtle.exportKey('raw', serverKeyPair.publicKey);
  const serverPublicKey = new Uint8Array(serverPublicKeyBuffer);
  
  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(clientPublicKey),
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  
  // Derive shared secret using ECDH
  const sharedSecretBuffer = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientKey },
    serverKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBuffer);
  
  // Generate random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Create auth info for PRK derivation (aes128gcm uses different info)
  const encoder = new TextEncoder();
  const authInfo = concat(
    encoder.encode('WebPush: info\0'),
    clientPublicKey,
    serverPublicKey
  );
  
  // Derive PRK from auth secret and shared secret
  const prk = await hkdf(clientAuth, sharedSecret, authInfo, 32);
  
  // Derive content encryption key (CEK) and nonce
  const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = encoder.encode('Content-Encoding: nonce\0');
  
  const cek = await hkdf(salt, prk, cekInfo, 16);
  const nonce = await hkdf(salt, prk, nonceInfo, 12);
  
  // Encrypt the payload with AES-128-GCM
  const payloadBytes = encoder.encode(payload);
  
  // Add padding delimiter (0x02 for final record)
  const paddedPayload = concat(payloadBytes, new Uint8Array([2]));
  
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
    toArrayBuffer(paddedPayload)
  );
  
  const encryptedPayload = new Uint8Array(encryptedBuffer);
  
  // Build aes128gcm header: salt (16) + rs (4) + idlen (1) + keyid (65)
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096, false); // Record size as big-endian
  
  const header = concat(
    salt,
    recordSize,
    new Uint8Array([65]), // keyid length (server public key length)
    serverPublicKey
  );
  
  const encrypted = concat(header, encryptedPayload);
  
  return { encrypted, serverPublicKey, salt };
}

// Create VAPID JWT
async function createVapidAuthHeader(
  audience: string,
  subject: string,
  publicKeyBase64: string,
  privateKeyBase64: string
): Promise<string> {
  const publicKeyBytes = base64UrlDecode(publicKeyBase64);
  const privateKeyBytes = base64UrlDecode(privateKeyBase64);
  
  if (publicKeyBytes.length !== 65) {
    throw new Error(`Invalid public key length: ${publicKeyBytes.length}, expected 65`);
  }
  if (privateKeyBytes.length !== 32) {
    throw new Error(`Invalid private key length: ${privateKeyBytes.length}, expected 32`);
  }
  
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

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64UrlEncode(signature);
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

async function sendPushToEndpoint(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    // Log key details for debugging
    console.log(`VAPID public key starts with: ${vapidPublicKey.substring(0, 20)}...`);
    console.log(`Creating VAPID JWT for audience: ${audience}`);
    
    // Create VAPID JWT
    const jwt = await createVapidAuthHeader(
      audience,
      'mailto:notifications@zensolar.app',
      vapidPublicKey,
      vapidPrivateKey
    );
    
    // Encrypt payload
    const payloadJson = JSON.stringify(payload);
    console.log(`Encrypting payload: ${payloadJson.length} bytes`);
    
    const { encrypted } = await encryptPayload(payloadJson, p256dh, auth);
    console.log(`Encrypted payload: ${encrypted.length} bytes`);
    
    // VAPID authorization header
    const authorizationHeader = `vapid t=${jwt}, k=${vapidPublicKey}`;
    
    console.log(`Sending to: ${endpoint.substring(0, 60)}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authorizationHeader,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Urgency': 'normal',
      },
      body: toArrayBuffer(encrypted),
    });

    const responseText = await response.text();
    console.log(`Push response: ${response.status} ${response.statusText}`);
    if (responseText) {
      console.log(`Response body: ${responseText.substring(0, 200)}`);
    }

    if (response.status === 201 || response.status === 200) {
      console.log('Push sent successfully!');
      return { success: true };
    } else if (response.status === 410) {
      console.log('Subscription expired');
      return { success: false, error: 'subscription_expired' };
    } else {
      console.error(`Push failed: ${response.status} - ${responseText}`);
      return { success: false, error: `${response.status}: ${responseText}` };
    }
  } catch (error) {
    console.error('Push send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`VAPID keys loaded - public: ${vapidPublicKey.length} chars, private: ${vapidPrivateKey.length} chars`);

    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth validation failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const body = await req.json();
    const { 
      user_id, 
      user_ids,
      title, 
      body: messageBody, 
      notification_type = 'system',
      data = {},
      url 
    } = body;

    if (!title || !messageBody) {
      return new Response(
        JSON.stringify({ error: 'title and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUserIds = user_ids || (user_id ? [user_id] : []);
    
    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'user_id or user_ids required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    console.log(`User is admin: ${isAdmin}`);

    if (!isAdmin) {
      const targetingSelf = targetUserIds.length === 1 && targetUserIds[0] === user.id;
      if (!targetingSelf) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions for users: ${targetUserIds.join(', ')}`);

    const payload: PushPayload = {
      title,
      body: messageBody,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { ...data, url },
      tag: notification_type,
      url,
    };

    const results: Array<{ user_id: string; success: boolean; error?: string }> = [];
    const expiredSubscriptions: string[] = [];

    for (const sub of subscriptions || []) {
      console.log(`Processing subscription for user: ${sub.user_id}`);
      
      const result = await sendPushToEndpoint(
        sub.endpoint,
        sub.p256dh,
        sub.auth,
        payload,
        vapidPublicKey,
        vapidPrivateKey
      );
      
      results.push({ user_id: sub.user_id, success: result.success, error: result.error });
      
      if (result.error === 'subscription_expired') {
        expiredSubscriptions.push(sub.id);
      }

      await supabaseClient.from('notification_logs').insert({
        user_id: sub.user_id,
        title,
        body: messageBody,
        notification_type,
        status: result.success ? 'sent' : 'failed',
        data: { ...data, error: result.error },
      });
    }

    if (expiredSubscriptions.length > 0) {
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
      console.log(`Cleaned up ${expiredSubscriptions.length} expired subscriptions`);
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Push complete: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount,
        total: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
