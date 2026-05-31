import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Calendar, Sparkles, Cpu, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThreeRevenueEngines } from '@/components/investor/ThreeRevenueEngines';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

/**
 * /investor/pitch — Canonical Investor Pitch v2.
 * Flywheel narrative + three revenue engines + multi-OEM monitoring moat.
 */
export default function InvestorPitch() {
  return (
    <>
      <Helmet>
        <title>Investor Pitch v2 — ZenSolar</title>
        <meta
          name="description"
          content="ZenSolar Investor Pitch v2 — Creating currency from energy. Flywheel, three revenue engines, the live multi-OEM monitoring moat, and the Strategic Seed ask."
        />
        <link rel="canonical" href="https://www.zensolar.com/investor/pitch" />
        <meta property="og:url" content="https://www.zensolar.com/investor/pitch" />
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
            <img src={zenLogo} alt="ZenSolar" className="h-6 w-auto opacity-90" />
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
                { k: '$3M', v: 'Strategic Seed' },
                { k: '$15M', v: 'Post-money cap' },
                { k: '$5M', v: 'Hard cap' },
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
              body="U.S. App. 19/634,402 covers Tap-to-Mint™, Mint-on-Proof™, Proof-of-Delta™."
            />
            <CatalystCard
              title="First of its kind"
              emphasized
              body={
                <>
                  One app, one UI, every major OEM. Tesla + Enphase + SolarEdge + Wallbox
                  monitoring in a single homeowner experience —{' '}
                  <span className="text-foreground">live today</span>. The data foundation the
                  other two engines depend on.
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
              out — aggregated utility data, a $4.99/mo AI optimizer, and protocol-level token
              economics — each reinforcing the others.
            </p>
          </div>
          <ThreeRevenueEngines />
        </section>

        {/* Why Us */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-t border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
            Why Us
          </h2>

          <div className="rounded-3xl border border-border/60 bg-card/40 p-6 md:p-8">
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
              ZenSolar is built by{' '}
              <span className="font-semibold text-foreground">
                Joseph Maushart and Michael Tschida
              </span>{' '}
              —{' '}
              <span className="text-foreground">childhood best friends</span>, now co-founders. Two
              operators who've spent a lifetime sharpening complementary edges of the same
              problem, pact-locked{' '}
              <span className="text-foreground">200B $ZSOLAR</span> between them to build this out
              together.
            </p>

            {/* Complementary edges */}
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <FounderCard
                icon={Cpu}
                accent="text-secondary"
                ring="border-secondary/30"
                name="Joseph Maushart"
                role="Protocol · Product · Distribution"
                bullets={[
                  'Ex-SolarCity. Built the live multi-OEM monitoring app (Tesla, Enphase, SolarEdge, Wallbox).',
                  'Patent-pending Tap-to-Mint™ author. 9-jurisdiction legal posture. 3.34M+ verified kWh shipped.',
                  'Owns: protocol, product, energy verification, GTM.',
                ]}
              />
              <FounderCard
                icon={Calculator}
                accent="text-eco"
                ring="border-eco/30"
                name="Michael Tschida"
                role="Capital · Math · Economics"
                bullets={[
                  'Top 10% State Farm agent nationwide. President\u2019s Club every year as a top producer.',
                  'Deep expertise in investment strategy, capital allocation, and applied economics — sharper than Joe\u2019s in those domains by design.',
                  'Owns: token economics math, capital deployment discipline, investor relations.',
                ]}
              />
            </div>

            <p className="mt-6 text-center text-[13px] md:text-sm italic text-foreground/85 leading-relaxed">
              Childhood best friends. Two complementary operators. One mission: turn every clean
              kWh into a hard-capped currency, and change how the world prices energy.
            </p>

            <ul className="mt-6 pt-5 border-t border-border/40 space-y-2 text-[13px] text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full shrink-0 bg-secondary" />
                Tesla, Enphase, SolarEdge, Wallbox OEM monitoring all live in production.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full shrink-0 bg-secondary" />
                Patent-pending Tap-to-Mint™ protocol filed with the USPTO.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full shrink-0 bg-secondary" />
                Embedded Coinbase Wallet, Reown AppKit, Base L2 — no MetaMask friction.
              </li>
            </ul>
          </div>
        </section>

        {/* The Ask */}
        <section className="mx-auto max-w-3xl px-5 py-12 border-t border-border/40">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-5">
            The Ask
          </h2>
          <div className="rounded-3xl border border-secondary/30 bg-secondary/5 p-6 md:p-8">
            <div className="text-base md:text-lg font-semibold text-foreground">
              $3M target · $5M hard cap · Strategic Seed (SAFE, post-money)
            </div>
            <ul className="mt-5 space-y-3 text-[13px] text-muted-foreground leading-relaxed">
              <li className="flex gap-3">
                <span className="text-secondary font-semibold shrink-0">Valuation —</span>
                <span>
                  $15M post-money cap (stretch $18–20M for strategic capital).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-semibold shrink-0">Milestones —</span>
                <span>
                  Mainnet TGE on Base (chain 8453), 1,000 verified homes, Deason AI ARR live, 2nd
                  LP tranche seeded, Series A in 18–24 months.{' '}
                  <span className="text-foreground">
                    Post-launch revenue driver: VPP dispatch (15% of gross).
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-secondary font-semibold shrink-0">Capital efficiency —</span>
                <span>
                  ~37% to LP seeding, ~32% to team & engineering, balance to audits, growth, and
                  legal.
                </span>
              </li>
            </ul>
            <div className="mt-7 flex flex-col sm:flex-row gap-2.5">
              <Button
                asChild
                className="flex-1 h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Link to="/demo">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Enter live demo
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 h-11">
                <a href="mailto:joe@zen.solar?subject=ZenSolar%20Investor%20Call&body=Hi%20Joseph%2C%20I%27d%20like%20to%20schedule%20a%20call.">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule a call
                </a>
              </Button>
            </div>
          </div>

          <p className="mt-10 text-center text-base md:text-lg italic text-foreground/80">
            <Sparkles className="inline h-4 w-4 text-secondary mr-1.5 -mt-0.5" />
            Bitcoin tokenized scarcity. We're tokenizing abundance.
          </p>
        </section>

        <footer className="border-t border-border/40 py-6 text-center">
          <p className="text-[11px] text-muted-foreground/70">
            ZenSolar, LLC · Austin, TX · joe@zen.solar · Confidential under NDA
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
