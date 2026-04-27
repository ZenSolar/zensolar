import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  Users,
  Zap,
  Coins,
  Leaf,
  Droplets,
  TrendingUp,
  Layers,
  ExternalLink,
  ArrowLeft,
  Loader2,
  Eye,
  Mail,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isPreviewMode } from "@/lib/previewMode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// =============================================================================
// MODEL — match the locked-in numbers from FoundersFundedLP
// =============================================================================
const SEED_USDC = 50_000;
const SEED_TOKENS = 500_000;
const KWH_PER_TOKEN = 1; // 1 $ZSOLAR = 1 verified kWh
const CO2_KG_PER_KWH = 0.4; // US grid avoidance factor (rough public-facing estimate)

interface LpRound {
  id: string;
  round_number: number;
  usdc_injected: number;
  tokens_released: number;
  spot_price_usd: number;
  executed_at: string;
}

interface NetworkStats {
  verifiedUsers: number;
  totalKwh: number;
  totalMinted: number;
  co2OffsetTons: number;
}

// 7-wave plan (matches FoundersFundedLP)
const WAVES = [
  { id: "W1", name: "Genesis", threshold: 1_000 },
  { id: "W2", name: "Founders", threshold: 5_000 },
  { id: "W3", name: "Pioneers", threshold: 25_000 },
  { id: "W4", name: "Builders", threshold: 100_000 },
  { id: "W5", name: "Network", threshold: 300_000 },
  { id: "W6", name: "Expansion", threshold: 600_000 },
  { id: "W7", name: "Mass", threshold: 1_000_000 },
];

