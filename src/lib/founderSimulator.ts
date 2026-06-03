/**
 * Founder Tokenomics & Launch Simulator — pure engine.
 *
 * Client-side only. Reads defaults from src/lib/tokenomics.ts (v3.1 SSOT).
 * Produces a month-by-month projection of LP depth, price, supply, treasury,
 * and sell-pressure given the founder's configurable launch levers.
 */

import {
  LP_SEED,
  MAX_SUPPLY,
  MINT_DISTRIBUTION,
  PRICES,
  STAKING_MULTIPLIERS,
  SUBSCRIPTION_TIERS,
  TRANSFER_TAX,
} from "@/lib/tokenomics";

// ---------- Types ----------

export type TierId = "base" | "regular" | "power";
export type StakeId = keyof typeof STAKING_MULTIPLIERS;

export interface TrancheConfig {
  id: string;
  enabled: boolean;
  /** Trigger month (0 = launch month); -1 = use price/LP triggers only. */
  triggerMonth: number;
  triggerLPBelowUSDC: number; // 0 = ignore
  triggerPriceBelow: number;  // 0 = ignore
  usdc: number;
  tokens: number;
}

export interface TierConfig {
  id: TierId;
  kwhPerToken: number;
  avgKwhPerMonth: number;
  softMintCapPerMonth: number; // 0 = none
  sellRate: number;            // 0..1
  onboardingShare: number;     // 0..1, all tiers sum to 1
}

export interface StakingMixEntry {
  tier: StakeId;
  share: number; // 0..1 of non-Base users
}

export interface SimulatorConfig {
  launchPriceUSD: number;
  initialLPUSDC: number;
  initialLPTokens: number;
  horizonMonths: number;

  initialUsers: number;
  monthlyGrowthRate: number;
  growthCurve: "linear" | "compound" | "s-curve";
  scaleCeiling: number;

  splitUserPct: number;
  splitLPPct: number;
  splitBurnPct: number;
  splitTreasuryPct: number;

  transferTaxPct: number;

  tiers: Record<TierId, TierConfig>;

  stakingMix: StakingMixEntry[];
  earlyUnlockBurnPct: number;

  tranches: TrancheConfig[];

  treasuryStartUSDC: number;
  defenseFloorPrice: number;
  monthlyBuybackCapUSDC: number;
  buybackTokensBurnedPct: number;

  selfSustainingWindowMonths: number;
}

export interface MonthSnapshot {
  month: number;
  users: number;
  newUsers: number;
  rawMint: number;
  toUser: number;
  toLPDirect: number;
  burned: number;
  toTreasuryTokens: number;
  lpUSDC: number;
  lpTokens: number;
  price: number;
  sellTokens: number;
  sellUSDCOut: number;
  taxToLPUSDC: number;
  treasuryUSDC: number;
  buybackUSDC: number;
  buybackTokens: number;
  circulatingSupply: number;
  trancheInjectedUSDC: number;
  trancheInjectedTokens: number;
  netLPChangeUSDC: number;
}

export interface SimulatorResult {
  months: MonthSnapshot[];
  selfSustainingMonth: number | null;
  finalPrice: number;
  peakDrawdownPct: number;
  totalTrancheUSDC: number;
  totalBurned: number;
  capExceededMonth: number | null;
}

// ---------- Defaults (from v3.1 SSOT) ----------

