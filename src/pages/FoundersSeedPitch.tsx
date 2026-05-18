import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";

/**
 * Seed Pitch URL — Greg Falesnik (MZ Group) review copy.
 *
 * Lives in-app at /founders/seed-pitch-greg so it can be shared with
 * Greg Falesnik (and any subsequent strategic eyeballs) without
 * passing around a PDF. Numbers below mirror Option B v2 FINAL;
 * a banner flags the pending v3.0 (1:1 / ~$10M) rescope.
 */

const ALLOCATION = [
  {
    bucket: "Team & Ops (24 mo)",
    amount: "$3.17M",
    pct: "63%",
    detail:
      "Joseph $250K Y1 / $275K Y2 · Michael + 2 eng + growth lead Y1 · +data/ML, support, designer Y2 · tools & contractors",
  },
  {
    bucket: "LP Reserve (2 tranches)",
    amount: "$700K",
    pct: "14%",
    detail:
      "OG launch tranche $200K USDC · Round 2 tranche $500K USDC · seeds Uniswap v3 LP at $0.25 → $0.50",
  },
  {
    bucket: "User Acquisition",
    amount: "$430K",
    pct: "9%",
    detail:
      "Targeted paid + creator-led referrals + Proof of Genesis viral loop → 25K paying subs by month 18",
  },
  {
    bucket: "Legal / Audits / Patents",
    amount: "$300K",
    pct: "6%",
    detail:
      "Smart contract audit, securities counsel, TM Stack patent prosecution (Tracks 1–3)",
  },
  {
    bucket: "Contingency",
    amount: "$400K",
    pct: "8%",
    detail:
      "Buffer for audit overruns, launch comms, OEM partnership pilots, FX",
  },
];

const LP_ROUNDS = [
  { round: "OG · Day 0", trigger: "Mainnet launch", usdc: "$200K", zen: "800K", source: "Seed", price: "$0.25" },
  { round: "Round 2", trigger: "25K paying subs OR $0.50 sustained", usdc: "$500K", zen: "1.0M", source: "Seed", price: "$0.50" },
  { round: "Round 3", trigger: "50K subs OR $1.00 sustained (~mo 18)", usdc: "$1.0M+", zen: "1.0M", source: "Subscription auto-inject", price: "$1.00+" },
  { round: "Round 4+", trigger: "Programmatic, every halving tier", usdc: "$2M+", zen: "Tier-set", source: "Self-funded", price: "Tier-priced" },
];

const MILESTONES = [
  { months: "0–3", milestone: "Mainnet launch · OG LP tranche live · audit complete", why: "Token is real, tradeable, audited" },
  { months: "3–9", milestone: "First 5K paying subs · OEM pilot signed (Tesla / SolarEdge / Enphase)", why: "Distribution proof — not just product" },
  { months: "9–15", milestone: "25K subs → Round 2 LP tranche fires", why: "Seed LP fully deployed; sub revenue compounding" },
  { months: "15–18", milestone: "50K subs → Round 3 LP funded by subscriptions", why: "Self-funded liquidity proven · default-alive" },
  { months: "18–24", milestone: "100K+ subs · multi-OEM live · Series A optional", why: "Raise on metrics — never on runway pressure" },
];

