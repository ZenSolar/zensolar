import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Lock, Sparkles } from "lucide-react";

/**
 * Seed Pitch URL — Greg Falesnik (MZ Group) review copy.
 *
 * v3.0 DRAFT — reflects the 2026-05-18 pivot back to 1 kWh = 1 $ZSOLAR
 * with a hybrid stake-to-unlock sell-throttle. Ask scaled from $5M → ~$10M
 * to absorb 10× user issuance with deeper LP and longer runway.
 *
 * Final figures pending Tschida + Greg Falesnik (MZ Group) review.
 * Numbers marked [DRAFT] are directional scalings, not committed.
 */

const ALLOCATION = [
  {
    bucket: "Team & Ops (24 mo)",
    amount: "$4.50M",
    pct: "45%",
      detail:
      "Joseph $300K Y1 / $300K Y2 · Michael + 3 eng + growth lead Y1 · +data/ML, support, designer, BD Y2 · tools & contractors trimmed to hold bucket flat",
  },
  {
    bucket: "LP Reserve (3 tranches)",
    amount: "$2.50M",
    pct: "25%",
    detail:
      "10× user issuance demands 10× LP depth. OG $500K · Round 2 $1.0M · Round 3 $1.0M USDC — seeds Uniswap v3 LP at $0.10 → $0.25 → $0.50",
  },
  {
    bucket: "User Acquisition",
    amount: "$1.20M",
    pct: "12%",
    detail:
      "Targeted paid + creator-led referrals + Proof of Genesis viral loop → 50K paying subs by month 18 (2× prior plan)",
  },
  {
    bucket: "Legal / Audits / Patents",
    amount: "$650K",
    pct: "6.5%",
    detail:
      "Smart contract + stake-to-unlock contract audits, securities counsel, TM Stack patent prosecution (Tracks 1–3)",
  },
  {
    bucket: "Energy Oracle R&D",
    amount: "$450K",
    pct: "4.5%",
    detail:
      "Per-user verified $/kWh on-chain — Phase 1 prototype, sets up Series A moat (Patent Track 2.5)",
  },
  {
    bucket: "Contingency",
    amount: "$700K",
    pct: "7%",
    detail:
      "Buffer for audit overruns, launch comms, OEM partnership pilots, FX, regulatory shifts",
  },
];

const LP_ROUNDS = [
  { round: "OG · Day 0", trigger: "Mainnet launch", usdc: "$500K", zen: "5.0M", source: "Seed", price: "$0.10" },
  { round: "Round 2", trigger: "25K paying subs OR $0.25 sustained", usdc: "$1.0M", zen: "4.0M", source: "Seed", price: "$0.25" },
  { round: "Round 3", trigger: "50K subs OR $0.50 sustained (~mo 15)", usdc: "$1.0M", zen: "2.0M", source: "Seed (final tranche)", price: "$0.50" },
  { round: "Round 4", trigger: "100K subs OR $1.00 sustained (~mo 18)", usdc: "$2.0M+", zen: "2.0M", source: "Subscription auto-inject", price: "$1.00" },
  { round: "Round 5+", trigger: "Programmatic, every halving tier", usdc: "Tier-set", zen: "Tier-set", source: "Self-funded", price: "Tier-priced" },
];

const MILESTONES = [
  { months: "0–3", milestone: "Mainnet launch · OG LP tranche live · audits complete (token + stake-to-unlock)", why: "Token real, tradeable, sell-throttle enforced on-chain" },
  { months: "3–9", milestone: "First 10K paying subs · OEM pilot signed (Tesla / SolarEdge / Enphase) · Oracle Phase 1 proto", why: "Distribution + verifiable kWh moat under construction" },
  { months: "9–15", milestone: "25K → 50K subs · Round 2 + Round 3 LP tranches fire", why: "Seed LP fully deployed; sub revenue compounding" },
  { months: "15–18", milestone: "100K subs → Round 4 LP funded by subscriptions, not seed", why: "Self-funded liquidity proven · default-alive" },
  { months: "18–24", milestone: "Multi-OEM live · Energy Oracle Phase 2 · Series A optional", why: "Raise on metrics + moat — never on runway pressure" },
];

