/**
 * Mint-on-Proof pure verification helpers.
 *
 * These functions are the contract for "no proof, no mint."
 * They run identically in the client, in edge functions, and in tests.
 * If you change them, update src/lib/__tests__/mintReconciliation.test.ts
 * and document user-facing impact in mem://features/proof-of-genesis-*.
 *
 * Rules enforced here (mirrors db migration 2026-05-24):
 *   M3. tokens/kWh/miles deltas must be >= 0
 *   M4. Three-way reconciliation: |headline − rows| ≤ tolerance AND
 *       |on_chain − headline| ≤ tolerance (default 1%)
 *   M5. Baseline ≤ lifetime for every numeric watermark key
 *   M7. verifyMintProof() — single function called by both edge function
 *       (pre-mint guard) and tests (golden fixtures).
 */

export const DEFAULT_RECONCILIATION_TOLERANCE_PCT = 1.0;
export const ABSOLUTE_FLOOR = 0.5; // kWh / miles — below this, % tolerance is too tight

export type MintViolationCode =
  | 'negative_amount'
  | 'baseline_exceeds_lifetime'
  | 'headline_rows_mismatch'
  | 'onchain_headline_mismatch'
  | 'idempotency_collision'
  | 'empty_source_breakdown';

export interface MintViolation {
  code: MintViolationCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ThreeWayInput {
  category: string;
  headline: number;
  rows: number;
  onChain: number;
  tolerancePct?: number;
}

export interface ThreeWayResult {
  ok: boolean;
  diffPct: number;
  rowsDiffPct: number;
  onChainDiffPct: number;
  violations: MintViolation[];
}

/** Percent diff using max(headline, ABSOLUTE_FLOOR) as denominator. */
export function diffPct(a: number, b: number): number {
  const denom = Math.max(Math.abs(a), Math.abs(b), ABSOLUTE_FLOOR);
  return Math.round(((a - b) / denom) * 10000) / 100; // two decimals
}

/**
 * M4 — Three-way reconciliation: headline ↔ rows ↔ on-chain.
 * Pure, deterministic, no I/O.
 */
export function verifyThreeWayMatch(input: ThreeWayInput): ThreeWayResult {
  const tol = input.tolerancePct ?? DEFAULT_RECONCILIATION_TOLERANCE_PCT;
  const rowsDiff = diffPct(input.headline, input.rows);
  const onChainDiff = diffPct(input.onChain, input.headline);
  const violations: MintViolation[] = [];

  if (Math.abs(rowsDiff) > tol) {
    violations.push({
      code: 'headline_rows_mismatch',
      message: `${input.category}: headline ${input.headline} vs rows ${input.rows} (diff ${rowsDiff}% > ${tol}%)`,
      details: { headline: input.headline, rows: input.rows, diffPct: rowsDiff, tolerancePct: tol },
    });
  }
  if (Math.abs(onChainDiff) > tol) {
    violations.push({
      code: 'onchain_headline_mismatch',
      message: `${input.category}: on-chain ${input.onChain} vs headline ${input.headline} (diff ${onChainDiff}% > ${tol}%)`,
      details: { onChain: input.onChain, headline: input.headline, diffPct: onChainDiff, tolerancePct: tol },
    });
  }

  return {
    ok: violations.length === 0,
    diffPct: Math.max(Math.abs(rowsDiff), Math.abs(onChainDiff)),
    rowsDiffPct: rowsDiff,
    onChainDiffPct: onChainDiff,
    violations,
  };
}

/** M3 — non-negative amount guard. */
export function verifyNonNegativeAmounts(amounts: {
  tokensMinted?: number;
  kwhDelta?: number;
  milesDelta?: number;
}): MintViolation[] {
  const out: MintViolation[] = [];
  for (const [k, v] of Object.entries(amounts)) {
    if (typeof v === 'number' && v < 0) {
      out.push({
        code: 'negative_amount',
        message: `${k} must be >= 0, got ${v}`,
        details: { field: k, value: v },
      });
    }
  }
  return out;
}

/**
 * M5 — Baseline ≤ lifetime for every numeric key present in both objects.
 * Mirrors public.enforce_baseline_le_lifetime trigger.
 */
export const WATERMARK_NUMERIC_KEYS = [
  'solar_wh',
  'lifetime_solar_wh',
  'solar_production_wh',
  'total_solar_produced_wh',
  'odometer',
  'last_known_odometer',
  'charging_kwh',
  'lifetime_charging_kwh',
  'battery_discharge_wh',
  'battery_charge_wh',
] as const;

export function verifyBaselineLeLifetime(
  baseline: Record<string, unknown> | null | undefined,
  lifetime: Record<string, unknown> | null | undefined,
): MintViolation[] {
  if (!baseline || !lifetime) return [];
  const out: MintViolation[] = [];
  for (const key of WATERMARK_NUMERIC_KEYS) {
    const b = baseline[key];
    const l = lifetime[key];
    if (typeof b !== 'number' || typeof l !== 'number') continue;
    if (b > l) {
      out.push({
        code: 'baseline_exceeds_lifetime',
        message: `baseline.${key} (${b}) exceeds lifetime.${key} (${l}); mint blocked until data syncs.`,
        details: { key, baseline: b, lifetime: l },
      });
    }
  }
  return out;
}

export interface MintProofInput {
  category: string;
  headline: number;
  rows: number;
  onChain: number;
  tokensMinted: number;
  kwhDelta?: number;
  milesDelta?: number;
  sourceBreakdown: Record<string, number>;
  baseline?: Record<string, unknown> | null;
  lifetime?: Record<string, unknown> | null;
  tolerancePct?: number;
}

export interface MintProofResult {
  ok: boolean;
  violations: MintViolation[];
  reconciliation: ThreeWayResult;
}

/**
 * M7 — Single entry point: pre-mint verification.
 * Called by the mint-onchain edge function and by tests.
 */
export function verifyMintProof(input: MintProofInput): MintProofResult {
  const violations: MintViolation[] = [
    ...verifyNonNegativeAmounts({
      tokensMinted: input.tokensMinted,
      kwhDelta: input.kwhDelta,
      milesDelta: input.milesDelta,
    }),
    ...verifyBaselineLeLifetime(input.baseline, input.lifetime),
  ];

  if (!input.sourceBreakdown || Object.keys(input.sourceBreakdown).length === 0) {
    violations.push({
      code: 'empty_source_breakdown',
      message: 'source_breakdown is required for forensic auditability.',
    });
  }

  const reconciliation = verifyThreeWayMatch({
    category: input.category,
    headline: input.headline,
    rows: input.rows,
    onChain: input.onChain,
    tolerancePct: input.tolerancePct,
  });

  return {
    ok: violations.length === 0 && reconciliation.ok,
    violations: [...violations, ...reconciliation.violations],
    reconciliation,
  };
}
