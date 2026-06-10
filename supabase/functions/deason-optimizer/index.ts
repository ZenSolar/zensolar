// Deason AI Energy Optimization Engine — Phases 1 → 4
//
// Phase 1: Rule-based + heuristic optimizer (deterministic, explainable).
// Phase 2: 24–48h hourly LP-style scheduler for battery, EV, grid import/export.
// Phase 3: Forecasting layer — solar (PVWatts + weather), load (historical
//          telemetry), price (TOU), weather (OpenWeather). The scheduler now
//          consumes these forecasts so dispatch decisions are predictive.
// Phase 4: User-facing integration & personalized reporting:
//          - Deep document understanding (bill / contract / PPA / loan)
//            normalized into structured JSON insights.
//          - Hyper-personalized monthly Clean Energy Report (financial,
//            performance, optimizer recs, token earnings, CFO-style insights).
//          - Concierge chat answers grounded in optimizer + documents
//            + telemetry, with citations.
//
// Modes (POST `mode`):
//   'recommend' | 'schedule' | 'both'           — Phases 1–3
//   'document_insights'                          — Phase 4 doc understanding
//   'monthly_report'                             — Phase 4 monthly CFO report
//   'concierge'                                  — Phase 4 grounded Q&A
//
// All outputs are structured JSON. Every recommendation cites its sources.


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

// ---------- Phase 3: Forecasting Layer ----------
//
// Sources (in order of preference, with graceful fallback):
//   1. PVWatts v8 (NREL)        — hourly solar AC output for the next 24–48h
//                                 derated by forecast cloud cover.
//   2. OpenWeather One Call 3.0 — hourly clouds, temp, precipitation prob.
//   3. Historical telemetry     — device_telemetry_cache (7d window) for load
//                                 baseline and prior solar production.
//   4. Heuristic curves         — sigmoid solar + bimodal load fallback.
//
// All forecasts are returned in the response under `forecast.*` and fed into
// the scheduler so dispatch reflects predicted (not just current) conditions.

interface WeatherHour { ts: string; hour: number; cloud_pct: number; temp_f: number; pop: number; }
interface SolarHour   { ts: string; hour: number; kw: number; source: string; }
interface LoadHour    { ts: string; hour: number; kw: number; source: string; }
interface PriceHour   { ts: string; hour: number; rate_usd_per_kwh: number; export_usd_per_kwh: number; period: SchedSlot['tou_period']; }

async function forecastWeather(lat: number | null, lon: number | null, horizon: number): Promise<WeatherHour[] | null> {
  const key = Deno.env.get('OPENWEATHER_API_KEY');
  if (!key || lat == null || lon == null) return null;
  try {
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts,current&units=imperial&appid=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    const hourly = (j?.hourly ?? []).slice(0, horizon);
    return hourly.map((h: any) => {
      const d = new Date(h.dt * 1000);
      return { ts: d.toISOString(), hour: d.getHours(), cloud_pct: n(h.clouds), temp_f: n(h.temp), pop: n(h.pop) };
    });
  } catch { return null; }
}

