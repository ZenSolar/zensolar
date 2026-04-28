import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Droplets,
  TrendingUp,
  Lock,
  Layers,
  Calendar,
  Wallet,
  Target,
  Sparkles,
  Loader2,
  Infinity as InfinityIcon,
  ShieldCheck,
  Eye,
  Flame,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { VaultPinGate } from "@/components/founders/VaultPinGate";
import { SubscriptionTransparencyPanel } from "@/components/home/SubscriptionTransparencyPanel";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// =============================================================================
// MODEL — Hardcoded, locked-in numbers from chat decisions
// =============================================================================

interface LpRound {
  id: string;
  round_number: number;
  usdc_injected: number;
  tokens_released: number;
  spot_price_usd: number;
  notes: string | null;
  executed_at: string;
}

interface Wave {
  id: string;
  name: string;
  monthOpens: number;
  newUsers: number;
  cumulativeUsers: number;
  // Symmetric structure: cliff = vest, ALWAYS. Stored in days for sub-month precision.
  cliffDays: number;
  vestDays: number;
  mintMultiplier: number;
  forecastEntryPrice: number;
  sellTaxPct?: number; // only for instant-unlock waves (8+)
}

// CORRECTED LOCKED LADDER — symmetric cliff = vest for every wave.
// Tapered as the network matures: longer locks for earlier risk-takers, shorter as floor deepens.
// Waves 8+ replace lock with sell-tax (cleaner — instant liquidity, disincentivized dumping).
const WAVES: Wave[] = [
  { id: "W1",  name: "Genesis",    monthOpens: 0,  newUsers: 1_000,     cumulativeUsers: 1_000,      cliffDays: 365, vestDays: 365, mintMultiplier: 2.0,  forecastEntryPrice: 0.10 },
  { id: "W2",  name: "Wave 2",     monthOpens: 6,  newUsers: 4_000,     cumulativeUsers: 5_000,      cliffDays: 274, vestDays: 274, mintMultiplier: 1.5,  forecastEntryPrice: 0.16 },
  { id: "W3",  name: "Wave 3",     monthOpens: 12, newUsers: 20_000,    cumulativeUsers: 25_000,     cliffDays: 183, vestDays: 183, mintMultiplier: 1.25, forecastEntryPrice: 0.26 },
  { id: "W4",  name: "Wave 4",     monthOpens: 18, newUsers: 75_000,    cumulativeUsers: 100_000,    cliffDays: 91,  vestDays: 91,  mintMultiplier: 1.1,  forecastEntryPrice: 0.42 },
  { id: "W5",  name: "Wave 5",     monthOpens: 24, newUsers: 400_000,   cumulativeUsers: 500_000,    cliffDays: 30,  vestDays: 30,  mintMultiplier: 1.0,  forecastEntryPrice: 0.68 },
  { id: "W6",  name: "Wave 6",     monthOpens: 30, newUsers: 500_000,   cumulativeUsers: 1_000_000,  cliffDays: 14,  vestDays: 14,  mintMultiplier: 1.0,  forecastEntryPrice: 1.15 },
  { id: "W7",  name: "Wave 7",     monthOpens: 36, newUsers: 1_500_000, cumulativeUsers: 2_500_000,  cliffDays: 7,   vestDays: 7,   mintMultiplier: 1.0,  forecastEntryPrice: 1.95 },
  { id: "W8",  name: "Wave 8",     monthOpens: 42, newUsers: 2_500_000, cumulativeUsers: 5_000_000,  cliffDays: 0,   vestDays: 0,   mintMultiplier: 1.0,  forecastEntryPrice: 3.30, sellTaxPct: 5 },
  { id: "W9",  name: "Wave 9",     monthOpens: 48, newUsers: 5_000_000, cumulativeUsers: 10_000_000, cliffDays: 0,   vestDays: 0,   mintMultiplier: 1.0,  forecastEntryPrice: 5.70, sellTaxPct: 3 },
  { id: "W10", name: "Open Mint",  monthOpens: 54, newUsers: 0,         cumulativeUsers: 0,          cliffDays: 0,   vestDays: 0,   mintMultiplier: 0.75, forecastEntryPrice: 9.00, sellTaxPct: 1 },
];

// Format a duration in days into a compact human-readable label (e.g. "12mo", "14d", "Instant").
function fmtDuration(days: number): string {
  if (days <= 0) return "Instant";
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30.4375);
  return `${months}mo`;
}

