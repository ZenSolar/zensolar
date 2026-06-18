import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  PlayCircle,
  ScrollText,
  ShieldCheck,
  Network,
  Sparkles,
  Cpu,
  Layers,
  Battery,
  Lock,
  Award,
  Boxes,
  CheckCircle2,
  Zap,
  Database,
  Trophy,
  Wallet,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

/**
 * /seed/ip — ZenSolar Intellectual Property
 * Focused on the filed non-provisional utility patent (App 19/634,402).
 * Narrative sourced from the patent specification.
 */

const components: Array<{ n: string; name: string; role: string; icon: any }> = [
  { n: '1', name: 'API Communication Module', role: 'Bridges Application Software to OEM and third-party APIs for the Real-Time Data Collection Step.', icon: Radio },
  { n: '2', name: 'Application Software', role: 'Orchestrator — runs the if/then logic, subroutines, and event triggers across the entire stack.', icon: Cpu },
  { n: '3', name: 'Blockchain Network', role: 'Public ledger on which tokens and NFTs are minted, transferred, and burned.', icon: Network },
  { n: '4', name: 'Blockchain Smart Contract', role: 'Executes Token Minting and NFT Minting steps; enforces supply caps, fees, and burn rules.', icon: ShieldCheck },
  { n: '5', name: 'Activity Data Storage Unit', role: 'Logs cumulative kWh produced, miles driven, and kWh discharged per device.', icon: Database },
  { n: '6', name: 'Milestone Tracking Algorithm', role: 'Watches thresholds (1k / 5k / 10k / 25k / 50k / 100k) and fires NFT mints when crossed.', icon: Trophy },
  { n: '7', name: 'NFT Minting Step', role: 'Issues a unique NFT each time a user crosses a milestone threshold.', icon: Award },
  { n: '8', name: 'User Wallet Interface', role: 'Receives tokens/NFTs, validates app-user identity, gates trading and exchange functions.', icon: Wallet },
  { n: '9', name: 'Real-Time Data Collection Step', role: 'Continuous pull of kWh/miles/discharge data — either via SEGI or via a hardware Measurement Device.', icon: Zap },
  { n: '11', name: 'Software-Enabled Gateway Interface (SEGI)', role: 'First embodiment. Pure-software gateway that pulls signed data directly from OEM APIs.', icon: Network },
  { n: '12', name: 'Solar Inverter Unit', role: 'Source of kWh production data in solar deployments.', icon: Zap },
  { n: '13', name: 'Measurement Device (IoT / Smart Meter)', role: 'Second embodiment. Hardware sensor installed in the system to measure activity directly. Doubles as Security Encryption Layer.', icon: Cpu },
  { n: '14', name: 'Token Minting Step', role: 'Mints $ZSOLAR at a predetermined per-kWh / per-mile rate after fees and burns.', icon: Sparkles },
  { n: '15', name: 'User Registration System', role: 'Onboards users and establishes their User Wallet Interface.', icon: ShieldCheck },
  { n: '16', name: "Business/Homeowner's Inverter Gateway", role: 'Customer-side gateway that exposes the inverter to the network for the API Communication Module.', icon: Network },
  { n: '17', name: 'EV Onboard System / Third-Party Integration', role: 'Source of EV mileage and driving telemetry (Tesla, ChargePoint, etc.).', icon: Boxes },
  { n: '18', name: 'Battery Storage System', role: 'Source of kWh discharge data (Powerwall / Megapack-class assets).', icon: Battery },
  { n: '19', name: 'EV Charger System', role: 'Source of charge-session data; feeds bidirectional accounting.', icon: Zap },
];

