import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, PlayCircle, ScrollText, ShieldCheck, FileBadge, Network, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

const useOfFunds: Array<{ item: string; amount: string; note?: string }> = [
  { item: 'Joseph Salary (Year 1)', amount: '$250K', note: 'Sole full-time founder runway' },
  { item: 'Initial Liquidity Pool Tranche', amount: '$200K', note: 'Seeds $ZSOLAR LP at $0.10' },
  { item: 'Patent, Trademark & Full Legal', amount: '$55K', note: 'Proof of Genesis™ + entity + token counsel' },
  { item: 'Smart Contract Audits', amount: '$40K', note: 'Third-party audit before mainnet TGE' },
  { item: 'Minimal Ops & Tools', amount: '$15K', note: 'Infra, monitoring, dev tooling' },
  { item: 'Buffer + User Acquisition', amount: '$440K', note: 'Growth, reserves, opportunistic spend' },
];

const docCards = [
  {
    icon: ShieldCheck,
    title: 'Proof-of-Genesis™',
    body: 'Cryptographic device attestation that proves every kWh originated from a real, verified clean-energy device. Patent-pending. Core IP moat.',
  },
  {
    icon: Network,
    title: 'Multi-OEM API Stack',
    body: 'Tesla + Enphase + SolarEdge + Wallbox reconciled in one app. First-of-its-kind unified monitoring; foundation for aggregated data revenue.',
  },
  {
    icon: FileBadge,
    title: 'IP & Legal Posture',
    body: 'Provisional patents filed (Proof-of-Genesis™, device watermarking). Trademark roadmap underway. Token counsel engaged.',
  },
];

const milestones = [
  'Mainnet TGE of $ZSOLAR on Base with third-party audited contracts',
  'LP seeded at $0.10 with the $200K tranche — public, immutable, on-chain',
  'First 1,000 paying subscribers — 100% of fees routed to LP',
  'Deason AI premium add-on live ($4.99/mo)',
  'Proof-of-Genesis™ IP filings completed (patent + trademark)',
];

export default function SeedDataRoom() {
  return (
    <>
      <Helmet>
        <title>ZenSolar Seed Data Room — $1M / $2M Hard Cap</title>
        <meta
          name="description"
          content="ZenSolar lean seed data room. $1M target, $2M hard cap. Convertible Note + 10% Token Warrant. Proof-of-Genesis™, multi-OEM moat, traction, IP."
        />
        <link rel="canonical" href="https://www.zensolar.com/seed/data-room" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
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
            <span className="text-[11px] uppercase tracking-[0.24em] text-secondary/90">Data Room</span>
            <h1 className="mt-3 text-3xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
              ZenSolar Lean Seed
              <br />
              <span className="text-secondary">$1M Target · $2M Hard Cap</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Convertible Note + 10% Token Warrant · 4-year vesting · 1-year cliff. Founder-led. Revenue-funded.
            </p>
            <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {[
                { k: '$1M', v: 'Target' },
                { k: '$2M', v: 'Hard cap' },
                { k: 'Conv. Note', v: 'Instrument' },
                { k: '10% Warrant', v: '4y vest / 1y cliff' },
              ].map((s) => (
                <div key={s.v} className="rounded-xl border border-border/60 bg-card/50 px-2 py-3">
                  <div className="text-sm font-semibold">{s.k}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Round summary */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Round Summary</h2>
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
              We are raising the minimum required to ship mainnet, seed the $ZSOLAR LP at $0.10, and prove the subscription
              flywheel. 100% of every user subscription is routed into the LP — making the round revenue-funded from day one.
              No Series A required to reach sustainability.
            </p>
          </div>
        </section>

        {/* Use of funds */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Use of Funds · $1M</h2>
          <div className="rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 bg-card/40 flex items-baseline justify-between">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Allocation</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Amount</div>
            </div>
            <div className="divide-y divide-border/40">
              {useOfFunds.map((row) => (
                <div key={row.item} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium leading-tight">{row.item}</div>
                    {row.note && <div className="text-[12px] text-muted-foreground mt-1 leading-snug">{row.note}</div>}
                  </div>
                  <div className="text-base font-semibold text-secondary tabular-nums whitespace-nowrap">{row.amount}</div>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 px-5 py-4 bg-secondary/10">
                <div className="text-base md:text-lg font-semibold">Total</div>
                <div className="text-xl md:text-2xl font-bold text-secondary tabular-nums">$1M</div>
              </div>
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Milestones Funded</h2>
          <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <ul className="space-y-2.5">
              {milestones.map((m) => (
                <li key={m} className="flex gap-3 text-[14px] text-foreground/90 leading-snug">
                  <span className="text-secondary mt-1">▸</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* IP & moat */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Technology, Moat & IP</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {docCards.map((c) => {
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
            Bitcoin tokenized scarcity. We’re tokenizing abundance.
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
