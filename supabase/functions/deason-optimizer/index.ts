// Deason AI Energy Optimization Engine — Phase 1
// Rule-based + heuristic optimizer. No LLM calls. Deterministic + explainable.
//
// Input  (POST JSON):
//   { userId?: string }   // optional override; defaults to caller
// Output (JSON):
//   {
//     generated_at, user_id, currency: 'USD',
//     inputs: { bill, devices, telemetry, profile, rate_plan },
//     recommendations: Recommendation[],   // ranked, top 5
//     summary: { est_monthly_savings_usd, est_annual_savings_usd, confidence },
//     rules_fired: string[]
//   }
//
// Every recommendation includes:
//   id, title, action, rationale, sources[], rule_id,
//   est_monthly_savings_usd, confidence (0..1), priority (1..5)
//
// IMPORTANT: This is the rule engine only. The LP scheduler lands in Phase 2
// inside this same file behind `mode: 'schedule'`.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ---------- types ----------
type Severity = 'low' | 'medium' | 'high';
interface Recommendation {
  id: string;
  rule_id: string;
  title: string;
  action: string;
  rationale: string;
  sources: string[];
  est_monthly_savings_usd: number;
  confidence: number;       // 0..1
  priority: number;         // 1 (highest) .. 5
  severity: Severity;
}

interface OptimizerInputs {
  bill: any | null;
  devices: any[];
  telemetry: { battery: any[]; ev: any[]; solar: any[] };
  profile: any | null;
  rate_plan: RatePlan;
}

interface RatePlan {
  utility: string | null;
  plan_name: string | null;
  peak_usd_per_kwh: number;
  offpeak_usd_per_kwh: number;
  superoffpeak_usd_per_kwh: number | null;
  peak_window: string;          // human-readable
  superoffpeak_window: string | null;
  nem_version: string | null;   // "NEM 2.0" | "NEM 3.0" | null
  source: 'bill' | 'default';
}

// ---------- helpers ----------
function n(v: any, d = 0): number {
  const x = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(x) ? x : d;
}
function round2(x: number) { return Math.round(x * 100) / 100; }

function defaultRatePlan(state: string | null): RatePlan {
  // Conservative US-residential defaults when no bill is uploaded.
  const map: Record<string, Partial<RatePlan>> = {
    CA: { peak_usd_per_kwh: 0.52, offpeak_usd_per_kwh: 0.32, superoffpeak_usd_per_kwh: 0.25, peak_window: '4pm–9pm', superoffpeak_window: '12am–3pm' },
    TX: { peak_usd_per_kwh: 0.22, offpeak_usd_per_kwh: 0.12, superoffpeak_usd_per_kwh: null, peak_window: '2pm–7pm', superoffpeak_window: null },
    AZ: { peak_usd_per_kwh: 0.30, offpeak_usd_per_kwh: 0.10, superoffpeak_usd_per_kwh: null, peak_window: '4pm–7pm', superoffpeak_window: null },
  };
  const base = map[state ?? ''] ?? { peak_usd_per_kwh: 0.28, offpeak_usd_per_kwh: 0.14, superoffpeak_usd_per_kwh: null, peak_window: '4pm–9pm', superoffpeak_window: null };
  return {
    utility: null, plan_name: null, nem_version: null, source: 'default',
    peak_usd_per_kwh: base.peak_usd_per_kwh!,
    offpeak_usd_per_kwh: base.offpeak_usd_per_kwh!,
    superoffpeak_usd_per_kwh: base.superoffpeak_usd_per_kwh ?? null,
    peak_window: base.peak_window!,
    superoffpeak_window: base.superoffpeak_window ?? null,
  };
}

