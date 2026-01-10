import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64 URL decode
function base64UrlDecode(str: string): Uint8Array {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
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

// Import VAPID private key for signing
async function importVapidPrivateKey(
  publicKeyBase64: string,
  privateKeyBase64: string
): Promise<CryptoKey> {
  const publicKeyBytes = base64UrlDecode(publicKeyBase64);
  const privateKeyBytes = base64UrlDecode(privateKeyBase64);
  
  // Public key is 65 bytes: 0x04 || x (32 bytes) || y (32 bytes)
  // Private key is 32 bytes: d
  const x = base64UrlEncode(publicKeyBytes.slice(1, 33));
  const y = base64UrlEncode(publicKeyBytes.slice(33, 65));
  const d = base64UrlEncode(privateKeyBytes);

  const jwk: JsonWebKey = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
  };

  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
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
  _p256dh: string,
  _auth: string,
  payload: PushPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = new URL(endpoint);
    const audience = `${url.protocol}//${url.host}`;
    
    console.log(`Creating VAPID JWT for audience: ${audience}`);
    
    // Import the private key
    const privateKey = await importVapidPrivateKey(vapidPublicKey, vapidPrivateKey);
    
    // Create JWT using djwt library
    const now = Math.floor(Date.now() / 1000);
    const jwt = await create(
      { alg: 'ES256', typ: 'JWT' },
      {
        aud: audience,
        exp: now + 12 * 60 * 60,
        sub: 'mailto:notifications@zensolar.app',
      },
      privateKey
    );
    
    console.log(`JWT created successfully`);

    // Prepare payload
    const payloadJson = JSON.stringify(payload);
    
    // VAPID authorization header format
    const authorizationHeader = `vapid t=${jwt}, k=${vapidPublicKey}`;
    
    console.log(`Sending to: ${endpoint.substring(0, 60)}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authorizationHeader,
        'Content-Type': 'application/json',
        'TTL': '86400',
        'Urgency': 'normal',
      },
      body: payloadJson,
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

    // Validate the user's JWT token
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

    // Get target user IDs
    const targetUserIds = user_ids || (user_id ? [user_id] : []);
    
    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'user_id or user_ids required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin (can send to anyone) or restrict to self only
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    console.log(`User is admin: ${isAdmin}`);

    // Non-admins can only send notifications to themselves
    if (!isAdmin) {
      const targetingSelf = targetUserIds.length === 1 && targetUserIds[0] === user.id;
      if (!targetingSelf) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch subscriptions for target users
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

      // Log notification
      await supabaseClient.from('notification_logs').insert({
        user_id: sub.user_id,
        title,
        body: messageBody,
        notification_type,
        status: result.success ? 'sent' : 'failed',
        data: { ...data, error: result.error },
      });
    }

    // Clean up expired subscriptions
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
