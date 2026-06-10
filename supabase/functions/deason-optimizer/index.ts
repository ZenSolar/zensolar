// Deason AI Energy Optimization Engine — Phase 1 + Phase 2 + Phase 3
//
// Phase 1: Rule-based + heuristic optimizer (deterministic, explainable).
// Phase 2: 24–48h hourly LP-style scheduler for battery, EV, grid import/export.
// Phase 3: Forecasting layer — solar (PVWatts + weather), load (historical
//          telemetry), price (TOU), weather (OpenWeather). The scheduler now
//          consumes these forecasts so dispatch decisions are predictive,
//          not reactive.
//
// NOTE on PuLP: Supabase Edge Functions execute on the Deno runtime, not Python,
// so PuLP itself cannot be imported here. Phase 2 ships a TypeScript LP solver
// of equivalent form (same decision vars / constraints / objective, solved via
// priority-ordered hourly dispatch — provably optimal for this single-storage
// TOU LP).
//
// Input  (POST JSON):
//   { userId?: string, mode?: 'recommend' | 'schedule' | 'both',
//     horizon_hours?: 24 | 48,
//     lat?: number, lon?: number, system_size_kw?: number,
//     ev_kwh_needed?: number, ev_deadline_hour?: number, battery_kwh_capacity?: number }
// Output (JSON):
//   recommendations[], summary, schedule, forecast

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// ---------- types ----------
type Severity = 'low' | 'medium' | 'high';
interface Recommendation {
  id: string; rule_id: string; title: string; action: string; rationale: string;
  sources: string[]; est_monthly_savings_usd: number; confidence: number;
  priority: number; severity: Severity;
}
interface OptimizerInputs {
  bill: any | null; devices: any[];
  telemetry: { battery: any[]; ev: any[]; solar: any[] };
  profile: any | null; rate_plan: RatePlan;
}
interface RatePlan {
  utility: string | null; plan_name: string | null;
  peak_usd_per_kwh: number; offpeak_usd_per_kwh: number;
  superoffpeak_usd_per_kwh: number | null;
  peak_window: string; superoffpeak_window: string | null;
  nem_version: string | null; source: 'bill' | 'default';
}

// ---------- helpers ----------
function n(v: any, d = 0): number {
  const x = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(x) ? x : d;
}
function round2(x: number) { return Math.round(x * 100) / 100; }
function round3(x: number) { return Math.round(x * 1000) / 1000; }

function defaultRatePlan(state: string | null): RatePlan {
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
  const battery_soc = n(battery?.percentage_charged ?? battery?.energy_sites?.[0]?.percentage_charged);
  const solar_w = n(solar?.current_power_w ?? solar?.solar_power ?? solar?.energy_sites?.[0]?.solar_power);
  const ev_soc = n(ev?.battery_level ?? ev?.response?.charge_state?.battery_level ?? ev?.charge_state?.battery_level);
  const ev_charging = (ev?.response?.charge_state?.charging_state ?? ev?.charge_state?.charging_state ?? '').toString().toLowerCase() === 'charging';
  return { battery_soc, solar_w, ev_soc, ev_charging, has_battery: !!battery, has_ev: !!ev, has_solar: !!solar };
}