interface MonthlyProjection {
  month: number;
  activeSubs: number;
  monthlySubRev: number;
  monthlyLpInject: number;
  monthlyFiat: number;
  cumulativeLp: number;
  cumulativeFiat: number;
  floorPrice: number;
}

// AMM math: starting LP = $50K USDC + 500K tokens
const SEED_USDC = 50_000;
const SEED_TOKENS = 500_000;
const SEED_K = SEED_USDC * SEED_TOKENS;
// Locked plan uses the public $9.99/mo subscription, rounded to $10 in the planning table.
const SUB_PRICE = 10;
const LP_SPLIT = 0.5;
const FIAT_SPLIT = 0.5;

function buildProjection(): MonthlyProjection[] {
  const milestones = [6, 12, 18, 24, 30, 36, 48, 60];
  const rows: MonthlyProjection[] = [];
  let cumulativeLp = 0;
  let cumulativeFiat = 0;
  let prevMonth = 0;

  for (const m of milestones) {
    // Planning table counts the wave that was active through the prior interval.
    // Example: W2 opens at M6, then shows as active at M12 after six months of subs.
    const activeWaves = WAVES.filter((w) => w.monthOpens <= prevMonth);
    const activeSubs = activeWaves[activeWaves.length - 1]?.cumulativeUsers ?? 0;

    // Subscription-sourced LP and fiat remain exactly equal by the 50/50 split.
    const monthsElapsed = m - prevMonth;
    const monthlySubRev = activeSubs * SUB_PRICE;
    const monthlyLpInject = monthlySubRev * LP_SPLIT;
    const monthlyFiat = monthlySubRev * FIAT_SPLIT;

    cumulativeLp += monthlyLpInject * monthsElapsed;
    cumulativeFiat += monthlyFiat * monthsElapsed;

    // Floor: AMM with seed + cumulative LP-side USDC against constant token reserve
    const usdcReserve = SEED_USDC + cumulativeLp;
    const tokenReserve = SEED_K / usdcReserve;
    const floorPrice = usdcReserve / tokenReserve;

    rows.push({
      month: m,
      activeSubs,
      monthlySubRev,
      monthlyLpInject,
      monthlyFiat,
      cumulativeLp,
      cumulativeFiat,
      floorPrice,
    });
    prevMonth = m;
  }
  return rows;
}

const PROJECTION = buildProjection();

// =============================================================================
// FORMATTERS
// =============================================================================

const fmtUsd = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(2)}`;
};

const fmtNum = (n: number) => {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toLocaleString();
};

const fmtPrice = (n: number) =>
  n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(3)}`;

// =============================================================================
// PAGE
// =============================================================================

export default function FoundersFundedLP() {
  const { user, isLoading: authLoading } = useAuth();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsFounder(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      const set = new Set((roles ?? []).map((r) => r.role));
      setIsFounder(set.has("founder") || set.has("admin"));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading || isFounder === null) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isFounder) return <Navigate to="/" replace />;

  return (
    <VaultPinGate userId={user.id}>
      <Dashboard />
    </VaultPinGate>
  );
}

// =============================================================================
// DASHBOARD
// =============================================================================

