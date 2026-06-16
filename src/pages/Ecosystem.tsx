import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import confetti from "canvas-confetti";
import {
  Activity,
  Flame,
  Users,
  Zap,
  Coins,
  Sparkles,
  TrendingUp,
  Droplets,
  Lock,
  Gift,
  ArrowUpRight,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useEcosystemStats, MAX_SUPPLY } from "@/hooks/useEcosystemStats";
import { formatTokenAmount, formatUSD, PRICES } from "@/lib/tokenomics";
import { useCountUp } from "@/hooks/useCountUp";

const GLASS =
  "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny number formatter w/ count-up
function CountNum({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
  duration = 1400,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}) {
  const { ref, value: v } = useCountUp({ end: value, duration, decimals });
  return (
    <span ref={ref as any} className={`tabular-nums ${className}`}>
      {prefix}
      {Number(v).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
function Hero({ price, kwh }: { price: number; kwh: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`${GLASS} relative overflow-hidden p-6`}
    >
      {/* Aurora */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-16 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.10),transparent_60%)]" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
        </span>
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-[0.18em] border-emerald-400/40 text-emerald-300 bg-emerald-500/5"
        >
          Live Network
        </Badge>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-emerald-100 bg-clip-text text-transparent">
        The ZenSolar Economy
      </h1>

      <p className="mt-3 text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
        Your monthly subscription is{" "}
        <span className="text-foreground font-semibold">
          100% powering the liquidity pool and the flywheel
        </span>
        . This is what you're investing in.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/5 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            $ZSOLAR · Launch
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-300">
            <CountNum value={price} decimals={2} prefix="$" />
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Lifetime kWh Minted
          </div>
          <div className="mt-1 text-2xl font-bold text-violet-300">
            <CountNum value={kwh} decimals={0} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Flywheel Health Gauge
const FLYWHEEL_PRESETS = {
  strong: {
    label: "Strong",
    emoji: "💪",
    pct: 45,
    tone: "text-emerald-300",
    ring: "#10b981",
    glow: "rgba(16,185,129,0.45)",
  },
  accelerating: {
    label: "Accelerating",
    emoji: "🚀",
    pct: 75,
    tone: "text-sky-300",
    ring: "#38bdf8",
    glow: "rgba(56,189,248,0.5)",
  },
  supercharged: {
    label: "Supercharged",
    emoji: "⚡",
    pct: 100,
    tone: "text-amber-300",
    ring: "#fbbf24",
    glow: "rgba(251,191,36,0.6)",
  },
} as const;

function FlywheelGauge({
  state,
  monthMints,
  subscribers,
}: {
  state: keyof typeof FLYWHEEL_PRESETS;
  monthMints: number;
  subscribers: number;
}) {
  const preset = FLYWHEEL_PRESETS[state];
  const [tapped, setTapped] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (state === "supercharged" && !firedRef.current) {
      firedRef.current = true;
      // Tasteful neon confetti burst
      const colors = ["#10b981", "#fbbf24", "#a78bfa", "#38bdf8"];
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 38,
        origin: { y: 0.35 },
        colors,
        scalar: 0.9,
      });
    }
  }, [state]);

  const R = 54;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - preset.pct / 100);

  return (
    <motion.button
      type="button"
      onClick={() => setTapped((t) => !t)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`${GLASS} group relative w-full overflow-hidden p-5 text-left`}
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 12px 60px -20px ${preset.glow}` }}
    >
      {/* radial glow */}
      <div
        className="pointer-events-none absolute -inset-1 -z-10 opacity-60 blur-3xl"
        style={{
          background: `radial-gradient(circle at 20% 30%, ${preset.glow}, transparent 60%)`,
        }}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          Flywheel Health
        </div>
        <Badge variant="outline" className="border-white/10 text-[10px]">
          tap for detail
        </Badge>
      </div>

      <div className="flex items-center gap-5">
        {/* SVG ring */}
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
            <motion.circle
              cx="60"
              cy="60"
              r={R}
              stroke={preset.ring}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 6px ${preset.glow})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={preset.emoji}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="text-3xl"
            >
              {preset.emoji}
            </motion.span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
              {preset.pct}%
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`text-2xl font-bold ${preset.tone}`}>{preset.label}</div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Every subscription + mint adds net buy pressure to the LP.
          </p>
          <div className="mt-3 flex gap-3 text-[11px] text-muted-foreground">
            <div>
              <div className="text-foreground font-semibold tabular-nums">
                {monthMints.toLocaleString()}
              </div>
              <div>mints / 30d</div>
            </div>
            <div>
              <div className="text-foreground font-semibold tabular-nums">
                {subscribers.toLocaleString()}
              </div>
              <div>subscribers</div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {tapped && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden text-[11px] text-muted-foreground border-t border-white/5 pt-3"
          >
            Score blends recent mint velocity, subscriber count, and monthly LP
            contribution. Reaches <span className="text-amber-300">Supercharged</span>{" "}
            when momentum sustains across all three.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI tile
function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  delay,
  accent = "emerald",
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  sub?: string;
  delay: number;
  accent?: "emerald" | "violet" | "sky" | "amber";
}) {
  const colors: Record<string, string> = {
    emerald: "from-emerald-500/20 to-transparent text-emerald-300",
    violet: "from-violet-500/20 to-transparent text-violet-300",
    sky: "from-sky-500/20 to-transparent text-sky-300",
    amber: "from-amber-500/20 to-transparent text-amber-300",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className={`${GLASS} group relative overflow-hidden p-4`}
    >
      <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${colors[accent]} opacity-60`} />
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
        <Icon className={`h-3.5 w-3.5 ${colors[accent].split(" ").pop()}`} />
        {label}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LP card
