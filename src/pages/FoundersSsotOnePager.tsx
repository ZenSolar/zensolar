import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Coins, Flame, Lock, TrendingUp, Calendar, Sparkles,
  CheckCircle2, Clock, ExternalLink, Zap, ShieldCheck, ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SEO } from "@/components/SEO";
import { PageTransition } from "@/components/layout/PageTransition";
import { cn } from "@/lib/utils";

const LAST_LOCKED = "2026-05-02";
const VERSION = "v2.1";

const KEY_METRICS = [
  { label: "Hard Cap", value: "1T", unit: "$ZSOLAR", icon: Coins, tone: "text-emerald-400" },
  { label: "Launch Price", value: "$0.10", unit: "USDC", icon: TrendingUp, tone: "text-cyan-400" },
  { label: "Mint Ratio", value: "10:1", unit: "kWh / token", icon: Zap, tone: "text-amber-400" },
  { label: "Burn / Mint", value: "20%", unit: "permanent", icon: Flame, tone: "text-orange-400" },
];

const TOKENOMICS = [
  { label: "Hard Cap", value: "1,000,000,000,000 (1T)", note: "Contract-enforced on Base L2" },
  { label: "Mint Ratio", value: "10 kWh = 1 $ZSOLAR", note: "Also 10 EV miles = 1 token" },
  { label: "Mint Split", value: "75 / 20 / 3 / 2", note: "User / Burn / LP / Treasury" },
  { label: "Halving", value: "Genesis @ 250K users", note: "Or 4-yr cadence (Bitcoin-style)" },
  { label: "Founder Lock", value: "200B locked", note: "Joseph until $6.67 · Michael until $20" },
  { label: "Floor Defense", value: "Satoshi-Mirror v2", note: "EIA floor + POL auto-buyback" },
];

const TIERS = [
  { name: "Base", price: "$9.99", lp: "$5.00", sell: "90%", tone: "border-zinc-600" },
  { name: "Regular", price: "$19.99", lp: "$10.00", sell: "25%", tone: "border-emerald-600" },
  { name: "Power", price: "$49.99", lp: "$25.00", sell: "5%", tone: "border-amber-500" },
];

const FLYWHEEL = [
  { step: "1", label: "User produces clean energy", icon: Zap },
  { step: "2", label: "Verified kWh → mints $ZSOLAR (10:1)", icon: Sparkles },
  { step: "3", label: "20% burns · 3% to LP · 2% treasury", icon: Flame },
  { step: "4", label: "Subscriptions fund LP (50%) + treasury (50%)", icon: Coins },
  { step: "5", label: "POL deepens · floor rises · scarcity compounds", icon: TrendingUp },
];

const ROADMAP = [
  { phase: "Seed Round", status: "active", progress: 65, note: "$1.7M LP reserve · OG round live" },
  { phase: "Genesis Launch", status: "next", progress: 25, note: "$0.10 launch · OG LP seeding" },
  { phase: "25K Users → Round 2", status: "planned", progress: 5, note: "$500K USDC + 5M tokens" },
  { phase: "100K Users → Self-Sustaining", status: "planned", progress: 0, note: "Flywheel covers LP from subs" },
  { phase: "250K Users → Genesis Halving", status: "planned", progress: 0, note: "Mint rate cuts 50%" },
  { phase: "Deason AI + FSD Miles", status: "planned", progress: 0, note: "Phase 2 utility expansion" },
];

const OPEN_QUESTIONS = [
  "Final binding mechanism for founder pact-lock",
  "On-chain implementation details for Genesis Halving",
  "ZK-Proof-of-Genesis provisional filing timeline",
  "Base tier soft cap (800–1,000 tokens/mo) — enable at launch?",
];

const NEXT_MILESTONES = [
  { label: "Lyndon Rive pitch", when: "In progress", icon: Sparkles },
  { label: "Seed close ($1.7M LP)", when: "Q2 2026", icon: Coins },
  { label: "Genesis launch on Base", when: "Q3 2026", icon: Zap },
  { label: "First halving milestone", when: "250K users", icon: Flame },
];

function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <Card className={cn(
      "border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01]",
      "backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]",
      className,
    )}>
      {children}
    </Card>
  );
}

