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

// Convert Uint8Array to proper ArrayBuffer
function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(arr.length);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

// HKDF implementation
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const saltBuffer = salt.length ? toArrayBuffer(salt) : new ArrayBuffer(32);
  const key = await crypto.subtle.importKey('raw', saltBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const prk = new Uint8Array(await crypto.subtle.sign('HMAC', key, toArrayBuffer(ikm)));
  
  const infoKey = await crypto.subtle.importKey('raw', toArrayBuffer(prk), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const infoWithCounter = concat(info, new Uint8Array([1]));
  const result = new Uint8Array(await crypto.subtle.sign('HMAC', infoKey, toArrayBuffer(infoWithCounter)));
  
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
  
  // Generate server ECDH key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  
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
  
  // Create auth info for PRK derivation
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

  // RFC8188 (aes128gcm): plaintext = data + padding delimiter + 0x00 padding.
  // For a single-record message we can send minimal padding: just the delimiter.
  // The *last* record delimiter MUST be 0x02.
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

  // Build aes128gcm body: salt (16) + rs (4) + idlen (1) + keyid (65) + ciphertext
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

// Convert WebCrypto ECDSA signature to JOSE (r||s) 64-byte format.
// WebCrypto commonly returns ASN.1 DER for ECDSA.
function ecdsaSigToJose(sig: Uint8Array): Uint8Array {
  if (sig.length === 64) return sig;

  // DER format: 0x30 totalLen 0x02 rLen rBytes 0x02 sLen sBytes
  let offset = 0;
  const readByte = () => sig[offset++];

  const seq = readByte();
  if (seq !== 0x30) throw new Error('Invalid ECDSA DER signature (no sequence)');

  // total length (short form is enough for ES256)
  const seqLen = readByte();
  if (seqLen + 2 !== sig.length) {
    // some implementations may not match exactly; continue anyway
  }

  const int1 = readByte();
  if (int1 !== 0x02) throw new Error('Invalid ECDSA DER signature (no r int)');
  const rLen = readByte();
  let r = sig.slice(offset, offset + rLen);
  offset += rLen;

  const int2 = readByte();
  if (int2 !== 0x02) throw new Error('Invalid ECDSA DER signature (no s int)');
  const sLen = readByte();
  let s = sig.slice(offset, offset + sLen);

  // Strip leading zeros if present
  while (r.length > 32 && r[0] === 0x00) r = r.slice(1);
  while (s.length > 32 && s[0] === 0x00) s = s.slice(1);

  // Left pad to 32 bytes
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

async function sendPushToEndpoint(
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

    // Get audience from endpoint URL
    const endpointUrl = new URL(endpoint);
    const audience = endpointUrl.origin;

    // Create VAPID JWT
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

    console.log(`[Push] POST to ${endpoint.substring(0, 60)}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: toArrayBuffer(encrypted),
    });

    const responseText = await response.text();
    console.log(`[Push] Response: ${response.status} ${response.statusText}`);
    if (responseText) {
      console.log(`[Push] Body: ${responseText.substring(0, 200)}`);
    }

    if (response.status === 201 || response.status === 200) {
      return { success: true };
    }

    if (response.status === 410 || response.status === 404) {
      console.log('[Push] Subscription expired/invalid');
      return { success: false, error: 'subscription_expired' };
    }

    return { success: false, error: `${response.status}: ${responseText}` };
  } catch (error) {
    console.error('[Push] send error:', error);
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
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Allow system/server-side calls using the service role key directly
    const isServiceRoleCall = token === serviceRoleKey;

    let userId: string;

    if (isServiceRoleCall) {
      // Server-to-server call (e.g. from tesla-charge-monitor cron)
      // Trust the user_id provided in the body
      userId = 'system';
      console.log('[Push] Service role call — system notification mode');
    } else {
      const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);

      if (authError || !claimsData?.claims) {
        console.error('Auth validation failed:', authError?.message || 'No claims');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = claimsData.claims.sub as string;
      console.log(`Authenticated user: ${userId}`);
    }

    const body = await req.json();
    const {
      user_id,
      user_ids,
      endpoint: targetEndpoint,
      title,
      body: messageBody,
      notification_type = 'system',
      data = {},
      url,
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

    if (!isServiceRoleCall) {
      const { data: isAdmin } = await supabaseClient.rpc('has_role', {
        _user_id: userId,
        _role: 'admin'
      });

      console.log(`User is admin: ${isAdmin}`);

      if (!isAdmin) {
        const targetingSelf = targetUserIds.length === 1 && targetUserIds[0] === userId;
        if (!targetingSelf) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    let subQuery = supabaseClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds);

    if (typeof targetEndpoint === 'string' && targetEndpoint.length > 0) {
      console.log('[Push] Targeting specific endpoint (current device)');
      subQuery = subQuery.eq('endpoint', targetEndpoint);
    }

    const { data: subscriptions, error: subError } = await subQuery;

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

      results.push({
        user_id: sub.user_id,
        success: result.success,
        error: result.error,
      });

      if (result.error === 'subscription_expired') {
        expiredSubscriptions.push(sub.id);
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      console.log(`Cleaning up ${expiredSubscriptions.length} expired subscriptions`);
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
    }

    // Log notification
    for (const targetId of targetUserIds) {
      await supabaseClient.from('notification_logs').insert({
        user_id: targetId,
        notification_type,
        title,
        body: messageBody,
        data: { url, ...data },
        sent_at: new Date().toISOString(),
        status: results.some(r => r.success) ? 'sent' : 'failed',
      });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Push complete: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sent: successCount,
        failed: results.length - successCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Push notification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
