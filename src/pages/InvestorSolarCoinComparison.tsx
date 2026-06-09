import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Smartphone,
  Layers,
  Repeat,
  Trophy,
} from 'lucide-react';

const ADVANTAGES = [
  {
    icon: ShieldCheck,
    title: 'Proof-of-Genesis™ Verification',
    body: 'Patent-pending cryptographic verification of real hardware telemetry — a generational leap beyond SolarCoin\'s Proof-of-Stake-Time honor-system uploads.',
  },
  {
    icon: Smartphone,
    title: 'Embedded Wallet + Tap-to-Mint™',
    body: 'Coinbase Smart Wallet baked into the app. No MetaMask, no seed phrases, no external wallet detours. One tap, mint in seconds.',
  },
  {
    icon: Layers,
    title: 'Multi-Vertical TAM',
    body: 'Solar generation, battery discharge, EV charging kWh, miles driven, and FSD miles — far beyond solar-only rewards.',
  },
  {
    icon: Repeat,
    title: '100% Subscription → LP Flywheel',
    body: 'Every subscription dollar recycles directly into the liquidity pool, compounding token strength as users grow.',
  },
];

interface Row {
  label: string;
  zen: string;
  solar: string;
}

interface Table {
  title: string;
  rows: Row[];
}

const TABLES: Table[] = [
  {
    title: 'Blockchain & Technical History',
    rows: [
      { label: 'Network', zen: 'Base L2 (Coinbase) — modern, low-fee', solar: 'Originally Bitcoin sidechain; 2026 relaunch on Base L2' },
      { label: 'Launched', zen: '2026 — purpose-built for the clean-energy era', solar: '2014 — 12 years of stagnation' },
      { label: 'Architecture', zen: 'Proof-of-Genesis™ + Proof-of-Delta™', solar: 'Proof-of-Stake-Time (PoST)' },
      { label: 'Verification', zen: 'Live OEM telemetry + cryptographic anchors', solar: 'Honor-system upload of solar production reports' },
    ],
  },
  {
    title: 'User Experience & Friction',
    rows: [
      { label: 'Dedicated app', zen: 'iOS, Android, and PWA', solar: 'None — web forms only' },
      { label: 'Wallet', zen: 'Embedded Coinbase Smart Wallet', solar: 'External wallet (MetaMask, etc.) required' },
      { label: 'Minting', zen: 'One-tap, in-app, instant feedback', solar: 'Manual production claim submission' },
      { label: 'Onboarding', zen: 'OAuth → connect OEM → mint in minutes', solar: 'Multi-step external account flow' },
    ],
  },
  {
    title: 'Reward Scope & TAM',
    rows: [
      { label: 'Solar generation', zen: 'Yes — verified per kWh', solar: 'Yes' },
      { label: 'Battery discharge', zen: 'Yes — Powerwall, Enphase, others', solar: 'No' },
      { label: 'EV charging kWh', zen: 'Yes — Wallbox, Tesla, etc.', solar: 'No' },
      { label: 'Miles driven (EV)', zen: 'Yes — Tesla + Smartcar fleet', solar: 'No' },
      { label: 'FSD miles', zen: 'Yes — autonomous mileage incentive', solar: 'No' },
    ],
  },
  {
    title: 'NFT Minting Strategy & Milestones',
    rows: [
      { label: 'NFT program', zen: 'Tiered milestone NFTs across solar, battery, EV, charging, combo', solar: 'None' },
      { label: 'Collectibility', zen: 'Verifiable on-chain milestones tied to real energy events', solar: 'N/A' },
      { label: 'User retention', zen: 'Gamified status drives habitual engagement', solar: 'No retention layer' },
    ],
  },
  {
    title: 'IP & Patents',
    rows: [
      { label: 'Core patent', zen: 'U.S. Patent Application No. 19/634,402 (Proof-of-Genesis™)', solar: 'None on record' },
      { label: 'Verification IP', zen: 'Proof-of-Delta™ cryptographic stack — patent-pending', solar: 'None' },
      { label: 'Defensibility', zen: 'Process + architecture protected', solar: 'No moat' },
    ],
  },
  {
    title: 'Tokenomics & Flywheel',
    rows: [
      { label: 'Supply cap', zen: '1T hard cap — disciplined scarcity', solar: 'Inflationary, weak emission discipline' },
      { label: 'Burn mechanism', zen: '20% burn per mint event', solar: 'None' },
      { label: 'LP funding', zen: '100% of subscription fees recycle into LP', solar: 'No subscription model, no LP funding loop' },
      { label: 'Launch model', zen: 'Tranche-seeded LP rounds at $0.10', solar: 'Fragile market depth; minimal daily volume' },
    ],
  },
  {
    title: 'Ecosystem Reach',
    rows: [
      { label: 'OEM integrations', zen: 'Tesla, Enphase, SolarEdge, Wallbox — unified app', solar: 'SolarEdge, Enphase, SMA — web portal, solar-only' },
      { label: 'Installer channel', zen: 'Palmetto API integration for installer-led onboarding', solar: 'None' },
      { label: 'Multi-OEM advantage', zen: 'Solar + battery + EV charging + miles in one UI', solar: 'Solar generation only' },
    ],
  },
  {
    title: 'Organization & Revenue Model',
    rows: [
      { label: 'Entity type', zen: 'Venture-backed for-profit company built to scale', solar: 'Non-profit foundation (SolarCoin Foundation, est. 2014)' },
      { label: 'Team', zen: 'Full-time founders + operating team with equity upside', solar: 'Volunteer-run — self-described "dedicated volunteers, 12 years of service"' },
      { label: 'Revenue model', zen: 'Recurring subscriptions, data aggregation, planned VPP settlement, LP economics', solar: 'No commercial revenue model — foundation/donation dependent' },
      { label: 'Growth capital', zen: 'Institutional seed round funding aggressive go-to-market', solar: 'No fundraising mechanism; no growth budget' },
      { label: 'Accountability', zen: 'Cap table, milestones, board oversight', solar: 'Foundation governance, no commercial pressure to ship product' },
    ],
  },
  {
    title: 'Additional Revenue Streams',
    rows: [
      { label: 'Subscription revenue', zen: 'Tiered monthly subscription engine', solar: 'None — non-profit, no paid product' },
      { label: 'Data aggregation', zen: 'Aggregated multi-OEM telemetry — high-margin upside at scale', solar: 'None' },
      { label: 'VPP program', zen: 'Planned virtual power plant settlement layer', solar: 'None' },
    ],
  },
];