function LpCard({
  usdc,
  tokens,
  monthFromSubs,
  monthFromMints,
}: {
  usdc: number;
  tokens: number;
  monthFromSubs: number;
  monthFromMints: number;
}) {
  const monthGrowth = monthFromSubs + monthFromMints;
  const sparkline = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: i,
        y: monthGrowth * Math.pow((i + 1) / 14, 1.3),
      })),
    [monthGrowth],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      whileHover={{ y: -2 }}
      className={`${GLASS} p-5`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">
        <Droplets className="h-3.5 w-3.5 text-sky-300" />
        Liquidity Pool
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">USDC Depth</div>
          <div className="text-xl font-bold text-sky-300">
            <CountNum value={usdc} decimals={0} prefix="$" />
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">$ZSOLAR Depth</div>
          <div className="text-xl font-bold text-emerald-300">{formatTokenAmount(tokens)}</div>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-emerald-500/[0.03] to-transparent p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-300">
            <TrendingUp className="h-3 w-3" />
            This Month's LP Growth
          </div>
          <div className="text-emerald-300 font-bold tabular-nums">
            +<CountNum value={monthGrowth} decimals={0} prefix="$" />
          </div>
        </div>
        <div className="mb-2 space-y-0.5 text-[10px] text-muted-foreground">
          <div className="flex justify-between">
            <span>From subscriptions</span>
            <span className="tabular-nums text-foreground/80">+${monthFromSubs.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span>From mint reflows</span>
            <span className="tabular-nums text-foreground/80">+${monthFromMints.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={sparkline} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
            <defs>
              <linearGradient id="lpSpark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.1)" }}
              contentStyle={{
                background: "rgba(10,14,20,0.92)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(v: any) => [`$${Number(v).toFixed(0)}`, "LP"]}
              labelFormatter={() => ""}
            />
            <Area
              type="monotone"
              dataKey="y"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#lpSpark)"
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Supply breakdown
function SupplyBar({
  circulating,
  founderLocked,
  treasuryLocked,
  teamLocked,
  burned,
  lockedPct,
  monthBurned,
}: {
  circulating: number;
  founderLocked: number;
  treasuryLocked: number;
  teamLocked: number;
  burned: number;
  lockedPct: number;
  monthBurned: number;
}) {
  const seg = (n: number) => `${(n / MAX_SUPPLY) * 100}%`;
  const items = [
    { label: "Circulating", color: "bg-emerald-400", value: circulating, glow: "shadow-emerald-500/40" },
    { label: "Pact-Locked", color: "bg-violet-400", value: founderLocked, glow: "shadow-violet-500/40" },
    { label: "Treasury", color: "bg-sky-400", value: treasuryLocked, glow: "shadow-sky-500/40" },
    { label: "Team", color: "bg-amber-400", value: teamLocked, glow: "shadow-amber-500/40" },
    { label: "Burned", color: "bg-rose-400", value: burned, glow: "shadow-rose-500/40" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`${GLASS} p-5`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground mb-4">
        <Lock className="h-3.5 w-3.5 text-violet-300" />
        Supply Breakdown
        <span className="ml-auto text-[10px] normal-case text-muted-foreground/70">
          1T hard cap
        </span>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5 mb-3">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            className={`${it.color} h-full`}
            initial={{ width: 0 }}
            animate={{ width: seg(it.value) }}
            transition={{ delay: 0.4 + i * 0.08, duration: 0.8, ease: "easeOut" }}
            title={`${it.label}: ${formatTokenAmount(it.value)}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] mb-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${it.color}`} />
            <span className="text-muted-foreground">{it.label}</span>
            <span className="ml-auto text-foreground font-semibold tabular-nums">
              {formatTokenAmount(it.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent p-3 flex items-start gap-3">
        <div className="shrink-0 rounded-lg bg-rose-500/15 p-2">
          <Flame className="h-4 w-4 text-rose-400" />
        </div>
        <div className="text-xs">
          <div className="font-semibold text-rose-200">
            <CountNum value={lockedPct} decimals={1} suffix="%" /> of all tokens are still locked or burned
          </div>
          <div className="text-muted-foreground mt-1">
            This month's burn permanently removed{" "}
            <span className="text-foreground font-semibold">
              {formatTokenAmount(monthBurned)}
            </span>{" "}
            tokens.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Growth chart
function GrowthChart({
  series,
}: {
  series: Array<{ date: string; subscribers: number; kwhCumulative: number }>;
}) {
  const [range, setRange] = useState<"30" | "90" | "all">("90");
  const data = useMemo(() => {
    if (range === "all") return series;
    const days = range === "30" ? 30 : 90;
    const cutoff = Date.now() - days * 86400000;
    return series.filter((g) => new Date(g.date).getTime() >= cutoff);
  }, [range, series]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className={`${GLASS} p-5`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Network Growth
          </div>
          <div className="text-[11px] text-muted-foreground/70">Subscribers + cumulative kWh</div>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-0.5">
          {(["30", "90", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider transition ${
                range === r
                  ? "bg-emerald-500/20 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "all" ? "All" : `${r}d`}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-10">
          Growth chart populates as users join and mint.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="strokeSubs" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
              axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
              tickLine={false}
            />
            <YAxis
              yAxisId="l"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="r"
              orientation="right"
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(10,14,20,0.94)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 11,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              yAxisId="l"
              type="monotone"
              dataKey="subscribers"
              name="Subscribers"
              stroke="url(#strokeSubs)"
              strokeWidth={2.5}
              dot={false}
              animationDuration={1200}
            />
            <Line
              yAxisId="r"
              type="monotone"
              dataKey="kwhCumulative"
              name="Cum. kWh"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              animationDuration={1200}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent mints ticker (marquee)
function MintsTicker({
  mints,
}: {
  mints: Array<{ tokens_minted: number; kwh_delta: number | null; created_at: string }>;
}) {
  if (mints.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`${GLASS} p-5`}
      >
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Recent Mints
        </div>
        <div className="text-sm text-muted-foreground text-center py-3">
          No confirmed mints yet. The ticker will come alive as activity flows in.
        </div>
      </motion.div>
    );
  }

  // Loop the list twice for seamless marquee
  const loop = [...mints, ...mints];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`${GLASS} p-5 overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Recent Mints
        </div>
        <Badge variant="outline" className="border-white/10 text-[10px]">
          anonymized
        </Badge>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent z-10" />
        <motion.div
          className="flex gap-3 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, ease: "linear", repeat: Infinity }}
        >
          {loop.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span className="text-muted-foreground">Anon</span>
              <span className="text-emerald-300 font-semibold tabular-nums">
                {Number(m.kwh_delta ?? 0).toFixed(2)} kWh
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-[10px] text-muted-foreground">{timeAgo(m.created_at)}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Your stake snapshot
function StakeSnapshot({
  tokens,
  kwh,
  lpThisMonth,
  sharePct,
}: {
  tokens: number;
  kwh: number;
  lpThisMonth: number;
  sharePct: number;
}) {
  const projLow = tokens * 0.5;
  const projHigh = tokens * 2.0;
  const sharePctBar = Math.min(sharePct * 50, 100); // visual amplification

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`${GLASS} relative overflow-hidden p-5`}
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.04), 0 0 60px -10px rgba(167,139,250,0.35)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-16 -right-12 h-48 w-48 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-violet-300" />
        <div className="text-xs uppercase tracking-[0.18em] text-violet-200">
          Your Stake in the Network
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">
        You're not a customer. You're a co-owner.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Earned (locked)
          </div>
          <div className="mt-1 text-2xl font-bold text-violet-200">
            <CountNum value={tokens} decimals={0} />
          </div>
          <div className="text-[10px] text-muted-foreground">
            $ZSOLAR · <CountNum value={kwh} decimals={1} /> kWh verified
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent p-3">
          <div className="text-[10px] uppercase tracking-wider text-emerald-300">
            Your LP Push / mo
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-300">
            +<CountNum value={lpThisMonth} decimals={2} prefix="$" />
          </div>
          <div className="text-[10px] text-muted-foreground">from your subscription</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-muted-foreground">Your share of circulating</span>
          <span className="text-foreground font-semibold tabular-nums">
            {sharePct.toFixed(4)}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${sharePctBar}%` }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-violet-400 to-amber-300 shadow-[0_0_10px_rgba(167,139,250,0.6)]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 to-transparent p-3 mb-4">
        <div className="text-[10px] uppercase tracking-wider text-amber-300 mb-1">
          Projected 3-Year Upside (illustrative)
        </div>
        <div className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-emerald-200 bg-clip-text text-transparent">
          {formatUSD(projLow)} – {formatUSD(projHigh)}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          Illustrative price band $0.50–$2.00. Not financial advice.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          asChild
          className="w-full bg-gradient-to-r from-emerald-500 to-violet-500 text-white border-0 hover:opacity-95 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)]"
        >
          <Link to="/referrals">
            <Gift className="h-4 w-4 mr-2" />
            Invite a friend — bonus tokens
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full border-white/15 bg-white/[0.02] hover:bg-white/[0.05]"
        >
          <Link to="/referrals">
            See my referrals
            <ArrowUpRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Ecosystem() {
  const { data, isLoading } = useEcosystemStats();

  if (isLoading || !data) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-6 space-y-5 pb-24">
      <Helmet>
        <title>The ZenSolar Economy — Live Network Stats</title>
        <meta
          name="description"
          content="Live state of the ZenSolar economy: subscribers, kWh minted, liquidity pool depth, supply, and your stake in the network."
        />
        <link rel="canonical" href="https://beta.zen.solar/ecosystem" />
      </Helmet>

      <Hero price={data.spotPrice || PRICES.launchFloor} kwh={data.lifetimeKwh} />

      <FlywheelGauge
        state={data.flywheelState}
        monthMints={data.monthMints}
        subscribers={data.subscribers}
      />

      <div className="grid grid-cols-2 gap-3">
        <Kpi
          icon={Users}
          label="Subscribers"
          value={<CountNum value={data.subscribers} />}
          sub={`${data.activeSubscriptions} active`}
          delay={0.15}
          accent="violet"
        />
        <Kpi
          icon={Zap}
          label="kWh Minted"
          value={<CountNum value={data.lifetimeKwh} decimals={0} />}
          sub="lifetime, verified"
          delay={0.2}
          accent="emerald"
        />
        <Kpi
          icon={Coins}
          label="Tokens Minted"
          value={formatTokenAmount(data.lifetimeTokensMinted)}
          sub={`${formatTokenAmount(data.monthTokensMinted)} / 30d`}
          delay={0.25}
          accent="amber"
        />
        <Kpi
          icon={ImageIcon}
          label="NFTs Minted"
          value={<CountNum value={data.nftCount} />}
          sub="proof badges"
          delay={0.3}
          accent="sky"
        />
      </div>

      <LpCard
        usdc={data.lpUsdc}
        tokens={data.lpTokens}
        monthFromSubs={data.monthLpFromSubs}
        monthFromMints={data.monthLpFromMintsUsd}
      />

      <SupplyBar
        circulating={data.circulating}
        founderLocked={data.founderLocked}
        treasuryLocked={data.treasuryLocked}
        teamLocked={data.teamLocked}
        burned={data.tokensBurned}
        lockedPct={data.lockedOrBurnedPct}
        monthBurned={data.monthBurned}
      />

      <GrowthChart series={data.growth} />

      <MintsTicker mints={data.recentMints} />

      <StakeSnapshot
        tokens={data.myTokens}
        kwh={data.myKwh}
        lpThisMonth={data.myMonthLpContribution}
        sharePct={data.myShareOfCirculating}
      />

      <div className="text-[10px] text-center text-muted-foreground/70 py-2">
        Live from on-chain mints + subscription records. Updated{" "}
        {new Date(data.snapshotAt).toLocaleTimeString()}.
      </div>
    </div>
  );
}
