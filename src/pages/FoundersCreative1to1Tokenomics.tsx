import { Navigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsFounder } from "@/hooks/useIsFounder";
import { isPreviewMode } from "@/lib/previewMode";

interface Rule {
  n: number;
  title: string;
  tldr: string;
  ux: string;
  pro: string;
  con: string;
}

const RULES: Rule[] = [
  {
    n: 1,
    title: "12-month linear vesting on all mints",
    tldr: "New tokens unlock daily over 12 months (1/365 per day).",
    ux: "“You earned 1,000 tokens. 83 unlocked today, the rest vest over 12 months.”",
    pro: "Kills immediate sell pressure.",
    con: "Users wait for full liquidity.",
  },
  {
    n: 2,
    title: "Staking: LP fees + revenue + mint multiplier",
    tldr: "Stake to earn LP fees, a slice of subscription revenue, and bigger future mints.",
    ux: "“Stake your tokens to earn rewards and higher future mints.”",
    pro: "Rewards long-term holders with real yield.",
    con: "Extra step for users.",
  },
  {
    n: 3,
    title: "2–4% early sell tax (decreasing)",
    tldr: "Selling in year 1 is taxed. 50% burned, 50% to LP. Tax decays over time.",
    ux: "“Selling now incurs a 3% tax (50% burned, 50% to LP).”",
    pro: "Discourages flipping, adds deflation + liquidity.",
    con: "Can feel punitive.",
  },
  {
    n: 4,
    title: "Protocol revenue share to stakers",
    tldr: "Slice of treasury subscription revenue paid to stakers in USDC or $ZSOLAR.",
    ux: "“Stake to earn a share of subscription revenue.”",
    pro: "Real yield, strong stake incentive.",
    con: "Reduces treasury runway.",
  },
  {
    n: 5,
    title: "Producer Score loyalty multiplier",
    tldr: "3+ consecutive months of production = permanent 1.05×–1.20× mint multiplier.",
    ux: "“Your Producer Score is 1.15× — you’ll earn 15% more next month.”",
    pro: "Rewards consistent real producers.",
    con: "Slightly more state to track.",
  },
  {
    n: 6,
    title: "25% monthly sell cap",
    tldr: "Max 25% of unlocked holdings sellable in any 30-day window.",
    ux: "“You can sell up to 25% of your unlocked tokens this month.”",
    pro: "Hard ceiling on sell pressure.",
    con: "Frustrating during big price moves.",
  },
  {
    n: 7,
    title: "Tiered vesting by subscription tier",
    tldr: "Base = 12mo, Regular = 9mo, Power = 6mo + bonuses.",
    ux: "“You’re on Power tier — your tokens unlock faster.”",
    pro: "Rewards paying subscribers.",
    con: "Adds tier complexity.",
  },
  {
    n: 8,
    title: "Hold-to-Earn auto-multiplier",
    tldr: "Unlocked tokens held 30+ days earn a permanent mint multiplier.",
    ux: "“Your tokens earn a 1.3× multiplier — held for 4 months.”",
    pro: "Passive incentive to hold.",
    con: "Requires per-wallet tracking.",
  },
  {
    n: 9,
    title: "Redemption-First Rule",
    tldr: "Sells route through the $ZSOLAR Store first with bonus discounts before USDC payout.",
    ux: "“You have $87 in store credit — redeem first for 15% bonus?”",
    pro: "Keeps tokens in the ecosystem.",
    con: "Adds a step before selling.",
  },
];

export default function FoundersCreative1to1Tokenomics() {
  const { user, isLoading } = useAuth();
  const { isFounder, ready } = useIsFounder();
  const preview = isPreviewMode();

  if (!preview && (isLoading || !ready)) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!preview && !user) return <Navigate to="/auth" replace />;
  if (!preview && !isFounder) return <Navigate to="/" replace />;

  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/92 pt-safe backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/founders" className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Vault
          </Link>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400">
            <Lock className="h-3 w-3" /> Founders Only
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-5 pt-10 pb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary mb-3 inline-flex items-center gap-2">
          <Lightbulb className="h-3 w-3" /> 1:1 Tokenomics · Internal
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl leading-tight tracking-tight">
          9 rules for a <span className="italic text-primary">true 1:1</span> kWh → $ZSOLAR mint
        </h1>
        <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
          Smart-contract levers that protect the 1:1 ratio while keeping the user-facing math dead simple.
        </p>
      </section>

      {/* Rules — compact list */}
      <section className="max-w-3xl mx-auto px-5 pb-12 space-y-3">
        {RULES.map((r) => (
          <article
            key={r.n}
            className="rounded-2xl border border-border/60 bg-card/40 p-4 md:p-5"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-mono text-muted-foreground tabular-nums shrink-0 w-5">
                {String(r.n).padStart(2, "0")}
              </span>
              <h2 className="text-base md:text-lg font-semibold leading-snug text-foreground">
                {r.title}
              </h2>
            </div>

            <p className="mt-2 ml-8 text-sm text-foreground/85 leading-relaxed">
              {r.tldr}
            </p>

            <div className="mt-3 ml-8 grid gap-1.5 text-[13px] leading-snug">
              <Row label="UX" value={r.ux} />
              <Row label="Pro" value={r.pro} tone="eco" />
              <Row label="Con" value={r.con} tone="muted" />
            </div>
          </article>
        ))}
      </section>

      <footer className="max-w-3xl mx-auto px-5 py-8 border-t border-border/40 text-[10px] uppercase tracking-widest text-muted-foreground text-center">
        ZenSolar · Founders · Confidential
      </footer>
    </div>
  );
}

function Row({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "eco" | "muted";
}) {
  const labelColor =
    tone === "eco"
      ? "text-eco"
      : tone === "muted"
      ? "text-muted-foreground"
      : "text-primary";
  return (
    <div className="flex gap-2">
      <span className={`shrink-0 w-8 text-[10px] uppercase tracking-wider font-semibold pt-0.5 ${labelColor}`}>
        {label}
      </span>
      <span className="text-foreground/80">{value}</span>
    </div>
  );
}
