// Returns the WalletConnect Project ID to the client.
// This is safe to expose publicly (it's a publishable identifier, not a secret key).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const projectId = Deno.env.get('VITE_WALLETCONNECT_PROJECT_ID')?.trim();

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'WalletConnect is not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify({ projectId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching WalletConnect Project ID:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load WalletConnect configuration' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
