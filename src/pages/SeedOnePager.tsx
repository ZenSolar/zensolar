import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

const useOfFunds: Array<[string, string]> = [
  ['Joseph Salary (Year 1)', '$250K'],
  ['Initial Liquidity Pool Tranche', '$200K'],
  ['Patent, Trademark & Full Legal', '$55K'],
  ['Smart Contract Audits', '$40K'],
  ['Minimal Ops & Tools', '$15K'],
  ['Buffer + User Acquisition', '$440K'],
];

export default function SeedOnePager() {
  useEffect(() => {
    document.title = 'ZenSolar · Seed One-Pager';
  }, []);

  return (
    <>
      <Helmet>
        <title>ZenSolar Seed — One-Pager · $1M / $2M Hard Cap</title>
        <meta
          name="description"
          content="ZenSolar lean seed one-pager — $1M target / $2M hard cap. Convertible Note + 10% Token Warrant. Proof-of-Genesis™, three revenue engines, multi-OEM moat."
        />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://www.zensolar.com/seed/one-pager" />
      </Helmet>

      <style>{`
        @media print {
          @page { size: Letter portrait; margin: 0.4in; }
          .no-print { display: none !important; }
          body, .op-root { background: white !important; color: black !important; }
          .op-card, .op-shot { break-inside: avoid; }
        }
      `}</style>

      {/* Sticky chrome (screen only) */}
      <div className="no-print sticky top-0 z-20 backdrop-blur-md bg-background/70 border-b border-border/40">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-5 py-2.5">
          <Link
            to="/seed"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to /seed
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="h-8 text-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Save as PDF
          </Button>
        </div>
      </div>

      <main className="op-root min-h-screen bg-background text-foreground">
        <article className="mx-auto max-w-4xl px-6 py-8 md:py-10 space-y-6">
          {/* Header */}
          <header className="flex items-start justify-between gap-4 border-b border-border/40 pb-5">
            <div>
              <img src={zenLogo} alt="ZenSolar" className="h-7 w-auto mb-2 opacity-95" loading="eager" decoding="async" fetchPriority="high" width="140" height="28" />
              <div className="text-[10px] uppercase tracking-[0.22em] text-secondary">
                Lean Seed · One-Pager · Confidential
              </div>
            </div>
            <div className="text-right text-[10px] text-muted-foreground leading-tight">
              ZenSolar, LLC<br />
              Austin, TX<br />
              joe@zensolar.com
            </div>
          </header>

          {/* Hero tagline */}
          <section className="op-card">
            <div className="text-[10px] uppercase tracking-[0.22em] text-secondary mb-1.5">
              Creating Currency From Energy
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
              Bitcoin tokenized scarcity.<br />
              <span className="text-secondary">ZenSolar tokenizes abundance.</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Proof-of-Genesis™ turns verified clean-energy production into a hard-capped digital currency — Bitcoin-grade integrity at ~0.001% of the energy cost.
            </p>
            <p className="mt-2 text-sm text-foreground/90">
              This lean seed launches the token, seeds the LP, and ignites the subscription flywheel — designed to reach self-sustainability without a traditional Series A.
            </p>
          </section>

          {/* The Ask */}
          <section className="op-card rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-secondary mb-2">The Ask</div>
            <div className="grid grid-cols-3 gap-3">
              <Stat k="$1M Target" v="Lean seed — now" />
              <Stat k="$2M Hard Cap" v="Oversubscription → LP" />
              <Stat k="Note + 10% Warrant" v="4yr vest · 1yr cliff" />
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground leading-snug">
              Convertible Note + 10% Token Warrant. Hard cap absorbs oversubscription into LP depth and extended runway — no bloat, no headcount creep.
            </p>
          </section>

          {/* Use of Funds */}
          <section className="op-card rounded-2xl border border-border/60 bg-card/40 p-4">
            <SectionLabel className="mb-2">Use of Funds · $1M</SectionLabel>
            <ul className="divide-y divide-border/40">
              {useOfFunds.map(([label, amt]) => (
                <li key={label} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="text-[12px] text-foreground/90">{label}</span>
                  <span className="text-[12px] font-medium text-foreground tabular-nums">{amt}</span>
                </li>
              ))}
              <li className="flex items-baseline justify-between gap-3 py-2 mt-1 border-t border-border/60">
                <span className="text-[12px] font-semibold text-foreground">Total</span>
                <span className="text-[13px] font-bold text-secondary tabular-nums">$1M</span>
              </li>
            </ul>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Hard cap of $2M absorbs oversubscription into LP depth and extended runway.
            </p>
          </section>

          {/* Catalyst */}
          <section className="op-card">
            <SectionLabel>The Catalyst</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90">
              $1.7T flows into clean energy every year — and not a single kWh is on-chain. ZenSolar makes verified clean-energy production a hard-capped, asset-backed digital currency.
            </p>
          </section>

          {/* Bitcoin vs ZenSolar */}
          <section className="op-card rounded-2xl border border-border/60 bg-card/40 p-4">
            <SectionLabel className="mb-2">Proof-of-Work vs Proof-of-Genesis™</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90">
              Bitcoin's Proof-of-Work consumes enormous amounts of energy to create digital scarcity with no direct environmental benefit. ZenSolar's Proof-of-Genesis™ rewards the actual creation of clean energy — one verified clean kilowatt-hour produced generates one $ZSOLAR token. We turn energy abundance into digital value instead of consuming massive energy to create artificial scarcity.
            </p>
          </section>

          {/* Three Engines */}
          <section className="op-card">
            <SectionLabel>Three Revenue Engines · One Flywheel</SectionLabel>
            <p className="text-[11px] text-muted-foreground mb-3">
              Verified kWh → Data → AI → $ZSOLAR
            </p>
            <div className="grid gap-2.5 md:grid-cols-3">
              <Engine
                n="01"
                title="Subscription + Deason AI"
                body="$9.99 / $19.99 / $49.99 subscription unlocks minting. Deason AI premium add-on at $4.99/mo. 100% of subscription dollars routed to the $ZSOLAR LP."
              />
              <Engine
                n="02"
                title="Token Economics"
                body="$ZSOLAR — 1T hard cap, $0.10 LP-seeded launch on Base. Mint split 50/25/20/5. Separate 3% transfer tax recycles to LP on every sale."
                emphasized
              />
              <Engine
                n="03"
                title="Aggregated Data + VPP (Scale Opportunity)"
                body="Anonymized multi-OEM telemetry licensed to utilities, ISOs, and REC registries — plus a crypto-rewarding VPP layer. $2B+ U.S. utility-analytics TAM; VPP adds $50–150 / household / yr at zero CapEx."
              />
            </div>
          </section>

          {/* Moat + screenshots */}
          <section className="op-card">
            <SectionLabel>The Moat — Proof-of-Genesis™ + multi-OEM monitoring</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90 mb-3">
              Proof-of-Genesis™ is the first protocol to mint a digital asset from real-world clean-energy production with cryptographic proof — Bitcoin-grade integrity at near-zero energy overhead. It runs on the first unified multi-OEM cockpit covering Tesla, Enphase, SolarEdge, and Wallbox: the prerequisite for verified minting, the proprietary data set behind Engine 03, and an experience mixed-system homeowners cannot get anywhere else.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {['Tesla', 'Enphase', 'SolarEdge', 'Wallbox'].map((oem) => (
                <span
                  key={oem}
                  className="rounded-full border border-border/60 bg-card/40 px-2.5 py-0.5 text-[10px] tracking-wide text-foreground/80"
                >
                  {oem}
                </span>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Shot
                src="/investor/one-pager/zen-monitoring.png"
                caption="Zen Monitoring — live multi-OEM energy cockpit"
              />
              <Shot
                src="/investor/one-pager/tap-to-mint.png"
                caption="Tap-to-Mint™ — verified kWh becomes $ZSOLAR"
              />
            </div>
          </section>

          {/* Traction */}
          <section className="op-card rounded-2xl border border-border/60 bg-card/40 p-4">
            <SectionLabel className="mb-2">Traction</SectionLabel>
            <div className="grid grid-cols-4 gap-3">
              <Stat k="23" v="Beta users" />
              <Stat k="4" v="OEMs live" />
              <Stat k="Patent-pending PoG" v="U.S. App. 19/634,402" />
              <Stat k="Base L2" v="Mainnet anchor at launch" />
            </div>
          </section>

          {/* Founders */}
          <section className="op-card">
            <SectionLabel>Founders</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90">
              <span className="font-semibold text-foreground">Joe Maushart</span>
              and <span className="font-semibold text-foreground">Michael Tschida</span> —
              clean-tech users & best friends. 150B / 50B pact-locked equity, crossovers at $6.67
              and $20 only if $ZSOLAR reaches a $1T market cap.
            </p>
          </section>

          {/* Long-Term Vision */}
          <section className="op-card rounded-2xl border border-border/60 bg-card/40 p-4">
            <SectionLabel className="mb-2">The Long-Term Vision</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90">
              With strong execution, the combination of real utility, a self-reinforcing 100% subscription-to-LP flywheel, and expanding rewardable behaviors positions ZenSolar to acquire millions of users and generate substantial recurring revenue. The tokenomics are designed so that success compounds — as user acquisition grows, the flywheel creates structural pressure toward significant long-term value creation, with the potential for $ZSOLAR to become one of the most important clean energy infrastructure tokens globally.
            </p>
          </section>

          {/* Footer */}
          <footer className="border-t border-border/40 pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Confidential · Lean Seed · Subject to NDA v1.0</span>
            <a
              href="mailto:joe@zensolar.com?subject=ZenSolar%20Seed%20Inquiry"
              className="inline-flex items-center gap-1 text-secondary hover:text-secondary/80"
            >
              <Mail className="h-3 w-3" /> joe@zensolar.com
            </a>
          </footer>
        </article>
      </main>
    </>
  );
}

function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-[10px] uppercase tracking-[0.22em] text-secondary mb-2 ${className}`}>
      {children}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 px-2.5 py-2.5 shadow-[inset_0_1px_0_0_hsl(var(--border)/0.45)]">
      <div className="text-sm sm:text-base font-semibold text-foreground leading-tight tabular-nums">{k}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 leading-tight">{v}</div>
    </div>
  );
}

function Engine({
  n,
  title,
  body,
  emphasized,
}: {
  n: string;
  title: string;
  body: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-card/40 p-3 ${
        emphasized ? 'ring-1 ring-amber-400/30 bg-card/60' : ''
      }`}
    >
      <div
        className={`text-[10px] uppercase tracking-[0.22em] font-semibold mb-1 ${
          emphasized ? 'text-amber-400' : 'text-secondary'
        }`}
      >
        Engine {n}
      </div>
      <div className="text-sm font-semibold text-foreground leading-tight mb-1.5">{title}</div>
      <p className="text-[11px] text-muted-foreground leading-snug">{body}</p>
    </div>
  );
}

function Shot({ src, caption }: { src: string; caption: string }) {
  return (
    <figure className="op-shot rounded-xl border border-border/60 bg-card/40 p-2.5">
      <div className="rounded-lg overflow-hidden bg-black/30 border border-border/40">
        <img src={src} alt={caption} className="w-full h-auto block" loading="lazy" />
      </div>
      <figcaption className="text-[10px] text-muted-foreground mt-1.5 text-center">
        {caption}
      </figcaption>
    </figure>
  );
}