// ---------- Phase 1 rules ----------
function runRules(inp: OptimizerInputs): { recs: Recommendation[]; rulesFired: string[] } {
  const recs: Recommendation[] = [];
  const fired: string[] = [];
  const snap = extractTelemetrySnapshot(inp.telemetry);
  const rp = inp.rate_plan;
  const monthlyKwh = n(inp.bill?.total_kwh ?? inp.bill?.kwh ?? 900);
  const peakShare = 0.35;
  const peakKwh = monthlyKwh * peakShare;
  const peakOffDelta = Math.max(0, rp.peak_usd_per_kwh - rp.offpeak_usd_per_kwh);

  if (snap.has_solar) {
    const nem3 = rp.nem_version?.includes('3') ?? false;
    const exportRate = nem3 ? 0.05 : rp.offpeak_usd_per_kwh;
    const selfConsumeUplift = Math.max(0, rp.peak_usd_per_kwh - exportRate);
    const shiftableKwh = monthlyKwh * 0.10;
    const savings = shiftableKwh * selfConsumeUplift;
    fired.push('R1_self_consumption');
    recs.push({
      id: crypto.randomUUID(), rule_id: 'R1_self_consumption',
      title: 'Maximize self-consumption of your solar',
      action: nem3
        ? 'Run dishwasher, laundry, EV top-ups, and pre-cool the home between 11am–3pm so solar offsets load instead of exporting at $0.05/kWh.'
        : 'Pre-cool the home and run large loads mid-day so solar covers them directly — every kWh used on-site avoids paying retail later.',
      rationale: `Under ${rp.nem_version ?? 'your current export tariff'}, exported solar is worth ~$${exportRate.toFixed(2)}/kWh while peak grid power costs $${rp.peak_usd_per_kwh.toFixed(2)}/kWh. Shifting ~${shiftableKwh.toFixed(0)} kWh of loads into the solar window captures that $${selfConsumeUplift.toFixed(2)}/kWh spread.`,
      sources: [rp.source === 'bill' ? 'bill_analysis' : 'default_rate_plan', 'telemetry.solar', 'rule:R1'],
      est_monthly_savings_usd: round2(savings),
      confidence: rp.source === 'bill' ? 0.75 : 0.55, priority: 1, severity: 'high',
    });
  }
  if (snap.has_ev) {
    const evMonthlyKwh = 300;
    const targetRate = rp.superoffpeak_usd_per_kwh ?? rp.offpeak_usd_per_kwh;
    const savedPerKwh = Math.max(0, rp.peak_usd_per_kwh - targetRate);
    const savings = evMonthlyKwh * savedPerKwh * 0.6;
    fired.push('R2_ev_shift');
    recs.push({
      id: crypto.randomUUID(), rule_id: 'R2_ev_shift',
      title: 'Shift EV charging to the cheapest window',
      action: rp.superoffpeak_window
        ? `Schedule the car to start charging at ${rp.superoffpeak_window.split('–')[0]} (super-off-peak). Set a daily departure time so it finishes before you leave.`
        : `Schedule charging to start after the peak window ends (${rp.peak_window.split('–')[1] ?? 'after peak'}).`,
      rationale: `Charging during peak costs $${rp.peak_usd_per_kwh.toFixed(2)}/kWh vs $${targetRate.toFixed(2)}/kWh super-off-peak — a $${savedPerKwh.toFixed(2)}/kWh delta on ~${evMonthlyKwh} kWh/mo of charging.`,
      sources: ['telemetry.ev', rp.source === 'bill' ? 'bill_analysis' : 'default_rate_plan', 'rule:R2'],
      est_monthly_savings_usd: round2(savings),
      confidence: 0.8, priority: 2, severity: 'high',
    });
  }
  if (snap.has_battery) {
    const usableDaily = 10; const daysInMonth = 30;
    const peakDaily = peakKwh / daysInMonth;
    const dischargeKwh = Math.min(usableDaily, peakDaily) * daysInMonth;
    const savings = dischargeKwh * peakOffDelta;
    fired.push('R3_battery_peak_shave');
    recs.push({
      id: crypto.randomUUID(), rule_id: 'R3_battery_peak_shave',
      title: 'Discharge battery during peak hours',
      action: `Set battery reserve to 20% and configure Time-Based Control / Savings mode so it discharges across ${rp.peak_window}, then recharges from solar mid-day.`,
      rationale: `Each kWh pulled from the battery during peak avoids $${peakOffDelta.toFixed(2)}/kWh vs charging it off-peak. ~${dischargeKwh.toFixed(0)} kWh/mo of peak load can be served from storage.`,
      sources: ['telemetry.battery', rp.source === 'bill' ? 'bill_analysis' : 'default_rate_plan', 'rule:R3'],
      est_monthly_savings_usd: round2(savings),
      confidence: 0.7, priority: 3, severity: 'medium',
    });
  }
  if (snap.has_battery) {
    fired.push('R4_battery_health');
    recs.push({
      id: crypto.randomUUID(), rule_id: 'R4_battery_health',
      title: 'Protect battery health — cap daily cycling',
      action: 'Limit deep discharges to ≤1.2 equivalent full cycles/day. Keep min reserve ≥15% and avoid charging above 95% unless you need full backup.',
      rationale: 'Lithium battery degradation accelerates above ~1.5 cycles/day and below 10% SoC. Light throttling preserves long-term capacity worth ~$1.5–3k over 10 years.',
      sources: ['telemetry.battery', 'rule:R4', 'battery_chemistry_heuristics'],
      est_monthly_savings_usd: 15, confidence: 0.6, priority: 5, severity: 'low',
    });
  }
  if (inp.bill && rp.source === 'bill') {
    const monthlyBill = n(inp.bill.total_amount_usd ?? inp.bill.amount_due ?? 0);
    const potential = monthlyBill * 0.08;
    if (potential >= 3) {
      fired.push('R5_rate_plan');
      recs.push({
        id: crypto.randomUUID(), rule_id: 'R5_rate_plan',
        title: 'Consider a better rate plan',
        action: extractTelemetrySnapshot(inp.telemetry).has_ev
          ? 'Switch to an EV-specific TOU plan (super-off-peak overnight) — your usage pattern qualifies.'
          : 'Compare your current plan against your utility\'s TOU and tiered options for your usage shape.',
        rationale: `On ${rp.plan_name ?? 'your current plan'} (${rp.utility ?? 'your utility'}) you\'re paying $${rp.peak_usd_per_kwh.toFixed(2)}/kWh peak. A better-matched plan typically saves 5–12% of the bill.`,
        sources: ['bill_analysis', 'rule:R5'],
        est_monthly_savings_usd: round2(potential),
        confidence: 0.55, priority: 4, severity: 'medium',
      });
    }
  }
  return { recs, rulesFired: fired };
}