export default function FoundersSeedPitch() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe">
      <Helmet>
        <title>Seed Pitch · Greg Falesnik (MZ Group) · ZenSolar Founders</title>
        <meta name="description" content="ZenSolar v3.0 seed pitch review copy for Greg Falesnik / MZ Group — $10M ask, 1:1 kWh, hybrid stake-to-unlock." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
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
            <Lock className="h-3 w-3" /> Founders Only · v3.0 DRAFT
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 pt-10 pb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-primary mb-3 inline-flex items-center gap-2">
          <Sparkles className="h-3 w-3" /> Seed Allocation · v3.0 Draft · 1:1 kWh Rescope
        </p>
        <h1 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-tight">
          $10M Seed.{" "}
          <span className="italic text-primary">One check.</span>{" "}
          1 kWh = 1 $ZSOLAR. Hybrid stake-to-unlock.
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
          $0.10 launch · 3 LP tranches pre-funded by seed · 10× user issuance
          absorbed by an on-chain stake-to-unlock sell-throttle. Round 4 onward
          funded entirely by subscription revenue. By month 18, ZenSolar is the
          rare crypto-energy company with a real-world utility floor — not just
          a chart.
        </p>
      </section>

      {/* Story / Vision — adapted from Lyndon v8 one-pager, updated to v3.0 */}
      <section className="max-w-4xl mx-auto px-5 pb-10">
        <div className="rounded-2xl border border-border/60 bg-card/30 p-5 md:p-7 space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-destructive mb-2">
              The Catalyst · Why Now
            </p>
            <h3 className="font-serif text-xl md:text-2xl leading-tight mb-2">
              $40B in clean energy incentives — repealed.
            </h3>
            <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
              The <span className="font-semibold">30% Solar ITC</span> and{" "}
              <span className="font-semibold">$7,500 federal EV credit</span> are
              being eliminated. State net-metering is rolling back. 50M+ American
              households just lost the financial reason to go — or stay — green.{" "}
              <span className="text-primary font-semibold">
                ZenSolar replaces a one-time government check with a permanent,
                market-backed reward per kWh
              </span>{" "}
              — paid forever, in $ZSOLAR. The SolarCity playbook, evolved for
              the tokenization era.
            </p>
          </div>

          <div className="pt-2 border-t border-border/40">
            <p className="text-[10px] uppercase tracking-[0.24em] text-eco mb-2">
              The Opportunity
            </p>
            <h3 className="font-serif text-xl md:text-2xl leading-tight mb-2">
              The energy economy is the next $10T shift.
            </h3>
            <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
              Tesla, solar and EVs scale faster than the grid can settle. Yet a
              kilowatt-hour still has no native asset.{" "}
              <span className="text-primary font-semibold">
                $10T+ market. No native asset — until now.
              </span>{" "}
              We're the rails before the rails exist.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-eco mb-2">
              The Compounding Flywheel
            </p>
            <h3 className="font-serif text-xl md:text-2xl leading-tight mb-2">
              Every kWh tightens the loop.
            </h3>
            <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
              Produce or consume clean energy → Proof-of-Genesis™ verifies →
              mint <span className="font-mono text-primary">1 kWh = 1 $ZSOLAR</span>.
              20% of every mint is permanently burned. 3% auto-seeds the LP.
              Halving every 4 years. Stake-to-unlock caps how much of a user's
              minted balance can hit the market at once — bounded sell pressure,
              compounding scarcity.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-eco mb-2">
              The Product
            </p>
            <h3 className="font-serif text-xl md:text-2xl leading-tight mb-2">
              One tap. Real tokens. Zero crypto friction.
            </h3>
            <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
              Connect Tesla, solar, battery, EV — done. Embedded Coinbase
              Wallet, mobile-first, Apple-grade simplicity. Live on Base L2.{" "}
              <span className="font-semibold">Proof-of-Genesis™</span> is the
              cryptographic trust layer no competitor can replicate without
              years of utility data.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/40">
            <div>
              <div className="font-mono text-primary text-lg">1T</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hard cap</div>
            </div>
            <div>
              <div className="font-mono text-primary text-lg">1 : 1</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">kWh per token</div>
            </div>
            <div>
              <div className="font-mono text-primary text-lg">$0.10</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Launch price</div>
            </div>
            <div>
              <div className="font-mono text-primary text-lg">75 / 20 / 3 / 2</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">User · Burn · LP · Treasury</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">
            Founders pact-locked: Joseph 150B until $6.67 · Michael 50B until $20.
          </p>

          <div className="pt-2 border-t border-border/40">
            <p className="text-[10px] uppercase tracking-[0.24em] text-eco mb-2">
              Vision & Traction
            </p>
            <h3 className="font-serif text-xl md:text-2xl leading-tight mb-2">
              A 100–200 year energy company.
            </h3>
            <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
              Live beta. Real users. Real mints. Tesla, SolarEdge, Wallbox
              connected. Patent-pending Proof of Genesis.{" "}
              <span className="text-primary font-semibold">
                Energy Price Oracle = Series A moat.
              </span>{" "}
              Built to outlast every grid we touch.
            </p>
          </div>
        </div>
      </section>

      {/* Review banner */}
      <section className="max-w-4xl mx-auto px-5 pb-6">
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 md:p-5">
          <p className="text-[10px] uppercase tracking-[0.24em] text-amber-400 mb-2">
            For Greg Falesnik review · v3.0 Draft · 2026-05-18
          </p>
          <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
            Rescoped from $5M / 10:1 to{" "}
            <span className="font-semibold text-primary">$10M / 1:1</span> to absorb
            10× user token issuance with deeper LP and a{" "}
            <span className="font-semibold">hybrid stake-to-unlock</span> sell-throttle
            (current preferred lever — full menu lives on the 1:1 Levers page).
            Allocation %s and LP tranche sizing are directional pending Greg's
            feedback on ask size, dilution targets, and milestone pacing.
          </p>
        </div>
      </section>

      {/* Allocation */}
      <section className="max-w-4xl mx-auto px-5 pb-10">
        <h2 className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-3">
          The $10M Allocation · Draft
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
            <div className="md:col-span-2 text-primary font-mono font-bold">$10.00M</div>
            <div className="md:col-span-1 text-muted-foreground font-mono">100%</div>
            <div className="md:col-span-5 text-sm text-foreground/80">
              24 months to default-alive — deeper LP, Oracle moat funded, no UA cliff, no salary cliff.
            </div>
          </div>
        </div>
      </section>

      {/* LP rounds */}
      <section className="max-w-4xl mx-auto px-5 pb-10">
        <h2 className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-2">
          LP Tranche Strategy — Three in Seed, Self-Funded After
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-3xl">
          Launch at $0.10 / $ZSOLAR. Seed pre-funds the first three LP injections
          to absorb 10× user issuance. By Round 4, subscription revenue is
          auto-injecting more USDC than required. The stake-to-unlock throttle
          keeps sell pressure bounded while the flywheel matures.
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

      {/* Why v3.0 + self-funding moment */}
      <section className="max-w-4xl mx-auto px-5 pb-10 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
          <h3 className="text-[11px] uppercase tracking-[0.24em] text-eco mb-3">Why 1:1 + Stake-to-Unlock</h3>
          <ul className="space-y-2.5 text-sm text-foreground/85 leading-relaxed">
            <li>1 kWh = 1 $ZSOLAR is the cleanest narrative crypto-energy has ever had — no division, no abstraction.</li>
            <li>Stake-to-unlock caps the % of minted tokens a user can sell at once → bounded sell pressure without forced lockups.</li>
            <li>10× user issuance is offset by 10× LP depth + the throttle. Float grows with conviction, not panic.</li>
            <li>Founders pact-locked: Joseph 150B · Michael 50B. $1T crossovers at $6.67 / $20.</li>
            <li>Energy Oracle R&D funded in seed → Series A moat that competitors can't replicate without years of utility data.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <h3 className="text-[11px] uppercase tracking-[0.24em] text-primary mb-3">The Self-Funding Moment</h3>
          <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
            <p>
              <span className="text-muted-foreground">At 50K paying subs (Round 3 trigger):</span>
              <br />
              ARR = <span className="font-mono text-primary">$6.0M</span> · LP auto-inject = <span className="font-mono text-primary">$3.0M/yr</span>
            </p>
            <p>
              <span className="text-muted-foreground">At 100K paying subs (Round 4 trigger):</span>
              <br />
              ARR = <span className="font-mono text-primary">$12.0M</span> · LP auto-inject = <span className="font-mono text-primary">$6.0M/yr</span>
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

      {/* Open questions for Greg */}
      <section className="max-w-4xl mx-auto px-5 pb-10">
        <div className="rounded-2xl border border-border/60 bg-card/30 p-5">
          <h3 className="text-[11px] uppercase tracking-[0.24em] text-amber-400 mb-3">Open Questions for Greg</h3>
          <ul className="space-y-2 text-sm text-foreground/85 leading-relaxed list-disc pl-5">
            <li>Is $10M the right ask, or do market conditions push us to $7.5M / $12.5M?</li>
            <li>Does the stake-to-unlock throttle hold up to institutional scrutiny, or do we need a hard vesting layer on top?</li>
            <li>LP tranche cadence — three in seed feels right; is the $0.10 → $0.50 price ladder defensible?</li>
            <li>Energy Oracle R&D in seed vs deferring to Series A — moat now, or runway now?</li>
          </ul>
        </div>
      </section>

      {/* Closer */}
      <section className="max-w-4xl mx-auto px-5 pb-16">
        <blockquote className="rounded-2xl border-l-4 border-primary bg-card/40 p-6 md:p-8 text-base md:text-lg leading-relaxed text-foreground/90 italic">
          “$10M. One check. 1 kWh = 1 $ZSOLAR — the cleanest narrative in
          crypto-energy. Stake-to-unlock keeps sell pressure bounded; three
          LP tranches absorb the float; by month eighteen, our subscribers —
          not our investors — are funding every dollar of liquidity that
          follows.”
        </blockquote>
      </section>

      <footer className="max-w-4xl mx-auto px-5 py-8 border-t border-border/40 text-[10px] uppercase tracking-widest text-muted-foreground text-center">
        ZenSolar · Confidential · Founders Only · v3.0 DRAFT · For Greg Falesnik Review
      </footer>
    </div>
  );
}
