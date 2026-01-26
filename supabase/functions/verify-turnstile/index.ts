const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, remoteip } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing turnstile token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    
    // If no secret key configured, allow in development (test keys)
    if (!secretKey) {
      console.log('[verify-turnstile] No secret key configured, allowing request (development mode)');
      return new Response(
        JSON.stringify({ success: true, development: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Cloudflare
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    const result: TurnstileResponse = await verifyResponse.json();

    console.log('[verify-turnstile] Cloudflare response:', {
      success: result.success,
      errorCodes: result['error-codes'],
      hostname: result.hostname,
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Verification failed',
          codes: result['error-codes'] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        hostname: result.hostname,
        challenge_ts: result.challenge_ts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[verify-turnstile] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