function ratePlanFromBill(bill: any, state: string | null): RatePlan {
  if (!bill) return defaultRatePlan(state);
  const peak = n(bill.peak_rate_usd_per_kwh ?? bill.peak_rate ?? bill?.rate_breakdown?.peak);
  const off  = n(bill.offpeak_rate_usd_per_kwh ?? bill.offpeak_rate ?? bill?.rate_breakdown?.offpeak);
  const sop  = bill.superoffpeak_rate_usd_per_kwh ?? bill?.rate_breakdown?.superoffpeak ?? null;
  const base = defaultRatePlan(state);
  return {
    utility: bill.utility ?? bill.utility_name ?? null,
    plan_name: bill.rate_plan ?? bill.plan_name ?? null,
    nem_version: bill.nem_version ?? null,
    source: 'bill',
    peak_usd_per_kwh: peak > 0 ? peak : base.peak_usd_per_kwh,
    offpeak_usd_per_kwh: off > 0 ? off : base.offpeak_usd_per_kwh,
    superoffpeak_usd_per_kwh: sop != null ? n(sop) : base.superoffpeak_usd_per_kwh,
    peak_window: bill.peak_window ?? base.peak_window,
    superoffpeak_window: bill.superoffpeak_window ?? base.superoffpeak_window,
  };
}

function extractTelemetrySnapshot(telemetry: OptimizerInputs['telemetry']) {
  const battery = telemetry.battery[0]?.payload ?? null;
  const ev      = telemetry.ev[0]?.payload ?? null;
  const solar   = telemetry.solar[0]?.payload ?? null;
  const battery_soc = n(
    battery?.percentage_charged ?? battery?.energy_sites?.[0]?.percentage_charged,
  );
  const solar_w = n(
    solar?.current_power_w ?? solar?.solar_power ?? solar?.energy_sites?.[0]?.solar_power,
  );
  const ev_soc = n(
    ev?.battery_level ?? ev?.response?.charge_state?.battery_level ?? ev?.charge_state?.battery_level,
  );
  const ev_charging = (ev?.response?.charge_state?.charging_state ?? ev?.charge_state?.charging_state ?? '').toString().toLowerCase() === 'charging';
  return { battery_soc, solar_w, ev_soc, ev_charging, has_battery: !!battery, has_ev: !!ev, has_solar: !!solar };
}