export default function FoundersSeedPitch() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/92 pt-safe backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" /> Vault
          </Link>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-amber-400">
            <Lock className="h-3 w-3" /> Founders Only
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 pt-10 pb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary mb-3 inline-flex items-center gap-2">
          <Sparkles className="h-3 w-3" /> Seed Allocation · v2 Final · Option B
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-tight">
          $5M Seed.{" "}
          <span className="italic text-primary">One check.</span>{" "}
          Twenty-four months of runway.
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
          $0.25 launch · 2 LP tranches pre-funded by seed · Round 3 onward funded
          entirely by subscription revenue. By month 18, ZenSolar is the rare
          crypto-energy company that doesn’t need another raise to keep its
          market deep.
        </p>
      </section>

      {/* v3.0 banner */}
      <section className="max-w-4xl mx-auto px-5 pb-6">
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 md:p-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-primary mb-2">
            Pending rescope · v3.0 · 2026-05-18
          </p>
          <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
            Numbers below reflect the prior 10:1 model. With the pivot back to{" "}
            <span className="font-semibold text-primary">1 kWh = 1 $ZSOLAR</span>{" "}
            (10× user issuance), the LP reserve and seed ask are being re-scoped
            toward <span className="font-semibold">~$10M</span> with a Hybrid
            vesting + stake-to-unlock sell-throttle. Final figures pending
            Tschida + Greg Falesnik review.
          </p>
        </div>
      </section>

      {/* Allocation */}
      <section className="max-w-4xl mx-auto px-5 pb-10">
        <h2 className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-3">
          The $5M Allocation
        </h2>
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-card/60 text-[10px] uppercase tracking-wider text-muted-foreground">
            <div className="col-span-4">Bucket</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1">%</div>
            <div className="col-span-5">What it buys</div>
          </div>
          {ALLOCATION.map((row) => (
            <div
              key={row.bucket}
              className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-3 px-4 py-4 border-t border-border/40 bg-card/30"
            >
              <div className="md:col-span-4 font-semibold text-foreground">{row.bucket}</div>
              <div className="md:col-span-2 text-primary font-mono text-sm">{row.amount}</div>
              <div className="md:col-span-1 text-muted-foreground font-mono text-sm">{row.pct}</div>
              <div className="md:col-span-5 text-sm text-foreground/80 leading-relaxed">{row.detail}</div>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-3 px-4 py-4 border-t border-border/40 bg-primary/5">
            <div className="md:col-span-4 font-bold">TOTAL</div>
            <div className="md:col-span-2 text-primary font-mono font-bold">$5.00M</div>
            <div className="md:col-span-1 text-muted-foreground font-mono">100%</div>
            <div className="md:col-span-5 text-sm text-foreground/80">
              24 months to default-alive — no UA cliff, no liquidity cliff, no salary cliff.
            </div>
          </div>
        </div>
      </section>

      {/* LP rounds */}
      <section className="max-w-4xl mx-auto px-5 pb-10">
        <h2 className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-2">
          LP Tranche Strategy — Why Only Two in Seed
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-3xl">
          Launch at $0.25 / $ZSOLAR in two tiers. Seed pre-funds the first two
          LP injections. By the time Round 3 fires, subscription revenue is
          already auto-injecting more USDC than Round 3 requires. The flywheel
          turns itself.
        </p>
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          {LP_ROUNDS.map((r, i) => (
            <div
              key={r.round}
              className={`grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3 px-4 py-3 text-sm ${
                i === 0 ? "" : "border-t border-border/40"
              } ${i % 2 ? "bg-card/30" : "bg-card/50"}`}
            >
              <div className="font-semibold text-primary md:col-span-1">{r.round}</div>
              <div className="md:col-span-2 text-foreground/80">{r.trigger}</div>
              <div className="font-mono text-foreground">{r.usdc}</div>
              <div className="font-mono text-muted-foreground">{r.zen} $ZSOLAR</div>
              <div className="text-foreground/70 text-[13px]">
                <div>{r.source}</div>
                <div className="text-primary font-mono">{r.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Option B + self-funding moment */}
      <section className="max-w-4xl mx-auto px-5 pb-10 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <h3 className="text-[11px] uppercase tracking-[0.24em] text-eco mb-3">Why Option B</h3>
          <ul className="space-y-2.5 text-sm text-foreground/85 leading-relaxed">
            <li>Cleanest pitch. $5M, not $6.5M — same headline Lyndon already knows.</li>
            <li>24-month runway, zero revenue assumed. $208K/mo burn fully loaded.</li>
            <li>Founder pay locked. Joseph $250K Y1 / $275K Y2; full team scales in Y2.</li>
            <li>Round 3 LP comes from subs. By month 18, $9.99/mo × 50K subs = $6M ARR with 50% auto-injecting to LP.</li>
            <li>UA trimmed to $430K. Proof of Genesis receipts do the viral work — every mint is a referral artifact.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <h3 className="text-[11px] uppercase tracking-[0.24em] text-primary mb-3">The Self-Funding Moment</h3>
          <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
            <p>
              <span className="text-muted-foreground">At 25K paying subs (Round 2 trigger):</span>
              <br />
              ARR = <span className="font-mono text-primary">$3.0M</span> · LP auto-inject = <span className="font-mono text-primary">$1.5M/yr</span>
            </p>
            <p>
              <span className="text-muted-foreground">At 50K paying subs (Round 3 trigger):</span>
              <br />
              ARR = <span className="font-mono text-primary">$6.0M</span> · LP auto-inject = <span className="font-mono text-primary">$3.0M/yr</span>
            </p>
            <p className="pt-2 border-t border-border/40 text-foreground/90">
              By month 18 the seed is spent — and subscription revenue is funding
              all future liquidity. Series A becomes a strategic option, not a
              survival event.
            </p>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="max-w-4xl mx-auto px-5 pb-10">
        <h2 className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-3">
          24-Month Milestone Path
        </h2>
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          {MILESTONES.map((m, i) => (
            <div
              key={m.months}
              className={`grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-3 px-4 py-3 ${
                i === 0 ? "" : "border-t border-border/40"
              } ${i % 2 ? "bg-card/30" : "bg-card/50"}`}
            >
              <div className="md:col-span-2 font-mono text-primary text-sm">{m.months}</div>
              <div className="md:col-span-6 text-sm text-foreground/90">{m.milestone}</div>
              <div className="md:col-span-4 text-sm text-muted-foreground italic">{m.why}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Closer */}
      <section className="max-w-4xl mx-auto px-5 pb-16">
        <blockquote className="rounded-2xl border-l-4 border-primary bg-card/40 p-6 md:p-8 text-base md:text-lg leading-relaxed text-foreground/90 italic">
          “$5M. One check. Twenty-four months of runway. Two LP tranches pre-funded.
          By month eighteen, our subscribers — not our investors — are funding every
          dollar of liquidity that follows. You write one check, ever.”
        </blockquote>
      </section>

      <footer className="max-w-4xl mx-auto px-5 py-8 border-t border-border/40 text-[10px] uppercase tracking-widest text-muted-foreground text-center">
        ZenSolar · Confidential · Founders Only · v2 Final · Option B
      </footer>
    </div>
  );
}
