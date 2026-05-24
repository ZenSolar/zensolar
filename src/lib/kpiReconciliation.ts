/**
 * kpiReconciliation — verifies that the daily/normalized receipt rows
 * powering the KPI Activity Log sheet add up to the same "pending" total
 * shown on the headline KPI card.
 *
 * Why it exists:
 *   Most data sources (Enphase production, Tesla Powerwall energy_exported,
 *   Tesla odometer, Tesla supercharger lifetime kWh) are CUMULATIVE
 *   counters. The KPI tile computes pending = lifetime_now − baseline_at_mint,
 *   while the receipt list shows day-over-day deltas. If we get the
 *   normalization wrong, the headline says "100 kWh" but the daily rows
 *   sum to "12 kWh" (or vice-versa), and users lose trust.
 *
 *   This module is a single source of truth for that check. Call it from
 *   anywhere we produce receipt rows; mismatches are logged in dev and
 *   surfaced via the returned object so callers can render an "approx" hint
 *   or insert a residual row.
 */

export interface ReconciliationResult {
  /** Sum of all receipt-row amounts. */
  rowsTotal: number;
  /** Headline pending amount the receipts should sum to. */
  headline: number;
  /** headline − rowsTotal, rounded to 1 decimal. Positive = receipts undercount. */
  diff: number;
  /** Absolute diff ≤ tolerance. */
  matches: boolean;
  /** Tolerance used (kWh or miles). */
  tolerance: number;
  /** Human label for logs. */
  category: string;
}

const DEFAULT_TOLERANCE = 0.5;

export function reconcileReceipts(
  category: string,
  headline: number,
  rows: Array<{ amount: number }>,
  tolerance: number = DEFAULT_TOLERANCE,
): ReconciliationResult {
  const rowsTotal = Math.round(rows.reduce((acc, r) => acc + (Number(r.amount) || 0), 0) * 10) / 10;
  const rounded = Math.round(headline * 10) / 10;
  const diff = Math.round((rounded - rowsTotal) * 10) / 10;
  const matches = Math.abs(diff) <= tolerance;

  if (!matches && typeof console !== 'undefined' && import.meta.env?.DEV) {
    // Dev-only: surface mismatches loudly so we catch normalization regressions
    // before users see them.
     
    console.warn(
      `[kpiReconciliation] ${category} mismatch: headline=${rounded} rows=${rowsTotal} diff=${diff} (tolerance ${tolerance})`,
    );
  }

  return { rowsTotal, headline: rounded, diff, matches, tolerance, category };
}

/**
 * Build a synthetic "residual" row to bridge a shortfall between the
 * sum of real receipt rows and the headline pending amount. Used when the
 * underlying source (e.g. Tesla supercharger lifetime counter) reports
 * more energy than the individual session rows account for — typically
 * because some sessions were dropped or never delivered to the SDK.
 *
 * Returns null if the gap is within tolerance (no residual needed).
 */
export function buildResidualRow<T extends { amount: number; recordedAt: string; unit: string; provider: string }>(
  recon: ReconciliationResult,
  template: {
    unit: T['unit'];
    provider: string;
    deviceId: string | null;
    recordedAt: string;
    label: string;
  },
): (T & {
  id: string;
  hasRealTime: false;
  verified: boolean;
  location: string;
  isResidual: true;
}) | null {
  if (recon.matches || recon.diff <= 0) return null;
  return {
    id: `residual-${recon.category}-${template.recordedAt}`,
    recordedAt: template.recordedAt,
    hasRealTime: false,
    amount: recon.diff,
    unit: template.unit,
    provider: template.provider,
    deviceId: template.deviceId,
    location: template.label,
    verified: true,
    isResidual: true,
  } as unknown as T & {
    id: string;
    hasRealTime: false;
    verified: boolean;
    location: string;
    isResidual: true;
  };
}
