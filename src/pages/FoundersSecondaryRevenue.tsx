import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Lock,
  Database,
  Brain,
  Zap,
  Megaphone,
  ShoppingBag,
  Leaf,
  Sparkles,
} from "lucide-react";

/**
 * Secondary Revenue Streams — single source of truth.
 *
 * Linked from both /founders/seed-pitch-greg and /founders/lyndon-pitch-v2.
 * Order locked per Joseph (2026-05-18): patent → data → Deason → VPP →
 * OEM ads → $ZSOLAR store → REC/carbon.
 */

const STREAMS = [
  {
    n: "01",
    icon: Lock,
    title: "Patent Licensing (The Qualcomm Play)",
    tagline: "Per-kWh royalties from every competitor who tokenizes energy.",
    body: "Composition-of-matter + method patent on Proof-of-Delta + Proof-of-Origin, filed across 9 jurisdictions. Once issued, every competitor (Helium, Daylight, Glow, future entrants) has two options: stop, or pay a per-kWh licensing fee. Zero marginal cost, no user acquisition required — same playbook as Qualcomm's CDMA moat.",
    tam: "$500M+ annual addressable by 2030",
    color: "text-amber-400",
    border: "border-amber-400/30",
    bg: "bg-amber-400/[0.05]",
  },
  {
    n: "02",
    icon: Database,
    title: "Energy Data Licensing",
    tagline: "Palantir-for-the-grid: anonymized kWh + device telemetry, sold.",
    body: "We're already ingesting verified production, consumption, and device-level telemetry from every connected user (Tesla, Enphase, SolarEdge, etc.). Aggregated and anonymized, this becomes a high-value dataset for utilities, ISOs, grid planners, REC registries, and climate researchers. Zero marginal cost since the data already powers minting.",
    tam: "$2B+ utility analytics market",
    color: "text-sky-400",
    border: "border-sky-400/30",
    bg: "bg-sky-400/[0.05]",
  },
  {
    n: "03",
    icon: Brain,
    title: "Deason AI Home Energy Optimizer",
    tagline: "$4.99/mo add-on · $19.99 one-shot bill audit · $49.99 Power tier includes it.",
    body: "AI agent that analyzes bills, optimizes rate plans, and gives device-aware advice. Weekly + monthly energy reports (Gemini 2.5 Pro on premium). Phase 2 expands to Tesla FSD / autonomous-mile tokenization (10 miles = 1 $ZSOLAR). Primary upgrade incentive into the Power tier.",
    tam: "$50M+ ARR at 1M subs (15% attach)",
    color: "text-eco",
    border: "border-eco/30",
    bg: "bg-eco/[0.05]",
  },
  {
    n: "04",
    icon: Zap,
    title: "VPP Dispatch Revenue Share",
    tagline: "15% of gross dispatch revenue per event · real-time settlement.",
    body: "When users export to the grid during demand events, ZenSolar (as the aggregator) keeps 15% of gross dispatch revenue. Users get 30% as monthly cash + 5% as real-time tokens; 50% feeds the LP. Patent claim covers the OpenADR-class signal + verified discharge + on-chain settlement link. Launch market: California via Leap Energy white-label.",
    tam: "$1.6B U.S. VPP market by 2028",
    color: "text-orange-400",
    border: "border-orange-400/30",
    bg: "bg-orange-400/[0.05]",
  },
  {
    n: "05",
    icon: Megaphone,
    title: "OEM Advertising & Sponsored Placements",
    tagline: "Tesla / Enphase / SolarEdge pay to be the default.",
    body: "Sponsored device tiles in onboarding (\"Connect your Enphase\"), featured NFT drops, co-branded mint events, and priority placement in the device-mix recommendation engine. OEMs already spend heavily on installer-channel marketing — we're a higher-intent surface at the homeowner level.",
    tam: "$10M+ ARR at 250K connected users",
    color: "text-rose-400",
    border: "border-rose-400/30",
    bg: "bg-rose-400/[0.05]",
  },
  {
    n: "06",
    icon: ShoppingBag,
    title: "$ZSOLAR Store / Token-Utility Marketplace",
    tagline: "Solar gear, EV accessories, carbon offsets, merch — priced in $ZSOLAR.",
    body: "Marketplace where holders spend $ZSOLAR on physical and digital goods. ZenSolar takes a 5–10% transaction fee. Doubles as a token sink — every purchase removes circulating supply, reinforcing the floor. Categories: solar/battery accessories, EV chargers, carbon offsets, ZenSolar merch, partner discounts.",
    tam: "Revenue + deflationary sink",
    color: "text-violet-400",
    border: "border-violet-400/30",
    bg: "bg-violet-400/[0.05]",
  },
  {
    n: "07",
    icon: Leaf,
    title: "REC & Carbon Credit Brokerage",
    tagline: "Bundle verified kWh into RECs, broker on behalf of users, take 15–20%.",
    body: "We already compute verified kWh + CO₂ offset per user — the same data REC registries (M-RETS, WREGIS, PJM-GATS) require for certificate issuance. Bundle user production into wholesale REC lots, sell to corporates with renewable-energy mandates, take a brokerage fee. Same data feeds voluntary carbon credit issuance.",
    tam: "$10B+ U.S. REC market",
    color: "text-emerald-400",
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/[0.05]",
  },
];

