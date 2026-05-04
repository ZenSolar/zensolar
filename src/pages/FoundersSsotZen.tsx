import { useMemo, useState, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Coins,
  Flame,
  Users,
  TrendingUp,
  Lock,
  Calendar,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Github,
  FileText,
  ShieldCheck,
  Zap,
  Activity,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SEO } from "@/components/SEO";
import { PageTransition } from "@/components/layout/PageTransition";
import { cn } from "@/lib/utils";

const ChartsBlock = lazy(() => import("./founders-ssot/SsotCharts"));

const SSOT = {
  version: "v2.1",
  lastLocked: "2026-05-02",
  token: {
    symbol: "$ZSOLAR",
    chain: "Base L2",
    hardCap: 1_000_000_000_000,
    decimals: 18,
    launchPrice: 0.10,
  },
  mintRatio: { kwhPerToken: 10, milesPerToken: 10 },
  baseline: {
    kwhPerUserPerMonth: 700,
    tokensPerUserPerMonth: 52.5,
    valuePerUserPerMonth: 5.25,
  },
  allocation: [
    { bucket: "Community (Mint-on-Proof)", pct: 70.00, tokens: 700_000_000_000, notes: "Subject to halving", color: "hsl(142 76% 45%)" },
    { bucket: "Joseph Maushart", pct: 15.00, tokens: 150_000_000_000, notes: "Pact-locked until $6.67", color: "hsl(168 72% 48%)" },
    { bucket: "Treasury", pct: 7.50, tokens: 75_000_000_000, notes: "2-yr vest", color: "hsl(200 70% 55%)" },
    { bucket: "Michael Tschida", pct: 5.00, tokens: 50_000_000_000, notes: "Pact-locked until $20", color: "hsl(190 70% 50%)" },
    { bucket: "Team Pool", pct: 2.49, tokens: 24_900_000_000, notes: "Future hires", color: "hsl(45 90% 55%)" },
    { bucket: "Strategic Introductions", pct: 0.01, tokens: 100_000_000, notes: "12-mo vest, 3-mo cliff", color: "hsl(280 70% 60%)" },
  ],
  perMintSplit: [
    { slice: "User", pct: 75, color: "hsl(142 76% 45%)" },
    { slice: "Burn", pct: 20, color: "hsl(0 75% 55%)" },
    { slice: "LP", pct: 3, color: "hsl(200 70% 55%)" },
    { slice: "Treasury", pct: 2, color: "hsl(45 90% 55%)" },
  ],
  scarcityStack: [
    "1T hard cap",
    "20% burn-per-mint",
    "Halving schedule (4-yr)",
    "Founder pact-lock",
    "Protocol-Owned Liquidity (POL)",
    "Satoshi-Mirror v2 floor",
  ],
  liquidityRounds: [
    { round: "OG (Day 0)", trigger: "Day 0", usdc: 200_000, tokens: 2_000_000, source: "Seed round", status: "ready" },
    { round: "Round 2", trigger: "25k users", usdc: 500_000, tokens: 5_000_000, source: "Seed round", status: "ready" },
    { round: "Round 3", trigger: "100k users", usdc: 1_000_000, tokens: 8_000_000, source: "Seed round", status: "ready" },
    { round: "Round 4+", trigger: "250k+ users", usdc: 2_000_000, tokens: 0, source: "Self-funded (50% sub revenue)", status: "auto" },
  ],
  subscription: [
    { tier: "Base", price: 9.99, sellRate: 0.90, color: "hsl(220 15% 60%)" },
    { tier: "Regular", price: 19.99, sellRate: 0.25, color: "hsl(168 72% 48%)" },
    { tier: "Power", price: 49.99, sellRate: 0.05, color: "hsl(142 76% 45%)" },
  ],
  founderPact: [
    { name: "Joseph Maushart", role: "Founder", tokens: 150_000_000_000, unlockPrice: 6.67, signedOff: true },
    { name: "Michael Tschida", role: "Co-founder", tokens: 50_000_000_000, unlockPrice: 20.00, signedOff: true },
  ],
  openItems: [
    { item: "Final binding mechanism for founder pact-lock", owner: "Legal", status: "open" },
    { item: "On-chain implementation details for Genesis Halving", owner: "Engineering", status: "open" },
    { item: "ZK-Proof-of-Genesis provisional filing timeline", owner: "Legal", status: "open" },
  ],
  roadmap: [
    { phase: "Seed Round", target: "Q2 2026", progress: 75, status: "in_progress", items: ["Lyndon Rive pitch", "$1.7M LP reserve", "Track 1 patent amendment"] },
    { phase: "Genesis Launch", target: "Q3 2026", progress: 30, status: "in_progress", items: ["OG LP seeding", "Tap-to-Mint live", "Daily Auto-Mint"] },
    { phase: "Phase 1.5 — Deason", target: "Q4 2026", progress: 10, status: "todo", items: ["Monthly Energy Insights email", "/energy-insights page", "Premium tier"] },
    { phase: "Phase 2 — FSD Miles", target: "Q1 2027", progress: 0, status: "todo", items: ["FSD oracle", "10 mi = 1 $ZSOLAR", "Lyndon cherry-on-top demo"] },
    { phase: "Self-Sustaining", target: "~100k users", progress: 0, status: "todo", items: ["No further LP raises", "Series A optional"] },
  ],
  deasonPricing: [
    { tier: "Free Insights", price: 0, features: ["Saturday Weekly Report (Basic)", "In-app Deason chat (limited)"] },
    { tier: "Power Tier (incl.)", price: 49.99, features: ["Premium narrative (Gemini 2.5 Pro)", "Monthly Deep Insights email", "/energy-insights page"] },
    { tier: "Insights Add-on", price: 4.99, features: ["Add to Base/Regular tier", "Monthly Deep Insights", "Premium Deason page"] },
  ],
  forbidden: [
    "1 kWh = 1 $ZSOLAR",
    "Launch at $1",
    "10B supply",
    "Anyone can buy at launch",
  ],
};

