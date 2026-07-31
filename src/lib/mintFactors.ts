/**
 * CANONICAL ISSUANCE CONSTANTS — single source of truth.
 * Locked 2026-07-31.
 *
 * Every issuance path and every display path MUST read conversion factors,
 * the netting factor and the mint split from this file. Do not hardcode a
 * rate, a ratio, or a split percentage anywhere else — in code or in copy.
 *
 * A mirror for edge functions lives at
 * supabase/functions/_shared/mintFactors.ts and must be kept identical.
 */

/** Activity categories that can be converted into $ZSOLAR. */
export type MintCategory =
  | 'solar_kwh'
  | 'supercharging_kwh'
  | 'fsd_miles'
  | 'ev_miles'
  | 'battery_export_kwh'
  | 'home_charging_kwh';

/**
 * Tokens credited per verified unit (kWh or mile), BEFORE netting,
 * Stack Bonus and the allowance cap.
 */
export const CONVERSION_FACTORS: Record<MintCategory, number> = {
  solar_kwh: 1,
  supercharging_kwh: 1,
  fsd_miles: 1,
  /** General EV miles are credited at 0.1 — they are not a direct energy measurement. */
  ev_miles: 0.1,
  battery_export_kwh: 1,
  /** Home charging enters at 1 and is then netted (see below) for solar homes. */
  home_charging_kwh: 1,
};

export const CONVERSION_FACTOR_LABELS: Record<MintCategory, string> = {
  solar_kwh: '1 kWh = 1 $ZSOLAR',
  supercharging_kwh: '1 kWh = 1 $ZSOLAR',
  fsd_miles: '1 FSD mile = 1 $ZSOLAR',
  ev_miles: '10 EV miles = 1 $ZSOLAR',
  battery_export_kwh: '1 kWh exported = 1 $ZSOLAR',
  home_charging_kwh: '1 kWh = 1 $ZSOLAR (0.25 on solar-connected homes)',
};

/**
 * NETTING — applied to home charging on solar-connected homes so that
 * self-generated energy is not credited twice (once as solar production,
 * once as charging). Applied BEFORE the Stack Bonus and BEFORE the cap.
 */
export const HOME_CHARGING_SOLAR_NETTING_FACTOR = 0.25;

/** Canonical pipeline order. Every issuance path must follow it. */
export const ISSUANCE_PIPELINE_ORDER = ['netting', 'stack_bonus', 'allowance_cap'] as const;

/**
 * MINT SPLIT (locked 2026-07-31) — tokens minted per verified unit.
 * 1.25 total: 1.0 to the member, 0.25 to treasury. No LP mint. No burn at
 * mint (a burn at mint has zero net supply effect and must not exist in
 * code or copy).
 */
export const MINT_SPLIT_PER_UNIT = {
  user: 1.0,
  lp: 0,
  burn: 0,
  treasury: 0.25,
} as const;

export const MINT_SPLIT_TOTAL_PER_UNIT =
  MINT_SPLIT_PER_UNIT.user +
  MINT_SPLIT_PER_UNIT.lp +
  MINT_SPLIT_PER_UNIT.burn +
  MINT_SPLIT_PER_UNIT.treasury; // 1.25

/** The same split expressed as a share of total tokens minted (sums to 100). */
export const MINT_SPLIT_PERCENT = {
  user: (MINT_SPLIT_PER_UNIT.user / MINT_SPLIT_TOTAL_PER_UNIT) * 100, // 80
  lp: 0,
  burn: 0,
  treasury: (MINT_SPLIT_PER_UNIT.treasury / MINT_SPLIT_TOTAL_PER_UNIT) * 100, // 20
} as const;

/** Canonical human-readable split string. Use this instead of writing numbers into copy. */
export const MINT_SPLIT_LABEL = '1.0 to you · 0.25 to treasury';
export const MINT_SPLIT_SENTENCE =
  'Every verified unit mints 1.25 $ZSOLAR: 1.0 to you and 0.25 to the treasury. No liquidity mint, no burn at mint.';

/** Base value of one verified unit, used by Deason and any savings estimator. */
export const TOKENS_PER_KWH = CONVERSION_FACTORS.solar_kwh; // 1

/** Convert a verified quantity to the member's credited token amount (pre-bonus, pre-cap). */
export function tokensForCategory(
  category: MintCategory,
  quantity: number,
  opts?: { solarConnectedHome?: boolean },
): number {
  const base = quantity * CONVERSION_FACTORS[category];
  if (category === 'home_charging_kwh' && opts?.solarConnectedHome) {
    return base * HOME_CHARGING_SOLAR_NETTING_FACTOR;
  }
  return base;
}

/** Treasury allocation that accompanies a member credit. */
export function treasuryForUserTokens(userTokens: number): number {
  return userTokens * MINT_SPLIT_PER_UNIT.treasury;
}