function Dashboard() {
  const [rounds, setRounds] = useState<LpRound[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("lp_rounds")
        .select("*")
        .order("round_number", { ascending: true });
      if (cancelled) return;
      if (!error && data) setRounds(data as LpRound[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const liveState = useMemo(() => {
    const totalUsdcInjected = rounds.reduce(
      (s, r) => s + Number(r.usdc_injected || 0),
      0
    );
    const totalTokensReleased = rounds.reduce(
      (s, r) => s + Number(r.tokens_released || 0),
      0
    );
    // Live LP = seed + all rounds executed
    const usdcReserve = SEED_USDC + totalUsdcInjected;
    const tokenReserve = SEED_TOKENS + totalTokensReleased;
    const k = usdcReserve * tokenReserve;
    const floorPrice = tokenReserve > 0 ? usdcReserve / tokenReserve : 0;
    return {
      usdcReserve,
      tokenReserve,
      k,
      floorPrice,
      totalUsdcInjected,
      totalTokensReleased,
      roundCount: rounds.length,
    };
  }, [rounds]);

  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/founders"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Vault
          </Link>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Founder-Funded LP
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-10">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" />
            Founders Only · Joseph & Michael
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Self-Funded Liquidity Plan
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
            The complete bootstrap path: $50K founder-funded LP (Joseph & Michael, out-of-pocket — no investors), $9.99/mo subscriptions,
            split 50% LP / 50% fiat, seven user waves on a <span className="text-foreground font-semibold">symmetric 12+12 cliff/vest schedule</span>,
            all the way to 1M users — without raising a single dollar of venture capital.
          </p>
        </motion.section>

        {/* WHY THIS IS INEVITABLE */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-5 sm:p-7 space-y-5"
        >
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

          <div className="relative space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-[10px] uppercase tracking-[0.22em] text-primary">
              <InfinityIcon className="h-3 w-3" />
              The Inevitability Thesis
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              The math doesn't <span className="italic text-primary">hope</span> to work.
              <br className="hidden sm:block" />
              It is <span className="text-primary">forced</span> to work.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
              Every other token launch begs holders not to sell. We make selling
              <span className="text-foreground font-medium"> structurally impossible</span> during
              each wave's cliff — and <span className="text-foreground font-medium">throttled to a fraction per month</span>
              during the linear vest after that. Meanwhile, <span className="text-foreground font-medium">50% of every subscription dollar</span>
              flows directly into the LP. Buy pressure compounds. Sell pressure
              is rate-limited by code. The floor only moves one direction.
            </p>
          </div>

          {/* The Three Forcing Functions */}
          <div className="relative grid sm:grid-cols-3 gap-3">
            <ForceCard
              icon={<Lock className="h-4 w-4" />}
              title="12-Month Cliff"
              body="Every wave accepts the same 12-month cliff from its start date. Because waves open every 6 months, no group reaches liquidity at the same moment as the next."
            />
            <ForceCard
              icon={<Calendar className="h-4 w-4" />}
              title="Symmetric Linear Vest"
              body="Every wave gets a 12-month linear vest after cliff. Only 1/12 of any wave's tokens unlock per month. Even if 100% of unlocks were sold, max monthly sell pressure is mathematically capped."
            />
            <ForceCard
              icon={<Droplets className="h-4 w-4" />}
              title="50% Sub → LP"
              body="Half of every $9.99 subscription is auto-injected into LP. Through every cliff window, the LP grows uncontested. By the time anyone can sell, the floor has already moved up."
            />
          </div>

          {/* Why users WILL accept the lock */}
          <div className="relative rounded-xl border border-border/50 bg-card/50 backdrop-blur p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Why users sign up for the lock
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Because they aren't buying tokens — they're <span className="text-foreground font-medium">producing</span>
              them from energy they already generate. Locking is the price of
              admission to a system that, by design, cannot dump on them. Three
              guarantees make this trade obvious:
            </p>
            <ul className="space-y-2.5 text-sm">
              <Guarantee
                icon={<Eye className="h-4 w-4" />}
                heading="Radical transparency"
                body="Every LP round, every subscription dollar, every wave's vesting schedule lives on this page and on-chain. No hidden allocations, no insider unlocks, no surprises."
              />
              <Guarantee
                icon={<Flame className="h-4 w-4" />}
                heading="Proof of Genesis"
                body="Each token is born from a verified kWh — never minted from thin air. If you believe the energy is real, you have to believe the floor is real too."
              />
              <Guarantee
                icon={<Lock className="h-4 w-4" />}
                heading="The same rules apply to founders"
                body="Joseph (150B) and Michael (50B) are pact-locked under the same logic. We don't unlock until the network does. We win when the holders win, in that order."
              />
            </ul>
          </div>

          <p className="relative text-xs text-muted-foreground italic max-w-3xl">
            This is the public pitch: <span className="text-foreground not-italic">mint, accept your wave's lock, watch the floor compound underneath you.</span>
            The only people who lose are the ones who didn't show up early.
          </p>
        </motion.section>


        <Section
          icon={<Droplets className="h-4 w-4" />}
          eyebrow="Live LP State"
          title="Current AMM Reserves"
          subtitle="Joseph & Michael personally funded the $50K starting LP — out-of-pocket, no investors. Everything beyond that comes from executed LP rounds (USDC paired against newly-released supply, governed by the lp_rounds ledger)."
        >
          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Two-column source-of-funds breakdown — impossible to misread */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-primary/80 flex items-center gap-1.5">
                    <Wallet className="h-3 w-3" />
                    Founders' Own Money
                  </div>
                  <div className="text-2xl font-bold text-primary tabular-nums">
                    {fmtUsd(SEED_USDC)}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    Out-of-pocket from Joseph & Michael. No investors, no raise.
                    This number never changes.
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3 w-3" />
                    LP Rounds (USDC Paired)
                  </div>
                  <div className="text-2xl font-bold tabular-nums">
                    {fmtUsd(liveState.totalUsdcInjected)}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-snug">
                    USDC paired against newly-released $ZSOLAR in {liveState.roundCount} executed
                    round{liveState.roundCount === 1 ? "" : "s"}. Tracked on-chain via{" "}
                    <code className="text-[10px]">lp_rounds</code>.
                  </div>
                </div>
              </div>

              {/* AMM stats — clearly labeled as the resulting pool state */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat
                  label="Pool USDC"
                  value={fmtUsd(liveState.usdcReserve)}
                  hint={`${fmtUsd(SEED_USDC)} founders + ${fmtUsd(liveState.totalUsdcInjected)} rounds`}
                  accent
                />
                <Stat
                  label="Pool $ZSOLAR"
                  value={fmtNum(liveState.tokenReserve)}
                  hint={`${fmtNum(SEED_TOKENS)} founders + ${fmtNum(liveState.totalTokensReleased)} rounds`}
                />
                <Stat
                  label="Constant k"
                  value={fmtNum(liveState.k)}
                  hint="USDC × tokens"
                />
                <Stat
                  label="Floor Price"
                  value={fmtPrice(liveState.floorPrice)}
                  accent
                />
              </div>
            </div>
          )}
        </Section>



        {/* LP ROUNDS LEDGER */}
        <Section
          icon={<Layers className="h-4 w-4" />}
          eyebrow="LP Rounds Ledger"
          title={`${liveState.roundCount} Round${liveState.roundCount === 1 ? "" : "s"} Executed`}
          subtitle="Historical record of every founder-funded LP injection."
        >
          {loading ? (
            <div className="h-24 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rounds.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
              No LP rounds executed yet. The $50K founder deposit (Joseph &
              Michael, out-of-pocket) is the starting position.
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>USDC In</TableHead>
                      <TableHead>Tokens Released</TableHead>
                      <TableHead>Spot Price</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rounds.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">
                          R{r.round_number}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fmtUsd(Number(r.usdc_injected))}
                        </TableCell>
                        <TableCell>{fmtNum(Number(r.tokens_released))}</TableCell>
                        <TableCell className="text-primary">
                          {fmtPrice(Number(r.spot_price_usd))}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {new Date(r.executed_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </Section>

        {/* SUBSCRIPTION 50/50 TRANSPARENCY */}
        <div className="-mx-4 sm:mx-0">
          <SubscriptionTransparencyPanel />
        </div>

        {/* WAVE ROLLOUT PLANNER */}
        <Section
          icon={<Calendar className="h-4 w-4" />}
          eyebrow="Wave Rollout Planner"
          title="10 Waves · Symmetric Cliff = Vest"
          subtitle="Cliff = vest, ALWAYS. Earlier waves accept the longest locks for the strongest mint multipliers; later waves graduate from lock-based protection to sell-tax-based protection once the floor is deep enough that instant unlocks can't move it."
        >
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Wave</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead className="hidden md:table-cell">Cumulative Users</TableHead>
                    <TableHead>Cliff</TableHead>
                    <TableHead>Vest</TableHead>
                    <TableHead className="hidden sm:table-cell">Mint ×</TableHead>
                    <TableHead className="hidden sm:table-cell text-primary">Entry Price</TableHead>
                    <TableHead className="hidden md:table-cell">Sell Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WAVES.map((w) => {
                    const isOpenMint = w.id === "W10";
                    return (
                      <TableRow key={w.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {w.id}
                            </span>
                            <span className="font-medium">{w.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          M{w.monthOpens}
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-medium text-primary">
                          {isOpenMint ? "Unlimited" : fmtNum(w.cumulativeUsers)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {fmtDuration(w.cliffDays)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {fmtDuration(w.vestDays)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell tabular-nums">
                          {w.mintMultiplier.toFixed(2)}×
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-primary tabular-nums">
                          {fmtPrice(w.forecastEntryPrice)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell tabular-nums text-muted-foreground">
                          {w.sellTaxPct ? `${w.sellTaxPct}%` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </Section>


        {/* REVENUE & LP GROWTH */}
        <Section
          icon={<TrendingUp className="h-4 w-4" />}
          eyebrow="Revenue & LP Growth"
          title="Subscription Flywheel"
          subtitle="$9.99/mo subscription shown as $10 planning math. Cumulative LP and cumulative fiat are always equal — same source, 50/50 split. The $50K founder-funded starting LP is separate and not mixed into either column."
        >
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Month</TableHead>
                    <TableHead>Active Subs</TableHead>
                    <TableHead className="hidden sm:table-cell">Monthly Sub Rev</TableHead>
                    <TableHead className="hidden md:table-cell">Monthly LP Inject</TableHead>
                    <TableHead className="hidden md:table-cell">Monthly Fiat</TableHead>
                    <TableHead>Cumulative LP</TableHead>
                    <TableHead>Cumulative Fiat</TableHead>
                    <TableHead className="hidden sm:table-cell text-primary">Floor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PROJECTION.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-mono text-xs">
                        M{row.month}
                      </TableCell>
                      <TableCell>{fmtNum(row.activeSubs)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {fmtUsd(row.monthlySubRev)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {fmtUsd(row.monthlyLpInject)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {fmtUsd(row.monthlyFiat)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {fmtUsd(row.cumulativeLp)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {fmtUsd(row.cumulativeFiat)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-primary font-semibold">
                        {fmtPrice(row.floorPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Section>

        {/* TRILLIONAIRE CROSSOVERS */}
        <Section
          icon={<Target className="h-4 w-4" />}
          eyebrow="Trillionaire Crossovers"
          title="Family Legacy Pact Math"
          subtitle="Founder pact-locked allocations × crossover prices."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <CrossoverCard
              name="Joseph"
              allocation={150_000_000_000}
              crossoverPrice={6.67}
              targetMonth="M36"
            />
            <CrossoverCard
              name="Michael"
              allocation={50_000_000_000}
              crossoverPrice={20}
              targetMonth="M60"
            />
          </div>
        </Section>

        {/* FOOTER NOTE */}
        <div className="text-xs text-muted-foreground/70 border-t border-border/40 pt-6 leading-relaxed">
          <Lock className="inline h-3 w-3 mr-1.5 -mt-0.5" />
          This page is restricted to Joseph and Michael. All numbers are
          forecasts based on the locked-in bootstrap model: $50K founder-funded LP (out-of-pocket, no investors),
          $9.99/mo subscriptions shown as $10 planning math, split 50% LP / 50% fiat, 7 waves over 36 months
          to 1M users, symmetric 12-month cliff + 12-month linear vest for every wave. Live LP state
          reflects the lp_rounds ledger.
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUBCOMPONENTS
// =============================================================================

function Section({
  icon,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary/80">
          {icon}
          {eyebrow}
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={`p-4 border-border/60 ${
        accent ? "bg-primary/5 border-primary/30" : "bg-card/50"
      }`}
    >
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
        {label}
      </div>
      <div
        className={`text-xl sm:text-2xl font-bold tabular-nums ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {hint && (
        <div className="text-[10px] text-muted-foreground/70 mt-1">{hint}</div>
      )}
    </Card>
  );
}

function CrossoverCard({
  name,
  allocation,
  crossoverPrice,
  targetMonth,
}: {
  name: string;
  allocation: number;
  crossoverPrice: number;
  targetMonth: string;
}) {
  const netWorth = allocation * crossoverPrice;
  return (
    <Card className="p-5 bg-gradient-to-br from-primary/5 to-card/40 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Wallet className="h-4 w-4 text-primary" />
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {name}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Allocation</span>
          <span className="font-medium tabular-nums">
            {fmtNum(allocation)} ZSOLAR
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Crossover Price</span>
          <span className="font-medium text-primary tabular-nums">
            ${crossoverPrice.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target</span>
          <span className="font-medium tabular-nums">{targetMonth}</span>
        </div>
        <div className="pt-3 mt-2 border-t border-border/40">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
            Net Worth at Crossover
          </div>
          <div className="text-2xl font-bold text-primary tabular-nums">
            {fmtUsd(netWorth)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ForceCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur p-4 space-y-2">
      <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="text-sm font-semibold tracking-tight">{title}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Guarantee({
  icon,
  heading,
  body,
}: {
  icon: React.ReactNode;
  heading: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 mt-0.5 inline-flex items-center justify-center h-7 w-7 rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="leading-relaxed">
        <span className="font-medium text-foreground">{heading}.</span>{" "}
        <span className="text-muted-foreground">{body}</span>
      </span>
    </li>
  );
}
