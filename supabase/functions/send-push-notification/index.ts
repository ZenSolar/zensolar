import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64 URL to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Create JWT for VAPID authentication
async function createVapidJwt(audience: string, subject: string, privateKeyBase64: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key
  const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64);
  const privateKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes.buffer as ArrayBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    encoder.encode(unsignedToken)
  );

  // Convert signature to URL-safe base64
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

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
    
    // Create VAPID JWT
    const jwt = await createVapidJwt(audience, 'mailto:notifications@zensolar.app', vapidPrivateKey);
    
    // Prepare payload
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
    
    // For simplicity, send unencrypted payload (most push services accept this for testing)
    // In production, you'd want to encrypt using the p256dh and auth keys
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL': '86400',
        'Urgency': 'normal',
      },
      body: payloadBytes,
    });

    if (response.status === 201 || response.status === 200) {
      return { success: true };
    } else if (response.status === 410) {
      // Subscription expired
      return { success: false, error: 'subscription_expired' };
    } else {
      const errorText = await response.text();
      console.error(`Push failed: ${response.status} - ${errorText}`);
      return { success: false, error: `${response.status}: ${errorText}` };
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

    console.log(`Sending push to ${subscriptions?.length || 0} subscriptions`);

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
      JSON.stringify({ error: 'Failed to send notification. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
