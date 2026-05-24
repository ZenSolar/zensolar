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

    // KPI-level drift sweep — writes to kpi_reconciliation_log
    let kpiDrifts = 0;
    try {
      const { data: kpiData, error: kpiErr } = await supabase.rpc('verify_kpi_reconciliation');
      if (kpiErr) console.error('verify_kpi_reconciliation rpc error', kpiErr);
      else kpiDrifts = typeof kpiData === 'number' ? kpiData : 0;
    } catch (e) {
      console.error('verify_kpi_reconciliation threw', e);
    }

    // Pillar 4 · anti-collusion graph sweep — writes to collusion_signals
    let collusionSignals = 0;
    try {
      const { data: cData, error: cErr } = await supabase.rpc('detect_collusion_signals');
      if (cErr) console.error('detect_collusion_signals rpc error', cErr);
      else collusionSignals = typeof cData === 'number' ? cData : 0;
    } catch (e) {
      console.error('detect_collusion_signals threw', e);
    }

    // Pillar 3 · Proof of Permanence — chain-integrity sweep + anchor freshness
    let chainTampers = 0;
    let anchorFreshnessAlerts = 0;
    try {
      const { data: tData, error: tErr } = await supabase.rpc('verify_chain_integrity');
      if (tErr) console.error('verify_chain_integrity rpc error', tErr);
      else chainTampers = typeof tData === 'number' ? tData : 0;
    } catch (e) {
      console.error('verify_chain_integrity threw', e);
    }
    try {
      const { data: fData, error: fErr } = await supabase.rpc('check_anchor_freshness');
      if (fErr) console.error('check_anchor_freshness rpc error', fErr);
      else anchorFreshnessAlerts = typeof fData === 'number' ? fData : 0;
    } catch (e) {
      console.error('check_anchor_freshness threw', e);
    }

    // Best-effort: surface critical violations + KPI criticals + collusion signals from this run
    const [{ data: criticals }, { data: kpiCriticals }, { data: collusionCriticals }] = await Promise.all([
      supabase
        .from('user_invariant_violations')
        .select('user_id, check_name, severity, details, detected_at')
        .gte('detected_at', startedAt)
        .eq('severity', 'critical')
        .limit(50),
      supabase
        .from('kpi_reconciliation_log')
        .select('user_id, kpi_key, severity, headline_value, computed_value, diff_pct, detected_at')
        .gte('detected_at', startedAt)
        .eq('severity', 'critical')
        .limit(50),
      supabase
        .from('collusion_signals')
        .select('signal_key, severity, user_ids, evidence, detected_at')
        .gte('detected_at', startedAt)
        .eq('severity', 'critical')
        .limit(50),
    ]);

    console.log(JSON.stringify({
      event: 'verify_user_invariants_complete',
      violations,
      criticals: criticals?.length ?? 0,
      kpi_drifts: kpiDrifts,
      kpi_criticals: kpiCriticals?.length ?? 0,
      collusion_signals: collusionSignals,
      collusion_criticals: collusionCriticals?.length ?? 0,
      started_at: startedAt,
    }));

    return new Response(
      JSON.stringify({
        ok: true,
        violations,
        criticals: criticals ?? [],
        kpi_drifts: kpiDrifts,
        kpi_criticals: kpiCriticals ?? [],
        collusion_signals: collusionSignals,
        collusion_criticals: collusionCriticals ?? [],
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
