import { lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

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
                { k: '$5M', v: 'Target raise' },
                { k: '$7M', v: 'Hard cap' },
                { k: 'SAFE', v: 'Structure' },
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
              $5M target · $7M hard cap · Strategic Seed (SAFE, post-money)
            </div>

            {/* Use of Funds — $5M target, locked Feb 2026 */}
            <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/60 bg-card/40">
                <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
                  Use of Funds · $5M Target
                </div>
              </div>
              <div className="divide-y divide-border/40">
                {[
                  { bucket: 'LP Reserve (3 tranches)', amt: '$2.0M', pct: '40%', note: 'Critical for flywheel health' },
                  { bucket: 'Team & Ops (18–24 mo)', amt: '$1.8M', pct: '36%', note: 'Founders + 3 hires' },
                  { bucket: 'Audits, Legal, Patents', amt: '$400K', pct: '8%', note: 'Smart-contract + security audits, securities counsel, patents' },
                  { bucket: 'Growth / User Acquisition', amt: '$500K', pct: '10%', note: 'Paid acquisition, creator partnerships, Proof-of-Genesis viral loop' },
                  { bucket: 'Reserves / Buffer', amt: '$300K', pct: '6%', note: 'Contingency' },
                ].map((row) => (
                  <div key={row.bucket} className="grid grid-cols-[1.4fr_auto_auto] gap-3 px-4 py-2.5 items-start">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-foreground leading-tight">{row.bucket}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{row.note}</div>
                    </div>
                    <div className="text-[13px] font-semibold text-secondary tabular-nums">{row.amt}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums pt-0.5">{row.pct}</div>
                  </div>
                ))}
                <div className="grid grid-cols-[1.4fr_auto_auto] gap-3 px-4 py-2.5 bg-card/30">
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-foreground">Total</div>
                  <div className="text-[13px] font-bold text-foreground tabular-nums">$5.0M</div>
                  <div className="text-[11px] text-foreground/80 tabular-nums pt-0.5">100%</div>
                </div>
              </div>
            </div>

            <ul className="mt-5 space-y-3 text-[13px] text-muted-foreground leading-relaxed">
              <li className="flex gap-3">
                <span className="text-secondary font-semibold shrink-0">Structure —</span>
                <span>SAFE (post-money). Valuation cap shared on request under NDA.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-semibold shrink-0">Milestones —</span>
                <span>
                  Mainnet TGE on Base (chain 8453), 1,000 verified homes, subscription revenue live
                  with Deason AI add-on, 2nd LP tranche seeded, Series A in 18–24 months.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-semibold shrink-0">Capital efficiency —</span>
                <span>
                  76% deployed into the flywheel (LP + team). Audits, growth, and a flexible
                  reserve cover the rest.
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

        <footer className="border-t border-border/40 py-6 text-center">
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

