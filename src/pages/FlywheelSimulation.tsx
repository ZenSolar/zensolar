import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  Droplets,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SEO } from "@/components/SEO";
import {
  SUBSCRIPTION_TIERS,
  GENESIS_HALVING,
  MINT_RATIO_KWH_PER_TOKEN,
  formatUSD,
} from "@/lib/tokenomics";

/**
 * Subscription Flywheel Simulation Page (Feature #5)
 * ──────────────────────────────────────────────────
 * Interactive 60-month projection showing how the v2.1 subscription
 * flywheel compounds capital into the LP and Treasury over time, with
 * the Genesis Halving trigger applied at the configured user-count
 * threshold (or fallback cadence).
 *
 * Assumptions (tunable via sliders):
 *   - Starting subscriber count
 *   - Monthly compound growth %
 *   - Tier mix (Base / Regular / Power) — must sum to 100
 *   - Monthly avg kWh per active subscriber (drives mint volume)
 *
 * Splits per SSoT v2.1: 50% LP / 50% Treasury of every subscription dollar.
 * Mint ratio: 10 kWh = 1 $ZSOLAR (10:1).
 */
export default function FlywheelSimulation() {
  const [startUsers, setStartUsers] = useState(1_000);
  const [growthPct, setGrowthPct] = useState(15); // monthly compound %
  const [baseShare, setBaseShare] = useState(40);
  const [regularShare, setRegularShare] = useState(45);
  // power = 100 - base - regular (auto-balanced, clamped >= 0)
  const powerShare = Math.max(0, 100 - baseShare - regularShare);
  const [kwhPerUserMo, setKwhPerUserMo] = useState(450); // ~typical residential

  const months = 60;

  const sim = useMemo(() => {
    const blendedArpu =
      (baseShare / 100) * SUBSCRIPTION_TIERS.base.monthlyPrice +
      (regularShare / 100) * SUBSCRIPTION_TIERS.regular.monthlyPrice +
      (powerShare / 100) * SUBSCRIPTION_TIERS.power.monthlyPrice;

    const rows: Array<{
      month: number;
      users: number;
      mrr: number;
      lpMo: number;
      treasuryMo: number;
      cumLp: number;
      cumTreasury: number;
      tokensMintedMo: number;
      halving: boolean;
    }> = [];

    let users = startUsers;
    let cumLp = 0;
    let cumTreasury = 0;
    let halvingActive = false;
    let halvingMonth: number | null = null;

    for (let m = 1; m <= months; m++) {
      // Apply growth
      if (m > 1) users = users * (1 + growthPct / 100);

      // Trigger Genesis Halving once subscriber threshold is crossed
      if (
        !halvingActive &&
        GENESIS_HALVING.enabled &&
        users >= GENESIS_HALVING.userCountTrigger
      ) {
        halvingActive = true;
        halvingMonth = m;
      }

      const mrr = users * blendedArpu;
      const lpMo = mrr * 0.5;
      const treasuryMo = mrr * 0.5;
      cumLp += lpMo;
      cumTreasury += treasuryMo;

      // Token mint volume: kWh / 10, halved post-trigger
      const rawTokens = (users * kwhPerUserMo) / MINT_RATIO_KWH_PER_TOKEN;
      const tokensMintedMo = halvingActive
        ? rawTokens * GENESIS_HALVING.multiplier
        : rawTokens;

      rows.push({
        month: m,
        users: Math.round(users),
        mrr,
        lpMo,
        treasuryMo,
        cumLp,
        cumTreasury,
        tokensMintedMo,
        halving: halvingActive,
      });
    }

    return {
      blendedArpu,
      rows,
      halvingMonth,
      finalUsers: rows[rows.length - 1].users,
      finalCumLp: cumLp,
      finalCumTreasury: cumTreasury,
      year1Lp: rows[11]?.cumLp ?? 0,
      year1Treasury: rows[11]?.cumTreasury ?? 0,
      totalTokensMinted: rows.reduce((s, r) => s + r.tokensMintedMo, 0),
    };
  }, [startUsers, growthPct, baseShare, regularShare, powerShare, kwhPerUserMo]);

  // Compact chart data — every 3rd month for performance
  const chartData = sim.rows
    .filter((_, i) => i % 3 === 0 || i === sim.rows.length - 1)
    .map((r) => ({
      month: r.month,
      LP: Math.round(r.cumLp),
      Treasury: Math.round(r.cumTreasury),
    }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO
        title="Flywheel Simulation | ZenSolar Founders"
        description="Project the v2.1 subscription flywheel over 60 months."
      />
      <div className="mx-auto w-full max-w-3xl px-4 pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/founders">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Vault
            </Link>
          </Button>
          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
            60-month projection
          </Badge>
        </div>

        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Flywheel Simulation
          </h1>
          <p className="text-sm text-muted-foreground leading-snug">
            Tune subscriber growth, tier mix, and energy throughput to see how
            the 50/50 subscription split compounds into the LP and Treasury,
            with the Genesis Halving applied automatically at{" "}
            {GENESIS_HALVING.userCountTrigger.toLocaleString()} subs.
          </p>
        </header>

        {/* Headline KPIs */}
        <div className="grid grid-cols-2 gap-2.5">
          <KpiCard
            icon={TrendingUp}
            label="Final subscribers"
            value={compact(sim.finalUsers)}
            sub={`from ${compact(startUsers)} · ${growthPct}%/mo`}
          />
          <KpiCard
            icon={Sparkles}
            label="Blended ARPU"
            value={formatUSD(sim.blendedArpu)}
            sub="weighted by tier mix"
          />
          <KpiCard
            icon={Droplets}
            label="60-mo LP injected"
            value={compactUsd(sim.finalCumLp)}
            sub={`Y1: ${compactUsd(sim.year1Lp)}`}
            tone="primary"
          />
          <KpiCard
            icon={Building2}
            label="60-mo Treasury"
            value={compactUsd(sim.finalCumTreasury)}
            sub={`Y1: ${compactUsd(sim.year1Treasury)}`}
          />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cumulative $ Routed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -12 }}
                >
                  <defs>
                    <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="trGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `M${v}`}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => compactUsd(v)}
                    width={48}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => compactUsd(v)}
                    labelFormatter={(l) => `Month ${l}`}
                  />
                  {sim.halvingMonth && (
                    <ReferenceLine
                      x={sim.halvingMonth}
                      stroke="hsl(var(--solar))"
                      strokeDasharray="4 3"
                      label={{
                        value: "Halving",
                        position: "top",
                        fill: "hsl(var(--solar))",
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="LP"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#lpGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Treasury"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    fill="url(#trGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground mt-1">
              <LegendDot color="hsl(var(--primary))" label="LP" />
              <LegendDot color="hsl(var(--muted-foreground))" label="Treasury" />
              {sim.halvingMonth && (
                <span className="flex items-center gap-1 text-solar">
                  <Flame className="h-3 w-3" />
                  Halving @ M{sim.halvingMonth}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Assumptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <SliderRow
              label="Starting subscribers"
              value={startUsers}
              display={compact(startUsers)}
              min={100}
              max={50_000}
              step={100}
              onChange={setStartUsers}
            />
            <SliderRow
              label="Monthly growth"
              value={growthPct}
              display={`${growthPct}%`}
              min={0}
              max={30}
              step={1}
              onChange={setGrowthPct}
            />
            <SliderRow
              label="kWh per sub / mo"
              value={kwhPerUserMo}
              display={`${kwhPerUserMo} kWh`}
              min={50}
              max={2000}
              step={50}
              onChange={setKwhPerUserMo}
            />

            <Separator />

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Tier mix · auto-balanced
              </p>
              <SliderRow
                label="Base ($9.99)"
                value={baseShare}
                display={`${baseShare}%`}
                min={0}
                max={100}
                step={5}
                onChange={(v) => {
                  setBaseShare(v);
                  if (v + regularShare > 100) setRegularShare(100 - v);
                }}
              />
              <SliderRow
                label="Regular ($19.99)"
                value={regularShare}
                display={`${regularShare}%`}
                min={0}
                max={100 - baseShare}
                step={5}
                onChange={setRegularShare}
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Power ($49.99)</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {powerShare}% <span className="text-muted-foreground">(auto)</span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tokens */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Token Issuance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <Row
              label="60-mo $ZSOLAR minted"
              value={`${compact(sim.totalTokensMinted)} $ZSOLAR`}
            />
            <Row
              label="Mint ratio"
              value={`${MINT_RATIO_KWH_PER_TOKEN} kWh = 1 $ZSOLAR`}
            />
            <Row
              label="Halving impact"
              value={
                sim.halvingMonth
                  ? `Triggered at M${sim.halvingMonth} · 50% mint rate cut`
                  : "Not triggered in 60mo (raise growth or starting subs)"
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  sub?: string;
  tone?: "primary";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${tone === "primary" ? "text-primary" : ""}`} />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`mt-1 text-lg font-bold tabular-nums ${tone === "primary" ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground tabular-nums">{sub}</p>}
    </div>
  );
}

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground tabular-nums">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

// ── Formatters ─────────────────────────────────────────────────────

function compact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

function compactUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
