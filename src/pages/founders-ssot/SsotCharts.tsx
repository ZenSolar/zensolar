import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SsotShape {
  baseline: { kwhPerUserPerMonth: number; tokensPerUserPerMonth: number };
  token: { launchPrice: number };
  liquidityRounds: { round: string; usdc: number }[];
  subscription: { tier: string; price: number; sellRate: number; color: string }[];
}

interface Props {
  scenario: "conservative" | "base" | "aggressive";
  ssot: SsotShape;
  mode?: "default" | "arr";
}

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-border/40 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.12)]",
        className,
      )}
    >
      {children}
    </Card>
  );
}

const SCENARIO_GROWTH = {
  conservative: { multiplier: 0.6, label: "Conservative" },
  base: { multiplier: 1, label: "Base" },
  aggressive: { multiplier: 1.8, label: "Aggressive" },
};

// Cohort mix evolves base-heavy → more Regular/Power as the network matures
const COHORT_AT = (users: number) => {
  // Simple S-curve: base shrinks, regular/power grow with user count
  const t = Math.min(1, users / 500_000);
  const base = 0.7 - 0.4 * t;       // 70% → 30%
  const regular = 0.25 + 0.25 * t;  // 25% → 50%
  const power = 0.05 + 0.15 * t;    // 5% → 20%
  return { base, regular, power };
};

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 8px 32px -8px hsl(var(--primary) / 0.3)",
};

