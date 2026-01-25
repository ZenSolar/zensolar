/**
 * Core Tokenomics Constants
 * 
 * SINGLE SOURCE OF TRUTH for all tokenomics values across the app.
 * Based on the 10B Strategy with $0.10 launch floor.
 * 
 * Reference: docs/TOKENOMICS_OPTIMIZATION_FRAMEWORK.md
 */

// === LIVE BETA MODE ===
// When true, applies 10x reward multiplier for testing with scaled-down LP
// Can be toggled via localStorage or environment variable

const LIVE_BETA_STORAGE_KEY = 'zensolar_live_beta_mode';

// Get Live Beta state from localStorage or env var
export const getLiveBetaMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LIVE_BETA_STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  }
  return import.meta.env.VITE_LIVE_BETA_MODE === 'true';
};

// Toggle Live Beta mode (persists to localStorage)
export const setLiveBetaMode = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LIVE_BETA_STORAGE_KEY, String(enabled));
    // Dispatch custom event for components to react
    window.dispatchEvent(new CustomEvent('liveBetaModeChange', { detail: enabled }));
  }
};

// Initial state (for static imports)
export const IS_LIVE_BETA = getLiveBetaMode();
export const LIVE_BETA_MULTIPLIER = 10; // 10x rewards in Live Beta

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
  // Mainnet values
  mainnet: {
    usdcAmount: 300_000, // $300K USDC
    tokenAmount: 3_000_000, // 3M tokens
    initialPrice: 0.10, // = $300K / 3M tokens
  },
  // Live Beta values - Scaled for 10 users with 10x multiplier
  // Math: 10 users × 750 kWh/mo × 10x = 75K tokens/mo minted
  // After 75% distribution: ~56K tokens to users/mo
  // LP must absorb ~3 months sell pressure at 25% sell rate = 42K tokens
  // Sized with buffer for stability
  liveBeta: {
    usdcAmount: 5_000, // $5K test USDC
    tokenAmount: 50_000, // 50K tokens to maintain $0.10 price
    initialPrice: 0.10, // Same $0.10 floor - user excitement preserved!
    expectedMonthlyMint: 75_000, // 10 users × 750 kWh × 10x (raw)
    expectedUserTokens: 56_250, // After 75% distribution
    sellPressureBuffer: 3, // Months of coverage at 25% sell rate
  },
} as const;

// Get the appropriate LP seed based on mode
export const getActiveLPSeed = () => getLiveBetaMode() ? LP_SEED.liveBeta : LP_SEED.mainnet;

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
// Base rates - multiplied by LIVE_BETA_MULTIPLIER when in Live Beta mode
export const BASE_REWARD_RATES = {
  solarProduction: 1, // 1 $ZSOLAR per kWh produced
  batteryDischarge: 1, // 1 $ZSOLAR per kWh discharged
  evMiles: 1, // 1 $ZSOLAR per mile driven
  evCharging: 1, // 1 $ZSOLAR per kWh charged
} as const;

// Active reward rates (applies multiplier in Live Beta)
export const REWARD_RATES = {
  solarProduction: BASE_REWARD_RATES.solarProduction * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
  batteryDischarge: BASE_REWARD_RATES.batteryDischarge * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
  evMiles: BASE_REWARD_RATES.evMiles * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
  evCharging: BASE_REWARD_RATES.evCharging * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
} as const;

// === SUBSCRIPTION ===
export const SUBSCRIPTION = {
  monthlyPrice: 9.99, // $9.99/month Pro subscription
  lpContribution: 50, // 50% of subscription goes to LP
} as const;

// === LIVE BETA SIMULATION ===
export const LIVE_BETA_CONFIG = {
  targetUsers: 10, // 10 beta users
  simulatedSubscriptions: 10, // Simulate 10 paying users
  monthlyLPInjection: 10 * 9.99 * 0.5, // $49.95/month to LP
  testUSDCContract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
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

/**
 * Get reward multiplier based on CURRENT mode (dynamic, not cached)
 * This must be called at runtime, not import time, to reflect toggle changes
 */
export function getRewardMultiplier(): number {
  return getLiveBetaMode() ? LIVE_BETA_MULTIPLIER : 1;
}

/**
 * Calculate effective reward rate for activity type (dynamic)
 */
export function getEffectiveRewardRate(activityType: keyof typeof BASE_REWARD_RATES): number {
  return BASE_REWARD_RATES[activityType] * getRewardMultiplier();
}

/**
 * Calculate raw activity units with Live Beta multiplier applied
 * Call this on each activity unit to get the pre-fee token amount
 */
export function calculateRawTokensFromActivity(activityUnits: number): number {
  return Math.floor(activityUnits * getRewardMultiplier());
}

/**
 * Calculate final tokens user receives (with Live Beta multiplier + 75% distribution)
 * This is the complete calculation: activity units → apply 10x if Live Beta → apply 75%
 */
export function calculatePendingTokens(activityUnits: number): number {
  const rawTokens = calculateRawTokensFromActivity(activityUnits);
  return Math.floor(rawTokens * (MINT_DISTRIBUTION.user / 100));
}