const CONCLUSION = [
  'Verifiable energy events at planetary scale via Proof-of-Genesis™ — not honor-system uploads.',
  'Embedded wallet + dedicated app removes the friction that has capped SolarCoin\'s adoption for a decade.',
  'Multi-vertical rewards (solar, battery, EV kWh, miles, FSD) expand TAM by orders of magnitude.',
  'Patent-pending IP creates a real moat where SolarCoin has none.',
  'A 100% subscription-to-LP flywheel, 1T cap, 20% burn, and planned VPP + data revenue position $ZSOLAR to credibly aim for the top tier of cryptocurrencies.',
];

export default function InvestorSolarCoinComparison() {
  return (
    <>
      <Helmet>
        <title>ZenSolar vs SolarCoin — The Next Generation of Clean Energy Tokenization</title>
        <meta
          name="description"
          content="Why ZenSolar is the fundamentally superior clean-energy tokenization platform: Proof-of-Genesis™ verification, embedded wallet, multi-vertical TAM, and a 100% subscription-to-LP flywheel."
        />
        <link rel="canonical" href="https://www.zensolar.com/investor/solarcoin-comparison" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-3xl px-5 pt-10 pb-24 md:pt-16 md:pb-32">
          <Link
            to="/investor"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Investor Hub
          </Link>

          {/* Header / Executive Summary */}
          <header className="mt-8 mb-14">
            <div className="text-[11px] uppercase tracking-[0.28em] text-secondary/90 mb-4">
              Competitive Analysis
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight break-words">
              ZenSolar vs SolarCoin: The Next Generation of Clean Energy Tokenization
            </h1>
            <div className="mt-8 space-y-5 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>
                SolarCoin launched in 2014 as a <span className="text-foreground font-medium">non-profit foundation</span> with an early vision to reward solar energy production. Twelve years later, the SolarCoin Foundation is still run by volunteers, has no commercial revenue model, no dedicated app, no embedded wallet, and remains solar-only on a basic Proof-of-Stake-Time (PoST) protocol — a structure that has delivered minimal adoption and minimal token liquidity.
              </p>
              <p>
                <span className="text-foreground font-medium">ZenSolar is the fundamentally superior platform built for the clean energy transition.</span> Powered by our patent-pending Proof-of-Genesis™ architecture (U.S. Patent Application No. 19/634,402), ZenSolar uses real-time hardware telemetry and cryptographic verification (Proof-of-Delta™) to create verifiable, on-chain clean energy events at global scale — a clear leap beyond SolarCoin's Proof-of-Stake-Time approach.
              </p>
              <p>
                With an embedded Coinbase Smart Wallet, one-tap minting, live multi-OEM monitoring, Deason AI, NFT milestones, Palmetto API integration for installers, and a 100% subscription-to-LP flywheel, ZenSolar dramatically reduces user friction while expanding the rewardable behaviors far beyond solar alone (battery discharge, EV charging kWh, miles driven, and FSD miles).
              </p>
              <p>
                The opportunity is enormous. With strong execution, ZenSolar can acquire millions of users across the exploding EV and clean energy markets, generate substantial recurring revenue through subscriptions, data aggregation, and a planned VPP program, and realistically position $ZSOLAR among the top 5–10 cryptocurrencies by delivering real, verifiable utility at planetary scale.
              </p>
            </div>
          </header>

          {/* Volunteer-Powered Non-Profit Callout */}
          <div className="mt-10 rounded-2xl border border-secondary/30 bg-secondary/10 p-6 backdrop-blur-sm">
            <h2 className="text-base md:text-lg font-semibold tracking-tight text-foreground mb-3 leading-tight">
              The volunteer-powered limitation
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                SolarCoin is operated by the SolarCoin Foundation, a non-profit run entirely by volunteers with no commercial revenue model, no paid product, and no dedicated growth budget. This structure creates three structural constraints that are difficult to overcome:
              </p>
              <ul className="space-y-2 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-medium flex-shrink-0">Sustainability —</span>
                  <span>Reliance on volunteer labor and donations means roadmap progress is unpredictable. There is no recurring revenue engine to fund ongoing development, security audits, or infrastructure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-medium flex-shrink-0">Incentives —</span>
                  <span>Without equity, full-time compensation, or commercial upside, attracting and retaining top-tier engineering, design, and go-to-market talent is structurally limited.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary font-medium flex-shrink-0">Scalability —</span>
                  <span>Absence of growth capital and commercial accountability means no aggressive installer partnerships, no OEM co-marketing, no user acquisition budget, and no rapid feature velocity.</span>
                </li>
              </ul>
              <p className="text-foreground font-medium pt-1">
                The result is a protocol that has remained essentially unchanged for over a decade, with minimal daily volume, no mobile product, and no path to mainstream adoption.
              </p>
            </div>
          </div>

          {/* Strategic Advantages */}
          <section className="mt-16 md:mt-20">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-6 leading-tight">
              At-a-glance strategic advantages
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ADVANTAGES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm"
                >
                  <Icon className="h-5 w-5 text-secondary mb-3" />
                  <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Detailed Comparison Tables */}
          <section className="mt-16 md:mt-20">
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2 leading-tight">
              Detailed comparison
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Side-by-side breakdown across every meaningful dimension.
            </p>

            <div className="space-y-10">
              {TABLES.map((table) => (
                <div key={table.title}>
                  <h3 className="text-base md:text-lg font-semibold tracking-tight mb-4 text-foreground break-words leading-tight">
                    {table.title}
                  </h3>
                  <div className="rounded-2xl border border-border/60 overflow-hidden">
                    <div className="grid grid-cols-2 text-[10px] md:text-xs uppercase tracking-[0.18em] bg-card/60 border-b border-border/60">
                      <div className="px-3 py-2.5 text-secondary font-semibold border-r border-border/60">
                        ZenSolar
                      </div>
                      <div className="px-3 py-2.5 text-muted-foreground font-semibold">
                        SolarCoin
                      </div>
                    </div>
                    {table.rows.map((row, i) => (
                      <div
                        key={row.label}
                        className={`border-b border-border/40 last:border-b-0 ${
                          i % 2 === 0 ? 'bg-background/40' : 'bg-card/20'
                        }`}
                      >
                        <div className="px-3 pt-3 pb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80">
                          {row.label}
                        </div>
                        <div className="grid grid-cols-2 gap-0">
                          <div className="px-3 py-3 border-r border-border/40 flex items-start gap-2 text-sm text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5" />
                            <span className="leading-snug">{row.zen}</span>
                          </div>
                          <div className="px-3 py-3 flex items-start gap-2 text-sm text-muted-foreground">
                            <XCircle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                            <span className="leading-snug">{row.solar}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Why ZenSolar Wins */}
          <section className="mt-16 md:mt-20">
            <div className="flex items-center gap-2 mb-5">
              <Trophy className="h-5 w-5 text-secondary" />
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight leading-tight">
                Why ZenSolar wins
              </h2>
            </div>
            <ul className="space-y-3">
              {CONCLUSION.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0 mt-1" />
                  <span className="text-sm text-foreground leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                to="/investor"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary text-secondary-foreground px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Back to Investor Hub
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/investor/why-this-round"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 px-5 py-3 text-sm font-medium hover:bg-card/60 transition-colors"
              >
                Why this round
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </section>
      </div>
    </>
  );
}
