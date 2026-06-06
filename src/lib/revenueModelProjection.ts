/**
 * Revenue Model Projection (internal founders comparison)
 * ────────────────────────────────────────────────────────
 * Pure math for /founders/revenue-models. Compares the current 50/50
 * subscription split against a proposed 100%-to-LP model where the
 * company is funded primarily by data sales to utilities.
 *
 * NOT a production source of truth — for Joseph & Michael's planning only.
 * The canonical split lives in src/lib/subscriptionSplitModel.ts.
 */

import { BLENDED_ARPU } from "@/lib/subscriptionSplitModel";

export type ProjectionAssumptions = {
  /** Cash on hand at month 0 (post-seed). */
  startingCash: number;
  /** Fixed monthly operating burn. */
  monthlyBurn: number;
  /** Month index (1-24) at which data revenue starts ramping for Model B. */
  dataRevenueStartMonth: number;
  /** Target monthly data revenue by month 24 (Model B only). */
  dataRevenueTargetM24: number;
  /** Users at month 1. */
  startingUsers: number;
  /** Users at month 24 (interpolated S-curve). */
  endingUsers: number;
};

export const DEFAULT_ASSUMPTIONS: ProjectionAssumptions = {
  startingCash: 5_500_000,
  monthlyBurn: 120_000,
  dataRevenueStartMonth: 6,
  dataRevenueTargetM24: 250_000,
  startingUsers: 500,
  endingUsers: 60_000,
};

export type ProjectionRow = {
  month: number;
  users: number;
  subRevenue: number;
  // Model A — 50/50
  a_lpInjection: number;
  a_companyRevenue: number;
  a_cumulativeLp: number;
  a_cash: number;
  // Model B — 100% to LP, data sales to company
  b_lpInjection: number;
  b_dataRevenue: number;
  b_cumulativeLp: number;
  b_cash: number;
};

export type ProjectionResult = {
  rows: ProjectionRow[];
  /** First month where LP injection ≥ monthly burn (self-sustaining). */
  a_flywheelMonth: number | null;
  b_flywheelMonth: number | null;
  /** First month where cash hits zero, if any. */
  a_runwayOutMonth: number | null;
  b_runwayOutMonth: number | null;
};

/** Smooth S-curve between two values across N months (1..total). */
function sCurve(start: number, end: number, month: number, total: number): number {
  if (total <= 1) return end;
  const t = (month - 1) / (total - 1); // 0..1
  const k = 8; // steepness
  const x = (t - 0.5) * k;
  const sig = 1 / (1 + Math.exp(-x));
  const sig0 = 1 / (1 + Math.exp(0.5 * k));
  const sig1 = 1 / (1 + Math.exp(-0.5 * k));
  const norm = (sig - sig0) / (sig1 - sig0);
  return start + (end - start) * norm;
}

/** Data revenue ramps from 0 at startMonth to target at month 24. */
function dataRevenueAt(month: number, a: ProjectionAssumptions): number {
  if (month < a.dataRevenueStartMonth) return 0;
  const rampMonths = 24 - a.dataRevenueStartMonth + 1;
  if (rampMonths <= 1) return a.dataRevenueTargetM24;
  const localMonth = month - a.dataRevenueStartMonth + 1;
  return sCurve(0, a.dataRevenueTargetM24, localMonth, rampMonths);
}

export function buildProjection(a: ProjectionAssumptions): ProjectionResult {
  const rows: ProjectionRow[] = [];
  let aCash = a.startingCash;
  let bCash = a.startingCash;
  let aCumLp = 0;
  let bCumLp = 0;
  let aFlywheel: number | null = null;
  let bFlywheel: number | null = null;
  let aRunwayOut: number | null = null;
  let bRunwayOut: number | null = null;

  for (let month = 1; month <= 24; month++) {
    const users = Math.round(sCurve(a.startingUsers, a.endingUsers, month, 24));
    const subRevenue = users * BLENDED_ARPU;

    // Model A — 50/50
    const a_lp = subRevenue * 0.5;
    const a_company = subRevenue * 0.5;
    aCumLp += a_lp;
    aCash += a_company - a.monthlyBurn;
    if (aFlywheel === null && a_lp >= a.monthlyBurn) aFlywheel = month;
    if (aRunwayOut === null && aCash <= 0) aRunwayOut = month;

    // Model B — 100% to LP
    const b_lp = subRevenue * 1.0;
    const b_data = dataRevenueAt(month, a);
    bCumLp += b_lp;
    bCash += b_data - a.monthlyBurn;
    if (bFlywheel === null && b_lp >= a.monthlyBurn) bFlywheel = month;
    if (bRunwayOut === null && bCash <= 0) bRunwayOut = month;

    rows.push({
      month,
      users,
      subRevenue,
      a_lpInjection: a_lp,
      a_companyRevenue: a_company,
      a_cumulativeLp: aCumLp,
      a_cash: aCash,
      b_lpInjection: b_lp,
      b_dataRevenue: b_data,
      b_cumulativeLp: bCumLp,
      b_cash: bCash,
    });
  }

  return {
    rows,
    a_flywheelMonth: aFlywheel,
    b_flywheelMonth: bFlywheel,
    a_runwayOutMonth: aRunwayOut,
    b_runwayOutMonth: bRunwayOut,
  };
}

export const fmtUsd = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}$${Math.round(abs)}`;
};