// ---------- rules ----------
function runRules(inp: OptimizerInputs): { recs: Recommendation[]; rulesFired: string[] } {
  const recs: Recommendation[] = [];
  const fired: string[] = [];
  const snap = extractTelemetrySnapshot(inp.telemetry);
  const rp = inp.rate_plan;
  const monthlyKwh = n(inp.bill?.total_kwh ?? inp.bill?.kwh ?? 900);
  const peakShare = 0.35;   // assumed share of usage in peak window absent interval data
  const peakKwh = monthlyKwh * peakShare;
  const peakOffDelta = Math.max(0, rp.peak_usd_per_kwh - rp.offpeak_usd_per_kwh);
  const peakSopDelta = rp.superoffpeak_usd_per_kwh != null
    ? Math.max(0, rp.peak_usd_per_kwh - rp.superoffpeak_usd_per_kwh)
    : peakOffDelta;

  // Rule 1 — Maximize self-consumption of solar
  if (snap.has_solar) {
    const nem3 = rp.nem_version?.includes('3') ?? false;
    const exportRate = nem3 ? 0.05 : rp.offpeak_usd_per_kwh; // NEM 3 export ≈ avoided-cost
    const selfConsumeUplift = Math.max(0, rp.peak_usd_per_kwh - exportRate);
    // Assume 25% of solar production currently exports during peak window.
    const shiftableKwh = monthlyKwh * 0.10;
    const savings = shiftableKwh * selfConsumeUplift;
    fired.push('R1_self_consumption');
    recs.push({
      id: crypto.randomUUID(),
      rule_id: 'R1_self_consumption',
      title: 'Maximize self-consumption of your solar',
      action: nem3
        ? 'Run dishwasher, laundry, EV top-ups, and pre-cool the home between 11am–3pm so solar offsets load instead of exporting at $0.05/kWh.'
        : 'Pre-cool the home and run large loads mid-day so solar covers them directly — every kWh used on-site avoids paying retail later.',
      rationale: `Under ${rp.nem_version ?? 'your current export tariff'}, exported solar is worth ~$${exportRate.toFixed(2)}/kWh while peak grid power costs $${rp.peak_usd_per_kwh.toFixed(2)}/kWh. Shifting ~${shiftableKwh.toFixed(0)} kWh of loads into the solar window captures that $${selfConsumeUplift.toFixed(2)}/kWh spread.`,
      sources: [rp.source === 'bill' ? 'bill_analysis' : 'default_rate_plan', 'telemetry.solar', 'rule:R1'],
      est_monthly_savings_usd: round2(savings),
      confidence: rp.source === 'bill' ? 0.75 : 0.55,
      priority: 1,
      severity: 'high',
    });
  }

  // Rule 2 — Shift EV charging to super-off-peak (or mid-day solar)
  if (snap.has_ev) {
    const evMonthlyKwh = 300; // ~1000 mi @ 3.3 mi/kWh; conservative default
    const targetRate = rp.superoffpeak_usd_per_kwh ?? rp.offpeak_usd_per_kwh;
    const savedPerKwh = Math.max(0, rp.peak_usd_per_kwh - targetRate);
    const savings = evMonthlyKwh * savedPerKwh * 0.6; // assume 60% currently mistimed
    fired.push('R2_ev_shift');
    recs.push({
      id: crypto.randomUUID(),
      rule_id: 'R2_ev_shift',
      title: 'Shift EV charging to the cheapest window',
      action: rp.superoffpeak_window
        ? `Schedule the car to start charging at ${rp.superoffpeak_window.split('–')[0]} (super-off-peak). Set a daily departure time so it finishes before you leave.`
        : `Schedule charging to start after the peak window ends (${rp.peak_window.split('–')[1] ?? 'after peak'}).`,
      rationale: `Charging during peak costs $${rp.peak_usd_per_kwh.toFixed(2)}/kWh vs $${targetRate.toFixed(2)}/kWh super-off-peak — a $${savedPerKwh.toFixed(2)}/kWh delta on ~${evMonthlyKwh} kWh/mo of charging.`,
      sources: ['telemetry.ev', rp.source === 'bill' ? 'bill_analysis' : 'default_rate_plan', 'rule:R2'],
      est_monthly_savings_usd: round2(savings),
      confidence: 0.8,
      priority: 2,
      severity: 'high',
    });
  }

  // Rule 3 — Discharge battery during peak
  if (snap.has_battery) {
    // Assume usable daily discharge = 10 kWh, only useful kWh = min(peakKwh/days, 10)
    const usableDaily = 10;
    const daysInMonth = 30;
    const peakDaily = peakKwh / daysInMonth;
    const dischargeKwh = Math.min(usableDaily, peakDaily) * daysInMonth;
    const savings = dischargeKwh * peakOffDelta;
    fired.push('R3_battery_peak_shave');
    recs.push({
      id: crypto.randomUUID(),
      rule_id: 'R3_battery_peak_shave',
      title: 'Discharge battery during peak hours',
      action: `Set battery reserve to 20% and configure Time-Based Control / Savings mode so it discharges across ${rp.peak_window}, then recharges from solar mid-day.`,
      rationale: `Each kWh pulled from the battery during peak avoids $${peakOffDelta.toFixed(2)}/kWh vs charging it off-peak. ~${dischargeKwh.toFixed(0)} kWh/mo of peak load can be served from storage.`,
      sources: ['telemetry.battery', rp.source === 'bill' ? 'bill_analysis' : 'default_rate_plan', 'rule:R3'],
      est_monthly_savings_usd: round2(savings),
      confidence: 0.7,
      priority: 3,
      severity: 'medium',
    });
  }

  // Rule 4 — Respect battery health (cycle guard)
  if (snap.has_battery) {
    fired.push('R4_battery_health');
    recs.push({
      id: crypto.randomUUID(),
      rule_id: 'R4_battery_health',
      title: 'Protect battery health — cap daily cycling',
      action: 'Limit deep discharges to ≤1.2 equivalent full cycles/day. Keep min reserve ≥15% and avoid charging above 95% unless you need full backup.',
      rationale: 'Lithium battery degradation accelerates above ~1.5 cycles/day and below 10% SoC. Light throttling preserves long-term capacity worth ~$1.5–3k over 10 years.',
      sources: ['telemetry.battery', 'rule:R4', 'battery_chemistry_heuristics'],
      est_monthly_savings_usd: 15, // amortized degradation avoidance
      confidence: 0.6,
      priority: 5,
      severity: 'low',
    });
  }

  // Rule 5 — Rate-plan optimization (only if we have a bill)
  if (inp.bill && rp.source === 'bill') {
    const monthlyBill = n(inp.bill.total_amount_usd ?? inp.bill.amount_due ?? 0);
    const potential = monthlyBill * 0.08; // conservative 8% switching upside
    if (potential >= 3) {
      fired.push('R5_rate_plan');
      recs.push({
        id: crypto.randomUUID(),
        rule_id: 'R5_rate_plan',
        title: 'Consider a better rate plan',
        action: snap.has_ev
          ? 'Switch to an EV-specific TOU plan (super-off-peak overnight) — your usage pattern qualifies.'
          : 'Compare your current plan against your utility\'s TOU and tiered options for your usage shape.',
        rationale: `On ${rp.plan_name ?? 'your current plan'} (${rp.utility ?? 'your utility'}) you\'re paying $${rp.peak_usd_per_kwh.toFixed(2)}/kWh peak. A better-matched plan typically saves 5–12% of the bill.`,
        sources: ['bill_analysis', 'rule:R5'],
        est_monthly_savings_usd: round2(potential),
        confidence: 0.55,
        priority: 4,
        severity: 'medium',
      });
    }
  }

  return { recs, rulesFired: fired };
}

