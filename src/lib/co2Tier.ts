/**
 * CO₂ Impact Tier — narrative-only status badge tied to lifetime CO₂ offset.
 *
 * This is a *narrative multiplier* (gamification / status), NOT a tokenomics
 * multiplier. The locked v3.1 mint split (SSOT in src/lib/tokenomics.ts) is
 * NEVER altered by tier — UI keeps showing 1 kWh = 1 $ZSOLAR to the user.
 *
 * Future: real yield multipliers will live behind the parked on-chain
 * Energy Price Oracle (Series A scope). Until then, tiers are pure status.
 */

export type Co2TierId = 'seedling' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Co2Tier {
  id: Co2TierId;
  label: string;
  minLbs: number;
  nextLbs: number | null;
  blurb: string;
}

const TIERS: Co2Tier[] = [
  { id: 'seedling', label: 'Seedling',  minLbs: 0,     nextLbs: 200,   blurb: 'Welcome to the grid you replace.' },
  { id: 'bronze',   label: 'Bronze',    minLbs: 200,   nextLbs: 1000,  blurb: 'Equivalent to 10+ trees planted this year.' },
  { id: 'silver',   label: 'Silver',    minLbs: 1000,  nextLbs: 5000,  blurb: 'Carbon-positive household contributor.' },
  { id: 'gold',     label: 'Gold',      minLbs: 5000,  nextLbs: 20000, blurb: 'Top 10% impact among ZenSolar members.' },
  { id: 'platinum', label: 'Platinum',  minLbs: 20000, nextLbs: null,  blurb: 'Elite climate-positive operator.' },
];

export function getCo2Tier(lifetimeLbs: number): Co2Tier {
  const lbs = Math.max(0, Number(lifetimeLbs) || 0);
  let current = TIERS[0];
  for (const t of TIERS) {
    if (lbs >= t.minLbs) current = t;
  }
  return current;
}

export function getCo2TierProgress(lifetimeLbs: number): {
  tier: Co2Tier;
  progressPct: number; // 0–100 toward next tier (100 if at top)
  toNextLbs: number | null;
} {
  const tier = getCo2Tier(lifetimeLbs);
  if (tier.nextLbs == null) {
    return { tier, progressPct: 100, toNextLbs: null };
  }
  const span = tier.nextLbs - tier.minLbs;
  const into = Math.max(0, lifetimeLbs - tier.minLbs);
  const pct = Math.min(100, Math.max(0, (into / span) * 100));
  return {
    tier,
    progressPct: pct,
    toNextLbs: Math.max(0, tier.nextLbs - lifetimeLbs),
  };
}