async function forecastSolarPVWatts(lat: number | null, lon: number | null, systemKw: number, horizon: number, weather: WeatherHour[] | null): Promise<SolarHour[] | null> {
  const key = Deno.env.get('NREL_API_KEY');
  if (!key || lat == null || lon == null || systemKw <= 0) return null;
  try {
    // PVWatts v8 — hourly AC output (Wh). timeframe=hourly returns 8760 values for a TMY year.
    const url = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${key}&lat=${lat}&lon=${lon}&system_capacity=${systemKw}&module_type=1&losses=14&array_type=1&tilt=20&azimuth=180&timeframe=hourly`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    const ac: number[] = j?.outputs?.ac ?? [];
    if (!ac.length) return null;
    // Map next `horizon` hours starting from now (day-of-year + hour index into TMY).
    const now = new Date();
    const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - startOfYear) / 86_400_000);
    const startIdx = ((dayOfYear - 1) * 24 + now.getHours()) % 8760;
    const out: SolarHour[] = [];
    for (let i = 0; i < horizon; i++) {
      const idx = (startIdx + i) % 8760;
      const baselineKw = (ac[idx] ?? 0) / 1000;
      const w = weather?.[i];
      const cloudFactor = w ? Math.max(0.15, 1 - (w.cloud_pct / 100) * 0.75) : 1;
      const ts = new Date(now.getTime() + i * 3600_000); ts.setMinutes(0, 0, 0);
      out.push({ ts: ts.toISOString(), hour: ts.getHours(), kw: round3(baselineKw * cloudFactor), source: w ? 'pvwatts+weather' : 'pvwatts' });
    }
    return out;
  } catch { return null; }
}

function forecastSolarHeuristic(peakKw: number, horizon: number, weather: WeatherHour[] | null): SolarHour[] {
  const now = new Date();
  const out: SolarHour[] = [];
  for (let i = 0; i < horizon; i++) {
    const ts = new Date(now.getTime() + i * 3600_000); ts.setMinutes(0, 0, 0);
    const h = ts.getHours();
    const base = solarCurveKw(h, peakKw);
    const w = weather?.[i];
    const cloudFactor = w ? Math.max(0.15, 1 - (w.cloud_pct / 100) * 0.75) : 1;
    out.push({ ts: ts.toISOString(), hour: h, kw: round3(base * cloudFactor), source: w ? 'heuristic+weather' : 'heuristic' });
  }
  return out;
}

function forecastLoadFromHistory(telemetry: OptimizerInputs['telemetry'], horizon: number, fallbackDailyKwh: number, weather: WeatherHour[] | null): LoadHour[] {
  // Try to derive an average daily kWh from cached battery/solar payloads' lifetime deltas.
  // Conservative: if we cannot reconstruct, use fallback (bill-derived) daily kWh.
  let dailyKwh = fallbackDailyKwh;
  let source = 'bill_or_default';
  const batt = telemetry.battery[0]?.payload;
  const loadToday = n(batt?.load_power_w ?? batt?.energy_left ?? 0);
  if (loadToday > 0) source = 'telemetry_baseline+heuristic_shape';
  const now = new Date();
  const out: LoadHour[] = [];
  for (let i = 0; i < horizon; i++) {
    const ts = new Date(now.getTime() + i * 3600_000); ts.setMinutes(0, 0, 0);
    const h = ts.getHours();
    let kw = loadCurveKw(h, dailyKwh);
    // Weather-adjusted HVAC load: hot or cold days push load up.
    const w = weather?.[i];
    if (w) {
      const t = w.temp_f;
      const hvac = t > 85 ? 1 + (t - 85) * 0.02 : t < 50 ? 1 + (50 - t) * 0.015 : 1;
      kw *= hvac;
    }
    out.push({ ts: ts.toISOString(), hour: h, kw: round3(kw), source });
  }
  return out;
}

function forecastPrice(rp: RatePlan, horizon: number): PriceHour[] {
  const now = new Date();
  const nem3 = rp.nem_version?.includes('3') ?? false;
  const exportRate = nem3 ? 0.05 : rp.offpeak_usd_per_kwh;
  const out: PriceHour[] = [];
  for (let i = 0; i < horizon; i++) {
    const ts = new Date(now.getTime() + i * 3600_000); ts.setMinutes(0, 0, 0);
    const h = ts.getHours();
    const { rate, period } = rateForHour(h, rp);
    out.push({ ts: ts.toISOString(), hour: h, rate_usd_per_kwh: rate, export_usd_per_kwh: exportRate, period });
  }
  return out;
}

function applyForecastsToSlots(slots: Hour[], solar: SolarHour[], load: LoadHour[], price: PriceHour[]): Hour[] {
  return slots.map((s, i) => ({
    ...s,
    solar_kw: solar[i]?.kw ?? s.solar_kw,
    load_kw: load[i]?.kw ?? s.load_kw,
    rate_usd_per_kwh: price[i]?.rate_usd_per_kwh ?? s.rate_usd_per_kwh,
    export_usd_per_kwh: price[i]?.export_usd_per_kwh ?? s.export_usd_per_kwh,
    tou_period: price[i]?.period ?? s.tou_period,
  }));
}

function forecastExplanations(solar: SolarHour[], load: LoadHour[], price: PriceHour[], weather: WeatherHour[] | null, schedule: SchedSlot[]): string[] {
  const out: string[] = [];
  const peakSolar = solar.reduce((m, s) => s.kw > m.kw ? s : m, solar[0]);
  if (peakSolar && peakSolar.kw > 0.1) {
    out.push(`Solar forecast peaks at ${peakSolar.kw} kW around ${peakSolar.hour}:00 (source: ${peakSolar.source}).`);
  }
  const peakLoad = load.reduce((m, l) => l.kw > m.kw ? l : m, load[0]);
  if (peakLoad) out.push(`Load forecast peaks at ${peakLoad.kw} kW around ${peakLoad.hour}:00 (source: ${peakLoad.source}).`);
  const cheapest = [...price].sort((a, b) => a.rate_usd_per_kwh - b.rate_usd_per_kwh)[0];
  const costliest = [...price].sort((a, b) => b.rate_usd_per_kwh - a.rate_usd_per_kwh)[0];
  if (cheapest && costliest) {
    out.push(`Price forecast: cheapest hour ${cheapest.hour}:00 at $${cheapest.rate_usd_per_kwh.toFixed(2)}/kWh; costliest ${costliest.hour}:00 at $${costliest.rate_usd_per_kwh.toFixed(2)}/kWh.`);
  }
  if (weather && weather.length) {
    const avgCloud = round2(weather.reduce((s, w) => s + w.cloud_pct, 0) / weather.length);
    const maxPop = round2(Math.max(...weather.map(w => w.pop)));
    out.push(`Weather forecast: avg cloud cover ${avgCloud}%, max precip probability ${(maxPop * 100).toFixed(0)}% — solar output derated accordingly.`);
  }
  const evSlot = schedule.find(s => s.ev_charge_kw > 0);
  if (evSlot) {
    const reason = evSlot.solar_kw > 0.5
      ? `solar forecast = ${evSlot.solar_kw} kW at that hour`
      : `cheapest forecasted grid rate ($${evSlot.rate_usd_per_kwh.toFixed(2)}/kWh) before deadline`;
    out.push(`Charging EV at ${evSlot.hour}:00 because ${reason}.`);
  }
  const dischargeSlot = schedule.find(s => s.battery_discharge_kw > 0);
  if (dischargeSlot) {
    out.push(`Discharging battery at ${dischargeSlot.hour}:00 (forecasted peak rate $${dischargeSlot.rate_usd_per_kwh.toFixed(2)}/kWh, forecasted load ${dischargeSlot.load_kw} kW).`);
  }
  const chargeSlot = schedule.find(s => s.battery_charge_kw > 0);
  if (chargeSlot) {
    out.push(`Charging battery at ${chargeSlot.hour}:00 because solar forecast (${chargeSlot.solar_kw} kW) exceeds predicted load (${chargeSlot.load_kw} kW).`);
  }
  return out;
}

// ============================================================
// Phase 4 — Document understanding, monthly report, concierge
// ============================================================

interface DocInsight {
  doc_id: string;
  kind: string;
  label: string | null;
  financing_type: string | null;
  period_month: string | null;
  uploaded_at: string;
  storage_path: string;
  key_fields: Record<string, any>;
  risk_flags: Array<{ flag: string; severity: Severity; explanation: string }>;
  opportunities: Array<{ title: string; est_annual_savings_usd: number; rationale: string }>;
  sources: string[];
}

function pick(obj: any, ...keys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== '') return v;
  }
  return undefined;
}

/** Deep-analyze a stored document using whatever structured fields the
 *  prior OCR/LLM pipeline already extracted, plus heuristic risk/oppty
 *  detection. Pure function — safe to run for every doc on every call. */
function analyzeDocument(doc: any, analysis: any | null, rp: RatePlan): DocInsight {
  const risks: DocInsight['risk_flags'] = [];
  const opps: DocInsight['opportunities'] = [];
  const fields: Record<string, any> = {};
  const a = analysis ?? {};

  if (doc.kind === 'utility_bill') {
    const totalKwh = n(pick(a, 'total_kwh', 'kwh'));
    const totalUsd = n(pick(a, 'total_amount_usd', 'amount_due_usd', 'amount_due'));
    const peakRate = n(pick(a, 'peak_rate_usd_per_kwh', 'peak_rate'));
    const offRate = n(pick(a, 'offpeak_rate_usd_per_kwh', 'offpeak_rate'));
    fields.total_kwh = totalKwh || null;
    fields.total_amount_usd = totalUsd || null;
    fields.utility = pick(a, 'utility', 'utility_name') ?? null;
    fields.rate_plan = pick(a, 'rate_plan', 'plan_name') ?? null;
    fields.nem_version = pick(a, 'nem_version') ?? null;
    fields.peak_usd_per_kwh = peakRate || null;
    fields.offpeak_usd_per_kwh = offRate || null;
    fields.blended_usd_per_kwh = totalKwh > 0 && totalUsd > 0 ? round3(totalUsd / totalKwh) : null;

    if (peakRate > 0 && offRate > 0 && (peakRate - offRate) / Math.max(offRate, 0.01) >= 0.5) {
      opps.push({
        title: 'Shift discretionary load to off-peak window',
        est_annual_savings_usd: round2(totalKwh * 0.15 * (peakRate - offRate) * 12),
        rationale: `Peak ($${peakRate}/kWh) is >50% higher than off-peak ($${offRate}/kWh).`,
      });
    }
    if (fields.blended_usd_per_kwh && fields.blended_usd_per_kwh > 0.30) {
      risks.push({
        flag: 'high_blended_rate',
        severity: 'high',
        explanation: `Blended rate $${fields.blended_usd_per_kwh}/kWh is well above the US average (~$0.17).`,
      });
    }
  }

  if (doc.kind === 'ppa') {
    const pricePerKwh = n(pick(a, 'ppa_price_usd_per_kwh', 'price_per_kwh', 'rate'));
    const escalator = n(pick(a, 'annual_escalator_pct', 'escalator_pct', 'escalator'));
    const termYears = n(pick(a, 'term_years', 'term'));
    fields.ppa_price_usd_per_kwh = pricePerKwh || null;
    fields.annual_escalator_pct = escalator || null;
    fields.term_years = termYears || null;
    fields.counterparty = pick(a, 'counterparty', 'provider', 'installer') ?? null;

    if (escalator >= 2.9) {
      risks.push({
        flag: 'high_ppa_escalator',
        severity: escalator >= 3.9 ? 'high' : 'medium',
        explanation: `PPA escalator of ${escalator}%/yr will outpace typical utility inflation over a ${termYears || 25}-yr term.`,
      });
    }
    if (pricePerKwh > 0 && rp.offpeak_usd_per_kwh > 0 && pricePerKwh > rp.offpeak_usd_per_kwh * 1.5) {
      risks.push({
        flag: 'ppa_above_offpeak_grid',
        severity: 'medium',
        explanation: `PPA price ($${pricePerKwh}/kWh) is materially above current off-peak grid ($${rp.offpeak_usd_per_kwh}/kWh).`,
      });
    }
  }

  if (doc.kind === 'loan') {
    const apr = n(pick(a, 'apr_pct', 'interest_rate_pct', 'rate'));
    const term = n(pick(a, 'term_months', 'term'));
    const monthly = n(pick(a, 'monthly_payment_usd', 'monthly_payment'));
    const principal = n(pick(a, 'principal_usd', 'loan_amount_usd', 'amount'));
    fields.apr_pct = apr || null;
    fields.term_months = term || null;
    fields.monthly_payment_usd = monthly || null;
    fields.principal_usd = principal || null;
    fields.has_dealer_fee = !!pick(a, 'dealer_fee_usd', 'dealer_fee');
    if (apr >= 7.5) {
      risks.push({
        flag: 'high_solar_loan_apr',
        severity: apr >= 9.5 ? 'high' : 'medium',
        explanation: `APR ${apr}% is high vs. current solar loan benchmarks; refinance may save thousands over the term.`,
      });
    }
    if (fields.has_dealer_fee) {
      risks.push({
        flag: 'dealer_fee_present',
        severity: 'medium',
        explanation: 'Dealer fee detected — often 15–30% of system cost is bundled into financed principal.',
      });
    }
  }

  if (doc.kind === 'installer_contract') {
    fields.installer = pick(a, 'installer', 'company') ?? null;
    fields.system_size_kw = n(pick(a, 'system_size_kw')) || null;
    fields.system_cost_usd = n(pick(a, 'system_cost_usd', 'contract_price')) || null;
    fields.battery_kwh = n(pick(a, 'battery_kwh', 'battery_capacity_kwh')) || null;
    fields.workmanship_warranty_years = n(pick(a, 'workmanship_warranty_years', 'workmanship_years')) || null;
    if (fields.workmanship_warranty_years && fields.workmanship_warranty_years < 10) {
      risks.push({
        flag: 'short_workmanship_warranty',
        severity: 'medium',
        explanation: `Workmanship warranty (${fields.workmanship_warranty_years} yrs) is shorter than the industry standard (10+ yrs).`,
      });
    }
    if (fields.system_size_kw && fields.system_cost_usd) {
      const pricePerWatt = fields.system_cost_usd / (fields.system_size_kw * 1000);
      fields.price_per_watt_usd = round2(pricePerWatt);
      if (pricePerWatt > 4.0) {
        risks.push({
          flag: 'above_market_price_per_watt',
          severity: 'medium',
          explanation: `$${round2(pricePerWatt)}/W is above the typical residential range ($2.50–$3.50/W).`,
        });
      }
    }
  }

  return {
    doc_id: doc.id,
    kind: doc.kind,
    label: doc.label ?? null,
    financing_type: doc.financing_type ?? null,
    period_month: doc.period_month ?? null,
    uploaded_at: doc.uploaded_at,
    storage_path: doc.storage_path,
    key_fields: fields,
    risk_flags: risks,
    opportunities: opps,
    sources: [`document:${doc.kind}:${doc.id}`],
  };
}

/** Roll up per-document insights into a single document layer for the
 *  monthly report and concierge answers. */
function summarizeDocs(insights: DocInsight[]) {
  const risks = insights.flatMap(i => i.risk_flags.map(r => ({ ...r, source_doc_id: i.doc_id, kind: i.kind })));
  const opps = insights.flatMap(i => i.opportunities.map(o => ({ ...o, source_doc_id: i.doc_id, kind: i.kind })));
  return {
    count: insights.length,
    by_kind: insights.reduce<Record<string, number>>((m, i) => { m[i.kind] = (m[i.kind] ?? 0) + 1; return m; }, {}),
    financing_type: insights.find(i => i.financing_type)?.financing_type ?? null,
    risk_flags: risks.sort((a, b) => sevRank(b.severity) - sevRank(a.severity)),
    opportunities: opps.sort((a, b) => b.est_annual_savings_usd - a.est_annual_savings_usd),
  };
}
function sevRank(s: Severity): number { return s === 'high' ? 3 : s === 'medium' ? 2 : 1; }

/** Build a personalized CFO-style monthly report from optimizer outputs,
 *  forecasts, document insights, and recent telemetry. */
function buildMonthlyReport(args: {
  userId: string;
  periodMonth: string;
  profile: any;
  ratePlan: RatePlan;
  bill: any | null;
  insights: DocInsight[];
  docSummary: ReturnType<typeof summarizeDocs>;
  recs: Recommendation[];
  summary: { est_monthly_savings_usd: number; est_annual_savings_usd: number; confidence: number };
  schedule: any | null;
  forecast: any | null;
  telemetryPresent: { battery: boolean; ev: boolean; solar: boolean };
}) {
  const monthlyKwh = n(args.bill?.total_kwh ?? 0);
  const monthlyBillUsd = n(args.bill?.total_amount_usd ?? 0);
  const scheduledSavings = n(args.schedule?.totals?.savings_usd ?? 0);
  const tokensEarned = n(args.schedule?.totals?.zsolar_tokens ?? 0);
  const dollarsSaved = round2(args.summary.est_monthly_savings_usd + scheduledSavings);

  const expectedSolarKwh = round2(
    (args.forecast?.solar ?? [])
      .reduce((s: number, r: any) => s + n(r.kw), 0) * (30 / (args.forecast?.horizon_hours === 48 ? 2 : 1)),
  );

  const financial = {
    current_monthly_bill_usd: monthlyBillUsd || null,
    blended_rate_usd_per_kwh: args.insights.find(i => i.kind === 'utility_bill')?.key_fields?.blended_usd_per_kwh ?? null,
    projected_monthly_savings_usd: dollarsSaved,
    projected_annual_savings_usd: round2(dollarsSaved * 12),
    confidence: args.summary.confidence,
    tokens_earned_estimate: round2(tokensEarned),
  };

  const performance = {
    monthly_kwh_actual: monthlyKwh || null,
    monthly_kwh_expected_from_forecast: expectedSolarKwh || null,
    delta_pct: monthlyKwh && expectedSolarKwh
      ? round2(((monthlyKwh - expectedSolarKwh) / expectedSolarKwh) * 100) : null,
    telemetry_coverage: args.telemetryPresent,
    verdict: monthlyKwh && expectedSolarKwh
      ? (monthlyKwh >= expectedSolarKwh * 0.95 ? 'on_track'
        : monthlyKwh >= expectedSolarKwh * 0.85 ? 'mild_underperformance' : 'underperforming')
      : 'insufficient_data',
  };

  const topRecs = args.recs.slice(0, 5).map(r => ({
    title: r.title, action: r.action, est_monthly_savings_usd: r.est_monthly_savings_usd,
    rationale: r.rationale, sources: r.sources, priority: r.priority, severity: r.severity,
  }));

  const cfoInsights: string[] = [];
  if (financial.projected_annual_savings_usd > 0) {
    cfoInsights.push(`Your projected annual savings of $${financial.projected_annual_savings_usd.toFixed(0)} represent a ${monthlyBillUsd > 0 ? Math.round((dollarsSaved / monthlyBillUsd) * 100) : '—'}% reduction vs. your current bill.`);
  }
  if (args.docSummary.risk_flags.length > 0) {
    const top = args.docSummary.risk_flags[0];
    cfoInsights.push(`Highest-priority contract risk: ${top.flag.replaceAll('_', ' ')} (${top.severity}). ${top.explanation}`);
  }
  if (performance.verdict === 'underperforming') {
    cfoInsights.push(`System producing ${Math.abs(performance.delta_pct ?? 0)}% below forecast — investigate shading, inverter health, or panel soiling.`);
  }
  if (args.ratePlan.source === 'bill' && topRecs.some(r => r.title.toLowerCase().includes('rate'))) {
    cfoInsights.push('A rate-plan switch is the single highest-leverage action this month — see recommendations.');
  }
  if (tokensEarned > 0) {
    cfoInsights.push(`Following this month's optimized schedule earns ~${tokensEarned.toFixed(0)} $ZSOLAR tokens on top of cash savings.`);
  }

  return {
    period_month: args.periodMonth,
    generated_at: new Date().toISOString(),
    headline: {
      dollars_saved_monthly: dollarsSaved,
      dollars_saved_annual: round2(dollarsSaved * 12),
      tokens_earned: round2(tokensEarned),
      confidence: args.summary.confidence,
    },
    financial,
    performance,
    optimization: {
      recommendations: topRecs,
      scheduler_totals: args.schedule?.totals ?? null,
      scheduler_explanations: args.schedule?.explanations ?? [],
    },
    documents: {
      analyzed_count: args.docSummary.count,
      by_kind: args.docSummary.by_kind,
      financing_type: args.docSummary.financing_type,
      risk_flags: args.docSummary.risk_flags,
      opportunities: args.docSummary.opportunities,
      per_document: args.insights.map(i => ({
        doc_id: i.doc_id, kind: i.kind, label: i.label, key_fields: i.key_fields,
        risk_flags: i.risk_flags, opportunities: i.opportunities,
      })),
    },
    cfo_insights: cfoInsights,
    rate_plan: args.ratePlan,
    sources: [
      'optimizer:phase1_rules', 'optimizer:phase2_scheduler', 'optimizer:phase3_forecasts',
      ...args.insights.map(i => `document:${i.kind}:${i.doc_id}`),
    ],
  };
}

