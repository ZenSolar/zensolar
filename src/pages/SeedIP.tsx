import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  PlayCircle,
  ScrollText,
  ShieldCheck,
  FileBadge,
  Network,
  Sparkles,
  Cpu,
  Layers,
  Satellite,
  Battery,
  Lock,
  Award,
  Boxes,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

/**
 * /seed/ip — ZenSolar Intellectual Property
 * Replaces the previous /seed/data-room. Comprehensive IP overview:
 * filed non-prov patent, planned provisionals, verification stack,
 * trademarks, and software/architecture IP.
 *
 * Source memories:
 *  - mem://legal/patent-roadmap
 *  - mem://legal/patent-update-checklist
 *  - mem://features/proof-of-genesis-verification
 *  - mem://features/trademark-roadmap
 */

type Patent = {
  code: string;
  status: 'Filed' | 'Planned Provisional' | 'Planned CIP';
  title: string;
  appNo?: string;
  filed?: string;
  claims?: string;
  summary: string;
  hooks: string[];
};

const patents: Patent[] = [
  {
    code: 'ZEN-001',
    status: 'Filed',
    title:
      'System and Method for Tokenizing and Gamifying Verified Clean Energy and Real-World Activity Using Blockchain Technology',
    appNo: 'Non-Prov 19/634,402 · Conf #4783 · Prov 63/782,397',
    filed: 'Provisional Apr 2, 2025 · Non-Prov locked',
    claims: '13 as-filed (2 independent · 11 dependent) · FIG. 1–12',
    summary:
      'Core utility patent covering generation, verification, and gamification of clean-energy and real-world activity into a fungible on-chain token. Foundation of the entire ZenSolar moat.',
    hooks: [
      'Dual-watermark architecture (W_supervised / W_unsupervised) for FSD & autonomous miles',
      'Robotaxi / Cybercab fleet telemetry classified under unsupervised mode (¶[0048], Claim 10)',
      'Cumulative Merkle anchoring → branded as Proof-of-Permanence™',
      'DeviceWatermarkRegistry — one device → one wallet, on-chain Sybil prevention',
    ],
  },
  {
    code: 'ZEN-002',
    status: 'Planned Provisional',
    title: 'Orbital + Robotic Asset Tokenization via Cryptographic Device Attestation',
    summary:
      'Combined provisional with two embodiment sections: Starlink (orbital downlink/uplink as tokenizable utility) and Optimus (robotic labor-hours tokenized via signed telemetry). Establishes priority over the entire "tokenized physical infrastructure" frontier beyond solar.',
    hooks: [
      'Embodiment A — Starlink orbital terminal attestation + signed downlink telemetry',
      'Embodiment B — Optimus robotic labor-hour attestation + task-completion proofs',
      'Shared core: cryptographic device attestation across non-energy physical assets',
      'Files same week as ZEN-003 (~$130 USPTO fee)',
    ],
  },
  {
    code: 'ZEN-003',
    status: 'Planned Provisional',
    title: 'Bidirectional Energy + Vehicle + Stationary-Storage Tokenization',
    summary:
      'Covers V2G/V2H bidirectional flow, Cybertruck/EV discharge as tokenizable production, Powerwall/Megapack as a tokenizable battery-reserve asset, and Supercharger DePIN. Shared claim core: battery-as-tokenizable-asset + bidirectional flow attestation.',
    hooks: [
      'Battery-as-asset claim (Powerwall, Megapack, EV pack treated identically)',
      'Bidirectional flow proofs — separate watermarks for charge vs discharge',
      'Supercharger DePIN classification + Wallbox/SolarEdge home-charging parity',
      'Cannot be added to ZEN-001 (no new matter); separate filing is cleanest',
    ],
  },
  {
    code: 'ZEN-CIP',
    status: 'Planned CIP',
    title: 'Continuation-In-Part Consolidation (~12 months post provisionals)',
    summary:
      'After ZEN-002 and ZEN-003 mature, consolidate into a single non-provisional CIP pulling priority back to the earliest provisional dates. Creates one unified family covering energy + vehicles + orbital + robotics under one continuous priority chain.',
    hooks: [
      'Priority chain anchored to Apr 2, 2025 (ZEN-001 provisional)',
      'Single prosecution surface for the full "tokenized real-world activity" family',
      'Defensive moat against later entrants in any of the four verticals',
    ],
  },
];

