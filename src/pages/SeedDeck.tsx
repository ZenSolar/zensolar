import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, PlayCircle, ScrollText, Sparkles, Zap, Battery, Car, Sun } from 'lucide-react';
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

const milestones = [
  'Mainnet TGE of $ZSOLAR on Base with third-party audited contracts',
  'LP seeded at $0.10 with the $200K tranche — public, immutable, on-chain',
  'First 1,000 paying subscribers — 100% of fees routed to LP',
  'Multi-OEM live: Tesla + Enphase + SolarEdge + Wallbox in one UI',
  'Deason AI premium add-on live ($4.99/mo)',
  'Proof-of-Genesis™ IP filings completed (patent + trademark)',
];

const engines = [
  {
    icon: Zap,
    title: 'Subscription + Deason AI',
    body: 'Monthly subscriptions are 100% routed to the $ZSOLAR LP. Deason AI ($4.99/mo) is a premium upsell — personal clean-tech concierge with bill optimization and contract review.',
  },
  {
    icon: Battery,
    title: 'Token Economics ($ZSOLAR)',
    body: '1T hard cap. Launch at $0.10 via LP-seeded tranches on Base. Mint split 50% user / 25% LP / 20% burn / 5% treasury. Separate 3% transfer tax recycles into LP on every sale.',
  },
  {
    icon: Sun,
    title: 'Aggregated Energy Data',
    body: 'Anonymized, privacy-preserving telemetry from our multi-OEM API stack licensed to utilities, ISOs, and REC registries. High-margin, recurring, B2B.',
  },
];

export default function SeedDeck() {
  return (
    <>
      <Helmet>
        <title>ZenSolar Seed Deck — $1M / $2M Hard Cap</title>
        <meta
          name="description"
          content="ZenSolar lean seed deck. $1M target, $2M hard cap. Convertible Note + 10% Token Warrant. 100% of subscriptions routed to the $ZSOLAR LP."
        />
        <link rel="canonical" href="https://www.zensolar.com/seed/deck" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <div className="border-b border-border/40 sticky top-0 z-20 bg-background/85 backdrop-blur">
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
          <div className="relative mx-auto max-w-3xl px-5 pt-14 pb-14 md:pt-20 md:pb-20 text-center">
            <span className="text-[11px] uppercase tracking-[0.24em] text-secondary/90">Lean Seed Deck</span>
            <h1 className="mt-3 text-3xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
              Creating Currency
              <br />
              <span className="text-secondary">From Energy.</span>
            </h1>
            <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              $1M target · $2M hard cap · Convertible Note + 10% Token Warrant (4-year vesting, 1-year cliff).
            </p>
            <div className="mt-7 grid grid-cols-3 gap-3 max-w-md mx-auto">
              {[
                { k: '$1M', v: 'Target' },
                { k: '$2M', v: 'Hard cap' },
                { k: '100% → LP', v: 'Subscriptions' },
              ].map((s) => (
                <div key={s.v} className="rounded-xl border border-border/60 bg-card/50 px-2 py-3">
                  <div className="text-base font-semibold">{s.k}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why this round */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Why This Round Is Different</h2>
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
              We are raising the absolute minimum required to ship mainnet, seed the LP, and prove the subscription flywheel.
              No bloated team. No Series A required. Every dollar of user subscription revenue compounds into the LP — making
              $ZSOLAR more liquid, more valuable, and more attractive to the next user.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { k: 'Founder-led', v: 'Sole full-time founder. No headcount creep.' },
                { k: 'Subscription = LP', v: '100% of fees deepen $ZSOLAR liquidity.' },
                { k: 'Revenue-funded', v: 'Scale on usage, not on the next round.' },
              ].map((b) => (
                <div key={b.k} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="text-sm font-semibold">{b.k}</div>
                  <div className="text-[12px] text-muted-foreground mt-1 leading-snug">{b.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Flywheel */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">The Flywheel</h2>
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
              100% of every user’s monthly subscription
              <br />
              <span className="text-secondary">goes directly into the $ZSOLAR Liquidity Pool.</span>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { k: 'Subscribe', v: 'User pays monthly fee' },
                { k: 'LP Deepens', v: '100% routed to $ZSOLAR LP' },
                { k: 'Flywheel', v: 'Liquidity → confidence → adoption' },
              ].map((step, i) => (
                <div key={step.k} className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Step {i + 1}</div>
                  <div className="text-sm font-semibold">{step.k}</div>
                  <div className="text-[12px] text-muted-foreground mt-1 leading-snug">{step.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Three engines */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Three Revenue Engines</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {engines.map((e, i) => {
              const Icon = e.icon;
              return (
                <div key={e.title} className="rounded-2xl border border-border/60 bg-card/40 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-secondary" />
                    <div className="text-[10px] uppercase tracking-[0.2em] text-secondary/90">Engine 0{i + 1}</div>
                  </div>
                  <div className="text-base font-semibold">{e.title}</div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{e.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Multi-OEM moat */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Multi-OEM Moat</h2>
          <div className="rounded-3xl border border-border/60 bg-card/40 p-6 md:p-8">
            <p className="text-base text-foreground/90 leading-relaxed">
              First-of-its-kind unified monitoring: <span className="font-semibold">Tesla, Enphase, SolarEdge, and Wallbox</span> in one app.
              No competitor reconciles solar + battery + EV across OEMs the way we do — and every new device class deepens
              the data moat that powers Proof-of-Genesis™ minting.
            </p>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {[
                { icon: Sun, k: 'Solar' },
                { icon: Battery, k: 'Battery' },
                { icon: Car, k: 'EV' },
                { icon: Zap, k: 'Charger' },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.k} className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <Icon className="h-5 w-5 text-secondary mx-auto" />
                    <div className="text-[12px] uppercase tracking-wider text-muted-foreground mt-2">{c.k}</div>
                  </div>
                );
              })}
            </div>
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
          <p className="mt-3 text-[12px] italic text-muted-foreground">
            Hard cap of $2M absorbs oversubscription into LP depth and extended runway.
          </p>
        </section>

        {/* Milestones */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">Milestones Funded by This Round</h2>
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

        {/* CTAs */}
        <section className="mx-auto max-w-3xl px-5 py-12">
          <div className="grid gap-3 md:grid-cols-3">
            <Button asChild className="h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/seed/ip"><ShieldCheck className="h-4 w-4 mr-2" />Intellectual Property</Link>
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
