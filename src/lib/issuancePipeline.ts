/**
 * CANONICAL ISSUANCE PIPELINE (client mirror).
 *
 * Kept identical to supabase/functions/_shared/issuancePipeline.ts.
 *
 * Every path that issues $ZSOLAR runs verified quantities through this
 * pipeline. The stage order is fixed and declared once:
 *
 *     netting  ->  stack_bonus  ->  allowance_cap
 *
 * Only `netting` is implemented today (2026-07-31). `stack_bonus` and
 * `allowance_cap` are NOT adopted mechanisms — the Stack Bonus has not been
 * decided and the cap needs plans and billing that do not exist yet. They are
 * present here as explicit, typed no-op seams so they can be filled in later
 * without restructuring any caller.
 *
 * SEAMS — where the two unbuilt stages plug in:
 *   1. `StackBonusStage` / `AllowanceCapStage` below: implement the interface.
 *   2. `runIssuancePipeline(..., { stackBonus, allowanceCap })`: pass the
 *      implementation in. Nothing else changes.
 *   3. `PipelineTrace.stages`: each stage appends its own before/after entry,
 *      so the receipt and the reconciliation log get the breakdown for free.
 *
 * A stage may only ever transform quantities. It must not read or write
 * baselines, watermarks, or accrual rows.
 */

import {
  CONVERSION_FACTORS,
  HOME_CHARGING_SOLAR_NETTING_FACTOR,
  MINT_SPLIT_PER_UNIT,
  type MintCategory,
} from '@/lib/mintFactors';

/** Verified quantity per category, in that category's native unit (kWh or miles). */
export type QuantityByCategory = Partial<Record<MintCategory, number>>;

export interface IssuanceContext {
  userId: string;
  /** True when the household has at least one connected solar-producing device. */
  solarConnectedHome: boolean;
}

export interface StageResult {
  stage: string;
  applied: boolean;
  /** Why the stage did or did not change anything — surfaced in the receipt. */
  note: string;
  before: QuantityByCategory;
  after: QuantityByCategory;
}

export interface PipelineStage {
  name: string;
  run(q: QuantityByCategory, ctx: IssuanceContext): { quantities: QuantityByCategory; note: string; applied: boolean };
}

export interface PipelineTrace {
  order: string[];
  stages: StageResult[];
  /** Post-pipeline quantities, still in native units. */
  quantities: QuantityByCategory;
  /** Tokens credited to the member. */
  userTokens: number;
  /** Tokens allocated to treasury alongside the member credit. */
  treasuryTokens: number;
  /** Total tokens minted (member + treasury). */
  totalTokens: number;
}

const clone = (q: QuantityByCategory): QuantityByCategory => ({ ...q });

// ---------------------------------------------------------------------------
// STAGE 1 — NETTING (implemented)
// ---------------------------------------------------------------------------

/**
 * Home charging on a solar-connected home is netted to 0.25:1 so that
 * self-generated energy is not credited twice — once as solar production and
 * again as charging. Homes with no connected solar device are unaffected:
 * their charging energy came off the grid and was only ever counted once.
 */
export const nettingStage: PipelineStage = {
  name: 'netting',
  run(q, ctx) {
    const out = clone(q);
    const home = out.home_charging_kwh ?? 0;

    if (!ctx.solarConnectedHome || home <= 0) {
      return {
        quantities: out,
        applied: false,
        note: home <= 0
          ? 'No home charging in this issuance — netting not applicable.'
          : 'No connected solar device on this account — home charging is grid energy and is not netted.',
      };
    }

    out.home_charging_kwh = home * HOME_CHARGING_SOLAR_NETTING_FACTOR;
    return {
      quantities: out,
      applied: true,
      note:
        `Solar-connected home: home charging netted at ${HOME_CHARGING_SOLAR_NETTING_FACTOR}:1 ` +
        `(${home} kWh -> ${out.home_charging_kwh} kWh credited) so self-generated energy is not counted twice.`,
    };
  },
};

// ---------------------------------------------------------------------------
// STAGE 2 — STACK BONUS (seam, not adopted)
// ---------------------------------------------------------------------------

export const stackBonusNoop: PipelineStage = {
  name: 'stack_bonus',
  run(q) {
    return {
      quantities: clone(q),
      applied: false,
      note: 'Stack Bonus is not an adopted mechanism. No adjustment applied.',
    };
  },
};

// ---------------------------------------------------------------------------
// STAGE 3 — ALLOWANCE CAP (seam, not built)
// ---------------------------------------------------------------------------

export const allowanceCapNoop: PipelineStage = {
  name: 'allowance_cap',
  run(q) {
    return {
      quantities: clone(q),
      applied: false,
      note: 'Allowance cap requires plan and billing data that does not exist. No cap applied.',
    };
  },
};

// ---------------------------------------------------------------------------

export interface PipelineOverrides {
  stackBonus?: PipelineStage;
  allowanceCap?: PipelineStage;
}

/** Convert post-pipeline quantities into the member's token credit. */
export function tokensFromQuantities(q: QuantityByCategory): number {
  let total = 0;
  for (const [cat, qty] of Object.entries(q) as [MintCategory, number][]) {
    if (!qty) continue;
    total += qty * (CONVERSION_FACTORS[cat] ?? 0);
  }
  return total;
}

/**
 * Run verified quantities through the canonical pipeline.
 * Pure and deterministic — no I/O.
 */
export function runIssuancePipeline(
  quantities: QuantityByCategory,
  ctx: IssuanceContext,
  overrides: PipelineOverrides = {},
): PipelineTrace {
  const stages: PipelineStage[] = [
    nettingStage,
    overrides.stackBonus ?? stackBonusNoop,
    overrides.allowanceCap ?? allowanceCapNoop,
  ];

  let current = clone(quantities);
  const trace: StageResult[] = [];

  for (const stage of stages) {
    const before = clone(current);
    const res = stage.run(current, ctx);
    current = res.quantities;
    trace.push({ stage: stage.name, applied: res.applied, note: res.note, before, after: clone(current) });
  }

  const userTokens = tokensFromQuantities(current);
  const treasuryTokens = userTokens * MINT_SPLIT_PER_UNIT.treasury;

  return {
    order: stages.map((s) => s.name),
    stages: trace,
    quantities: current,
    userTokens,
    treasuryTokens,
    totalTokens: userTokens + treasuryTokens,
  };
}
