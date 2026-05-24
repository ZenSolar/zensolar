// Pillar 5 · Public Mint Receipt Verifier
// GET /verify-mint-receipt?hash=<chain_hash>
// No auth required — anyone with a receipt hash can audit the chain.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const hash = (url.searchParams.get('hash') ?? '').trim().toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return new Response(
      JSON.stringify({ ok: false, error: 'invalid_hash_format' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc('get_mint_receipt', { _chain_hash: hash });
  if (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, receipt: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