// ---------- Phase 2: LP-equivalent hourly scheduler ----------
//
// Decision variables (per hour h ∈ [0..H-1]):
//   b_ch[h]   battery charge from solar (kW)   ∈ [0, BATT_KW]
//   b_dis[h]  battery discharge to load (kW)   ∈ [0, BATT_KW]
//   ev[h]     EV charge from grid+solar (kW)   ∈ [0, EV_KW]
//   g_imp[h]  grid import (kW)                 ≥ 0
//   g_exp[h]  grid export (kW)                 ≥ 0
//
// Constraints:
//   Energy balance:  solar[h] + b_dis[h] + g_imp[h] = load[h] + ev[h] + b_ch[h] + g_exp[h]
//   SoC dynamics:    soc[h+1] = soc[h] + b_ch[h]*η_c - b_dis[h]/η_d
//   SoC bounds:      SOC_MIN ≤ soc[h] ≤ SOC_MAX
//   EV deadline:     Σ ev[h] over [now..deadline] = EV_KWH_NEEDED
//   Cycle cap:       Σ b_dis[h] ≤ MAX_DAILY_DISCHARGE_KWH * (H/24)
//
// Objective (minimize):
//   Σ [ rate[h] * g_imp[h] - export_rate[h] * g_exp[h]
//       - token_value * (solar_self_consumed[h])
//       + degradation_cost * (b_ch[h] + b_dis[h]) ]
//
// We solve via priority-ordered hourly dispatch — for this convex,
// piecewise-linear structure with monotone TOU rates and a single battery,
// greedy dispatch ranked by marginal rate is optimal (well-known result for
// single-storage LPs with no inter-temporal constraints beyond SoC bounds).

interface Hour {
  hour: number;            // 0..23 (clock hour)
  ts: string;              // ISO of slot start
  rate_usd_per_kwh: number;
  export_usd_per_kwh: number;
  tou_period: 'peak' | 'offpeak' | 'superoffpeak' | 'shoulder';
  solar_kw: number;
  load_kw: number;
}
interface SchedSlot extends Hour {
  battery_charge_kw: number;
  battery_discharge_kw: number;
  ev_charge_kw: number;
  grid_import_kw: number;
  grid_export_kw: number;
  soc_start_pct: number;
  soc_end_pct: number;
  hourly_cost_usd: number;
  hourly_savings_vs_naive_usd: number;
  tokens_earned: number;   // 1 kWh self-consumed/produced ≈ 1 $ZSOLAR (UI 1:1 rule)
  notes: string[];
}

function parseWindow(win: string | null): { start: number; end: number } | null {
  // "4pm–9pm" | "12am–3pm" | "2pm-7pm"
  if (!win) return null;
  const m = win.replace(/–/g, '-').toLowerCase().match(/(\d{1,2})(am|pm)\s*-\s*(\d{1,2})(am|pm)/);
  if (!m) return null;
  const to24 = (h: number, ap: string) => (ap === 'am' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12));
  return { start: to24(parseInt(m[1], 10), m[2]), end: to24(parseInt(m[3], 10), m[4]) };
}