export default function SsotCharts({ scenario, ssot, mode = "default" }: Props) {
  const mult = SCENARIO_GROWTH[scenario].multiplier;

  // ── User growth curve (months 0–24) ──
  const userGrowth = useMemo(() => {
    const data: { month: number; users: number; paying: number }[] = [];
    for (let m = 0; m <= 24; m++) {
      // sigmoid growth, peak ~250k by month 24 in base
      const users = Math.round((250_000 / (1 + Math.exp(-(m - 10) / 3))) * mult);
      const paying = Math.round(users * 0.35); // ~35% conversion
      data.push({ month: m, users, paying });
    }
    return data;
  }, [mult]);

  // ── LP depth vs sell pressure ──
  const lpVsSell = useMemo(() => {
    let cumulativeLp = 0;
    const lpRoundsByUserBucket: Record<number, number> = {
      0: ssot.liquidityRounds[0].usdc,
      25_000: ssot.liquidityRounds[1].usdc,
      100_000: ssot.liquidityRounds[2].usdc,
      250_000: ssot.liquidityRounds[3].usdc,
    };
    return userGrowth.map((d) => {
      // Add LP at trigger thresholds
      for (const [threshold, usdc] of Object.entries(lpRoundsByUserBucket)) {
        if (d.users >= Number(threshold) && cumulativeLp < (cumulativeLp + usdc)) {
          // mark applied by zeroing the bucket after first crossing
          cumulativeLp += usdc;
          lpRoundsByUserBucket[Number(threshold)] = 0;
        }
      }
      // Add self-funded LP from subscription revenue (50% of sub fees)
      const cohort = COHORT_AT(d.paying);
      const monthlySubLp =
        d.paying *
        (cohort.base * ssot.subscription[0].price * 0.5 +
          cohort.regular * ssot.subscription[1].price * 0.5 +
          cohort.power * ssot.subscription[2].price * 0.5);
      cumulativeLp += monthlySubLp;

      // Sell pressure: tokens per paying user × weighted sell rate × launch price
      const weightedSell =
        cohort.base * ssot.subscription[0].sellRate +
        cohort.regular * ssot.subscription[1].sellRate +
        cohort.power * ssot.subscription[2].sellRate;
      const monthlySellUsd = d.paying * ssot.baseline.tokensPerUserPerMonth * weightedSell * ssot.token.launchPrice;
      return {
        month: d.month,
        lpDepth: Math.round(cumulativeLp),
        sellPressure: Math.round(monthlySellUsd),
      };
    });
  }, [userGrowth, ssot]);

  // ── Token price projection ──
  const priceProjection = useMemo(() => {
    return lpVsSell.map((d) => {
      // Toy model: price = launch * (1 + lp/sell ratio capped)
      const ratio = d.sellPressure > 0 ? d.lpDepth / Math.max(1, d.sellPressure * 12) : 10;
      const price = ssot.token.launchPrice * Math.min(20, 1 + Math.log10(1 + ratio) * 1.5);
      return { month: d.month, price: Number(price.toFixed(3)) };
    });
  }, [lpVsSell, ssot]);

  // ── Break-even point: where LP depth covers 12mo sell pressure ──
  const breakEven = useMemo(() => {
    return lpVsSell.find((d) => d.lpDepth >= d.sellPressure * 12)?.month ?? null;
  }, [lpVsSell]);

  // ── ARR projection ──
  const arrData = useMemo(() => {
    return userGrowth.map((d) => {
      const cohort = COHORT_AT(d.paying);
      const mrr =
        d.paying *
        (cohort.base * ssot.subscription[0].price +
          cohort.regular * ssot.subscription[1].price +
          cohort.power * ssot.subscription[2].price);
      return {
        month: d.month,
        arr: Math.round(mrr * 12),
        base: Math.round(d.paying * cohort.base * ssot.subscription[0].price * 12),
        regular: Math.round(d.paying * cohort.regular * ssot.subscription[1].price * 12),
        power: Math.round(d.paying * cohort.power * ssot.subscription[2].price * 12),
      };
    });
  }, [userGrowth, ssot]);

  if (mode === "arr") {
    return (
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">Projected ARR (24 months)</CardTitle>
          <CardDescription>Subscription revenue stack — {SCENARIO_GROWTH[scenario].label} scenario.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={arrData}>
              <defs>
                <linearGradient id="grad-base" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(220 15% 60%)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(220 15% 60%)" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="grad-reg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(168 72% 48%)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="hsl(168 72% 48%)" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="grad-pow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 76% 45%)" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="hsl(142 76% 45%)" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `M${v}`} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                labelFormatter={(l) => `Month ${l}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="base" stackId="a" fill="url(#grad-base)" name="Base" />
              <Bar dataKey="regular" stackId="a" fill="url(#grad-reg)" name="Regular" />
              <Bar dataKey="power" stackId="a" fill="url(#grad-pow)" name="Power" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* User Growth */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">User Growth</CardTitle>
          <CardDescription>Total users vs paying subscribers — {SCENARIO_GROWTH[scenario].label}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={userGrowth}>
              <defs>
                <linearGradient id="grad-users" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 76% 45%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(142 76% 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad-paying" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(168 72% 48%)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(168 72% 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `M${v}`} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [v.toLocaleString(), name]}
                labelFormatter={(l) => `Month ${l}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="users" stroke="hsl(142 76% 45%)" strokeWidth={2} fill="url(#grad-users)" name="Total users" />
              <Area type="monotone" dataKey="paying" stroke="hsl(168 72% 48%)" strokeWidth={2} fill="url(#grad-paying)" name="Paying subscribers" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      {/* LP Depth vs Sell Pressure */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-base">LP Depth vs Monthly Sell Pressure</CardTitle>
          <CardDescription>Cumulative liquidity (USDC) vs monthly sell flow. Break-even at month {breakEven ?? "—"}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lpVsSell}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `M${v}`} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name]}
                labelFormatter={(l) => `Month ${l}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {breakEven !== null && (
                <ReferenceLine x={breakEven} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: "Break-even", fill: "hsl(var(--primary))", fontSize: 10, position: "top" }} />
              )}
              <Line type="monotone" dataKey="lpDepth" stroke="hsl(142 76% 45%)" strokeWidth={2.5} dot={false} name="LP depth" />
              <Line type="monotone" dataKey="sellPressure" stroke="hsl(0 75% 60%)" strokeWidth={2} dot={false} name="Monthly sell pressure" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      {/* Token Price Projection */}
      <GlassCard className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Token Price Projection</CardTitle>
          <CardDescription>
            Toy model: floor lifts as LP depth outpaces sell pressure. Launch ${ssot.token.launchPrice.toFixed(2)} → projected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={priceProjection}>
              <defs>
                <linearGradient id="grad-price" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 76% 45%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(142 76% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `M${v}`} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${v.toFixed(2)}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`$${v.toFixed(3)}`, "Projected price"]}
                labelFormatter={(l) => `Month ${l}`}
              />
              <ReferenceLine y={ssot.token.launchPrice} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Launch", fill: "hsl(var(--muted-foreground))", fontSize: 10, position: "right" }} />
              <Area type="monotone" dataKey="price" stroke="hsl(142 76% 45%)" strokeWidth={2.5} fill="url(#grad-price)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>
    </div>
  );
}
