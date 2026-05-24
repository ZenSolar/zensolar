// Pillar 5b · Proof-of-Permanence Merkle snapshot
// Cron-invoked every 6h. Computes Merkle root over all mint_transactions.chain_hash
// and inserts into proof_of_permanence_anchors. On-chain anchoring is deferred
// (MINTER_PRIVATE_KEY + DeviceWatermarkRegistry exists for Phase 2).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc('compute_permanence_snapshot');
  if (error) {
    console.error('compute_permanence_snapshot failed', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const newId = data as string | null;
  let anchor: unknown = null;
  if (newId) {
    const { data: row } = await supabase
      .from('proof_of_permanence_anchors')
      .select('id, snapshot_at, merkle_root, leaf_count, max_chain_seq_global')
      .eq('id', newId)
      .maybeSingle();
    anchor = row;
  }

  console.log(JSON.stringify({
    event: 'permanence_snapshot_complete',
    new_anchor: !!newId,
    anchor,
  }));

  return new Response(
    JSON.stringify({ ok: true, new_anchor: !!newId, anchor }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