const fmt = new Intl.NumberFormat("en-US");
const fmtUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtCompact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/40",
        "bg-gradient-to-br from-card/80 via-card/60 to-card/40",
        "backdrop-blur-xl shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.12),inset_0_1px_0_0_hsl(var(--foreground)/0.04)]",
        className,
      )}
    >
      {children}
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "primary",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: "primary" | "warm" | "rare";
}) {
  return (
    <GlassCard className="group hover:border-primary/40 transition-all hover:-translate-y-0.5 duration-300">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div
            className={cn(
              "shrink-0 p-2.5 rounded-xl border transition-transform group-hover:scale-110",
              accent === "primary" && "bg-primary/10 border-primary/30 text-primary shadow-[0_0_24px_-4px_hsl(var(--primary)/0.5)]",
              accent === "warm" && "bg-accent-warm/10 border-accent-warm/30 text-accent-warm",
              accent === "rare" && "bg-accent-rare/10 border-accent-rare/30 text-accent-rare",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </GlassCard>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export default function FoundersSsotZen() {
  const [scenario, setScenario] = useState<"conservative" | "base" | "aggressive">("base");

  const totalUsdcLp = useMemo(() => SSOT.liquidityRounds.reduce((s, r) => s + r.usdc, 0), []);

  return (
    <PageTransition>
      <SEO title="SSOT Zen | Internal Founders Dashboard" description="Single Source of Truth dashboard for ZenSolar founders." />

      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent-warm/[0.04] blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] tracking-wider">
                  INTERNAL · FOUNDERS ONLY
                </Badge>
                <Badge variant="outline" className="border-accent-warm/40 bg-accent-warm/10 text-accent-warm text-[10px] tracking-wider">
                  {SSOT.version}
                </Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                SSOT · Zen
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
                Single Source of Truth dashboard for Joseph & Michael. Mirrors{" "}
                <code className="text-xs px-1.5 py-0.5 rounded bg-muted/50 text-foreground/80">.lovable/memory/CANONICAL_SSOT.md</code>.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/40 border border-border/40 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                  <span className="relative rounded-full bg-primary h-2 w-2" />
                </span>
                <span className="text-xs text-muted-foreground">Last locked</span>
                <span className="text-xs font-semibold tabular-nums">{SSOT.lastLocked}</span>
              </div>
            </div>
          </div>
        </motion.header>

        <section>
          <SectionHeader icon={Activity} title="Project Overview" description="At-a-glance KPIs locked in v2.1." />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard icon={Coins} label="Hard Cap" value="1T" sub={`${SSOT.token.symbol} on ${SSOT.token.chain}`} />
            <MetricCard icon={Zap} label="Mint Ratio" value={`${SSOT.mintRatio.kwhPerToken}:1`} sub={`kWh / ${SSOT.token.symbol}`} accent="warm" />
            <MetricCard icon={Sparkles} label="Launch Price" value={`$${SSOT.token.launchPrice.toFixed(2)}`} sub="USDC per token" />
            <MetricCard icon={Flame} label="Burn / Mint" value="20%" sub="Permanent destruction" accent="rare" />
            <MetricCard icon={Users} label="Per-User Tokens" value={`${SSOT.baseline.tokensPerUserPerMonth}`} sub={`${SSOT.baseline.kwhPerUserPerMonth} kWh/mo · 75% share`} />
            <MetricCard icon={Lock} label="LP Reserve" value={fmtUsd.format(totalUsdcLp)} sub="Seed-allocated to liquidity" />
            <MetricCard icon={ShieldCheck} label="Founders Locked" value="200B" sub="Joseph 150B · Michael 50B" accent="warm" />
            <MetricCard icon={TrendingUp} label="Self-Funding" value="~100k" sub="Users to flywheel break-even" />
          </div>
        </section>

        <section>
          <SectionHeader icon={Coins} title="Tokenomics (v2.1)" description="Allocation, per-mint split, and floor defense." />
          <div className="grid lg:grid-cols-3 gap-4">
            <GlassCard className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Allocation Table (LOCKED)</CardTitle>
                <CardDescription>Total supply: 1,000,000,000,000 $ZSOLAR</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40">
                        <TableHead>Bucket</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="text-right">Tokens</TableHead>
                        <TableHead className="hidden md:table-cell">Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SSOT.allocation.map((a) => (
                        <TableRow key={a.bucket} className="border-border/30 hover:bg-muted/20">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: a.color, boxShadow: `0 0 12px ${a.color}` }} />
                              {a.bucket}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-semibold">{a.pct.toFixed(2)}%</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{fmtCompact.format(a.tokens)}</TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{a.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </GlassCard>

            <GlassCard>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Per-Mint Distribution</CardTitle>
                <CardDescription>Locked. Transfer tax 7%, redemption burn 5%.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SSOT.perMintSplit.map((s) => (
                  <div key={s.slice}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium">{s.slice}</span>
                      <span className="tabular-nums font-semibold" style={{ color: s.color }}>{s.pct}%</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: s.color, boxShadow: `0 0 12px ${s.color}` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </GlassCard>

            <GlassCard className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Scarcity Stack — Cite all 6 always
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {SSOT.scarcityStack.map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-xl border border-primary/20 bg-primary/[0.04] text-xs font-medium text-center hover:border-primary/40 hover:bg-primary/[0.08] transition-all"
                    >
                      <span className="block text-[10px] text-primary mb-1 font-bold tabular-nums">#{i + 1}</span>
                      {item}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <SectionHeader icon={TrendingUp} title="Flywheel & Growth Projections" description="Interactive — toggle scenarios, hover for detail." />
            <ToggleGroup
              type="single"
              value={scenario}
              onValueChange={(v) => v && setScenario(v as typeof scenario)}
              className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-lg p-1"
            >
              <ToggleGroupItem value="conservative" className="text-xs h-7 px-3">Conservative</ToggleGroupItem>
              <ToggleGroupItem value="base" className="text-xs h-7 px-3">Base</ToggleGroupItem>
              <ToggleGroupItem value="aggressive" className="text-xs h-7 px-3">Aggressive</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Suspense fallback={<div className="h-[400px] rounded-2xl bg-card/30 border border-border/30 animate-pulse" />}>
            <ChartsBlock scenario={scenario} ssot={SSOT} />
          </Suspense>
        </section>

        <section>
          <SectionHeader icon={Calendar} title="Roadmap & Milestones" description="Phase progress. Source: master outline + canonical SSoT." />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SSOT.roadmap.map((phase, i) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <GlassCard className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{phase.phase}</CardTitle>
                        <CardDescription className="text-xs mt-1">{phase.target}</CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          phase.status === "in_progress" && "border-primary/40 bg-primary/10 text-primary",
                          phase.status === "todo" && "border-muted-foreground/30 text-muted-foreground",
                        )}
                      >
                        {phase.status === "in_progress" ? "In progress" : "Planned"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="tabular-nums font-semibold">{phase.progress}%</span>
                      </div>
                      <Progress value={phase.progress} className="h-1.5" />
                    </div>
                    <ul className="space-y-1.5 text-xs">
                      {phase.items.map((it) => (
                        <li key={it} className="flex items-start gap-2 text-muted-foreground">
                          <Circle className="h-2 w-2 mt-1.5 shrink-0 text-primary/60 fill-primary/40" />
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader icon={Sparkles} title="Deason AI & Revenue Streams" description="Subscription tiers + Deason add-on monetization." />
          <Tabs defaultValue="subscription" className="space-y-4">
            <TabsList className="bg-card/40 backdrop-blur-sm border border-border/40">
              <TabsTrigger value="subscription">Subscription Tiers</TabsTrigger>
              <TabsTrigger value="deason">Deason AI</TabsTrigger>
              <TabsTrigger value="arr">Projected ARR</TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="grid md:grid-cols-3 gap-4 mt-4">
              {SSOT.subscription.map((t) => (
                <GlassCard key={t.tier} className="hover:-translate-y-1 transition-transform">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{t.tier}</CardTitle>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color, boxShadow: `0 0 16px ${t.color}` }} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight tabular-nums">${t.price.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">/ mo</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sell-rate</span>
                      <span className="font-semibold tabular-nums">{(t.sellRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">LP / mo</span>
                      <span className="tabular-nums">${(t.price / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Treasury / mo</span>
                      <span className="tabular-nums">${(t.price / 2).toFixed(2)}</span>
                    </div>
                  </CardContent>
                </GlassCard>
              ))}
            </TabsContent>

            <TabsContent value="deason" className="grid md:grid-cols-3 gap-4 mt-4">
              {SSOT.deasonPricing.map((p) => (
                <GlassCard key={p.tier}>
                  <CardHeader>
                    <CardTitle className="text-base">{p.tier}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold tabular-nums">{p.price === 0 ? "Free" : `$${p.price.toFixed(2)}`}</span>
                      {p.price > 0 && <span className="text-xs text-muted-foreground">/ mo</span>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 text-xs">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </GlassCard>
              ))}
            </TabsContent>

            <TabsContent value="arr" className="mt-4">
              <Suspense fallback={<div className="h-[300px] rounded-2xl bg-card/30 border border-border/30 animate-pulse" />}>
                <ChartsBlock scenario={scenario} ssot={SSOT} mode="arr" />
              </Suspense>
            </TabsContent>
          </Tabs>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <div>
            <SectionHeader icon={CheckCircle2} title="Product Features" description="Shipped + locked." />
            <GlassCard>
              <CardContent className="p-5">
                <ul className="space-y-2.5 text-sm">
                  {[
                    "Tap-to-Mint™ live (10:1 ratio)",
                    "Daily Auto-Mint engine",
                    "Mint-on-Proof™ (PoG receipts)",
                    "Embedded Coinbase Wallet + Reown AppKit",
                    "Clean Energy Center (mobile-first 390×844)",
                    "Subscription system (Base / Regular / Power)",
                    "Deason floating chat bubble",
                    "Live mirror dashboard (VIP demo)",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </GlassCard>
          </div>

          <div>
            <SectionHeader icon={AlertCircle} title="Open Items" description="Unresolved — needs founder/legal sign-off." />
            <GlassCard>
              <CardContent className="p-5 space-y-3">
                {SSOT.openItems.map((o, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0 text-accent-warm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{o.item}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Owner: {o.owner}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-accent-warm/40 text-accent-warm">{o.status}</Badge>
                  </div>
                ))}
                <div className="pt-2 border-t border-border/30">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Forbidden statements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SSOT.forbidden.map((f) => (
                      <Badge key={f} variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-[10px]">
                        ❌ {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </section>

        <section>
          <SectionHeader icon={Lock} title="Founder Pact & Sign-offs" description="Pact-locked allocations and crossover triggers." />
          <div className="grid md:grid-cols-2 gap-4">
            {SSOT.founderPact.map((f) => (
              <GlassCard key={f.name}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{f.role}</p>
                      <h3 className="text-lg font-bold mt-0.5">{f.name}</h3>
                    </div>
                    {f.signedOff ? (
                      <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Signed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-accent-warm/40 text-accent-warm">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Pact-locked</p>
                      <p className="text-xl font-bold tabular-nums">{fmtCompact.format(f.tokens)}</p>
                      <p className="text-[10px] text-muted-foreground">$ZSOLAR</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/[0.06] border border-primary/20">
                      <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Unlocks at</p>
                      <p className="text-xl font-bold tabular-nums text-primary">${f.unlockPrice.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">per token</p>
                    </div>
                  </div>
                </CardContent>
              </GlassCard>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader icon={ExternalLink} title="Live Status & Quick Links" description="Direct access to memory files, related dashboards, and sources." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: "Master Outline", to: "/founders/master-outline", icon: FileText, desc: "Full narrative & strategy" },
              { label: "Changelog", to: "/founders/changelog", icon: Clock, desc: "Recent decisions" },
              { label: "Catchup", to: "/founders/catchup", icon: Activity, desc: "Where we are right now" },
              { label: "Lyndon Pitch v2", to: "/founders/lyndon-pitch-v2", icon: Sparkles, desc: "Lyndon Rive deck" },
              { label: "Seed Ask", to: "/founders/seed-ask", icon: Coins, desc: "Round mechanics" },
              { label: "Flywheel Sim", to: "/founders/flywheel-simulation", icon: TrendingUp, desc: "Interactive model" },
              { label: "Deason Utility AI", to: "/founders/deason-utility-ai-revstream", icon: Zap, desc: "Phase 1.5 spec" },
              { label: "VPP Roadmap", to: "/founders/vpp-roadmap", icon: Calendar, desc: "Series A track" },
              { label: "Patent Expansion", to: "/founders/patent-expansion", icon: ShieldCheck, desc: "IP coverage" },
            ].map((link) => (
              <Link key={link.to} to={link.to} className="group">
                <GlassCard className="hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
                      <link.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{link.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.desc}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  </CardContent>
                </GlassCard>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
                <Github className="h-3.5 w-3.5 mr-1.5" /> GitHub
              </a>
            </Button>
            <Button variant="outline" size="sm" disabled>
              <FileText className="h-3.5 w-3.5 mr-1.5" /> CANONICAL_SSOT.md (in repo)
            </Button>
          </div>
        </section>

        <footer className="pt-8 pb-4 border-t border-border/30 text-center">
          <p className="text-[11px] text-muted-foreground">
            Mirrors <code className="text-foreground/70">.lovable/memory/CANONICAL_SSOT.md</code> {SSOT.version} ·
            Last locked <span className="text-foreground/70 tabular-nums">{SSOT.lastLocked}</span> ·
            Edit memory file first, then mirror constants in <code className="text-foreground/70">FoundersSsotZen.tsx</code>.
          </p>
        </footer>
      </div>
    </PageTransition>
  );
}
