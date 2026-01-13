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

// Convert WebCrypto ECDSA signature to JOSE (r||s) 64-byte format
function ecdsaSigToJose(sig: Uint8Array): Uint8Array {
  if (sig.length === 64) return sig;

  let offset = 0;
  const readByte = () => sig[offset++];

  const seq = readByte();
  if (seq !== 0x30) throw new Error('Invalid ECDSA DER signature (no sequence)');

  const seqLen = readByte();
  if (seqLen + 2 !== sig.length) {
    // continue anyway
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

    const responseText = await response.text();
    console.log(`[Push] Response: ${response.status} ${response.statusText}`);

    if (response.status === 201 || response.status === 200) {
      return { success: true };
    }

    if (response.status === 410 || response.status === 404) {
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
    console.log('[Reminder] Starting 24-hour reminder notification check...');

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('[Reminder] VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'Push notifications not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Find users who:
    // 1. Signed up between 24-25 hours ago (to catch them in a 1-hour window)
    // 2. Have NOT connected any energy accounts (tesla, enphase, solaredge, wallbox)
    // 3. Have not received this reminder already (check notification_logs)
    
    const now = new Date();
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(`[Reminder] Looking for users created between ${twentyFiveHoursAgo.toISOString()} and ${twentyFourHoursAgo.toISOString()}`);

    // Get profiles of users who signed up 24-25 hours ago with no energy accounts connected
    const { data: eligibleProfiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id, display_name, tesla_connected, enphase_connected, solaredge_connected, wallbox_connected, created_at')
      .gte('created_at', twentyFiveHoursAgo.toISOString())
      .lte('created_at', twentyFourHoursAgo.toISOString())
      .or('tesla_connected.is.null,tesla_connected.eq.false')
      .or('enphase_connected.is.null,enphase_connected.eq.false')
      .or('solaredge_connected.is.null,solaredge_connected.eq.false')
      .or('wallbox_connected.is.null,wallbox_connected.eq.false');

    if (profilesError) {
      console.error('[Reminder] Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles', details: profilesError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter to only users with NO energy accounts connected
    const usersWithNoAccounts = (eligibleProfiles || []).filter(profile => 
      !profile.tesla_connected && 
      !profile.enphase_connected && 
      !profile.solaredge_connected && 
      !profile.wallbox_connected
    );

    console.log(`[Reminder] Found ${usersWithNoAccounts.length} users with no energy accounts connected`);

    if (usersWithNoAccounts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users to notify', notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userIds = usersWithNoAccounts.map(p => p.user_id);

    // Check which users have already received this reminder
    const { data: existingLogs, error: logsError } = await supabaseClient
      .from('notification_logs')
      .select('user_id')
      .in('user_id', userIds)
      .eq('notification_type', '24h_connect_reminder');

    if (logsError) {
      console.error('[Reminder] Error checking notification logs:', logsError);
    }

    const alreadyNotifiedUserIds = new Set((existingLogs || []).map(log => log.user_id));
    const usersToNotify = usersWithNoAccounts.filter(p => !alreadyNotifiedUserIds.has(p.user_id));

    console.log(`[Reminder] ${usersToNotify.length} users need to be notified (${alreadyNotifiedUserIds.size} already received reminder)`);

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'All eligible users already notified', notified: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push subscriptions for these users
    const userIdsToNotify = usersToNotify.map(p => p.user_id);
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIdsToNotify);

    if (subError) {
      console.error('[Reminder] Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Reminder] Found ${subscriptions?.length || 0} push subscriptions for ${userIdsToNotify.length} users`);

    // Send the notification
    const payload: PushPayload = {
      title: '⚡ Your solar rewards are waiting!',
      body: "You're one step away from earning $ZSOLAR tokens! Connect your Tesla, Enphase, or SolarEdge account to start turning your clean energy into crypto rewards.",
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: '24h_connect_reminder',
      url: '/',
      data: { type: '24h_connect_reminder' },
    };

    const results: Array<{ user_id: string; success: boolean; error?: string }> = [];
    const expiredSubscriptions: string[] = [];
    const notifiedUserIds = new Set<string>();

    for (const sub of subscriptions || []) {
      console.log(`[Reminder] Sending reminder to user: ${sub.user_id}`);
      
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

      if (result.success) {
        notifiedUserIds.add(sub.user_id);
      }

      if (result.error === 'subscription_expired') {
        expiredSubscriptions.push(sub.id);
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      console.log(`[Reminder] Cleaning up ${expiredSubscriptions.length} expired subscriptions`);
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
    }

    // Log notifications for users who were successfully notified
    for (const userId of notifiedUserIds) {
      await supabaseClient.from('notification_logs').insert({
        user_id: userId,
        notification_type: '24h_connect_reminder',
        title: payload.title,
        body: payload.body,
        data: payload.data,
        status: 'sent',
      });
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`[Reminder] Sent ${successCount}/${results.length} notifications successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount} reminder notifications`,
        notified: successCount,
        total_eligible: usersToNotify.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Reminder] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
