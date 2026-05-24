// Pillar 1 · Math — nightly invariant runner.
// Calls verify_user_sum_invariant() and returns the violation count.
// Triggered by pg_cron once per day (see migration scheduling it).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const startedAt = new Date().toISOString();
  try {
    const { data, error } = await supabase.rpc('verify_user_sum_invariant');
    if (error) throw error;
    const violations = typeof data === 'number' ? data : 0;

    // Best-effort: surface critical violations from the last run
    const { data: criticals } = await supabase
      .from('user_invariant_violations')
      .select('user_id, check_name, severity, details, detected_at')
      .gte('detected_at', startedAt)
      .eq('severity', 'critical')
      .limit(50);

    console.log(JSON.stringify({
      event: 'verify_user_invariants_complete',
      violations,
      criticals: criticals?.length ?? 0,
      started_at: startedAt,
    }));

    return new Response(
      JSON.stringify({
        ok: true,
        violations,
        criticals: criticals ?? [],
        started_at: startedAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('verify-user-invariants failed', err);
    return new Response(
      JSON.stringify({ ok: false, error: String((err as Error).message ?? err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
