import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Cpu,
  Shield,
  Database,
  Zap,
  Smartphone,
  Lock,
  GitBranch,
  Workflow,
  Layers,
  Network,
  Bell,
  Sparkles,
  CheckCircle2,
  Code2,
  Cloud,
  Wrench,
  Fingerprint,
  Scale,
  Lightbulb,
  FileText,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { SEGIProofOfDeltaDiagram } from "@/components/technology/SEGIProofOfDeltaDiagram";
import { MintOnProofFlowDiagram } from "@/components/whitepaper/MintOnProofFlowDiagram";
import { DeflationaryFlywheel } from "@/components/how-it-works/DeflationaryFlywheel";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5 },
};

function ChapterHeader({
  chapter,
  title,
  subtitle,
}: {
  chapter: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary/60">
          Chapter {chapter}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function PillarCard({
  icon: Icon,
  title,
  plain,
  technical,
}: {
  icon: React.ElementType;
  title: string;
  plain: string;
  technical: string;
}) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-foreground/90">{plain}</p>
        <div className="pt-2 border-t border-border/40">
          <p className="text-xs font-mono text-muted-foreground leading-relaxed">
            <span className="text-primary/70 font-semibold">Under the hood: </span>
            {technical}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Engineering() {
  return (
    <>
      <SEO
        title="ZenSolar Engineering"
        url="https://zensolar.lovable.app/engineering"
      />
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-12">
          {/* Hero */}
          <motion.section {...fadeIn} className="space-y-6 pt-4">
            <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary">
              <Wrench className="h-3 w-3" />
              Preview only — internal
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
                The Engineering Behind{" "}
                <span className="text-primary">ZenSolar</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                A plain-English tour of how a one-tap clean-energy app actually
                works — from a solar panel on your roof to a token in your
                wallet, and every guardrail in between.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <StatCard icon={Database} label="Database tables" value="40+" hint="With row-level security" />
              <StatCard icon={Cloud} label="Backend functions" value="50+" hint="Serverless, auto-scaled" />
              <StatCard icon={Network} label="Device integrations" value="6" hint="Tesla, Enphase & more" />
              <StatCard icon={Shield} label="Security layers" value="7" hint="From wallet to RLS" />
            </div>
          </motion.section>

          <Separator className="bg-border/40" />

          {/* Chapter 1 */}
          <motion.section {...fadeIn} className="space-y-6">
            <ChapterHeader
              chapter={1}
              title="The Big Picture"
              subtitle="ZenSolar turns real, verified clean-energy activity into digital tokens. The app is the friendly face on top of a careful, multi-layered system."
            />
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm leading-relaxed">
                  Think of ZenSolar as three layers stacked on top of each other:
                </p>
                <div className="space-y-3">
                  {[
                    {
                      label: "1. The App",
                      desc: "What you see and tap — built mobile-first, works offline, installs to your home screen like a native app.",
                    },
                    {
                      label: "2. The Brain",
                      desc: "A secure backend that talks to your solar panels, batteries, and EVs, then verifies every kilowatt-hour before anything is rewarded.",
                    },
                    {
                      label: "3. The Ledger",
                      desc: "A blockchain (Base) that issues your $ZSOLAR tokens. Public, permanent, and tamper-proof.",
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex gap-3">
                      <span className="text-primary font-semibold text-sm shrink-0 w-20">
                        {row.label}
                      </span>
                      <span className="text-sm text-foreground/85">{row.desc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Chapter 1.5 — The 60-second user story */}
          <motion.section {...fadeIn} className="space-y-6">
            <ChapterHeader
              chapter={2}
              title="What The User Actually Does"
              subtitle="Before the engineering, here's the entire human experience — four steps, about a minute total."
            />
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-6">
                <ol className="space-y-4">
                  {[
                    {
                      n: "1",
                      t: "Connect your gear",
                      d: "Sign in to Tesla, Enphase, SolarEdge, or Wallbox with one tap. No hardware, no installer.",
                    },
                    {
                      n: "2",
                      t: "Go live your life",
                      d: "Drive your EV. Let your panels do their thing. The app silently keeps score in the background.",
                    },
                    {
                      n: "3",
                      t: "Tap to Mint™",
                      d: "When you're ready, one tap turns your verified clean energy into $ZSOLAR tokens in your embedded wallet.",
                    },
                    {
                      n: "4",
                      t: "Use your rewards",
                      d: "Hold, swap, or spend. NFTs unlock as you hit clean-energy milestones.",
                    },
                  ].map((s) => (
                    <li key={s.n} className="flex gap-4">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-mono font-bold text-sm">
                        {s.n}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{s.t}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </motion.section>
          <motion.section {...fadeIn} className="space-y-6">
            <ChapterHeader
              chapter={3}
              title="The Engineering Pillars"
              subtitle="Eight systems that make the magic feel simple."
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <PillarCard
                icon={Smartphone}
                title="Mobile-First, App-Like Feel"
                plain="The app is built so your phone treats it like a real installed app — full screen, smooth, with safe-area handling for notches and home bars."
                technical="React 18 + Vite + Tailwind. PWA service worker, 100svh/100dvh viewport math, and pull-to-refresh patterns hand-tuned for iOS Safari quirks."
              />
              <PillarCard
                icon={Lock}
                title="Wallet, Without the Headache"
                plain="You don't need to install MetaMask or remember a seed phrase. A wallet is created and embedded for you behind the scenes."
                technical="Coinbase Embedded Wallets via Reown AppKit. Hard-redirect OAuth flows to dodge in-app browser sandboxing on iOS."
              />
              <PillarCard
                icon={Zap}
                title="Mint-on-Proof™"
                plain="Tokens are only issued when the system has cryptographic proof that the energy actually happened. No proof, no mint."
                technical="Each mint carries a proof chain (device ID, timestamps, baseline + delta, signed metadata). Smart contract accepts deltas only — never lifetime totals — to prevent double-issuance."
              />
              <PillarCard
                icon={Network}
                title="Real Device Integrations"
                plain="The app connects directly to your Tesla, Enphase, SolarEdge, or Wallbox account to read what really happened."
                technical="OAuth 2.0 with refresh token rotation, per-provider rate limit handling, automatic re-auth detection, and ownership-transfer logic when devices change hands."
              />
              <PillarCard
                icon={Database}
                title="A Database That Defends Itself"
                plain="Every row of data has rules about who's allowed to see or change it — enforced by the database itself, not just the app."
                technical="Postgres with Row-Level Security on every user table. Roles stored in a dedicated user_roles table (never on profiles) to prevent privilege escalation. Security definer functions for safe role checks."
              />
              <PillarCard
                icon={Workflow}
                title="The Tokenomics Engine"
                plain="Every mint is split four ways automatically: most goes to you, some is burned forever, some seeds liquidity, and a sliver funds the treasury."
                technical="On-chain split: 75% user / 20% burn / 3% LP / 2% treasury. Hard cap of 10B tokens. Burn logic is irreversible. LP automation routes through the pool atomically."
              />
              <PillarCard
                icon={Bell}
                title="Live Notifications"
                plain="The app can ping you the moment something mintable happens — even when it's closed."
                technical="Web Push via the service worker, per-device subscription records, template-driven payloads with dismissal tracking and delivery logs."
              />
              <PillarCard
                icon={Sparkles}
                title="Sensory Feedback"
                plain="A successful mint feels good — a gentle gong, a confetti burst, a glowing flow of energy."
                technical="Web Audio API graphs (oscillators + biquad filters + LFO modulation), Framer Motion choreography, and Canvas-based particle system. Tuned for 60fps on mid-range phones."
              />
            </div>
          </motion.section>

          <Separator className="bg-border/40" />

          {/* Chapter 4 — Mint flow */}
          <motion.section {...fadeIn} className="space-y-6">
            <ChapterHeader
              chapter={4}
              title="What Happens When You Tap 'Mint'"
              subtitle="A second-by-second tour of the most important button in the app."
            />
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-6 space-y-5">
                {[
                  {
                    step: "01",
                    title: "Sync the device",
                    plain: "The app asks your solar/EV provider for the latest readings.",
                    tech: "Refreshes OAuth token if expired, fetches lifetime totals, caches on failure.",
                  },
                  {
                    step: "02",
                    title: "Calculate the delta",
                    plain: "It subtracts what was already minted to find only what's new.",
                    tech: "current_lifetime − baseline = pending. Floor to integer; never negative.",
                  },
                  {
                    step: "03",
                    title: "Build the proof",
                    plain: "It packages the new activity with timestamps and device signatures.",
                    tech: "Proof chain stored as JSONB; hashed and referenced on-chain.",
                  },
                  {
                    step: "04",
                    title: "Submit to the chain",
                    plain: "The smart contract verifies and mints your tokens.",
                    tech: "mintRewards() accepts delta values only. Tx hash, block number, gas used logged.",
                  },
                  {
                    step: "05",
                    title: "Reset the baseline",
                    plain: "The system marks that activity as 'minted' so it can never be counted again.",
                    tech: "baseline_data updated atomically with last_minted_at. Pending resets to 0.",
                  },
                  {
                    step: "06",
                    title: "Celebrate",
                    plain: "Confetti, gong, and your new balance — instantly visible.",
                    tech: "Optimistic UI update, then reconciled against on-chain balance via wagmi.",
                  },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-mono text-sm font-bold text-primary">
                      {s.step}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <h3 className="font-semibold text-sm">{s.title}</h3>
                      <p className="text-sm text-foreground/85">{s.plain}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {s.tech}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.section>

          {/* Chapter 5 — Patent-Pending Core */}
          <motion.section {...fadeIn} className="space-y-6">
            <ChapterHeader
              chapter={5}
              title="The Patent-Pending Core"
              subtitle="Four ideas that, taken together, are novel enough to defend — and the reason a tap can be trusted."
            />

            <SEGIProofOfDeltaDiagram />


            <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
              <CardContent className="p-5 sm:p-6 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground border-0 gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Patent Reference
                  </Badge>
                  <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/40 gap-1.5">
                    <FileText className="h-3 w-3" />
                    Provisional filing — pending
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                  Most "energy + crypto" projects pre-mint a giant pool of tokens
                  and hand them out. ZenSolar does the opposite: tokens only
                  exist <em>because</em> verified energy happened. The four
                  claims below describe how we do that — and why it's hard to
                  copy.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {[
                {
                  num: 1,
                  icon: Layers,
                  title: "Software-Enabled Gateway Interface (SEGI)",
                  plain:
                    "One software layer that speaks fluent Tesla, Enphase, SolarEdge, and Wallbox — so we never have to ship hardware.",
                  technical:
                    "Hardware-agnostic OAuth 2.0 aggregation with a normalized data schema, bridging manufacturer cloud APIs to on-chain smart contracts.",
                  novelty:
                    "Eliminates custom IoT hardware by leveraging existing manufacturer clouds.",
                },
                {
                  num: 2,
                  icon: Zap,
                  title: "Mint-on-Proof Architecture",
                  plain:
                    "Tokens are created at the exact moment we can prove the energy happened — not before, not in bulk.",
                  technical:
                    "Token issuance is gated by cryptographic verification of real-world activity, ensuring 1:1 correspondence between energy production and circulating supply.",
                  novelty:
                    "Replaces pre-minted pool distribution with verifiable, just-in-time issuance.",
                },
                {
                  num: 3,
                  icon: Fingerprint,
                  title: "Device Watermark Registry",
                  plain:
                    "Every solar panel, battery, and EV gets a permanent record of how much it has already earned — even if it changes owners.",
                  technical:
                    "Cumulative per-device tokenization watermark, bound to the physical device (not the user account), preventing double-counting across transfers.",
                  novelty:
                    "Device-bound (not user-bound) tracking keeps token integrity intact when ownership changes.",
                },
                {
                  num: 4,
                  icon: CheckCircle2,
                  title: "Delta-Only Minting",
                  plain:
                    "We only ever mint the difference since last time — never the lifetime total. Yesterday's energy can't be re-claimed today.",
                  technical:
                    "Smart contract accepts only the increment between the current device reading and the last recorded watermark.",
                  novelty:
                    "Prevents retroactive claims and guarantees every token represents only new, verified activity.",
                },
              ].map((claim) => (
                <Card key={claim.num} className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <claim.icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-primary/60">
                            CLAIM {String(claim.num).padStart(2, "0")}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm sm:text-base leading-snug">
                          {claim.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {claim.plain}
                    </p>
                    <div className="pt-2 border-t border-border/40 space-y-2">
                      <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                        <span className="text-primary/70 font-semibold">
                          Under the hood:{" "}
                        </span>
                        {claim.technical}
                      </p>
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shrink-0 gap-1"
                        >
                          <Lightbulb className="h-2.5 w-2.5" />
                          Novelty
                        </Badge>
                        <span className="text-xs text-muted-foreground italic leading-relaxed">
                          {claim.novelty}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Why this is a moat */}
            <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="h-4 w-4 text-primary" />
                  Why these four together form a moat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      icon: Zap,
                      title: "60-second onboarding",
                      desc: "No installs, no shipping, no technician — just sign in.",
                    },
                    {
                      icon: Shield,
                      title: "Tamper-evident by design",
                      desc: "Data pulled from manufacturer APIs, hashed at the moment of mint.",
                    },
                    {
                      icon: Sparkles,
                      title: "Token integrity, guaranteed",
                      desc: "Every $ZSOLAR token is backed by a unique, non-duplicated kWh.",
                    },
                    {
                      icon: Scale,
                      title: "Defensible IP position",
                      desc: "Software gateway + on-chain verification is the patentable combination.",
                    },
                  ].map((adv) => (
                    <div
                      key={adv.title}
                      className="flex gap-3 p-3 rounded-lg bg-background/60 border border-border/40"
                    >
                      <adv.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold leading-tight">
                          {adv.title}
                        </p>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {adv.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <MintOnProofFlowDiagram />
          </motion.section>

          <Separator className="bg-border/40" />

          {/* Chapter 6 — Tokenomics flywheel */}
          <motion.section {...fadeIn} className="space-y-6">
            <ChapterHeader
              chapter={6}
              title="The Deflationary Flywheel"
              subtitle="Why every mint quietly makes the next $ZSOLAR scarcer — and what that means for token holders."
            />
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Every mint and every transfer routes a portion of supply into
                  one of three sinks: <strong>burn</strong> (gone forever),
                  <strong> liquidity</strong> (deepens the pool), or
                  <strong> treasury</strong> (funds the protocol). The supply
                  curve only ever points in one direction — down.
                </p>
                <DeflationaryFlywheel />
                <div className="grid sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg border border-border/40 bg-background/40">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Hard cap</p>
                    <p className="text-lg font-bold">10,000,000,000</p>
                    <p className="text-xs text-muted-foreground">$ZSOLAR, ever.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/40 bg-background/40">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Mint split</p>
                    <p className="text-lg font-bold">75 / 20 / 3 / 2</p>
                    <p className="text-xs text-muted-foreground">user / burn / LP / treasury</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border/40 bg-background/40">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Burn logic</p>
                    <p className="text-lg font-bold">Irreversible</p>
                    <p className="text-xs text-muted-foreground">Enforced on-chain.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <Separator className="bg-border/40" />

          {/* Chapter 7 — Security */}
          <motion.section {...fadeIn} className="space-y-6">
            <ChapterHeader
              chapter={7}
              title="Security in Layers"
              subtitle="No single line of defense — eight of them, working together."
            />
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: Lock, label: "Wallet auth", desc: "Embedded wallet, no seed phrase exposure." },
                { icon: Shield, label: "RLS policies", desc: "Postgres enforces who can read each row." },
                { icon: GitBranch, label: "Role separation", desc: "Roles in dedicated table; no escalation paths." },
                { icon: Code2, label: "Security definer functions", desc: "Safe SQL helpers with locked search paths." },
                { icon: CheckCircle2, label: "Delta-only minting", desc: "Smart contract refuses cumulative totals." },
                { icon: Database, label: "Validation triggers", desc: "Time-sensitive rules over CHECK constraints." },
                { icon: Layers, label: "Bot protection", desc: "Page-level filtering on public surfaces." },
                { icon: Cloud, label: "Edge function isolation", desc: "Each function runs sandboxed and stateless." },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex gap-3 p-3 rounded-lg border border-border/40 bg-card/40"
                >
                  <s.icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Chapter 8 — The stack */}
          <motion.section {...fadeIn} className="space-y-6">
            <ChapterHeader
              chapter={8}
              title="The Stack, In One Page"
              subtitle="What's actually running, in plain terms."
            />
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  {[
                    ["Frontend", "React 18, Vite, TypeScript, Tailwind"],
                    ["UI system", "shadcn/ui + custom design tokens (HSL)"],
                    ["Animation", "Framer Motion + Canvas particles"],
                    ["Audio", "Web Audio API (custom graphs)"],
                    ["Mobile", "PWA, service worker, safe-area aware"],
                    ["Backend", "Postgres + serverless functions"],
                    ["Auth", "Email + Google OAuth, email verification"],
                    ["Wallet", "Coinbase Embedded + Reown AppKit"],
                    ["Chain", "Base L2 (low fees, Ethereum security)"],
                    ["Contracts", "Solidity, delta-only mint interface"],
                    ["Notifications", "Web Push via service worker"],
                    ["Analytics", "Privacy-first, server-side"],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 border-b border-border/30 pb-2"
                    >
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-mono text-xs text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Closing */}
          <motion.section {...fadeIn} className="space-y-4 pt-4">
            <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
              <CardContent className="p-6 sm:p-8 space-y-4 text-center">
                <Cpu className="h-8 w-8 text-primary mx-auto" />
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Simple to use. Serious underneath.
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Everything in this document exists for one reason: so a tap
                  feels like a tap, while the system underneath holds the line
                  on truth, security, and fairness.
                </p>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </div>
    </>
  );
}