export function buildDefaultConfig(): SimulatorConfig {
  return {
    launchPriceUSD: PRICES.launchFloor,
    initialLPUSDC: LP_SEED.mainnet.usdcAmount,
    initialLPTokens: LP_SEED.mainnet.tokenAmount,
    horizonMonths: 36,

    initialUsers: 250,
    monthlyGrowthRate: 0.18,
    growthCurve: "compound",
    scaleCeiling: 250_000,

    splitUserPct: MINT_DISTRIBUTION.user,
    splitLPPct: MINT_DISTRIBUTION.lp,
    splitBurnPct: MINT_DISTRIBUTION.burn,
    splitTreasuryPct: MINT_DISTRIBUTION.treasury,

    transferTaxPct: TRANSFER_TAX.lp,

    tiers: {
      base: {
        id: "base",
        kwhPerToken: 1.0,
        avgKwhPerMonth: 400,
        softMintCapPerMonth: SUBSCRIPTION_TIERS.base.softMintCapPerMonth ?? 1000,
        sellRate: SUBSCRIPTION_TIERS.base.assumedMonthlySellRate,
        onboardingShare: 0.5,
      },
      regular: {
        id: "regular",
        kwhPerToken: 1.0,
        avgKwhPerMonth: 700,
        softMintCapPerMonth: 0,
        sellRate: SUBSCRIPTION_TIERS.regular.assumedMonthlySellRate,
        onboardingShare: 0.4,
      },
      power: {
        id: "power",
        kwhPerToken: 1.0,
        avgKwhPerMonth: 1500,
        softMintCapPerMonth: 0,
        sellRate: SUBSCRIPTION_TIERS.power.assumedMonthlySellRate,
        onboardingShare: 0.1,
      },
    },

    stakingMix: [
      { tier: "none", share: 0.55 },
      { tier: "threeMo", share: 0.2 },
      { tier: "sixMo", share: 0.15 },
      { tier: "twelveMo", share: 0.08 },
      { tier: "twentyFour", share: 0.02 },
    ],
    earlyUnlockBurnPct: 50,

    tranches: [
      { id: "T1", enabled: true, triggerMonth: 0,  triggerLPBelowUSDC: 0, triggerPriceBelow: 0, usdc: 300_000,   tokens: 3_000_000 },
      { id: "T2", enabled: true, triggerMonth: 6,  triggerLPBelowUSDC: 0, triggerPriceBelow: 0, usdc: 1_500_000, tokens: 15_000_000 },
      { id: "T3", enabled: true, triggerMonth: 12, triggerLPBelowUSDC: 0, triggerPriceBelow: 0, usdc: 3_000_000, tokens: 30_000_000 },
    ],

    treasuryStartUSDC: 500_000,
    defenseFloorPrice: 0.08,
    monthlyBuybackCapUSDC: 50_000,
    buybackTokensBurnedPct: 100,

    selfSustainingWindowMonths: 6,
  };
}

// ---------- Helpers ----------

function effectiveStakingMultiplier(mix: StakingMixEntry[]): number {
  let total = 0;
  let weight = 0;
  for (const entry of mix) {
    const m = STAKING_MULTIPLIERS[entry.tier].multiplier;
    total += m * entry.share;
    weight += entry.share;
  }
  return weight > 0 ? total / weight : 1;
}

function projectUsers(cfg: SimulatorConfig, month: number): number {
  if (month === 0) return cfg.initialUsers;
  if (cfg.growthCurve === "linear") {
    const perMonth = cfg.initialUsers * cfg.monthlyGrowthRate;
    return Math.min(cfg.scaleCeiling, cfg.initialUsers + perMonth * month);
  }
  if (cfg.growthCurve === "s-curve") {
    const L = cfg.scaleCeiling;
    const k = cfg.monthlyGrowthRate;
    const t0 = cfg.horizonMonths / 2;
    return cfg.initialUsers + (L - cfg.initialUsers) / (1 + Math.exp(-k * (month - t0)));
  }
  return Math.min(cfg.scaleCeiling, cfg.initialUsers * Math.pow(1 + cfg.monthlyGrowthRate, month));
}

// ---------- Simulation ----------