const trademarks: Array<{ tier: string; mark: string; classes: string; note: string }> = [
  { tier: 'Tier 1', mark: 'Proof-of-Permanence™', classes: 'Class 9, 42', note: 'Tagline (locked): "The Eternal Ledger". Renamed continuity primitive.' },
  { tier: 'Tier 1', mark: 'Genesis Anchor™', classes: 'Class 9, 42', note: 'First-ever-mint commemorative on Proof-of-Origin pages.' },
  { tier: 'Tier 1', mark: 'Proof-of-Custody™', classes: 'Class 9, 42', note: 'Device ownership-transfer ledger primitive.' },
  { tier: 'Tier 2', mark: 'Proof-of-Genesis™', classes: 'Class 9, 42', note: 'SSOT name for the verification protocol. Replaces retired SEGI™.' },
  { tier: 'Tier 2', mark: 'ZPPA', classes: 'Class 36, 42', note: 'Zen Power Purchase Agreement — distinct from utility-industry "PPA".' },
  { tier: 'Tier 3', mark: 'Mint-on-Proof™ · Proof-of-Delta™ · Proof-of-Origin™', classes: 'Patent-claim language', note: 'Trademark filings once patent counsel clears.' },
];

const verificationLayers: Array<{ n: number; layer: string; status: 'Shipping' | 'Specified' | 'In Spec'; prevents: string }> = [
  { n: 1, layer: 'Multi-OEM OAuth ingestion (Tesla · SolarEdge · Enphase · Wallbox)', status: 'Shipping', prevents: 'Spoofed production data — provider signs at source' },
  { n: 2, layer: 'DeviceWatermarkRegistry.sol — one device → one wallet, on-chain', status: 'Shipping', prevents: 'Sybil attacks (one array minting to many wallets)' },
  { n: 3, layer: 'Server-side mint reconciliation via edge functions', status: 'Shipping', prevents: 'Wallet-side mint inflation' },
  { n: 4, layer: 'Weather + irradiance cross-reference', status: 'Shipping', prevents: 'Solar at midnight, production during storms' },
  { n: 5, layer: 'Bidirectional EV mint — separate proofs for charge / discharge / miles / FSD', status: 'Shipping', prevents: 'Double-counting between EV roles' },
  { n: 6, layer: 'Receipt + CO₂ framing — every mint = verifiable carbon receipt', status: 'Shipping', prevents: 'Unauditable provenance' },
  { n: 7, layer: 'Subscription dual-gate — only paying subscribers can mint', status: 'Shipping', prevents: 'Free-mint Sybil farms (economic gate)' },
  { n: 8, layer: 'Producer-gated LP rounds — kWh-weighted caps', status: 'Specified', prevents: 'Whale / day-trader capture of supply' },
  { n: 9, layer: 'VPP settlement path — grid-utility cross-confirmation', status: 'In Spec', prevents: 'Off-grid spoofing in VPP-covered regions' },
  { n: 10, layer: '5-layer Scarcity Stack (cap · burn · halving · pact-lock · POL)', status: 'Shipping', prevents: 'Protocol-level inflation attacks' },
];

const softwareIp: Array<{ icon: any; title: string; body: string }> = [
  {
    icon: Network,
    title: 'Multi-OEM Unified Stack',
    body: 'First-of-its-kind reconciliation of Tesla + Enphase + SolarEdge + Wallbox in a single UI. Trade-secret pipeline: schema normalization, kWh deduplication, provider-priority ranking per capability (Solar / Battery / EV / Charger).',
  },
  {
    icon: Cpu,
    title: 'Deason AI Layer',
    body: 'Premium AI add-on combining OEM diagnostics + utility-rate optimization across plans. Proprietary prompts, evaluator harness, and per-OEM fault libraries. Wraps into the $4.99/mo subscription tier.',
  },
  {
    icon: Layers,
    title: 'Mint Split v3.1 (SSOT)',
    body: 'Locked tokenomics constant in src/lib/tokenomics.ts: 50% user · 25% LP · 20% burn · 5% treasury, plus a separate 3% transfer tax recycling to LP. Independently audited at TGE.',
  },
  {
    icon: Battery,
    title: 'Bidirectional Energy Engine',
    body: 'Vehicle + stationary-storage telemetry pipeline that distinguishes charge / discharge / V2G / V2H without double-counting. Anchors ZEN-003 provisional.',
  },
  {
    icon: Satellite,
    title: 'Orbital + Robotic Asset Track',
    body: 'Forward-looking attestation framework for Starlink terminals and Optimus labor-hours. Anchors ZEN-002 provisional and extends the moat beyond energy.',
  },
  {
    icon: ShieldCheck,
    title: 'Proof-of-Genesis™ Receipt UI',
    body: 'Unified receipt surface (single URL, single share link, CO₂-tons headline) that doubles as the customer-facing audit trail. Patent-anchored UX.',
  },
];