const APPENDIX = [
  "White-label / API licensing to utilities and installers (Sunrun, SunPower) — $50K–$500K/yr per partner",
  "Premium fleet analytics for installers and EPCs — $99–$499/mo per installer",
  "Lead-gen referral fees from Deason recommendations (rate-plan switches, battery adds, EV charger installs)",
  "Insurance partnerships — verified production + battery health as an underwriting signal (Lemonade, Tesla Insurance)",
  "Treasury USDC yield via Aave / Morpho on Base — passive compounding of the 2% treasury allocation",
];

export default function FoundersSecondaryRevenue() {
  return (
    <div className="min-h-[100svh] bg-background text-foreground pb-safe">
      <Helmet>
        <title>Secondary Revenue Streams · ZenSolar Founders</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 pb-16"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/founders"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Founders Vault
          </Link>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Link to="/founders/seed-pitch-greg" className="hover:text-primary">Greg deck</Link>
            <span>·</span>
            <Link to="/investor/pitch" className="hover:text-primary">Investor Pitch v2</Link>
          </div>
        </div>

        {/* Header */}
        <header className="mb-10 border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 text-eco text-xs uppercase tracking-widest mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Secondary Revenue · Beyond Subscription
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Seven Future Revenue Streams.<br />
            <span className="text-eco">Same Users. Same Data. Same Patent.</span>
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Subscription + LP injection is the core engine. These seven additional streams
            unlock progressively as we scale — each one compounds on data and users we're
            already paying to acquire. None require a new product category.
          </p>
        </header>

        {/* Streams */}
        <section className="space-y-4 mb-10">
          {STREAMS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className={`rounded-xl border ${s.border} ${s.bg} p-5 sm:p-6`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-3xl font-black font-mono ${s.color} opacity-60 flex-shrink-0 w-12`}>
                    {s.n}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={`h-4 w-4 ${s.color}`} />
                      <h3 className="text-base sm:text-lg font-semibold text-foreground">
                        {s.title}
                      </h3>
                    </div>
                    <p className={`text-sm font-medium ${s.color} mb-3`}>{s.tagline}</p>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      {s.body}
                    </p>
                    <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground border border-border/60 rounded-md px-2 py-1 bg-background/40">
                      <span className="font-semibold text-foreground/70">TAM:</span>
                      <span>{s.tam}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Appendix */}
        <section className="rounded-xl border border-border bg-card/40 p-5 sm:p-6 mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Appendix · Additional streams not in the headline seven
          </h2>
          <ul className="space-y-2">
            {APPENDIX.map((item) => (
              <li key={item} className="text-sm text-foreground/80 leading-relaxed pl-4 relative">
                <span className="absolute left-0 top-2 h-1 w-1 rounded-full bg-muted-foreground" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Closer */}
        <section className="rounded-xl border border-eco/40 bg-gradient-to-br from-eco/[0.08] to-primary/[0.05] p-6">
          <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
            The subscription engine funds the company. The patent funds the moat. These seven
            streams turn ZenSolar from a SaaS into a <span className="text-eco font-semibold">platform
            with seven independent monetization surfaces</span> — most of which competitors
            can't replicate without first paying us a licensing fee.
          </p>
        </section>

        <footer className="mt-10 pt-6 border-t border-border/60 text-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            ZenSolar · Confidential · Founders Only · Single source of truth for both decks
          </p>
        </footer>
      </div>
    </div>
  );
}