export function simulate(cfg: SimulatorConfig): SimulatorResult {
  const months: MonthSnapshot[] = [];
  let lpUSDC = cfg.initialLPUSDC;
  let lpTokens = cfg.initialLPTokens;
  let treasuryUSDC = cfg.treasuryStartUSDC;
  let circulating = cfg.initialLPTokens;
  let totalBurned = 0;
  let totalTrancheUSDC = 0;
  let capExceededMonth: number | null = null;
  let peakPrice = cfg.launchPriceUSD;
  let peakDrawdownPct = 0;
  let consecGrowth = 0;
  let selfSustainingMonth: number | null = null;
  let prevLPUSDC = lpUSDC;
  const fired = new Set<string>();

  const stakingMult = effectiveStakingMultiplier(cfg.stakingMix);
  const splitSum = cfg.splitUserPct + cfg.splitLPPct + cfg.splitBurnPct + cfg.splitTreasuryPct || 1;
  const userShare = cfg.splitUserPct / splitSum;
  const lpShare = cfg.splitLPPct / splitSum;
  const burnShare = cfg.splitBurnPct / splitSum;
  const treasShare = cfg.splitTreasuryPct / splitSum;

  for (let m = 0; m < cfg.horizonMonths; m++) {
    const usersPrev = m === 0 ? 0 : months[m - 1].users;
    const users = projectUsers(cfg, m);
    const newUsers = Math.max(0, users - usersPrev);

    // 1) Mint per tier
    let rawMint = 0;
    (Object.keys(cfg.tiers) as TierId[]).forEach((tierId) => {
      const t = cfg.tiers[tierId];
      const tierUsers = users * t.onboardingShare;
      let perUserTokens = t.avgKwhPerMonth / Math.max(0.001, t.kwhPerToken);
      if (tierId !== "base") perUserTokens *= stakingMult;
      if (t.softMintCapPerMonth > 0) {
        perUserTokens = Math.min(perUserTokens, t.softMintCapPerMonth);
      }
      rawMint += tierUsers * perUserTokens;
    });

    const remainingCap = MAX_SUPPLY - circulating - totalBurned;
    if (rawMint > remainingCap) {
      rawMint = Math.max(0, remainingCap);
      if (capExceededMonth === null) capExceededMonth = m;
    }

    const toUser = rawMint * userShare;
    const toLPDirect = rawMint * lpShare;
    const burned = rawMint * burnShare;
    const toTreasuryTokens = rawMint * treasShare;

    lpTokens += toLPDirect;
    circulating += toUser + toLPDirect + toTreasuryTokens;
    totalBurned += burned;

    // 2) Sell pressure
    let sellTokens = 0;
    (Object.keys(cfg.tiers) as TierId[]).forEach((tierId) => {
      const t = cfg.tiers[tierId];
      sellTokens += toUser * t.onboardingShare * t.sellRate;
    });

    // Constant-product swap
    const k = lpUSDC * lpTokens;
    const newLpTokens = lpTokens + sellTokens;
    const newLpUSDC = Math.max(1, k / newLpTokens);
    const sellUSDCOut = lpUSDC - newLpUSDC;
    lpTokens = newLpTokens;
    lpUSDC = newLpUSDC;

    // 3) Transfer-tax recycle
    const taxToLPUSDC = sellUSDCOut * (cfg.transferTaxPct / 100);
    lpUSDC += taxToLPUSDC;

    // 4) Treasury defense
    let price = lpUSDC / lpTokens;
    let buybackUSDC = 0;
    let buybackTokens = 0;
    if (price < cfg.defenseFloorPrice && treasuryUSDC > 0) {
      buybackUSDC = Math.min(cfg.monthlyBuybackCapUSDC, treasuryUSDC);
      const k2 = lpUSDC * lpTokens;
      const newUSDC2 = lpUSDC + buybackUSDC;
      const newTokens2 = k2 / newUSDC2;
      buybackTokens = lpTokens - newTokens2;
      lpUSDC = newUSDC2;
      lpTokens = newTokens2;
      treasuryUSDC -= buybackUSDC;
      const burnFromBuyback = buybackTokens * (cfg.buybackTokensBurnedPct / 100);
      totalBurned += burnFromBuyback;
      circulating -= burnFromBuyback;
    }

    // 5) Tranches
    let trancheUSDC = 0;
    let trancheTokens = 0;
    for (const tr of cfg.tranches) {
      if (!tr.enabled || fired.has(tr.id)) continue;
      const monthMatch = tr.triggerMonth >= 0 && tr.triggerMonth === m;
      const lpMatch = tr.triggerLPBelowUSDC > 0 && lpUSDC < tr.triggerLPBelowUSDC;
      const priceMatch = tr.triggerPriceBelow > 0 && price < tr.triggerPriceBelow;
      if (monthMatch || lpMatch || priceMatch) {
        lpUSDC += tr.usdc;
        lpTokens += tr.tokens;
        trancheUSDC += tr.usdc;
        trancheTokens += tr.tokens;
        totalTrancheUSDC += tr.usdc;
        circulating += tr.tokens;
        fired.add(tr.id);
      }
    }

    price = lpUSDC / lpTokens;
    if (price > peakPrice) peakPrice = price;
    const dd = (peakPrice - price) / peakPrice;
    if (dd > peakDrawdownPct) peakDrawdownPct = dd;

    const netLPChangeUSDC = lpUSDC - prevLPUSDC;
    if (trancheUSDC === 0 && netLPChangeUSDC > 0) {
      consecGrowth++;
      if (consecGrowth >= cfg.selfSustainingWindowMonths && selfSustainingMonth === null) {
        selfSustainingMonth = m - cfg.selfSustainingWindowMonths + 1;
      }
    } else if (trancheUSDC === 0) {
      consecGrowth = 0;
    }
    prevLPUSDC = lpUSDC;

    months.push({
      month: m,
      users,
      newUsers,
      rawMint,
      toUser,
      toLPDirect,
      burned,
      toTreasuryTokens,
      lpUSDC,
      lpTokens,
      price,
      sellTokens,
      sellUSDCOut,
      taxToLPUSDC,
      treasuryUSDC,
      buybackUSDC,
      buybackTokens,
      circulatingSupply: circulating,
      trancheInjectedUSDC: trancheUSDC,
      trancheInjectedTokens: trancheTokens,
      netLPChangeUSDC,
    });
  }

  return {
    months,
    selfSustainingMonth,
    finalPrice: months[months.length - 1]?.price ?? cfg.launchPriceUSD,
    peakDrawdownPct,
    totalTrancheUSDC,
    totalBurned,
    capExceededMonth,
  };
}