function fmtNum(n: number, digits = 0): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtUsd(n: number, digits = 2): string {
  if (!isFinite(n)) return "—";
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export default function Transparency() {
  const { user, isLoading: authLoading } = useAuth();
  const preview = isPreviewMode();
  const [isFounder, setIsFounder] = useState<boolean | null>(null);
  const [rounds, setRounds] = useState<LpRound[]>([]);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Founder check (only matters on production hosts)
  useEffect(() => {
    if (preview) {
      setIsFounder(true);
      return;
    }
    if (!user) {
      setIsFounder(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (cancelled) return;
      setIsFounder(!!data?.some((r) => r.role === "founder" || r.role === "admin"));
    })();
    return () => {
      cancelled = true;
    };
  }, [user, preview]);

  // Load LP rounds + network counts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: lpData }, usersRes, mintsRes] = await Promise.all([
        supabase.from("lp_rounds").select("*").order("round_number", { ascending: true }),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }),
        supabase
          .from("mint_transactions")
          .select("tokens_minted, kwh_delta")
          .eq("status", "confirmed"),
      ]);
      if (cancelled) return;
      setRounds((lpData as LpRound[]) ?? []);

      const verifiedUsers = usersRes.count ?? 0;
      const totalMinted = (mintsRes.data ?? []).reduce(
        (s, r: any) => s + Number(r.tokens_minted ?? 0),
        0
      );
      const totalKwh = (mintsRes.data ?? []).reduce(
        (s, r: any) => s + Number(r.kwh_delta ?? 0),
        0
      );
      const co2OffsetTons = (totalKwh * CO2_KG_PER_KWH) / 1000;

      setStats({ verifiedUsers, totalKwh, totalMinted, co2OffsetTons });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // AMM live state
  const lpState = useMemo(() => {
    let usdc = SEED_USDC;
    let tokens = SEED_TOKENS;
    for (const r of rounds) {
      usdc += Number(r.usdc_injected);
      tokens += Number(r.tokens_released);
    }
    const k = usdc * tokens;
    const floorPrice = tokens > 0 ? usdc / tokens : 0;
    return { usdc, tokens, k, floorPrice };
  }, [rounds]);

  // Wave progress
  const waveProgress = useMemo(() => {
    const u = stats?.verifiedUsers ?? 0;
    const currentIdx = Math.max(
      0,
      WAVES.findIndex((w) => u < w.threshold)
    );
    const safeIdx = currentIdx === -1 ? WAVES.length - 1 : currentIdx;
    const current = WAVES[safeIdx];
    const prevThreshold = safeIdx === 0 ? 0 : WAVES[safeIdx - 1].threshold;
    const span = current.threshold - prevThreshold;
    const within = Math.min(Math.max(u - prevThreshold, 0), span);
    const pct = span > 0 ? (within / span) * 100 : 0;
    const next = WAVES[safeIdx + 1];
    return { current, pct, next, prevThreshold };
  }, [stats]);

  if (authLoading || isFounder === null) {
    return (
      <main className="min-h-[100svh] grid place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  // Production gate: founders only until launched
  if (!preview && !isFounder) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-background via-background to-primary/5 text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to={preview ? "/" : "/founders"}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {preview ? "Home" : "Founders Vault"}
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-widest text-amber-400">
            <Eye className="h-3 w-3" />
            Preview · Not Live
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] uppercase tracking-widest text-primary mb-3">
            <Activity className="h-3 w-3 animate-pulse" />
            Live Network Stats
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            ZenSolar Transparency
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Every kWh verified. Every token minted. Every dollar of liquidity. Public,
            on-chain, real-time. This is what "Creating Currency From Energy" looks like.
          </p>
          <div className="mt-4">
            <WaitlistDialog />
          </div>
        </motion.div>

        {/* Hero metrics */}
        <section className="grid grid-cols-2 gap-3 mb-8">
          <HeroStat
            icon={<Users className="h-4 w-4" />}
            label="Verified Producers"
            value={fmtNum(stats?.verifiedUsers ?? 0)}
            loading={loading}
            tint="primary"
          />
          <HeroStat
            icon={<Zap className="h-4 w-4" />}
            label="kWh Verified"
            value={fmtNum(stats?.totalKwh ?? 0, 1)}
            loading={loading}
            tint="amber"
          />
          <HeroStat
            icon={<Coins className="h-4 w-4" />}
            label="$ZSOLAR Minted"
            value={fmtNum(stats?.totalMinted ?? 0, 2)}
            loading={loading}
            tint="primary"
          />
          <HeroStat
            icon={<Leaf className="h-4 w-4" />}
            label="CO₂ Offset (tons)"
            value={fmtNum(stats?.co2OffsetTons ?? 0, 2)}
            loading={loading}
            tint="eco"
          />
        </section>

        {/* Floor price */}
        <Card className="p-5 mb-6 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary mb-1">
                Current Floor Price
              </p>
              <p className="text-4xl font-bold tabular-nums">
                {fmtUsd(lpState.floorPrice, 4)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                LP-backed minimum · 1 $ZSOLAR = {KWH_PER_TOKEN} verified kWh
              </p>
            </div>
            <div className="rounded-xl bg-primary/15 p-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* LP State */}
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Liquidity Pool · Live State
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <LpStat
            icon={<Droplets className="h-4 w-4" />}
            label="USDC Reserve"
            value={fmtUsd(lpState.usdc, 0)}
          />
          <LpStat
            icon={<Coins className="h-4 w-4" />}
            label="$ZSOLAR Reserve"
            value={fmtNum(lpState.tokens, 0)}
          />
          <LpStat
            icon={<Layers className="h-4 w-4" />}
            label="Constant (k)"
            value={fmtNum(lpState.k, 0)}
          />
          <LpStat
            icon={<TrendingUp className="h-4 w-4" />}
            label="LP Rounds Executed"
            value={fmtNum(rounds.length)}
          />
        </div>

        {/* Wave Progress */}
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-3">
          Network Rollout · Wave Progress
        </h2>
        <Card className="p-5 mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-primary">
                Current Wave
              </p>
              <p className="text-lg font-semibold">
                {waveProgress.current.id} · {waveProgress.current.name}
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-primary">
              {waveProgress.pct.toFixed(1)}%
            </p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${waveProgress.pct}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-primary/60"
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{fmtNum(waveProgress.prevThreshold)} users</span>
            <span>{fmtNum(waveProgress.current.threshold)} users</span>
          </div>
          {waveProgress.next && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
              <span className="text-foreground font-medium">Next unlock:</span>{" "}
              {waveProgress.next.id} · {waveProgress.next.name} at{" "}
              {fmtNum(waveProgress.next.threshold)} verified producers
            </p>
          )}
        </Card>

        {/* Wave list */}
        <Card className="p-5 mb-6">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            All 7 Waves
          </p>
          <div className="space-y-2">
            {WAVES.map((w, i) => {
              const reached = (stats?.verifiedUsers ?? 0) >= w.threshold;
              const isCurrent = w.id === waveProgress.current.id;
              return (
                <div
                  key={w.id}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                    isCurrent
                      ? "border-primary/50 bg-primary/10"
                      : reached
                      ? "border-eco/30 bg-eco/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-mono ${
                        reached ? "text-eco" : isCurrent ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {w.id}
                    </span>
                    <span className="text-sm font-medium">{w.name}</span>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {fmtNum(w.threshold)} users
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Footer transparency */}
        <Card className="p-5 mb-6 border-dashed">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            On-Chain Verification
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            All metrics are computed live from verified mint transactions, the LP rounds
            ledger, and the connected device registry. Smart contracts and LP pool will
            be linked here at public launch.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              Basescan · pending launch
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              Uniswap LP · pending launch
            </span>
          </div>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground/70">
          Last updated{" "}
          {new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · Auto-refreshes on reload
        </p>
      </div>
    </main>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function HeroStat({
  icon,
  label,
  value,
  loading,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading?: boolean;
  tint: "primary" | "amber" | "eco";
}) {
  const tintMap = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    eco: "border-eco/30 bg-eco/5 text-eco",
  } as const;
  return (
    <Card className={`p-4 ${tintMap[tint].split(" ").slice(0, 2).join(" ")}`}>
      <div className={`inline-flex items-center gap-1.5 ${tintMap[tint].split(" ")[2]}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums mt-2">
        {loading ? <Loader2 className="h-5 w-5 animate-spin opacity-50" /> : value}
      </p>
    </Card>
  );
}

function LpStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="inline-flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums mt-2">{value}</p>
    </Card>
  );
}
