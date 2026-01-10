import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Convert ArrayBuffer to URL-safe Base64
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert JWK base64url to standard base64url (they should be the same, but ensure consistency)
function normalizeBase64Url(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate ECDSA P-256 key pair for VAPID
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true, // extractable
      ['sign', 'verify']
    );

    // Export the public key in raw format (uncompressed point: 0x04 || x || y = 65 bytes)
    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const publicKeyBase64 = arrayBufferToBase64Url(publicKeyRaw);

    // Export the private key as JWK to get the 'd' value directly
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    
    if (!privateKeyJwk.d) {
      throw new Error('Failed to extract private key');
    }
    
    // The 'd' value in JWK is already base64url encoded
    const privateKeyBase64 = normalizeBase64Url(privateKeyJwk.d);
    
    // Verify the key lengths
    const publicKeyBytes = base64UrlToUint8Array(publicKeyBase64);
    const privateKeyBytes = base64UrlToUint8Array(privateKeyBase64);
    
    console.log(`VAPID keys generated - public: ${publicKeyBytes.length} bytes (${publicKeyBase64.length} chars), private: ${privateKeyBytes.length} bytes (${privateKeyBase64.length} chars)`);

    // Verify we can recreate the key pair and sign with it
    const x = normalizeBase64Url(privateKeyJwk.x || '');
    const y = normalizeBase64Url(privateKeyJwk.y || '');
    
    console.log(`JWK x: ${x.length} chars, y: ${y.length} chars, d: ${privateKeyBase64.length} chars`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'VAPID keys generated. Copy these values and add them as secrets.',
        keys: {
          publicKey: publicKeyBase64,
          privateKey: privateKeyBase64,
        },
        debug: {
          publicKeyLength: publicKeyBytes.length,
          privateKeyLength: privateKeyBytes.length,
        },
        instructions: [
          '1. Copy the publicKey value',
          '2. Add it as secret: VAPID_PUBLIC_KEY',
          '3. Copy the privateKey value', 
          '4. Add it as secret: VAPID_PRIVATE_KEY',
          '5. Re-enable push notifications in the app'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating VAPID keys:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate VAPID keys. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
