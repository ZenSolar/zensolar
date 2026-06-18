import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Lock, PlayCircle, Sparkles } from 'lucide-react';
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

export default function SeedOnePager() {
  return (
    <>
      <Helmet>
        <title>ZenSolar Seed — One-Pager · $1M / $2M Hard Cap</title>
        <meta
          name="description"
          content="ZenSolar lean seed one-pager — $1M target, $2M hard cap. Convertible Note + 10% Token Warrant. 100% of subscriptions routed to the $ZSOLAR LP."
        />
        <link rel="canonical" href="https://www.zensolar.com/seed/one-pager" />
        <meta property="og:title" content="ZenSolar Seed One-Pager — $1M / $2M" />
        <meta property="og:description" content="Lean seed. Convertible Note + 10% Token Warrant. 100% subs → LP." />
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

        <section className="relative overflow-hidden border-b border-border/40">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.18),transparent_60%)]" />
          <div className="relative mx-auto max-w-3xl px-5 pt-12 pb-12 md:pt-16 md:pb-16 text-center">
            <span className="text-[11px] uppercase tracking-[0.24em] text-secondary/90">One-Pager</span>
            <h1 className="mt-3 text-3xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
              ZenSolar — Lean Seed
              <br />
              <span className="text-secondary">$1M Target · $2M Hard Cap</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Convertible Note + 10% Token Warrant · 4-year vesting · 1-year cliff.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
              {[
                { k: '$1M', v: 'Target' },
                { k: '$2M', v: 'Hard cap' },
                { k: '10% Warrant', v: 'Token upside' },
              ].map((s) => (
                <div key={s.v} className="rounded-xl border border-border/60 bg-card/50 px-2 py-3">
                  <div className="text-sm md:text-base font-semibold text-foreground">{s.k}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-10 border-b border-border/40">
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8 text-center">
            <div className="text-xl md:text-2xl font-semibold tracking-tight">
              100% of every user subscription goes directly into the
              <span className="text-secondary"> $ZSOLAR Liquidity Pool.</span>
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Subscriptions aren’t revenue extraction — they’re recurring fuel for LP depth, price stability, and adoption.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-10 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">Use of Funds · $1M</h2>
          <div className="rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 bg-card/40 flex items-baseline justify-between">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Allocation</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">Amount</div>
            </div>
            <div className="divide-y divide-border/40">
              {useOfFunds.map((row) => (
                <div key={row.item} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium text-foreground leading-tight">{row.item}</div>
                    {row.note && <div className="text-[12px] text-muted-foreground mt-1 leading-snug">{row.note}</div>}
                  </div>
                  <div className="text-base font-semibold text-secondary tabular-nums whitespace-nowrap">{row.amount}</div>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 px-5 py-4 bg-secondary/10">
                <div className="text-base md:text-lg font-semibold text-foreground">Total</div>
                <div className="text-xl md:text-2xl font-bold text-secondary tabular-nums">$1M</div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[12px] italic text-muted-foreground">
            Hard cap of $2M absorbs oversubscription into LP depth and extended runway — no bloat, no headcount creep.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-10 border-b border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-4">Revenue Engines</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-secondary/90 mb-2">Engine 01</div>
              <div className="text-base font-semibold">Anonymous Aggregated Data</div>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">
                Anonymized, privacy-preserving telemetry from our first-of-its-kind multi-OEM stack (Tesla + Enphase + SolarEdge + Wallbox) licensed to utilities and clean-tech partners.
              </p>
            </div>
            <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-secondary/90 mb-2">Engine 02</div>
              <div className="text-base font-semibold">Deason AI — $4.99/mo Add-on</div>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">
                Personal clean-tech concierge. Deep system analysis, utility bill optimization, contract review, conversational support. Premium upsell on every subscriber.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-12">
          <div className="grid gap-3 md:grid-cols-3">
            <Button asChild className="h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/seed/deck"><FileText className="h-4 w-4 mr-2" />Full Deck</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/seed/ip"><ShieldCheck className="h-4 w-4 mr-2" />Intellectual Property</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/demo?demo=investor"><PlayCircle className="h-4 w-4 mr-2" />Live Demo</Link>
            </Button>
          </div>
          <p className="mt-8 text-center text-base italic text-foreground/80">
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
