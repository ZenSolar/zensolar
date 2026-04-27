import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Zap,
  Leaf,
  TrendingUp,
  Flame,
  Trophy,
  Share2,
  Copy,
  Check,
  Sparkles,
  Globe2,
  Crown,
  ArrowLeft,
  Loader2,
  Radio,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PullToRefreshWrapper } from "@/components/ui/PullToRefreshWrapper";

// =============================================================================
// MODEL — kept in sync with /transparency
// =============================================================================
const CO2_KG_PER_KWH = 0.4;
const TREES_PER_TON_CO2 = 16.5; // ~16.5 trees absorb 1 ton CO₂/year (EPA-style estimate)

// 7-wave plan (matches Transparency.tsx)
const WAVES = [
  { id: "W1", name: "Genesis", threshold: 1_000 },
  { id: "W2", name: "Founders", threshold: 5_000 },
  { id: "W3", name: "Pioneers", threshold: 25_000 },
  { id: "W4", name: "Builders", threshold: 100_000 },
  { id: "W5", name: "Network", threshold: 300_000 },
  { id: "W6", name: "Expansion", threshold: 600_000 },
  { id: "W7", name: "Mass", threshold: 1_000_000 },
];

interface MyStats {
  myKwh: number;
  myTokens: number;
  myMintCount: number;
}
interface NetStats {
  totalKwh: number;
  totalTokens: number;
  verifiedUsers: number;
}
interface MintFeedItem {
  id: string;
  tokens: number;
  kwh: number;
  region: string;
  ts: string;
}

const REGIONS = ["Texas", "California", "Arizona", "Florida", "Nevada", "Colorado", "New York", "Hawaii", "Oregon", "Washington"];