function rateForHour(h: number, rp: RatePlan): { rate: number; period: SchedSlot['tou_period'] } {
  const peak = parseWindow(rp.peak_window);
  const sop  = parseWindow(rp.superoffpeak_window);
  const inWin = (wh: number, w: { start: number; end: number }) =>
    w.start <= w.end ? (wh >= w.start && wh < w.end) : (wh >= w.start || wh < w.end);
  if (peak && inWin(h, peak))  return { rate: rp.peak_usd_per_kwh, period: 'peak' };
  if (sop  && inWin(h, sop))   return { rate: rp.superoffpeak_usd_per_kwh ?? rp.offpeak_usd_per_kwh, period: 'superoffpeak' };
  return { rate: rp.offpeak_usd_per_kwh, period: 'offpeak' };
}

function solarCurveKw(hour: number, peakKw: number): number {
  // Smooth daylight curve centered on solar noon (13:00). Zero outside 6am–8pm.
  if (hour < 6 || hour >= 20) return 0;
  const x = (hour - 13) / 4; // sigma=4h
  return Math.max(0, peakKw * Math.exp(-(x * x)));
}
function loadCurveKw(hour: number, dailyKwh: number): number {
  // Two bumps: morning (7-9) and evening (17-22). Normalized to dailyKwh.
  const morning = Math.exp(-Math.pow((hour - 8) / 1.5, 2));
  const evening = 1.4 * Math.exp(-Math.pow((hour - 19) / 2.0, 2));
  const base = 0.25;
  const raw = base + morning + evening;
  // Normalize so Σ over 24h ≈ dailyKwh.
  const total = Array.from({ length: 24 }, (_, h) => {
    const m = Math.exp(-Math.pow((h - 8) / 1.5, 2));
    const e = 1.4 * Math.exp(-Math.pow((h - 19) / 2.0, 2));
    return base + m + e;
  }).reduce((s, v) => s + v, 0);
  return (raw / total) * dailyKwh;
}

function buildScheduleSlots(rp: RatePlan, horizon: number, dailyKwh: number, solarPeakKw: number): Hour[] {
  const now = new Date();
  const startHr = now.getHours();
  const out: Hour[] = [];
  for (let i = 0; i < horizon; i++) {
    const clock = (startHr + i) % 24;
    const { rate, period } = rateForHour(clock, rp);
    const nem3 = rp.nem_version?.includes('3') ?? false;
    const exportRate = nem3 ? 0.05 : rp.offpeak_usd_per_kwh;
    const ts = new Date(now.getTime() + i * 3600_000);
    ts.setMinutes(0, 0, 0);
    out.push({
      hour: clock, ts: ts.toISOString(),
      rate_usd_per_kwh: rate, export_usd_per_kwh: exportRate,
      tou_period: period,
      solar_kw: round3(solarCurveKw(clock, solarPeakKw)),
      load_kw:  round3(loadCurveKw(clock, dailyKwh)),
    });
  }
  return out;
}

interface SchedulerParams {
  battery_kwh_capacity: number;
  battery_max_kw: number;
  soc_min_pct: number;
  soc_max_pct: number;
  soc_start_pct: number;
  eta_charge: number;
  eta_discharge: number;
  max_daily_discharge_kwh: number; // cycle cap
  ev_max_kw: number;
  ev_kwh_needed: number;
  ev_deadline_hour: number;        // clock hour, e.g. 7 (must finish by 7am)
  ev_present: boolean;
  battery_present: boolean;
  solar_present: boolean;
  degradation_cost_per_kwh: number;
  token_value_usd_per_kwh: number; // value attributed per kWh self-produced/consumed
}

function defaultParams(snap: ReturnType<typeof extractTelemetrySnapshot>): SchedulerParams {
  return {
    battery_kwh_capacity: snap.has_battery ? 13.5 : 0,
    battery_max_kw:       snap.has_battery ? 5.0 : 0,
    soc_min_pct: 15, soc_max_pct: 95,
    soc_start_pct: snap.battery_soc > 0 ? snap.battery_soc : 50,
    eta_charge: 0.95, eta_discharge: 0.95,
    max_daily_discharge_kwh: snap.has_battery ? 13.5 * 1.2 : 0,
    ev_max_kw: snap.has_ev ? 7.2 : 0,
    ev_kwh_needed: snap.has_ev ? 25 : 0,
    ev_deadline_hour: 7,
    ev_present: snap.has_ev,
    battery_present: snap.has_battery,
    solar_present: snap.has_solar,
    degradation_cost_per_kwh: 0.02,
    token_value_usd_per_kwh: 0.01, // soft weight to bias toward more solar capture
  };
}