const claimHighlights: Array<{ title: string; body: string }> = [
  {
    title: 'Two embodiments under one umbrella',
    body: 'The patent simultaneously claims a software-only path (SEGI pulling from OEM APIs) and a hardware path (an installed Measurement Device — IoT sensor, smart meter, or dedicated hardware). A would-be copycat cannot avoid the claim by switching from API ingestion to physical metering, or vice-versa.',
  },
  {
    title: 'Three activity classes, one minting engine',
    body: 'Solar kWh produced, EV miles driven, and battery kWh discharged are all routed through the same Token Minting Step and Milestone Tracking Algorithm. Independent claim scope covers any combination of the three.',
  },
  {
    title: 'Delta-based minting (anti-replay logic)',
    body: 'The specification claims explicit if-then logic — "if new kWh produced > last kWh stored, calculate the difference as new kWh to mint." This per-device delta accounting is what makes the system spoof-resistant and is anchored in the patent text itself.',
  },
  {
    title: 'Supply-aware minting + fee-with-burn',
    body: 'The Blockchain Smart Contract is claimed with built-in logic that throttles minting when total supply exceeds a threshold and burns a portion of every transaction fee. The tokenomics scarcity model is part of the patent — not just product policy.',
  },
  {
    title: 'Milestone NFTs as on-chain proof of sustained behavior',
    body: 'NFTs mint automatically at 1k / 5k / 10k / 25k / 50k / 100k kWh (and parallel thresholds for miles and discharge). These become a non-fungible, transferable record of long-term clean-energy contribution — distinct from the fungible $ZSOLAR token.',
  },
  {
    title: 'Presale + non-producer participation',
    body: 'The User Wallet Interface is claimed to allow users without a solar, EV, battery, or charger system to participate via presale token purchases. This locks the funnel — buyers and producers live inside the same patented interface.',
  },
  {
    title: 'Cross-domain reach written into the spec',
    body: 'The specification expressly extends the same architecture to wind, fitness, environmental monitoring, education, gaming, fundraising, and carbon-credit issuance. Future verticals are pre-claimed at the spec level rather than left for competitors to colonize.',
  },
];

const whyUnique: Array<{ icon: any; title: string; body: string }> = [
  {
    icon: Layers,
    title: 'Unified across solar + EV + battery in one filing',
    body: 'Existing blockchain energy systems tend to cover a single behavior (grid trading, or just solar). The patent integrates three productive behaviors into one minting and milestone framework, with one wallet, one token, and one NFT series.',
  },
  {
    icon: ShieldCheck,
    title: 'Dual-embodiment fraud resistance',
    body: 'Software path (SEGI + OEM APIs) and hardware path (IoT/smart-meter) are both covered. If a competitor tries to "do it with a sensor instead of an API," they still land inside the claims.',
  },
  {
    icon: Sparkles,
    title: 'Real-time rewards + milestone NFTs in the same contract',
    body: 'Most sustainability rewards programs are delayed, single-event, or off-chain. The patent ties an instantaneous fungible mint and a milestone-triggered NFT mint together inside one smart-contract flow.',
  },
  {
    icon: Lock,
    title: 'Scarcity controls baked into the claims',
    body: 'Supply-threshold throttling and per-transaction burn are claimed at the smart-contract level — not bolted on. The "5-layer Scarcity Stack" is downstream of the patent, not separate from it.',
  },
  {
    icon: Boxes,
    title: 'Carbon-credit and cross-vertical optionality',
    body: 'The spec explicitly contemplates the minted token functioning as a carbon credit and extending into wind, fitness, environmental monitoring, education, gaming, and fundraising — pre-claiming the obvious adjacencies.',
  },
  {
    icon: Award,
    title: 'Producer + non-producer in one wallet',
    body: 'Presale purchase rights for users without hardware are claimed alongside the producer-mint flow. The customer funnel itself is patent-anchored.',
  },
];