// ---------- entry ----------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user } } = await userClient.auth.getUser();
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body ok */ }
    const userId: string | null = body.userId ?? user?.id ?? null;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'not_authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pull context in parallel.
    const [profileRes, devicesRes, analysisRes, cacheRes] = await Promise.all([
      admin.from('profiles').select('state_code, utility_name, esid').eq('user_id', userId).maybeSingle(),
      admin.from('connected_devices').select('provider, device_type, device_id, device_name').eq('user_id', userId),
      admin.from('deason_doc_analyses').select('analysis, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('device_telemetry_cache').select('oem_type, device_type, payload, cached_at').eq('user_id', userId),
    ]);

    const profile = profileRes.data;
    const devices = devicesRes.data ?? [];
    const bill = analysisRes.data?.analysis ?? null;
    const cache = cacheRes.data ?? [];
    const telemetry = {
      battery: cache.filter((r: any) => r.device_type === 'battery'),
      ev: cache.filter((r: any) => r.device_type === 'ev'),
      solar: cache.filter((r: any) => r.device_type === 'solar'),
    };
    const rate_plan = ratePlanFromBill(bill, profile?.state_code ?? null);

    const inputs: OptimizerInputs = { bill, devices, telemetry, profile, rate_plan };
    const { recs, rulesFired } = runRules(inputs);

    // Rank by (priority asc, savings desc) and cap at 5.
    const ranked = recs
      .sort((a, b) => a.priority - b.priority || b.est_monthly_savings_usd - a.est_monthly_savings_usd)
      .slice(0, 5);

    const estMonthly = round2(ranked.reduce((s, r) => s + r.est_monthly_savings_usd, 0));
    const confidence = ranked.length
      ? round2(ranked.reduce((s, r) => s + r.confidence, 0) / ranked.length)
      : 0;

    const result = {
      generated_at: new Date().toISOString(),
      user_id: userId,
      currency: 'USD',
      inputs: {
        bill: bill ? { utility: rate_plan.utility, plan_name: rate_plan.plan_name, nem_version: rate_plan.nem_version, total_kwh: bill.total_kwh ?? null, total_amount_usd: bill.total_amount_usd ?? null } : null,
        devices: devices.map((d: any) => ({ provider: d.provider, type: d.device_type, name: d.device_name })),
        telemetry_present: { battery: telemetry.battery.length > 0, ev: telemetry.ev.length > 0, solar: telemetry.solar.length > 0 },
        profile: profile ? { state: profile.state_code, utility: profile.utility_name, esid: profile.esid } : null,
        rate_plan,
      },
      recommendations: ranked,
      summary: {
        est_monthly_savings_usd: estMonthly,
        est_annual_savings_usd: round2(estMonthly * 12),
        confidence,
      },
      rules_fired: rulesFired,
      engine: { phase: 1, type: 'rule_based_heuristic', version: '1.0.0' },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'optimizer_failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