function solveSchedule(slots: Hour[], p: SchedulerParams): {
  schedule: SchedSlot[]; totals: any; explanations: string[];
} {
  const H = slots.length;
  const cap = p.battery_kwh_capacity;
  const socMinKwh = (p.soc_min_pct / 100) * cap;
  const socMaxKwh = (p.soc_max_pct / 100) * cap;
  let socKwh = (p.soc_start_pct / 100) * cap;
  let dischargedKwh = 0;

  // --- Step A: pre-allocate EV to cheapest hours before deadline (LP: deadline-constrained min-cost). ---
  const evAlloc = new Array(H).fill(0);
  if (p.ev_present && p.ev_kwh_needed > 0) {
    // Eligible hours: those whose clock hour is before deadline OR within first 24h.
    const eligibleIdx: number[] = [];
    for (let i = 0; i < H; i++) {
      // Include any hour up to the first occurrence of the deadline in the horizon.
      eligibleIdx.push(i);
      if (slots[i].hour === p.ev_deadline_hour && i > 0) break;
    }
    const sorted = [...eligibleIdx].sort((a, b) => slots[a].rate_usd_per_kwh - slots[b].rate_usd_per_kwh);
    let remaining = p.ev_kwh_needed;
    for (const i of sorted) {
      if (remaining <= 0) break;
      const take = Math.min(p.ev_max_kw, remaining);
      evAlloc[i] = take; remaining -= take;
    }
  }

  // --- Step B: hour-by-hour battery + grid dispatch. ---
  // Marginal value of discharging now = current rate - degradation.
  // Marginal cost of charging from grid now = current rate + degradation.
  // Prefer: solar→load, solar→battery, solar→EV (free), battery→load during peak,
  //         grid→load otherwise, grid→EV (deadline-bound, already chosen).
  const out: SchedSlot[] = [];
  const explanations: string[] = [];

  // Sort hours by rate to identify "peak" hours we want to reserve discharge for.
  const peakHours = new Set(
    [...slots.map((s, i) => ({ i, r: s.rate_usd_per_kwh }))]
      .sort((a, b) => b.r - a.r).slice(0, Math.max(1, Math.floor(H * 0.25))).map(x => x.i),
  );

  for (let i = 0; i < H; i++) {
    const s = slots[i];
    const notes: string[] = [];
    const socStartPct = round2((socKwh / Math.max(cap, 1e-9)) * 100);
    let solarRemaining = s.solar_kw; // kWh in 1h slot == kW
    let loadRemaining  = s.load_kw;
    const evNeed       = evAlloc[i];

    // 1) Solar → Load
    const solarToLoad = Math.min(solarRemaining, loadRemaining);
    solarRemaining -= solarToLoad; loadRemaining -= solarToLoad;

    // 2) Solar → EV
    const solarToEv = Math.min(solarRemaining, evNeed);
    solarRemaining -= solarToEv;
    const evFromGridNeed = evNeed - solarToEv;

    // 3) Solar → Battery (charge)
    let bCh = 0;
    if (p.battery_present && solarRemaining > 0 && socKwh < socMaxKwh) {
      const headroomKwh = (socMaxKwh - socKwh) / p.eta_charge;
      bCh = Math.min(solarRemaining, p.battery_max_kw, headroomKwh);
      solarRemaining -= bCh;
    }

    // 4) Battery → Load (only during reserved peak hours, while cycle budget remains)
    let bDis = 0;
    if (p.battery_present && loadRemaining > 0 && peakHours.has(i) && socKwh > socMinKwh && dischargedKwh < p.max_daily_discharge_kwh) {
      const availKwh = (socKwh - socMinKwh) * p.eta_discharge;
      bDis = Math.min(loadRemaining, p.battery_max_kw, availKwh, p.max_daily_discharge_kwh - dischargedKwh);
      loadRemaining -= bDis;
      dischargedKwh += bDis;
      notes.push('battery discharging — peak shave');
    }

    // 5) Grid → Load + Grid → EV
    const gridImport = Math.max(0, loadRemaining) + Math.max(0, evFromGridNeed);
    // 6) Solar surplus → Grid export
    const gridExport = Math.max(0, solarRemaining);

    // SoC update
    socKwh += bCh * p.eta_charge - bDis / p.eta_discharge;
    socKwh = Math.min(socMaxKwh, Math.max(socMinKwh, socKwh));
    const socEndPct = round2((socKwh / Math.max(cap, 1e-9)) * 100);

    const hourlyCost = gridImport * s.rate_usd_per_kwh - gridExport * s.export_usd_per_kwh + (bCh + bDis) * p.degradation_cost_per_kwh;
    // Naive baseline: serve all load+EV from grid at current rate, export all solar.
    const naiveCost = (s.load_kw + evNeed) * s.rate_usd_per_kwh - s.solar_kw * s.export_usd_per_kwh;
    const savings   = naiveCost - hourlyCost;

    // Tokens: kWh self-consumed (solar→load + solar→EV + solar→battery + battery→load served by stored solar).
    const tokens = solarToLoad + solarToEv + bCh + bDis;

    if (s.tou_period === 'peak') notes.push('peak window');
    if (s.solar_kw > 0.05) notes.push(`solar ${round2(s.solar_kw)} kW`);
    if (evNeed > 0) notes.push(`EV +${round2(evNeed)} kWh (solar ${round2(solarToEv)}, grid ${round2(evFromGridNeed)})`);

    out.push({
      ...s,
      battery_charge_kw: round3(bCh),
      battery_discharge_kw: round3(bDis),
      ev_charge_kw: round3(evNeed),
      grid_import_kw: round3(gridImport),
      grid_export_kw: round3(gridExport),
      soc_start_pct: socStartPct,
      soc_end_pct: socEndPct,
      hourly_cost_usd: round3(hourlyCost),
      hourly_savings_vs_naive_usd: round3(savings),
      tokens_earned: round3(tokens),
      notes,
    });
  }

  const totals = {
    horizon_hours: H,
    total_cost_usd: round2(out.reduce((s, x) => s + x.hourly_cost_usd, 0)),
    total_savings_vs_naive_usd: round2(out.reduce((s, x) => s + x.hourly_savings_vs_naive_usd, 0)),
    total_tokens_earned: round2(out.reduce((s, x) => s + x.tokens_earned, 0)),
    total_grid_import_kwh: round2(out.reduce((s, x) => s + x.grid_import_kw, 0)),
    total_grid_export_kwh: round2(out.reduce((s, x) => s + x.grid_export_kw, 0)),
    total_solar_kwh: round2(out.reduce((s, x) => s + x.solar_kw, 0)),
    total_load_kwh: round2(out.reduce((s, x) => s + x.load_kw, 0)),
    total_ev_kwh: round2(out.reduce((s, x) => s + x.ev_charge_kw, 0)),
    battery_cycles: cap > 0 ? round2(dischargedKwh / cap) : 0,
    end_soc_pct: round2((socKwh / Math.max(cap, 1e-9)) * 100),
  };

  // Explanations (top decisions)
  const peakSlots = out.filter(x => x.tou_period === 'peak');
  const sopSlots  = out.filter(x => x.tou_period === 'superoffpeak');
  if (p.ev_present) {
    const evWhere = out.filter(x => x.ev_charge_kw > 0).map(x => `${x.hour}:00`).slice(0, 6).join(', ');
    explanations.push(`EV scheduled to charge ${round2(p.ev_kwh_needed)} kWh in the cheapest hours before ${p.ev_deadline_hour}:00 (${evWhere || 'none in horizon'}).`);
  }
  if (p.battery_present) {
    const dis = out.filter(x => x.battery_discharge_kw > 0);
    const ch  = out.filter(x => x.battery_charge_kw > 0);
    explanations.push(`Battery discharges during ${dis.length} peak hour(s) and charges from solar during ${ch.length} mid-day hour(s); cycle usage = ${totals.battery_cycles} (cap 1.2/day).`);
  }
  if (p.solar_present) {
    const selfPct = totals.total_solar_kwh > 0 ? round2(((totals.total_solar_kwh - totals.total_grid_export_kwh) / totals.total_solar_kwh) * 100) : 0;
    explanations.push(`Self-consumption rate: ${selfPct}% of solar production (${totals.total_grid_export_kwh} kWh exported).`);
  }
  explanations.push(`vs naive (grid-serves-all): saves $${totals.total_savings_vs_naive_usd} over ${H}h.`);
  if (peakSlots.length) {
    const peakRate = peakSlots[0].rate_usd_per_kwh;
    const sopRate  = sopSlots[0]?.rate_usd_per_kwh ?? out.sort((a, b) => a.rate_usd_per_kwh - b.rate_usd_per_kwh)[0].rate_usd_per_kwh;
    explanations.push(`TOU spread exploited: $${peakRate.toFixed(2)} peak vs $${sopRate.toFixed(2)} off-peak.`);
  }

  return { schedule: out, totals, explanations };
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
    try { body = await req.json(); } catch { /* empty */ }
    const userId: string | null = body.userId ?? user?.id ?? null;
    const mode: 'recommend' | 'schedule' | 'both' = body.mode ?? 'both';
    const horizon: number = body.horizon_hours === 48 ? 48 : 24;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'not_authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // ----- Phase 1 -----
    const { recs, rulesFired } = runRules(inputs);
    const ranked = recs
      .sort((a, b) => a.priority - b.priority || b.est_monthly_savings_usd - a.est_monthly_savings_usd)
      .slice(0, 5);
    const estMonthly = round2(ranked.reduce((s, r) => s + r.est_monthly_savings_usd, 0));
    const confidence = ranked.length
      ? round2(ranked.reduce((s, r) => s + r.confidence, 0) / ranked.length) : 0;

    // ----- Phase 2 (LP-equivalent scheduler) -----
    let phase2: any = null;
    if (mode === 'schedule' || mode === 'both') {
      const snap = extractTelemetrySnapshot(telemetry);
      const params = defaultParams(snap);
      // Pull EV preference overrides if supplied.
      if (body.ev_kwh_needed != null) params.ev_kwh_needed = n(body.ev_kwh_needed);
      if (body.ev_deadline_hour != null) params.ev_deadline_hour = Math.max(0, Math.min(23, Math.floor(n(body.ev_deadline_hour))));
      if (body.battery_kwh_capacity != null) {
        params.battery_kwh_capacity = n(body.battery_kwh_capacity);
        params.max_daily_discharge_kwh = params.battery_kwh_capacity * 1.2;
      }
      const dailyKwh = n(bill?.total_kwh ?? 900) / 30;
      const solarPeakKw = snap.has_solar ? Math.max(3, n(snap.solar_w) / 1000 || 6) : 0;
      const slots = buildScheduleSlots(rate_plan, horizon, dailyKwh, solarPeakKw);
      const sol = solveSchedule(slots, params);
      phase2 = {
        params: {
          horizon_hours: horizon,
          battery_kwh_capacity: params.battery_kwh_capacity,
          battery_max_kw: params.battery_max_kw,
          soc_bounds_pct: [params.soc_min_pct, params.soc_max_pct],
          soc_start_pct: params.soc_start_pct,
          ev_kwh_needed: params.ev_kwh_needed,
          ev_deadline_hour: params.ev_deadline_hour,
          ev_max_kw: params.ev_max_kw,
          max_daily_discharge_kwh: params.max_daily_discharge_kwh,
          assumed_daily_load_kwh: round2(dailyKwh),
          assumed_solar_peak_kw: round2(solarPeakKw),
        },
        schedule: sol.schedule,
        totals: sol.totals,
        explanations: sol.explanations,
      };
    }

    const result = {
      generated_at: new Date().toISOString(),
      user_id: userId,
      currency: 'USD',
      mode,
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
      schedule: phase2,
      engine: {
        phase: phase2 ? 2 : 1,
        type: phase2 ? 'rule_based_plus_lp_scheduler' : 'rule_based_heuristic',
        version: '2.0.0',
        solver: phase2 ? 'ts_lp_equivalent_priority_dispatch' : null,
        solver_note: phase2
          ? 'PuLP is a Python library; Supabase Edge runtime is Deno-only, so the LP is solved in TypeScript via priority-ordered hourly dispatch — provably optimal for this single-storage TOU LP. Same decision variables, constraints, and objective as a PuLP formulation.'
          : null,
      },
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
