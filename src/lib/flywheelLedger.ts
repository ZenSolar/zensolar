/**
 * Flywheel Ledger (mock, off-chain)
 * ─────────────────────────────────
 * Derives the live 50/50 subscription-fee flywheel from the user's active
 * mock subscription tier (see SubscriptionStatusCard / Subscribe.tsx).
 *
 * Per SSoT v2.1:
 *   - 50% of every subscription dollar → on-chain liquidity pool
 *   - 50% of every subscription dollar → treasury operations
 *
 * MAINNET BEHAVIOR (parked, NOT executed here):
 *   When mainnet launches, the LP-side 50% will be auto-injected into the
 *   public LP via a smart contract — visible on Basescan in real time.
 *   Until then, this ledger is a transparent off-chain mock so users and
 *   investors can see the math accruing.
 */

import { SUBSCRIPTION_TIERS, type SubscriptionTierId } from '@/lib/tokenomics';

const MOCK_TIER_KEY = 'zensolar_mock_subscription_tier';
const MOCK_SUB_START_KEY = 'zensolar_mock_subscription_started_at';

export type FlywheelContribution = {
  tier: SubscriptionTierId | null;
  monthlyPrice: number;
  monthlyToLp: number;
  monthlyToTreasury: number;
  /** Months elapsed since this user activated (fractional, mock). */
  monthsActive: number;
  /** Cumulative $ routed to LP since activation (mock). */
  cumulativeLp: number;
  /** Cumulative $ routed to Treasury since activation (mock). */
  cumulativeTreasury: number;
  /** Cumulative total = cumulativeLp + cumulativeTreasury. */
  cumulativeTotal: number;
};

const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;

/** Read the active mock tier (or null). */
export function readMockTier(): SubscriptionTierId | null {
  try {
    const raw = localStorage.getItem(MOCK_TIER_KEY) as SubscriptionTierId | null;
    if (raw && raw in SUBSCRIPTION_TIERS) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

/** Stamp activation time on first read so cumulative math has an anchor. */
function getOrInitStartedAt(): number {
  try {
    const existing = localStorage.getItem(MOCK_SUB_START_KEY);
    if (existing) {
      const parsed = Number(existing);
      if (!Number.isNaN(parsed)) return parsed;
    }
    const now = Date.now();
    localStorage.setItem(MOCK_SUB_START_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/** Derive the current user's flywheel contribution snapshot. */
export function getFlywheelContribution(now = Date.now()): FlywheelContribution {
  const tier = readMockTier();
  if (!tier) {
    return {
      tier: null,
      monthlyPrice: 0,
      monthlyToLp: 0,
      monthlyToTreasury: 0,
      monthsActive: 0,
      cumulativeLp: 0,
      cumulativeTreasury: 0,
      cumulativeTotal: 0,
    };
  }
  const t = SUBSCRIPTION_TIERS[tier];
  const startedAt = getOrInitStartedAt();
  const monthsActive = Math.max(0, (now - startedAt) / MS_PER_MONTH);
  const cumulativeLp = t.lpPerMonth * monthsActive;
  const cumulativeTreasury = t.treasuryPerMonth * monthsActive;
  return {
    tier,
    monthlyPrice: t.monthlyPrice,
    monthlyToLp: t.lpPerMonth,
    monthlyToTreasury: t.treasuryPerMonth,
    monthsActive,
    cumulativeLp,
    cumulativeTreasury,
    cumulativeTotal: cumulativeLp + cumulativeTreasury,
  };
}

/** Reset the activation anchor (used when user changes tier). */
export function resetFlywheelAnchor(): void {
  try {
    localStorage.setItem(MOCK_SUB_START_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
