/**
 * Core Tokenomics Constants
 * 
 * SINGLE SOURCE OF TRUTH for all tokenomics values across the app.
 * Based on the 10B Strategy with $0.10 launch floor.
 * 
 * Reference: docs/TOKENOMICS_OPTIMIZATION_FRAMEWORK.md
 */

// === TOKEN SUPPLY ===
export const MAX_SUPPLY = 10_000_000_000; // 10 billion hard cap

// === TOKEN ALLOCATIONS ===
export const ALLOCATIONS = {
  community: { percentage: 90, amount: 9_000_000_000 }, // Dual-gated for subscribers
  treasury: { percentage: 7.5, amount: 750_000_000, vestingYears: 2 },
  founder: { percentage: 2.5, amount: 250_000_000, vestingYears: 3, cliffMonths: 6 },
} as const;

// === PRICE TARGETS ===
export const PRICES = {
  launchFloor: 0.10, // $0.10 launch price (10x narrative)
  target: 1.00, // $1.00 long-term target
  moonshotTargets: [5.00, 10.00, 20.00], // Moonshot scenarios
} as const;

// === LIQUIDITY POOL ===
export const LP_SEED = {
  usdcAmount: 300_000, // $300K USDC
  tokenAmount: 3_000_000, // 3M tokens
  initialPrice: 0.10, // = $300K / 3M tokens
} as const;

// === MINT DISTRIBUTION (what happens when tokens are minted) ===
export const MINT_DISTRIBUTION = {
  user: 75, // 75% goes to user's wallet
  burn: 20, // 20% burned forever (OPTIMIZED from 15%)
  lp: 3, // 3% to liquidity pool
  treasury: 2, // 2% to project treasury
} as const;

// === TRANSFER TAX (applied on every token transfer) ===
export const TRANSFER_TAX = {
  burn: 3, // 3% burned
  lp: 2, // 2% to liquidity pool
  treasury: 2, // 2% to treasury
  total: 7, // 7% total tax
} as const;

// === REWARD RATES ===
export const REWARD_RATES = {
  solarProduction: 1, // 1 $ZSOLAR per kWh produced
  batteryDischarge: 1, // 1 $ZSOLAR per kWh discharged
  evMiles: 1, // 1 $ZSOLAR per mile driven
  evCharging: 1, // 1 $ZSOLAR per kWh charged
} as const;

// === SUBSCRIPTION ===
export const SUBSCRIPTION = {
  monthlyPrice: 9.99, // $9.99/month Pro subscription
  lpContribution: 50, // 50% of subscription goes to LP
} as const;

// === REDEMPTION ===
export const REDEMPTION = {
  burnFee: 5, // 5% burn on store redemptions
} as const;

// === SCALING MILESTONES ===
export const SCALING_MILESTONES = {
  tippingPoint: 25_000, // 25K paying subscribers = self-sustaining
  scaleTarget: 100_000, // 100K subscribers = full ecosystem
} as const;

// === FORMATTING HELPERS ===
export function formatTokenAmount(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

// === CALCULATIONS ===

/**
 * Calculate tokens received after mint burn
 * @param rawTokens - Total tokens before distribution
 * @returns Tokens user actually receives
 */
export function calculateUserTokens(rawTokens: number): number {
  return Math.floor(rawTokens * (MINT_DISTRIBUTION.user / 100));
}

/**
 * Calculate tokens burned during minting
 * @param rawTokens - Total tokens minted
 * @returns Tokens burned
 */
export function calculateMintBurn(rawTokens: number): number {
  return Math.floor(rawTokens * (MINT_DISTRIBUTION.burn / 100));
}

/**
 * Calculate USD value at current price
 * @param tokens - Number of tokens
 * @param price - Price per token (default: launch floor)
 * @returns USD value
 */
export function calculateTokenValue(tokens: number, price: number = PRICES.launchFloor): number {
  return tokens * price;
}

/**
 * Calculate monthly LP injection from subscribers
 * @param subscribers - Number of paying subscribers
 * @returns Monthly USD flowing to LP
 */
export function calculateMonthlyLPInjection(subscribers: number): number {
  return subscribers * SUBSCRIPTION.monthlyPrice * (SUBSCRIPTION.lpContribution / 100);
}
