import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  MAX_SUPPLY,
  MINT_DISTRIBUTION,
  PRICES,
  SUBSCRIPTION,
  ALLOCATIONS,
  getActiveLPSeed,
} from "@/lib/tokenomics";

export interface EcosystemStats {
  subscribers: number;
  activeSubscriptions: number;
  lifetimeKwh: number;
  lifetimeTokensMinted: number;
  monthTokensMinted: number;
  monthMints: number;
  nftCount: number;
  rawMintedEquivalent: number;
  tokensBurned: number;
  monthBurned: number;
  tokensToLp: number;
  tokensToTreasury: number;
  founderLocked: number;
  treasuryLocked: number;
  teamLocked: number;
  circulating: number;
  lpUsdc: number;
  lpTokens: number;
  spotPrice: number;
  monthLpFromSubs: number;
  monthLpFromMintsUsd: number;
  monthLpTotalUsd: number;
  recentMints: Array<{
    user_id: string | null;
    tokens_minted: number;
    kwh_delta: number | null;
    created_at: string;
  }>;
  myTokens: number;
  myKwh: number;
  myShareOfCirculating: number;
  myMonthLpContribution: number;
  growth: Array<{ date: string; subscribers: number; kwhCumulative: number }>;
  flywheelScore: number;
  flywheelState: "strong" | "accelerating" | "supercharged";
  lockedOrBurnedPct: number;
  snapshotAt: string;
}

