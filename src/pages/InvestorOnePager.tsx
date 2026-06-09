import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Printer, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { readInvestorUnlocked } from '@/components/investor/InvestorPinGate';
import { InvestorHeader } from '@/components/investor/InvestorHeader';
import { isPreviewHost } from '@/lib/previewHost';

const NDA_KEY = 'zs_investor_nda_signed';

function ndaSignedLocally(): boolean {
  if (isPreviewHost()) return true;
  try {
    const raw = localStorage.getItem(NDA_KEY);
    if (!raw) return false;
    const p = JSON.parse(raw);
    return !!(p?.email && p?.fullName);
  } catch {
    return false;
  }
}

export default function InvestorOnePager() {
  const [ok, setOk] = useState<boolean>(() => readInvestorUnlocked() && ndaSignedLocally());

  useEffect(() => {
    document.title = 'ZenSolar · One-Pager';
  }, []);

  if (!ok) {
    return <Navigate to="/investor" replace />;
  }

  return (
    <>
      <Helmet>
        <title>ZenSolar — Investor One-Pager</title>
        <meta name="description" content="ZenSolar one-page investor summary — Proof-of-Genesis™, three revenue engines, $5M seed." />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://www.zensolar.com/investor/one-pager" />
      </Helmet>

      <style>{`
        @media print {
          @page { size: Letter portrait; margin: 0.4in; }
          .no-print { display: none !important; }
          body, .op-root { background: white !important; color: black !important; }
          .op-card, .op-shot { break-inside: avoid; }
        }
      `}</style>

      <div className="no-print">
        <InvestorHeader eyebrow="Strategic Seed · One-Pager" compact />
      </div>

      {/* Sticky chrome (screen only) */}
      <div className="no-print sticky top-0 z-20 backdrop-blur-md bg-background/70 border-b border-border/40">
        <div className="mx-auto max-w-4xl flex items-center justify-between px-5 py-2.5">
          <Link
            to="/investor"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Investor
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
                Strategic Seed · One-Pager · Confidential
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
          </section>

          {/* The Ask */}
          <section className="op-card rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-secondary mb-2">The Ask</div>
            <div className="grid grid-cols-3 gap-3">
              <Stat k="$5M" v="Target raise" />
              <Stat k="$7M" v="Hard cap" />
              <Stat k="Convertible Note" v="Instrument" />
            </div>
          </section>

          {/* Catalyst */}
          <section className="op-card">
            <SectionLabel>The Catalyst</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90">
              $1.7T flows into clean energy every year — and not a single kWh is on-chain. ZenSolar makes verified clean-energy production a hard-capped, asset-backed digital currency.
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
                body="$9.99 / $19.99 / $49.99 subscription unlocks minting. Deason AI premium add-on at $4.99/mo. Every sub dollar splits 50% LP / 50% treasury."
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
              <span className="font-semibold text-foreground">Joseph Maushart</span> (ex-SolarCity)
              and <span className="font-semibold text-foreground">Michael Tschida</span> —
              clean-tech users & best friends. 150B / 50B pact-locked equity, crossovers at $6.67
              and $20 only if $ZSOLAR reaches a $1T market cap.
            </p>
          </section>

          {/* Footer */}
          <footer className="border-t border-border/40 pt-4 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Confidential · Strategic Seed · Subject to NDA v1.0</span>
            <a
              href="mailto:joe@zensolar.com?subject=ZenSolar%20Investor%20Inquiry"
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
    <div className="rounded-lg border border-border/50 bg-card/50 px-2.5 py-2">
      <div className="text-base font-semibold text-foreground leading-tight">{k}</div>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{v}</div>
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
