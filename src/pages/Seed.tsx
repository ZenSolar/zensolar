import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Sparkles, FileText, Lock, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

/**
 * /seed — Lean Seed Round ($1M target / $2M hard cap).
 * Clean mirror of /investor/pitch focused exclusively on the lean ask,
 * the 100%-to-LP subscription flywheel, and complementary revenue engines.
 */
export default function Seed() {
  const useOfFunds: Array<{ item: string; amount: string; note?: string }> = [
    { item: 'Joseph Salary (Year 1)', amount: '$250K', note: 'Sole full-time founder runway' },
    { item: 'Initial Liquidity Pool Tranche', amount: '$200K', note: 'Seeds $ZSOLAR LP at $0.10' },
    { item: 'Patent, Trademark & Full Legal', amount: '$55K', note: 'Proof of Genesis™ + entity + token counsel' },
    { item: 'Smart Contract Audits', amount: '$40K', note: 'Third-party audit before mainnet TGE' },
    { item: 'Minimal Ops & Tools', amount: '$15K', note: 'Infra, monitoring, dev tooling' },
    { item: 'Buffer + User Acquisition', amount: '$440K', note: 'Growth, reserves, opportunistic spend' },
  ];

  return (
    <>
      <Helmet>
        <title>ZenSolar Seed Round — $1M Target / $2M Hard Cap</title>
        <meta
          name="description"
          content="ZenSolar Seed Round — $1M target, $2M hard cap. Extremely lean. 100% of user subscriptions go directly to the $ZSOLAR liquidity pool. Prove the flywheel first."
        />
        <link rel="canonical" href="https://www.zensolar.com/seed" />
        <meta property="og:title" content="ZenSolar Seed Round — $1M / $2M Hard Cap" />
        <meta property="og:description" content="Extremely lean. 100% user subscriptions go directly to the LP. Prove the flywheel first." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.zensolar.com/seed" />
        <meta property="og:image" content="https://zensolar.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ZenSolar Seed Round — $1M / $2M Hard Cap" />
        <meta name="twitter:description" content="100% user subscriptions → LP. Prove the flywheel first." />
        <meta name="twitter:image" content="https://zensolar.com/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Top nav — mirrors /investor/pitch */}
        <div className="border-b border-border/40">
          <div className="mx-auto max-w-5xl px-5 h-14 flex items-center justify-between">
            <Link
              to="/investor"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Investor home
            </Link>
            <img
              src={zenLogo}
              alt="ZenSolar"
              className="h-6 w-auto opacity-90"
              loading="lazy"
              decoding="async"
              width="120"
              height="24"
            />
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--secondary)/0.18),transparent_60%)]"
          />
          <div className="relative mx-auto max-w-3xl px-5 pt-12 pb-14 md:pt-20 md:pb-20 flex flex-col items-center text-center">
            <span className="text-[11px] uppercase tracking-[0.24em] text-secondary/90 mb-4">
              Lean Seed Round
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
              ZenSolar Seed Round
              <br />
              <span className="text-secondary">$1M Target · $2M Hard Cap</span>
            </h1>
            <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
              Extremely lean. 100% of every user subscription goes directly into the $ZSOLAR
              liquidity pool. Prove the flywheel first — then scale on revenue, not on rounds.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-3 w-full max-w-md">
              {[
                { k: '$1M', v: 'Target' },
                { k: '$2M', v: 'Hard cap' },
                { k: '100% → LP', v: 'Subscriptions' },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-xl border border-border/60 bg-card/50 px-2 py-3"
                >
                  <div className="text-base md:text-lg font-semibold text-foreground">{s.k}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[12px] md:text-[13px] text-muted-foreground/90">
              Instrument: <span className="text-foreground/90">Convertible Note + 10% Token Warrant</span> · 4-year vesting · 1-year cliff
            </p>
          </div>
        </section>

        {/* Use of Funds — large, premium */}
        <section className="mx-auto max-w-3xl px-5 py-14">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
            Use of Funds · $1M
          </h2>
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-5 md:p-7">
            <div className="rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
              <div className="px-5 py-3 border-b border-border/60 bg-card/40 flex items-baseline justify-between">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                  Allocation
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                  Amount
                </div>
              </div>
              <div className="divide-y divide-border/40">
                {useOfFunds.map((row) => (
                  <div key={row.item} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <div className="text-[15px] md:text-base font-medium text-foreground leading-tight">
                        {row.item}
                      </div>
                      {row.note && (
                        <div className="text-[12px] text-muted-foreground mt-1 leading-snug">
                          {row.note}
                        </div>
                      )}
                    </div>
                    <div className="text-base md:text-lg font-semibold text-secondary tabular-nums whitespace-nowrap">
                      {row.amount}
                    </div>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-4 px-5 py-4 bg-secondary/10">
                  <div className="text-base md:text-lg font-semibold text-foreground">Total</div>
                  <div className="text-xl md:text-2xl font-bold text-secondary tabular-nums">
                    $1M
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-[12px] italic text-muted-foreground leading-relaxed">
              Hard cap of $2M absorbs oversubscription into LP depth and extended runway — no
              bloat, no headcount creep, no Series A required.
            </p>
          </div>
        </section>

        {/* The Flywheel Model */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-t border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
            The Flywheel Model
          </h2>
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-tight">
              100% of every user’s monthly subscription
              <br />
              <span className="text-secondary">goes directly into the $ZSOLAR Liquidity Pool.</span>
            </div>
            <p className="mt-5 text-[14px] md:text-[15px] text-muted-foreground leading-relaxed">
              Your subscription isn’t an expense — it’s a monthly investment that strengthens the
              entire ecosystem and supports long-term $ZSOLAR price appreciation. Every paying
              user deepens LP liquidity, tightens spreads, and reinforces the protocol’s
              economic foundation.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                { k: 'Subscribe', v: 'User pays monthly fee' },
                { k: 'LP Deepens', v: '100% routed to $ZSOLAR LP' },
                { k: 'Flywheel', v: 'Liquidity → confidence → adoption' },
              ].map((step, i) => (
                <div
                  key={step.k}
                  className="rounded-xl border border-border/60 bg-background/40 p-4"
                >
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
                    Step {i + 1}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{step.k}</div>
                  <div className="text-[12px] text-muted-foreground mt-1 leading-snug">
                    {step.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Revenue Engines */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-t border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
            Additional Revenue Engines
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-secondary/90 mb-2">
                Engine 01
              </div>
              <div className="text-base font-semibold text-foreground">
                Anonymous Aggregated Data
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">
                Privacy-preserving, anonymized data sold to utilities, grid operators, and
                clean-tech partners — sourced from our first-of-its-kind multi-OEM API stack
                (Tesla, Enphase, SolarEdge, Wallbox). High-margin, recurring, B2B.
              </p>
            </div>
            <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-secondary/90 mb-2">
                Engine 02
              </div>
              <div className="text-base font-semibold text-foreground">
                Deason AI — $4.99/mo Add-on
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">
                Personal clean-tech concierge. Deep system analysis, utility bill optimization,
                solar/EV contract review, and conversational customer support. Premium upsell on
                every subscriber.
              </p>
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section className="mx-auto max-w-3xl px-5 py-14 border-t border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5 text-center">
            Next Steps
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Button asChild className="h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link to="/seed/deck">
                <FileText className="h-4 w-4 mr-2" />
                View Full Deck
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/seed/one-pager">
                <ScrollText className="h-4 w-4 mr-2" />
                One-Pager
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/seed/data-room">
                <Lock className="h-4 w-4 mr-2" />
                Enter Data Room
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/demo?demo=investor">
                <PlayCircle className="h-4 w-4 mr-2" />
                See Live Demo
              </Link>
            </Button>
          </div>

          <p className="mt-10 text-center text-base md:text-lg italic text-foreground/80">
            <Sparkles className="inline h-4 w-4 text-secondary mr-1.5 -mt-0.5" />
            Bitcoin tokenized scarcity. We’re tokenizing abundance.
          </p>
        </section>

        <footer className="border-t border-border/40 py-6 text-center space-y-2">
          <p className="text-[11px] text-muted-foreground">
            ZenSolar, LLC · Austin, TX ·{' '}
            <a
              href="mailto:joe@zensolar.com?subject=ZenSolar%20Seed%20Inquiry"
              className="text-secondary hover:text-secondary/80 underline-offset-4 hover:underline"
            >
              joe@zensolar.com
            </a>{' '}
            · Confidential under NDA
          </p>
          <Link
            to="/investor/data-room"
            className="inline-block text-[11px] uppercase tracking-[0.18em] text-secondary/80 hover:text-secondary"
          >
            Data Room →
          </Link>
        </footer>
      </div>
    </>
  );
}