async function fetchStats(userId: string | null): Promise<EcosystemStats> {
  const seed = getActiveLPSeed();

  const [
    earningsRes,
    profilesRes,
    activeSubsRes,
    lpRoundsRes,
    recentMintsRes,
    myMintsRes,
    growthMintsRes,
    growthProfilesRes,
  ] = await Promise.all([
    supabase.rpc("get_live_earnings_stats"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("energy_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("lp_rounds")
      .select("usdc_injected, tokens_released, spot_price_usd, round_number")
      .order("round_number", { ascending: false }),
    supabase
      .from("mint_transactions")
      .select("user_id, tokens_minted, kwh_delta, created_at")
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(10),
    userId
      ? supabase
          .from("mint_transactions")
          .select("tokens_minted, kwh_delta")
          .eq("status", "confirmed")
          .eq("user_id", userId)
      : Promise.resolve({ data: [] as any[], error: null }),
    supabase
      .from("mint_transactions")
      .select("created_at, kwh_delta, tokens_minted")
      .eq("status", "confirmed")
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("created_at")
      .order("created_at", { ascending: true }),
  ]);

  const earnings = (earningsRes.data as any) ?? {};
  const subscribers = profilesRes.count ?? 0;
  const activeSubs = activeSubsRes.count ?? 0;

  const lifetimeTokens = Number(earnings.lifetime_tokens ?? 0);
  const monthTokens = Number(earnings.month_tokens ?? 0);
  const monthMints = Number(earnings.month_mints ?? 0);

  // Backend grossing math (NEVER expose split % in UI copy)
  const grossUp = 100 / MINT_DISTRIBUTION.user;
  const rawMintedEquivalent = lifetimeTokens * grossUp;
  const tokensBurned = rawMintedEquivalent * (MINT_DISTRIBUTION.burn / 100);
  const monthBurned = monthTokens * grossUp * (MINT_DISTRIBUTION.burn / 100);
  const tokensToLp = rawMintedEquivalent * (MINT_DISTRIBUTION.lp / 100);
  const tokensToTreasury = rawMintedEquivalent * (MINT_DISTRIBUTION.treasury / 100);

  let lifetimeKwh = 0;
  for (const row of growthMintsRes.data ?? []) {
    lifetimeKwh += Number((row as any).kwh_delta ?? 0);
  }

  let lpUsdc: number = seed.usdcAmount;
  let lpTokens: number = seed.tokenAmount;
  let spotPrice: number = seed.initialPrice;
  if (lpRoundsRes.data && lpRoundsRes.data.length > 0) {
    lpUsdc = 0;
    lpTokens = 0;
    for (const r of lpRoundsRes.data) {
      lpUsdc += Number((r as any).usdc_injected ?? 0);
      lpTokens += Number((r as any).tokens_released ?? 0);
    }
    spotPrice = Number((lpRoundsRes.data[0] as any).spot_price_usd ?? PRICES.launchFloor);
  }
  lpTokens += tokensToLp;

  const monthLpFromSubs =
    Math.max(subscribers, activeSubs) *
    SUBSCRIPTION.monthlyPrice *
    (SUBSCRIPTION.lpContribution / 100);

  let myTokens = 0;
  let myKwh = 0;
  for (const row of (myMintsRes.data ?? []) as any[]) {
    myTokens += Number(row.tokens_minted ?? 0);
    myKwh += Number(row.kwh_delta ?? 0);
  }

  const founderLocked =
    ALLOCATIONS.founderJoseph.amount + ALLOCATIONS.cofounderMichael.amount;
  const treasuryLocked = ALLOCATIONS.treasury.amount;
  const teamLocked = ALLOCATIONS.teamPool.amount;

  const circulating = Math.max(lifetimeTokens + tokensToLp + tokensToTreasury, 1);
  const myShareOfCirculating = (myTokens / circulating) * 100;

  // Growth series
  const subsByDate = new Map<string, number>();
  for (const p of (growthProfilesRes.data ?? []) as any[]) {
    const d = String(p.created_at).slice(0, 10);
    subsByDate.set(d, (subsByDate.get(d) ?? 0) + 1);
  }
  const kwhByDate = new Map<string, number>();
  for (const m of (growthMintsRes.data ?? []) as any[]) {
    const d = String(m.created_at).slice(0, 10);
    kwhByDate.set(d, (kwhByDate.get(d) ?? 0) + Number(m.kwh_delta ?? 0));
  }
  const allDates = Array.from(
    new Set([...subsByDate.keys(), ...kwhByDate.keys()]),
  ).sort();
  let cumSubs = 0;
  let cumKwh = 0;
  const growth = allDates.map((d) => {
    cumSubs += subsByDate.get(d) ?? 0;
    cumKwh += kwhByDate.get(d) ?? 0;
    return { date: d, subscribers: cumSubs, kwhCumulative: cumKwh };
  });

  // Flywheel score: weighted blend of momentum signals
  const score = monthMints * 0.7 + subscribers * 0.3 + monthLpFromSubs * 0.02;
  const flywheelState: "strong" | "accelerating" | "supercharged" =
    score >= 500 ? "supercharged" : score >= 100 ? "accelerating" : "strong";

  const lockedOrBurnedPct =
    ((founderLocked + treasuryLocked + teamLocked + tokensBurned) / MAX_SUPPLY) * 100;

  return {
    subscribers,
    activeSubscriptions: activeSubs,
    lifetimeKwh,
    lifetimeTokensMinted: lifetimeTokens,
    monthTokensMinted: monthTokens,
    monthMints,
    nftCount: 0,
    rawMintedEquivalent,
    tokensBurned,
    monthBurned,
    tokensToLp,
    tokensToTreasury,
    founderLocked,
    treasuryLocked,
    teamLocked,
    circulating,
    lpUsdc,
    lpTokens,
    spotPrice,
    monthLpFromSubs,
    recentMints: (recentMintsRes.data ?? []) as any[],
    myTokens,
    myKwh,
    myShareOfCirculating,
    myMonthLpContribution:
      SUBSCRIPTION.monthlyPrice * (SUBSCRIPTION.lpContribution / 100),
    growth,
    flywheelScore: score,
    flywheelState,
    lockedOrBurnedPct,
    snapshotAt: new Date().toISOString(),
  };
}

export function useEcosystemStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ecosystem-stats", user?.id ?? null],
    queryFn: () => fetchStats(user?.id ?? null),
    staleTime: 60_000,
    refetchInterval: 90_000,
  });
}

export { MAX_SUPPLY };
