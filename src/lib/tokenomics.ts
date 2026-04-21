/**
 * Core Tokenomics Constants — 1T Trillionaire Strategy
 * 
 * SINGLE SOURCE OF TRUTH for all tokenomics values across the admin app.
 * 
 * Active model: 1 Trillion hard cap with founder/co-founder allocations
 * sized for trillionaire outcomes at $1+ token price.
 * 
 * Archive: The previous 10B Strategy is preserved at:
 *   - Database: public.tokenomics_models (model_name = '10B Strategy ($0.10 Floor)')
 *   - Code: src/lib/archive/tokenomics_v1_10B.ts
 *   - UI: /admin/archive/*
 * 
 * NOTE: This file powers admin pages only. Public/demo/marketing pages
 * may still reference the 10B model until intentionally migrated.
 */

// === LIVE BETA MODE ===
const LIVE_BETA_STORAGE_KEY = 'zensolar_live_beta_mode';

export const getLiveBetaMode = (): boolean => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LIVE_BETA_STORAGE_KEY);
    if (stored !== null) return stored === 'true';
  }
  return import.meta.env.VITE_LIVE_BETA_MODE === 'true';
};

export const setLiveBetaMode = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LIVE_BETA_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent('liveBetaModeChange', { detail: enabled }));
  }
};

export const IS_LIVE_BETA = getLiveBetaMode();
export const LIVE_BETA_MULTIPLIER = 10;

// === MODEL METADATA ===
export const MODEL_NAME = '1T Trillionaire Strategy';
export const MODEL_VERSION = 2;

// === TOKEN SUPPLY ===
export const MAX_SUPPLY = 1_000_000_000_000; // 1 TRILLION hard cap

// === TOKEN ALLOCATIONS ===
// Joseph 15% / Michael 5% / Treasury 7.5% / Team Pool 2.5% / Community 70%
export const ALLOCATIONS = {
  community: { 
    percentage: 70, 
    amount: 700_000_000_000,
    description: 'Mint-on-Proof, dual-gated to subscribers',
  },
  treasury: { 
    percentage: 7.5, 
    amount: 75_000_000_000, 
    vestingYears: 2,
    description: 'Multisig-controlled treasury, 2-year vest',
  },
  teamPool: { 
    percentage: 2.5, 
    amount: 25_000_000_000,
    description: 'Future hires & advisors',
  },
  founderJoseph: { 
    percentage: 15, 
    amount: 150_000_000_000, 
    vestingYears: 4, 
    cliffMonths: 12,
    name: 'Joseph Maushart',
    role: 'Founder & CEO',
  },
  cofounderMichael: { 
    percentage: 5, 
    amount: 50_000_000_000, 
    vestingYears: 4, 
    cliffMonths: 12,
    name: 'Michael Tschida',
    role: 'CFO/CRO',
  },
} as const;

// === PRICE TARGETS ===
export const PRICES = {
  launchFloor: 0.10,
  target: 1.00,
  moonshotTargets: [5.00, 10.00, 20.00, 50.00, 100.00],
} as const;

// === LIQUIDITY POOL ===
export const LP_SEED = {
  mainnet: {
    usdcAmount: 300_000,
    tokenAmount: 3_000_000,
    initialPrice: 0.10,
  },
  liveBeta: {
    usdcAmount: 5_000,
    tokenAmount: 50_000,
    initialPrice: 0.10,
    expectedMonthlyMint: 75_000,
    expectedUserTokens: 56_250,
    sellPressureBuffer: 3,
  },
} as const;

export const getActiveLPSeed = () => getLiveBetaMode() ? LP_SEED.liveBeta : LP_SEED.mainnet;

// === MINT DISTRIBUTION ===
export const MINT_DISTRIBUTION = {
  user: 75,
  burn: 20,
  lp: 3,
  treasury: 2,
} as const;

// === TRANSFER TAX ===
export const TRANSFER_TAX = {
  burn: 3,
  lp: 2,
  treasury: 2,
  total: 7,
} as const;