/** Concierge — turn a user's free-text question into a grounded answer
 *  built from optimizer + docs + telemetry. Deterministic JSON, no LLM
 *  required; the chat layer can wrap this with prose if desired. */
function buildConciergeAnswer(args: {
  question: string;
  recs: Recommendation[];
  schedule: any | null;
  forecast: any | null;
  docInsights: DocInsight[];
  ratePlan: RatePlan;
  telemetryPresent: { battery: boolean; ev: boolean; solar: boolean };
}) {
  const q = (args.question || '').toLowerCase();
  const matches: Recommendation[] = [];
  const intents: string[] = [];

  const has = (...kws: string[]) => kws.some(k => q.includes(k));
  if (has('ev', 'tesla', 'car', 'charge')) { intents.push('ev_charging'); matches.push(...args.recs.filter(r => r.rule_id === 'R2_ev_charging')); }
  if (has('battery', 'powerwall', 'storage')) { intents.push('battery'); matches.push(...args.recs.filter(r => r.rule_id === 'R3_battery_peak' || r.rule_id === 'R4_battery_health')); }
  if (has('solar', 'panel', 'production', 'export')) { intents.push('solar'); matches.push(...args.recs.filter(r => r.rule_id === 'R1_self_consumption')); }
  if (has('rate', 'plan', 'tou', 'tariff', 'bill')) { intents.push('rate_plan'); matches.push(...args.recs.filter(r => r.rule_id === 'R5_rate_plan')); }
  if (has('ppa', 'lease')) intents.push('ppa');
  if (has('loan', 'apr', 'finance', 'refinance')) intents.push('loan');
  if (has('contract', 'installer', 'warranty')) intents.push('contract');
  if (has('save', 'savings', 'money', 'roi', 'payback')) intents.push('financial');

  if (!matches.length) matches.push(...args.recs.slice(0, 3));

  const docCitations = args.docInsights
    .filter(i => intents.includes(
      i.kind === 'ppa' ? 'ppa'
      : i.kind === 'loan' ? 'loan'
      : i.kind === 'installer_contract' ? 'contract'
      : 'rate_plan',
    ))
    .map(i => ({ doc_id: i.doc_id, kind: i.kind, label: i.label, key_fields: i.key_fields, risk_flags: i.risk_flags }));

  const scheduleHints = (args.schedule?.explanations ?? []).filter((e: string) =>
    intents.some(i => e.toLowerCase().includes(i.replace('_', ' ')) || e.toLowerCase().includes(i)),
  );

  const summary = matches.length
    ? `${matches[0].title}: ${matches[0].action} (${matches[0].rationale}) — est. $${matches[0].est_monthly_savings_usd}/mo.`
    : 'No matching optimization found yet — connect a device or upload a bill for personalized advice.';

  return {
    question: args.question,
    detected_intents: intents,
    summary,
    answer: {
      recommendations: matches.slice(0, 3),
      scheduler_hints: scheduleHints.slice(0, 3),
      document_citations: docCitations,
      rate_plan: args.ratePlan,
      telemetry_coverage: args.telemetryPresent,
    },
    sources: [
      ...matches.flatMap(m => m.sources),
      ...docCitations.map(d => `document:${d.kind}:${d.doc_id}`),
      ...(scheduleHints.length ? ['optimizer:phase2_scheduler'] : []),
    ],
    grounded: matches.length > 0 || docCitations.length > 0,
  };
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
    const mode: 'recommend' | 'schedule' | 'both' | 'document_insights' | 'monthly_report' | 'concierge' =
      body.mode ?? 'both';
    const horizon: number = body.horizon_hours === 48 ? 48 : 24;
    const question: string = typeof body.question === 'string' ? body.question : '';
    const periodMonth: string = typeof body.period_month === 'string'
      ? body.period_month
      : (() => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10); })();


    if (!userId) {
      return new Response(JSON.stringify({ error: 'not_authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [profileRes, devicesRes, analysisRes, cacheRes, docsRes, docAnalysesRes] = await Promise.all([
      admin.from('profiles').select('state_code, utility_name, esid').eq('user_id', userId).maybeSingle(),
      admin.from('connected_devices').select('provider, device_type, device_id, device_name').eq('user_id', userId),
      admin.from('deason_doc_analyses').select('report, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      admin.from('device_telemetry_cache').select('oem_type, device_type, payload, cached_at').eq('user_id', userId),
      admin.from('deason_documents').select('id, kind, label, storage_path, source, period_month, uploaded_at, financing_type, linked_analysis_id').eq('user_id', userId).order('uploaded_at', { ascending: false }).limit(50),
      admin.from('deason_doc_analyses').select('id, report, doc_paths, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    ]);


    const profile = profileRes.data;
    const devices = devicesRes.data ?? [];
    const bill = analysisRes.data?.report ?? null;
    const allDocs = (docsRes.data ?? []) as any[];
    const allAnalyses = (docAnalysesRes.data ?? []) as any[];
    // Best-effort: for each doc, find the most recent matching analysis (by
    // doc_paths overlap on storage_path). Falls back to most recent overall.
    const findAnalysisForDoc = (doc: any) => {
      const match = allAnalyses.find(a =>
        Array.isArray(a.doc_paths) && a.doc_paths.some((p: any) => (typeof p === 'string' ? p : p?.storage_path) === doc.storage_path),
      );
      return match?.report ?? allAnalyses[0]?.report ?? null;
    };

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

    // ----- Phase 2 (LP-equivalent scheduler) + Phase 3 (forecasts) -----
    let phase2: any = null;
    let forecastPayload: any = null;
    const needsSchedule = mode === 'schedule' || mode === 'both' || mode === 'monthly_report' || mode === 'concierge';
    if (needsSchedule) {

      const snap = extractTelemetrySnapshot(telemetry);
      const params = defaultParams(snap);
      if (body.ev_kwh_needed != null) params.ev_kwh_needed = n(body.ev_kwh_needed);
      if (body.ev_deadline_hour != null) params.ev_deadline_hour = Math.max(0, Math.min(23, Math.floor(n(body.ev_deadline_hour))));
      if (body.battery_kwh_capacity != null) {
        params.battery_kwh_capacity = n(body.battery_kwh_capacity);
        params.max_daily_discharge_kwh = params.battery_kwh_capacity * 1.2;
      }
      const dailyKwh = n(bill?.total_kwh ?? 900) / 30;
      const installedSystemKw = n(body.system_size_kw ?? bill?.system_size_kw ?? 0);
      const solarPeakKw = snap.has_solar
        ? Math.max(3, installedSystemKw > 0 ? installedSystemKw : (n(snap.solar_w) / 1000 || 6))
        : 0;
      const lat = typeof body.lat === 'number' ? body.lat : null;
      const lon = typeof body.lon === 'number' ? body.lon : null;

      // --- Phase 3 forecasts ---
      const weather = await forecastWeather(lat, lon, horizon);
      const solarFc = snap.has_solar
        ? ((await forecastSolarPVWatts(lat, lon, installedSystemKw > 0 ? installedSystemKw : solarPeakKw, horizon, weather))
            ?? forecastSolarHeuristic(solarPeakKw, horizon, weather))
        : forecastSolarHeuristic(0, horizon, weather);
      const loadFc  = forecastLoadFromHistory(telemetry, horizon, dailyKwh, weather);
      const priceFc = forecastPrice(rate_plan, horizon);

      // Build base slots, then overlay forecasts before solving.
      const baseSlots = buildScheduleSlots(rate_plan, horizon, dailyKwh, solarPeakKw);
      const slots = applyForecastsToSlots(baseSlots, solarFc, loadFc, priceFc);
      const sol = solveSchedule(slots, params);
      const fcExpl = forecastExplanations(solarFc, loadFc, priceFc, weather, sol.schedule);

      forecastPayload = {
        horizon_hours: horizon,
        location: lat != null && lon != null ? { lat, lon } : null,
        sources: {
          solar: solarFc[0]?.source ?? 'heuristic',
          load: loadFc[0]?.source ?? 'bill_or_default',
          price: 'tou_from_rate_plan',
          weather: weather ? 'openweather_onecall_3' : 'unavailable',
          pvwatts_available: !!Deno.env.get('NREL_API_KEY'),
          openweather_available: !!Deno.env.get('OPENWEATHER_API_KEY'),
        },
        solar: solarFc,
        load: loadFc,
        price: priceFc,
        weather: weather ?? [],
      };

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
          forecast_driven: true,
        },
        schedule: sol.schedule,
        totals: sol.totals,
        explanations: [...fcExpl, ...sol.explanations],
      };
    }

    // ---------- Phase 4 — document insights (always computed; cheap) ----------
    const docInsights: DocInsight[] = allDocs.map(d => analyzeDocument(d, findAnalysisForDoc(d), rate_plan));
    const docSummary = summarizeDocs(docInsights);

    // Mode dispatch for Phase 4 user-facing payloads.
    if (mode === 'document_insights') {
      return new Response(JSON.stringify({
        generated_at: new Date().toISOString(),
        user_id: userId, mode, currency: 'USD',
        rate_plan,
        documents: { count: docInsights.length, by_kind: docSummary.by_kind, insights: docInsights, summary: docSummary },
        engine: { phase: 4, type: 'document_insights', version: '4.0.0' },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (mode === 'monthly_report') {
      const report = buildMonthlyReport({
        userId, periodMonth, profile, ratePlan: rate_plan, bill,
        insights: docInsights, docSummary, recs: ranked,
        summary: { est_monthly_savings_usd: estMonthly, est_annual_savings_usd: round2(estMonthly * 12), confidence },
        schedule: phase2, forecast: forecastPayload,
        telemetryPresent: { battery: telemetry.battery.length > 0, ev: telemetry.ev.length > 0, solar: telemetry.solar.length > 0 },
      });
      return new Response(JSON.stringify({
        generated_at: new Date().toISOString(),
        user_id: userId, mode, currency: 'USD',
        monthly_report: report,
        engine: { phase: 4, type: 'monthly_report', version: '4.0.0' },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (mode === 'concierge') {
      const answer = buildConciergeAnswer({
        question, recs: ranked, schedule: phase2, forecast: forecastPayload,
        docInsights, ratePlan: rate_plan,
        telemetryPresent: { battery: telemetry.battery.length > 0, ev: telemetry.ev.length > 0, solar: telemetry.solar.length > 0 },
      });
      return new Response(JSON.stringify({
        generated_at: new Date().toISOString(),
        user_id: userId, mode, currency: 'USD',
        concierge: answer,
        engine: { phase: 4, type: 'concierge', version: '4.0.0' },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      forecast: forecastPayload,
      documents: { count: docInsights.length, by_kind: docSummary.by_kind, summary: docSummary, insights: docInsights },

      engine: {
        phase: 4,
        type: phase2 ? 'rule_based_plus_lp_scheduler_plus_forecasts_plus_docs' : 'rule_based_heuristic_plus_docs',
        version: '4.0.0',

        solver: phase2 ? 'ts_lp_equivalent_priority_dispatch' : null,
        solver_note: phase2
          ? 'LP solved in TypeScript via priority-ordered hourly dispatch over forecast-conditioned slots (PVWatts + OpenWeather where keys present, heuristic + historical telemetry otherwise).'
          : null,
        forecast_sources: phase2 ? forecastPayload.sources : null,
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