export default function SeedIP() {
  return (
    <>
      <Helmet>
        <title>ZenSolar Intellectual Property — Filed Utility Patent 19/634,402</title>
        <meta
          name="description"
          content="Deep narrative on ZenSolar's filed non-provisional utility patent: System and Method for Tokenizing and Gamifying Sustainable Behaviors Using Blockchain Technology."
        />
        <link rel="canonical" href="https://www.zensolar.com/seed/ip" />
        <meta property="og:title" content="ZenSolar Intellectual Property" />
        <meta property="og:description" content="Filed non-provisional utility patent — full technical narrative." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.zensolar.com/seed/ip" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <div className="border-b border-border/40">
          <div className="mx-auto max-w-5xl px-5 h-14 flex items-center justify-between">
            <Link to="/seed" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to /seed
            </Link>
            <img src={zenLogo} alt="ZenSolar" className="h-6 w-auto opacity-90" loading="lazy" decoding="async" />
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.18),transparent_60%)]" />
          <div className="relative mx-auto max-w-3xl px-5 pt-12 pb-12 md:pt-16 md:pb-16 text-center">
            <span className="text-[11px] uppercase tracking-[0.24em] text-secondary/90">Intellectual Property</span>
            <h1 className="mt-3 text-3xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
              One Filed
              <br />
              <span className="text-secondary">Utility Patent</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              A single non-provisional anchors the entire ZenSolar architecture — solar production, EV miles, and battery
              discharge minted into one on-chain token and milestone NFT series.
            </p>
          </div>
        </section>

        {/* Patent header card */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-mono tracking-wider text-secondary">ZEN-001</span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-400/10 border-emerald-400/30">
                Filed · Non-Provisional Utility
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold leading-snug">
              System and Method for Tokenizing and Gamifying Sustainable Behaviors Using Blockchain Technology
            </h2>
            <dl className="mt-4 grid gap-1.5 text-[12px] text-muted-foreground">
              <div className="flex gap-2"><dt className="text-foreground/70 min-w-[88px]">App No:</dt><dd className="font-mono">19/634,402</dd></div>
              <div className="flex gap-2"><dt className="text-foreground/70 min-w-[88px]">Priority:</dt><dd>Provisional 63/782,397 · Apr 2, 2025</dd></div>
              <div className="flex gap-2"><dt className="text-foreground/70 min-w-[88px]">Inventor:</dt><dd>Joseph Maushart</dd></div>
              <div className="flex gap-2"><dt className="text-foreground/70 min-w-[88px]">Assignee:</dt><dd>ZenSolar, LLC</dd></div>
            </dl>
          </div>
        </section>

        {/* The Problem */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">The Problem the Patent Solves</h2>
          <div className="space-y-4 text-[14px] md:text-[15px] text-foreground/85 leading-relaxed">
            <p>
              Adoption of clean-energy hardware — rooftop solar, EVs, home battery storage — is bottlenecked by the
              absence of an immediate, scalable economic reward. Owners deploy meaningful capital but see no real-time
              value from the kWh they produce, the miles they drive electric, or the kWh they discharge back.
            </p>
            <p>
              Existing sustainability-rewards programs are delayed, fragmented, and tied to a single behavior. None
              unify multiple productive activities under one cohesive on-chain incentive, and none scale credibly for
              the business-class systems (50 kW+ arrays, multi-vehicle EV fleets, large-battery installations) that
              actually move the needle.
            </p>
            <p>
              The patented invention closes that gap by minting a token <em>and</em> milestone NFTs in real time, driven
              by cryptographically-verified activity data collected either through software (SEGI pulling OEM APIs) or
              hardware (an installed measurement device).
            </p>
          </div>
        </section>

        {/* What the technology does */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">What the Technology Does</h2>
          <div className="space-y-4 text-[14px] md:text-[15px] text-foreground/85 leading-relaxed">
            <p>
              At its core, the patent describes a closed loop with five moving pieces:
            </p>
            <ol className="space-y-3 list-decimal list-inside marker:text-secondary marker:font-semibold">
              <li>
                <strong className="text-foreground">Collect.</strong> A Real-Time Data Collection Step pulls activity
                data — kWh produced, miles driven, kWh discharged — from solar inverters, EV onboard systems, battery
                systems, and EV chargers. Two embodiments are claimed: a software-only path (SEGI + OEM APIs) and a
                hardware path (an installed IoT sensor / smart meter / dedicated device).
              </li>
              <li>
                <strong className="text-foreground">Verify.</strong> The data flows through a Security Encryption Layer
                into an Activity Data Storage Unit. A Milestone Tracking Algorithm continuously evaluates if-then
                thresholds against the cumulative log. Per-device delta logic ("new kWh &gt; last kWh stored") prevents
                replay and double-counting.
              </li>
              <li>
                <strong className="text-foreground">Mint.</strong> When new activity is detected, the Blockchain Smart
                Contract executes the Token Minting Step at a predetermined per-kWh / per-mile rate. The same contract
                fires the NFT Minting Step whenever a milestone threshold (1k → 100k kWh, plus parallel mileage and
                discharge bands) is crossed.
              </li>
              <li>
                <strong className="text-foreground">Govern supply.</strong> The smart contract claims explicit if-then
                logic to throttle minting when total supply exceeds a threshold and to burn a portion of every
                transaction fee — the scarcity controls are inside the claim language, not external policy.
              </li>
              <li>
                <strong className="text-foreground">Distribute &amp; trade.</strong> Tokens and NFTs land in a User
                Wallet Interface — set up by the User Registration System — which gates exchange and NFT-marketplace
                access exclusively to verified app users, and supports presale purchase for non-producers.
              </li>
            </ol>
          </div>
        </section>

        {/* Worked example */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">Worked Example from the Spec</h2>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5 md:p-6 text-[14px] text-foreground/85 leading-relaxed">
            <p className="mb-3">
              A business operating a 50 kW solar system, a 10-vehicle EV fleet, and a battery installation in a single
              year produces 250,000 kWh of solar, drives 120,000 EV miles, and discharges 50,000 kWh from storage.
            </p>
            <p className="mb-3">In the embodiment described by the patent, that single business receives:</p>
            <ul className="space-y-1.5 mb-3">
              <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-secondary mt-1 shrink-0" /><span><strong>237,500</strong> $ZSOLAR for solar production (post-fee)</span></li>
              <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-secondary mt-1 shrink-0" /><span><strong>11,400</strong> $ZSOLAR for EV miles driven</span></li>
              <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-secondary mt-1 shrink-0" /><span><strong>23,750</strong> $ZSOLAR for battery discharge</span></li>
              <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-secondary mt-1 shrink-0" /><span><strong>8 NFTs</strong> minted automatically as cumulative thresholds are crossed (1k, 5k, 10k, 25k, 50k, 100k kWh; 1k / 5k miles; 1k / 5k kWh discharged)</span></li>
            </ul>
            <p className="text-muted-foreground text-[13px] italic">
              All three activity classes flow into the same contract, the same wallet, the same NFT series — that
              unification is the core of the independent claim.
            </p>
          </div>
        </section>

        {/* Claim highlights */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">What the Claims Actually Cover</h2>
          <div className="space-y-3">
            {claimHighlights.map((c) => (
              <div key={c.title} className="rounded-2xl border border-border/60 bg-card/40 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-secondary mt-1 shrink-0" />
                  <div>
                    <div className="text-[15px] font-semibold leading-snug">{c.title}</div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mt-1.5">{c.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Component map */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2">System Components (Spec Items)</h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            The specification names each component as a numbered item. Every box below appears verbatim in the patent.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {components.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.n} className="rounded-2xl border border-border/60 bg-card/40 p-4 flex gap-3">
                  <Icon className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold leading-tight">
                      <span className="font-mono text-secondary mr-1.5">#{c.n}</span>
                      {c.name}
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-snug mt-1">{c.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Why unique */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">What Makes It Unique</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {whyUnique.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-2xl border border-border/60 bg-card/40 p-5">
                  <Icon className="h-5 w-5 text-secondary mb-2" />
                  <div className="text-base font-semibold">{c.title}</div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{c.body}</p>
                </div>
              );
            })}
          </div>
          <blockquote className="mt-6 border-l-2 border-secondary/60 pl-4 italic text-[14px] text-foreground/80 leading-relaxed">
            "Bitcoin spent 15 years proving one verification mechanism. ZenSolar ships a patent that ties verification,
            minting, scarcity, and milestone proof to real productive activity — in one filing."
          </blockquote>
        </section>

        {/* CTAs */}
        <section className="mx-auto max-w-3xl px-5 py-12">
          <div className="grid gap-3 md:grid-cols-3">
            <Button asChild className="h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/seed/deck"><FileText className="h-4 w-4 mr-2" />Full Deck</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/seed/one-pager"><ScrollText className="h-4 w-4 mr-2" />One-Pager</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/demo?demo=investor"><PlayCircle className="h-4 w-4 mr-2" />Live Demo</Link>
            </Button>
          </div>
          <p className="mt-10 text-center text-base md:text-lg italic text-foreground/80">
            <Sparkles className="inline h-4 w-4 text-secondary mr-1.5 -mt-0.5" />
            One filed patent. Three activity classes. Two embodiments. One unified mint.
          </p>
        </section>

        <footer className="border-t border-border/40 py-6 text-center">
          <p className="text-[11px] text-muted-foreground">
            ZenSolar, LLC · Austin, TX ·{' '}
            <a href="mailto:joe@zensolar.com" className="text-secondary hover:underline">joe@zensolar.com</a>{' '}
            · Confidential under NDA
          </p>
        </footer>
      </div>
    </>
  );
}