// === REWARD RATES (1 token per kWh / mile — kept 1:1 for scarcity) ===
export const BASE_REWARD_RATES = {
  solarProduction: 1,
  batteryDischarge: 1,
  evMiles: 1,
  evCharging: 1,
  fsdSupervisedMiles: 1,
  fsdUnsupervisedMiles: 1,
} as const;

export const REWARD_RATES = {
  solarProduction: BASE_REWARD_RATES.solarProduction * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
  batteryDischarge: BASE_REWARD_RATES.batteryDischarge * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
  evMiles: BASE_REWARD_RATES.evMiles * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
  evCharging: BASE_REWARD_RATES.evCharging * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
  fsdSupervisedMiles: BASE_REWARD_RATES.fsdSupervisedMiles * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
  fsdUnsupervisedMiles: BASE_REWARD_RATES.fsdUnsupervisedMiles * (IS_LIVE_BETA ? LIVE_BETA_MULTIPLIER : 1),
} as const;

// === SUBSCRIPTION (Tier-1 active, ladder roadmap) ===
export const SUBSCRIPTION = {
  monthlyPrice: 19.99, // Active tier
  tier1Price: 19.99,
  tier2Price: 29.99,
  tier3Price: 49.99,
  lpContribution: 50, // 50% to LP
  ladderNotes: 'Tier-1 ($19.99) live now. Tier-2 ($29.99) and Tier-3 ($49.99) unlock as user value grows.',
} as const;

// === LIVE BETA SIMULATION ===
export const LIVE_BETA_CONFIG = {
  targetUsers: 10,
  simulatedSubscriptions: 10,
  monthlyLPInjection: 10 * 19.99 * 0.5, // $99.95/month at $19.99 tier
  testUSDCContract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
} as const;

// === REDEMPTION ===
export const REDEMPTION = {
  burnFee: 5,
} as const;

// === SCALING MILESTONES (ARR ↔ Users, aggressive ~$250 ARPU) ===
export const SCALING_MILESTONES = {
  tippingPoint: 25_000,
  scaleTarget: 100_000,
  arrTiers: [
    { arr: 1_000_000, users: 4_000, label: '$1M ARR' },
    { arr: 10_000_000, users: 40_000, label: '$10M ARR' },
    { arr: 100_000_000, users: 400_000, label: '$100M ARR' },
    { arr: 500_000_000, users: 2_000_000, label: '$500M ARR' },
    { arr: 1_000_000_000, users: 4_000_000, label: '$1B ARR' },
    { arr: 5_000_000_000, users: 20_000_000, label: '$5B ARR' },
  ],
} as const;

// === FORMATTING HELPERS ===
export function formatTokenAmount(amount: number): string {
  if (amount >= 1_000_000_000_000) return `${(amount / 1_000_000_000_000).toFixed(2)}T`;
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

// === CALCULATIONS ===
export function calculateUserTokens(rawTokens: number): number {
  return Math.floor(rawTokens * (MINT_DISTRIBUTION.user / 100));
}

export function calculateMintBurn(rawTokens: number): number {
  return Math.floor(rawTokens * (MINT_DISTRIBUTION.burn / 100));
}

export function calculateTokenValue(tokens: number, price: number = PRICES.launchFloor): number {
  return tokens * price;
}

export function calculateMonthlyLPInjection(subscribers: number): number {
  return subscribers * SUBSCRIPTION.monthlyPrice * (SUBSCRIPTION.lpContribution / 100);
}

export function getRewardMultiplier(): number {
  return getLiveBetaMode() ? LIVE_BETA_MULTIPLIER : 1;
}

export function getEffectiveRewardRate(activityType: keyof typeof BASE_REWARD_RATES): number {
  return BASE_REWARD_RATES[activityType] * getRewardMultiplier();
}

export function calculateRawTokensFromActivity(activityUnits: number): number {
  return Math.floor(activityUnits * getRewardMultiplier());
}

export function calculatePendingTokens(activityUnits: number): number {
  const rawTokens = calculateRawTokensFromActivity(activityUnits);
  return Math.floor(rawTokens * (MINT_DISTRIBUTION.user / 100));
}