export default function FoundersSsotOnePager() {
  return (
    <PageTransition>
      <SEO title="ZenSolar SSOT — One-Pager" description="Executive one-pager: tokenomics, flywheel, roadmap." />
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),_transparent_60%)] bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-primary/40 text-primary">SSOT {VERSION}</Badge>
                <Badge variant="secondary" className="text-[10px]">One-Pager</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                ZenSolar — Executive Summary
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Creating Currency From Energy · Last locked {LAST_LOCKED}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/founders/ssot-zen">
                Full SSOT <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </motion.div>

          {/* Key metrics */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {KEY_METRICS.map((m) => (
              <GlassCard key={m.label}>
                <CardContent className="p-4">
                  <m.icon className={cn("h-5 w-5 mb-2", m.tone)} />
                  <div className="text-2xl font-bold tabular-nums">{m.value}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    {m.label} · {m.unit}
                  </div>
                </CardContent>
              </GlassCard>
            ))}
          </motion.div>

          {/* Tokenomics summary */}
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" /> Tokenomics Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TOKENOMICS.map((t) => (
                <div key={t.label} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
                  <div className="font-semibold text-foreground">{t.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.note}</div>
                </div>
              ))}
            </CardContent>
          </GlassCard>

          {/* Subscription tiers */}
          <GlassCard>
            <CardHeader>
              <CardTitle className="text-lg">Subscription Tiers</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {TIERS.map((t) => (
                <div key={t.name} className={cn("rounded-lg border-2 bg-white/[0.02] p-4", t.tone)}>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-2xl font-bold mt-1 tabular-nums">{t.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <div>LP injection: <span className="text-foreground font-medium">{t.lp}</span></div>
                    <div>Sell rate: <span className="text-foreground font-medium">{t.sell}</span></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </GlassCard>

          {/* Flywheel one-pager */}
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" /> The Flywheel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-3">
                {FLYWHEEL.map((f, i) => (
                  <motion.li
                    key={f.step}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-gradient-to-r from-primary/5 to-transparent p-3"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-sm shrink-0">
                      {f.step}
                    </div>
                    <f.icon className="h-4 w-4 text-primary/70 shrink-0" />
                    <div className="text-sm">{f.label}</div>
                  </motion.li>
                ))}
              </ol>
              <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200/90">
                <Lock className="inline h-3.5 w-3.5 mr-1" />
                Self-sustaining at ~100K paying users. No further capital raises needed for liquidity.
              </div>
            </CardContent>
          </GlassCard>

          {/* Roadmap */}
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" /> Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ROADMAP.map((r, i) => (
                <motion.div
                  key={r.phase}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.04 * i }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {r.status === "active" ? (
                        <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
                      ) : r.status === "next" ? (
                        <Sparkles className="h-4 w-4 text-primary" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
                      )}
                      {r.phase}
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{r.progress}%</span>
                  </div>
                  <Progress value={r.progress} className="h-1.5" />
                  <div className="text-xs text-muted-foreground pl-6">{r.note}</div>
                </motion.div>
              ))}
            </CardContent>
          </GlassCard>

          {/* Open questions + Next milestones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard>
              <CardHeader>
                <CardTitle className="text-lg">Open Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {OPEN_QUESTIONS.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span className="text-muted-foreground">{q}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </GlassCard>

            <GlassCard>
              <CardHeader>
                <CardTitle className="text-lg">Next Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {NEXT_MILESTONES.map((m, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <m.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{m.label}</div>
                        <div className="text-xs text-muted-foreground">{m.when}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </GlassCard>
          </div>

          {/* Footer links */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/founders/ssot-zen"><ExternalLink className="mr-1 h-3.5 w-3.5" /> Full SSOT Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/founders/lyndon-pitch-v2"><ExternalLink className="mr-1 h-3.5 w-3.5" /> Lyndon Pitch v2</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/founders/changelog"><ExternalLink className="mr-1 h-3.5 w-3.5" /> Changelog</Link>
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground pt-4">
            Canonical source: <code className="text-foreground/70">.lovable/memory/CANONICAL_SSOT.md</code> · v{VERSION} · Last locked {LAST_LOCKED}
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
