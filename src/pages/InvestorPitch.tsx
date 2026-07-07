import { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { InvestorFAQ } from '@/components/investor/InvestorFAQ';

const ThreeRevenueEngines = lazy(() =>
  import('@/components/investor/ThreeRevenueEngines').then((m) => ({
    default: m.ThreeRevenueEngines,
  }))
);

/**
 * /investor/pitch — Canonical Investor Pitch v2.
 * Flywheel narrative + three revenue engines + multi-OEM monitoring moat.
 */
export default function InvestorPitch() {
  return (
    <>
      <Helmet>
        <title>ZenSolar — Investor Pitch v2 · Creating Currency From Energy</title>
        <meta
          name="description"
          content="ZenSolar Investor Pitch v2 — Creating currency from energy. Flywheel, three revenue engines, the live multi-OEM monitoring moat, and the Strategic Seed ask."
        />
        <link rel="canonical" href="https://www.zensolar.com/investor/pitch" />
        <meta property="og:title" content="ZenSolar — Investor Pitch v2" />
        <meta property="og:description" content="Flywheel, three revenue engines, the live multi-OEM monitoring moat, and the Strategic Seed ask." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://www.zensolar.com/investor/pitch" />
        <meta property="og:image" content="https://zensolar.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ZenSolar — Investor Pitch v2" />
        <meta name="twitter:description" content="Creating currency from energy. The flywheel, three engines, and multi-OEM moat." />
        <meta name="twitter:image" content="https://zensolar.com/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Top nav */}
        <div className="border-b border-border/40">
          <div className="mx-auto max-w-5xl px-5 h-14 flex items-center justify-between">
            <Link
              to="/investor"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Investor home
            </Link>
            <img src={zenLogo} alt="ZenSolar" className="h-6 w-auto opacity-90" loading="lazy" decoding="async" width="120" height="24" />
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
              Investor Pitch · v2
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold leading-[1.05] tracking-tight">
              Creating Currency
              <br />
              From Energy.
            </h1>
            <p className="mt-5 text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
              The first patent-pending protocol turning verified clean-energy production into a
              hard-capped digital currency — built on the first-ever unified multi-manufacturer
              monitoring app, live today across Tesla, Enphase, SolarEdge, and Wallbox.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-3 w-full max-w-md">
              {[
                { k: '$1M Target', v: 'Lean seed — now' },
                { k: '$2M Hard Cap', v: 'Oversub → LP' },
                { k: 'Convertible Note', v: 'Instrument' },
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
          </div>
        </section>

        {/* The Catalyst */}
        <section className="mx-auto max-w-3xl px-5 py-12">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
            The Catalyst
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <CatalystCard
              title="$1.7T"
              body="Annual clean-energy capex globally — nobody has tokenized the kWh itself."
            />
            <CatalystCard
              title="Patent-pending"
              body="U.S. App. 19/634,402 covers the Proof of Genesis™ protocol — a novel system for turning verified clean-energy production into a hard-capped, asset-backed digital currency on Base."
            />
            <CatalystCard
              title="First of its kind"
              emphasized
              body={
                <>
                  <span className="text-foreground">Zen Monitoring</span> — the first-of-its-kind
                  multi-OEM live energy cockpit. Aggregates real-time data from{' '}
                  <span className="text-foreground">Tesla, Enphase, SolarEdge, and Wallbox</span>{' '}
                  into one premium dashboard. Homeowners with mixed systems (Enphase solar +
                  Tesla Powerwall + Tesla EV) finally get unified visibility — and
                  Proof-of-Genesis™ minting on top.
                </>
              }
            />

          </div>
        </section>

        {/* Three Revenue Engines */}
        <section className="mx-auto max-w-5xl px-5 py-12 border-t border-border/40">
          <div className="max-w-2xl mb-7">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
              Three Revenue Engines. One Flywheel.
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Verified clean-energy production is the input. Three independent revenue lines come
              out — protocol-level token economics, monthly user subscriptions (with Deason AI as a
              $4.99 premium add-on), and aggregated utility data — each reinforcing the others.
            </p>
          </div>
          <Suspense fallback={<div className="min-h-[400px]" aria-hidden />}>
            <ThreeRevenueEngines />
          </Suspense>
        </section>

        {/* Why Us section intentionally removed — founder framing is handled inside the deck and via direct contact in the footer below. */}

        {/* The Ask */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-t border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
            The Ask
          </h2>
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
            <div className="text-base md:text-lg font-semibold text-foreground">
              Seed Round — $1M Target · $2M Hard Cap · Convertible Note
            </div>
            <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
              We are raising the absolute minimum required to ship mainnet, seed the LP, and prove
              the subscription flywheel — designed to reach self-sustainability without a
              traditional Series A.
            </p>

            {/* Use of Funds — $1M Target */}
            <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/60 bg-card/40">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                  Use of Funds · $1M Target
                </div>
              </div>
              <div className="divide-y divide-border/40">
                {[
                  { bucket: 'Token Launch & Liquidity', amount: '$250K' },
                  { bucket: 'Legal, Compliance & Audits', amount: '$200K' },
                  { bucket: 'App Polish & Onboarding', amount: '$150K' },
                  { bucket: 'Growth & User Acquisition', amount: '$150K' },
                  { bucket: 'Operational Runway (18–24 months)', amount: '$250K' },
                ].map((row) => (
                  <div key={row.bucket} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
                    <div className="text-[13px] font-medium text-foreground leading-tight">{row.bucket}</div>
                    <div className="text-[13px] font-semibold text-secondary tabular-nums whitespace-nowrap">{row.amount}</div>
                  </div>
                ))}
                <div className="flex items-baseline justify-between gap-3 px-4 py-3 bg-secondary/10">
                  <div className="text-[13px] font-semibold text-foreground">Total</div>
                  <div className="text-[14px] font-bold text-secondary tabular-nums">$1M</div>
                </div>
              </div>
              <p className="px-4 py-2.5 text-[11px] italic text-muted-foreground border-t border-border/40 bg-card/20">
                Hard cap of $2M absorbs oversubscription into LP depth and extended runway — no bloat, no headcount creep.
              </p>
            </div>

            <ul className="mt-5 space-y-3 text-[13px] text-muted-foreground leading-relaxed">
              <li className="flex gap-3">
                <span className="text-secondary font-semibold shrink-0">Structure —</span>
                <span>Convertible Note (post-money). Valuation cap shared on request under NDA.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-semibold shrink-0">Milestones —</span>
                <span>
                  Mainnet TGE on Base (chain 8453), LP seeded at $0.10 with the $200K tranche, first
                  1,000 paying subscribers, Deason AI premium add-on live, Proof-of-Genesis™ IP
                  filings completed.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-semibold shrink-0">Why so lean —</span>
                <span>
                  Disciplined founder-led execution. 100% of subscription revenue compounds into the
                  LP. Scale on usage, not on the next round.
                </span>
              </li>
            </ul>
            <div className="mt-7">
              <Button
                asChild
                className="w-full h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Link to="/demo?demo=investor">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  See it live
                </Link>
              </Button>
            </div>
          </div>

          <p className="mt-10 text-center text-base md:text-lg italic text-foreground/80">
            <Sparkles className="inline h-4 w-4 text-secondary mr-1.5 -mt-0.5" />
            Bitcoin tokenized scarcity. We're tokenizing abundance.
          </p>
        </section>

        <section className="mt-12">
          <InvestorFAQ />
        </section>

        <footer className="border-t border-border/40 py-6 text-center space-y-2 mt-12">
          <p className="text-[11px] text-muted-foreground">
            ZenSolar, LLC · Austin, TX ·{' '}
            <a
              href="mailto:joe@zensolar.com?subject=ZenSolar%20Investor%20Inquiry"
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

function CatalystCard({
  title,
  body,
  emphasized,
}: {
  title: string;
  body: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        emphasized
          ? 'border-secondary/40 bg-secondary/5'
          : 'border-border/60 bg-card/40'
      }`}
    >
      <div
        className={`text-lg font-semibold ${
          emphasized ? 'text-secondary' : 'text-foreground'
        }`}
      >
        {title}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{body}</p>
    </div>
  );
}