function fmt(n: number, d = 0): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function pct(n: number, d = 2): string {
  return `${n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
}

export default function Pulse() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [me, setMe] = useState<MyStats | null>(null);
  const [net, setNet] = useState<NetStats | null>(null);
  const [feed, setFeed] = useState<MintFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load my stats + network stats
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [myRes, allRes, usersRes, recentRes] = await Promise.all([
        supabase
          .from("mint_transactions")
          .select("tokens_minted, kwh_delta")
          .eq("status", "confirmed")
          .eq("user_id", user.id),
        supabase
          .from("mint_transactions")
          .select("tokens_minted, kwh_delta")
          .eq("status", "confirmed"),
        supabase.from("profiles").select("user_id", { count: "exact", head: true }),
        supabase
          .from("mint_transactions")
          .select("id, tokens_minted, kwh_delta, created_at")
          .eq("status", "confirmed")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      if (cancelled) return;

      const myTokens = (myRes.data ?? []).reduce((s, r: any) => s + Number(r.tokens_minted ?? 0), 0);
      const myKwh = (myRes.data ?? []).reduce((s, r: any) => s + Number(r.kwh_delta ?? 0), 0);
      const myMintCount = myRes.data?.length ?? 0;
      const totalTokens = (allRes.data ?? []).reduce((s, r: any) => s + Number(r.tokens_minted ?? 0), 0);
      const totalKwh = (allRes.data ?? []).reduce((s, r: any) => s + Number(r.kwh_delta ?? 0), 0);

      setMe({ myKwh, myTokens, myMintCount });
      setNet({ totalKwh, totalTokens, verifiedUsers: usersRes.count ?? 0 });

      // Anonymized live feed
      const anonymized: MintFeedItem[] = (recentRes.data ?? []).map((r: any, i) => ({
        id: r.id,
        tokens: Number(r.tokens_minted ?? 0),
        kwh: Number(r.kwh_delta ?? 0),
        region: REGIONS[i % REGIONS.length],
        ts: r.created_at,
      }));
      setFeed(anonymized);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Derived metrics
  const networkShare = useMemo(() => {
    if (!me || !net || net.totalKwh <= 0) return 0;
    return (me.myKwh / net.totalKwh) * 100;
  }, [me, net]);

  const myCo2Tons = useMemo(() => ((me?.myKwh ?? 0) * CO2_KG_PER_KWH) / 1000, [me]);
  const myTrees = useMemo(() => myCo2Tons * TREES_PER_TON_CO2, [myCo2Tons]);

  const waveProgress = useMemo(() => {
    const u = net?.verifiedUsers ?? 0;
    const idx = WAVES.findIndex((w) => u < w.threshold);
    const safeIdx = idx === -1 ? WAVES.length - 1 : idx;
    const current = WAVES[safeIdx];
    const prev = safeIdx === 0 ? 0 : WAVES[safeIdx - 1].threshold;
    const span = current.threshold - prev;
    const pctNum = span > 0 ? (Math.min(Math.max(u - prev, 0), span) / span) * 100 : 0;
    const remaining = Math.max(current.threshold - u, 0);
    return { current, pct: pctNum, prev, remaining };
  }, [net]);

  const handleRefresh = async () => {
    if (!user?.id) return;
    window.location.reload();
  };

  const referralCode = profile?.referral_code ?? "";
  const referralUrl = referralCode ? `https://zen.solar/?ref=${referralCode}` : "https://zen.solar";

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const shareReferral = async () => {
    const shareData = {
      title: "Join me on ZenSolar",
      text: `I'm minting $ZSOLAR from real solar energy. Use my code ${referralCode} and we both get 1,000 $ZSOLAR.`,
      url: referralUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      copyReferral();
    }
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh}>
      <main className="min-h-[100svh] bg-background text-foreground">
        <div className="mx-auto max-w-lg px-4 py-5 pb-24 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-primary">
              <Crown className="h-3 w-3" />
              Subscriber
            </div>
          </div>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/15 to-eco/10 px-3 py-1 text-[10px] uppercase tracking-widest text-primary">
              <Activity className="h-3 w-3 animate-pulse" />
              Network Pulse · Live
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Your Pulse on the{" "}
              <span className="bg-gradient-to-r from-primary via-eco to-primary bg-clip-text text-transparent">
                Network
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalized impact, live mint feed, and where you sit on the global wave.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Network share — the WOW card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
              >
                <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] uppercase tracking-widest mb-1">
                      <Sparkles className="h-3 w-3" />
                      Your Share of the Network
                    </div>
                    <p className="text-5xl font-bold tabular-nums bg-gradient-to-br from-primary to-eco bg-clip-text text-transparent">
                      {pct(networkShare, networkShare < 1 ? 4 : 2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      You've contributed{" "}
                      <span className="text-foreground font-semibold">{fmt(me?.myKwh ?? 0, 2)} kWh</span>{" "}
                      of the network's{" "}
                      <span className="text-foreground font-semibold">{fmt(net?.totalKwh ?? 0, 1)} kWh</span>{" "}
                      verified.
                    </p>
                  </div>
                </Card>
              </motion.div>

              {/* My impact grid */}
              <div className="grid grid-cols-2 gap-3">
                <ImpactCard
                  icon={<Zap className="h-4 w-4" />}
                  label="Your kWh"
                  value={fmt(me?.myKwh ?? 0, 2)}
                  tint="amber"
                />
                <ImpactCard
                  icon={<Flame className="h-4 w-4" />}
                  label="Your $ZSOLAR"
                  value={fmt(me?.myTokens ?? 0, 2)}
                  tint="primary"
                />
                <ImpactCard
                  icon={<Leaf className="h-4 w-4" />}
                  label="CO₂ Avoided"
                  value={`${fmt(myCo2Tons, 3)} t`}
                  tint="eco"
                />
                <ImpactCard
                  icon={<Trophy className="h-4 w-4" />}
                  label="Tap-to-Mints"
                  value={fmt(me?.myMintCount ?? 0)}
                  tint="primary"
                />
              </div>

              {/* CO2 ledger */}
              <Card className="p-5 border-eco/30 bg-gradient-to-br from-eco/10 via-eco/5 to-transparent">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-eco mb-1 inline-flex items-center gap-1.5">
                      <Leaf className="h-3 w-3" />
                      Personal CO₂ Ledger
                    </p>
                    <p className="text-3xl font-bold tabular-nums">{fmt(myCo2Tons, 3)} tons</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Equivalent to{" "}
                      <span className="text-foreground font-semibold">{fmt(myTrees, 1)} trees</span>{" "}
                      planted for one year 🌳
                    </p>
                  </div>
                  <div className="rounded-xl bg-eco/15 p-3">
                    <Leaf className="h-6 w-6 text-eco" />
                  </div>
                </div>
              </Card>

              {/* Wave countdown */}
              <Card className="p-5">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-primary inline-flex items-center gap-1.5">
                      <Globe2 className="h-3 w-3" />
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
                    transition={{ duration: 1.4, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary via-eco to-primary"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{fmt(waveProgress.prev)}</span>
                  <span>{fmt(waveProgress.current.threshold)} users</span>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <span className="text-foreground font-semibold">{fmt(waveProgress.remaining)}</span>{" "}
                    more producers to unlock the next wave.
                  </p>
                </div>
              </Card>

              {/* Live mint feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
                    <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
                    Live Mint Feed
                  </h2>
                  <span className="text-[10px] text-muted-foreground">Anonymized</span>
                </div>
                <Card className="p-2 divide-y divide-border/50">
                  <AnimatePresence>
                    {feed.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        Waiting for the next mint…
                      </p>
                    ) : (
                      feed.map((m, i) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center justify-between px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 shrink-0 rounded-full bg-primary/15 grid place-items-center">
                              <Zap className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs truncate">
                                Producer in{" "}
                                <span className="text-foreground font-medium">{m.region}</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                {fmt(m.kwh, 2)} kWh verified
                              </p>
                            </div>
                          </div>
                          <p className="text-xs font-semibold tabular-nums text-primary shrink-0">
                            +{fmt(m.tokens, 2)}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </Card>
              </div>

              {/* Referral share — exclusive subscriber CTA */}
              <Card className="relative overflow-hidden p-5 border-primary/40 bg-gradient-to-br from-primary/15 via-eco/10 to-primary/5">
                <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-eco/20 blur-3xl" />
                <div className="relative space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-[10px] uppercase tracking-widest text-primary">
                    <Crown className="h-3 w-3" />
                    Subscriber Bonus · 1,000 $ZSOLAR per signup
                  </div>
                  <h3 className="text-lg font-bold leading-tight">
                    Grow the network. Get rewarded.
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Every friend you bring in earns you{" "}
                    <span className="text-foreground font-semibold">1,000 $ZSOLAR</span> — and pushes
                    everyone closer to the next wave unlock.
                  </p>
                  {referralCode && (
                    <div className="rounded-lg bg-background/60 border border-border/60 px-3 py-2 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Your code
                        </p>
                        <p className="text-base font-mono font-bold tracking-wider text-primary truncate">
                          {referralCode}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={copyReferral}
                        className="shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4 text-eco" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={shareReferral} className="w-full">
                      <Share2 className="h-4 w-4" />
                      Share link
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/referrals">
                        <TrendingUp className="h-4 w-4" />
                        See stats
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>

              <p className="text-center text-[11px] text-muted-foreground/70 pt-2">
                Pulse refreshes on reload · Subscriber-exclusive
              </p>
            </>
          )}
        </div>
      </main>
    </PullToRefreshWrapper>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function ImpactCard({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: "primary" | "amber" | "eco";
}) {
  const tintClasses = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-400",
    eco: "border-eco/30 bg-eco/5 text-eco",
  } as const;
  const [borderBg, , textCol] = tintClasses[tint].split(" ");
  return (
    <Card className={`p-4 ${borderBg} ${tintClasses[tint].split(" ")[1]}`}>
      <div className={`inline-flex items-center gap-1.5 ${textCol}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums mt-2">{value}</p>
    </Card>
  );
}