const roadmap = [
  { phase: 'Phase 1 — Seed (now → mainnet)', body: 'ZenSolar edge functions act as the trusted oracle behind the 10-layer verification stack. Multisig on contract upgrade authority. Hard 1T cap + 20% burn-per-mint contains worst-case blast radius.' },
  { phase: 'Phase 2 — Post-Seed (Series A)', body: 'Migrate to Chainlink Functions / DON. N independent nodes fetch OEM APIs; consensus required before minting. Pairs with on-chain Energy Price Oracle.' },
  { phase: 'Phase 3 — Series B', body: 'ZK-Proof-of-Genesis. Users prove ≥X kWh produced without revealing location, time, or curve. Solves EU/CA PII compliance and unlocks enterprise + government participation.' },
];

const statusColor: Record<string, string> = {
  Filed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  'Planned Provisional': 'text-secondary bg-secondary/10 border-secondary/30',
  'Planned CIP': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  Shipping: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  Specified: 'text-secondary bg-secondary/10 border-secondary/30',
  'In Spec': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
};

export default function SeedIP() {
  return (
    <>
      <Helmet>
        <title>ZenSolar Intellectual Property — Patents, Trademarks & Verification Stack</title>
        <meta
          name="description"
          content="ZenSolar IP overview: filed utility patent 19/634,402, two planned provisionals (ZEN-002 / ZEN-003), 10-layer Proof-of-Genesis™ verification stack, and full trademark roadmap."
        />
        <link rel="canonical" href="https://www.zensolar.com/seed/ip" />
        <meta property="og:title" content="ZenSolar Intellectual Property" />
        <meta property="og:description" content="Filed patent + two planned provisionals + 10-layer verification stack + trademark roadmap." />
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
              The ZenSolar
              <br />
              <span className="text-secondary">IP Moat</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              One filed utility patent. Two planned provisionals. A 10-layer Proof-of-Genesis™ verification stack.
              A trademark family covering every primitive we ship.
            </p>
            <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {[
                { k: '1 Filed', v: 'Non-Prov Utility' },
                { k: '2 Planned', v: 'Provisionals' },
                { k: '10 Layers', v: 'Verification Stack' },
                { k: '8+ Marks', v: 'Trademark Family' },
              ].map((s) => (
                <div key={s.v} className="rounded-xl border border-border/60 bg-card/50 px-2 py-3">
                  <div className="text-sm font-semibold">{s.k}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reframe */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">The Reframe</h2>
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
              ZenSolar is <strong className="text-secondary">not a Web3 energy app</strong>. It is a{' '}
              <strong className="text-secondary">verification system that happens to mint a token</strong>. Every
              fraud-prevention question reduces to one answer: <em>show me the verification stack</em>. Our IP
              portfolio exists to make that stack defensible, durable, and exclusive.
            </p>
          </div>
        </section>

        {/* Patents */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Patent Portfolio</h2>
          <div className="space-y-4">
            {patents.map((p) => (
              <div key={p.code} className="rounded-2xl border border-border/60 bg-card/40 p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[11px] font-mono tracking-wider text-secondary">{p.code}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor[p.status]}`}>
                    {p.status}
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-semibold leading-snug">{p.title}</h3>
                {(p.appNo || p.filed || p.claims) && (
                  <dl className="mt-3 grid gap-1.5 text-[12px] text-muted-foreground">
                    {p.appNo && (
                      <div className="flex gap-2"><dt className="text-foreground/70 min-w-[68px]">App:</dt><dd className="font-mono">{p.appNo}</dd></div>
                    )}
                    {p.filed && (
                      <div className="flex gap-2"><dt className="text-foreground/70 min-w-[68px]">Filed:</dt><dd>{p.filed}</dd></div>
                    )}
                    {p.claims && (
                      <div className="flex gap-2"><dt className="text-foreground/70 min-w-[68px]">Claims:</dt><dd>{p.claims}</dd></div>
                    )}
                  </dl>
                )}
                <p className="mt-3 text-[14px] text-foreground/85 leading-relaxed">{p.summary}</p>
                <ul className="mt-3 space-y-1.5">
                  {p.hooks.map((h) => (
                    <li key={h} className="flex gap-2 text-[13px] text-muted-foreground leading-snug">
                      <CheckCircle2 className="h-3.5 w-3.5 text-secondary mt-0.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground italic">
            Bidirectional / V2G is not meaningfully covered in ZEN-001; new matter cannot be added post-filing, so
            ZEN-003 is filed separately and later consolidated via CIP.
          </p>
        </section>

        {/* Verification Stack */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2">
            Proof-of-Genesis™ — 10-Layer Verification Stack
          </h2>
          <p className="text-[13px] text-muted-foreground mb-5">
            Shipping or specified <em>before</em> we add decentralized oracles or ZK. Every layer is IP-anchored.
          </p>
          <div className="rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
            <div className="divide-y divide-border/40">
              {verificationLayers.map((l) => (
                <div key={l.n} className="px-5 py-4 flex items-start gap-4">
                  <div className="text-[11px] font-mono text-secondary w-6 shrink-0 mt-0.5">L{l.n}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[14px] font-medium leading-tight">{l.layer}</div>
                      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusColor[l.status]}`}>
                        {l.status}
                      </span>
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-1 leading-snug">Prevents: {l.prevents}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Decentralization Roadmap */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Decentralization Roadmap</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {roadmap.map((r) => (
              <div key={r.phase} className="rounded-2xl border border-border/60 bg-card/40 p-5">
                <div className="text-[11px] uppercase tracking-wider text-secondary font-semibold">{r.phase}</div>
                <p className="text-[13px] text-foreground/85 leading-relaxed mt-2">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trademarks */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Trademark Family</h2>
          <div className="rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 bg-card/40 grid grid-cols-12 gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              <div className="col-span-2">Tier</div>
              <div className="col-span-5">Mark</div>
              <div className="col-span-5">Notes</div>
            </div>
            <div className="divide-y divide-border/40">
              {trademarks.map((t) => (
                <div key={t.mark} className="px-5 py-4 grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-2 text-[12px] text-secondary font-medium">{t.tier}</div>
                  <div className="col-span-5">
                    <div className="text-[14px] font-medium leading-tight">{t.mark}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{t.classes}</div>
                  </div>
                  <div className="col-span-5 text-[12px] text-muted-foreground leading-snug">{t.note}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground italic">
            Proof-of-Permanence™ tagline is locked: <strong>"The Eternal Ledger"</strong>. Always rendered with ™ on first
            appearance per page. SEGI™ retired Jun 2026 — consolidated under Proof-of-Genesis™.
          </p>
        </section>

        {/* Software & Architecture IP */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Software & Architecture IP</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {softwareIp.map((c) => {
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
        </section>

        {/* What we have that no one else has */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Why It's Defensible</h2>
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8 space-y-4 text-[14px] text-foreground/90 leading-relaxed">
            <p className="flex gap-3"><Award className="h-5 w-5 text-secondary shrink-0 mt-0.5" /><span><strong>OEM OAuth + watermark + weather + dual-gate is unique.</strong> Most projects ship 1–2 of these — we ship four-plus, with a filed patent anchoring the architecture.</span></p>
            <p className="flex gap-3"><Boxes className="h-5 w-5 text-secondary shrink-0 mt-0.5" /><span><strong>Bidirectional EV is in scope today.</strong> Most "energy" tokens ignore EV entirely; ZEN-003 locks battery-as-asset as a separate priority chain.</span></p>
            <p className="flex gap-3"><Lock className="h-5 w-5 text-secondary shrink-0 mt-0.5" /><span><strong>Producer-gated LP rounds.</strong> No other project inverts the pay-to-buy model — earn-to-buy is a structural, defensible primitive.</span></p>
            <p className="flex gap-3"><Sparkles className="h-5 w-5 text-secondary shrink-0 mt-0.5" /><span><strong>One unified story.</strong> Verification stack and scarcity stack are tied to the same productive activity — not two separate narratives stitched together post-hoc.</span></p>
          </div>
          <blockquote className="mt-6 border-l-2 border-secondary/60 pl-4 italic text-[14px] text-foreground/80 leading-relaxed">
            "Bitcoin spent 15 years building one verification mechanism (PoW) and one scarcity mechanism (halving).
            ZenSolar ships with 10 verification layers and 5 scarcity layers — and every layer is tied to productive
            clean energy instead of wasted compute."
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
            Bitcoin tokenized scarcity. We're tokenizing abundance — and we own the IP that proves it.
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
