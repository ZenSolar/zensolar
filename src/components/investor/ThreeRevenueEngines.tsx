import { ArrowRight, Coins, CreditCard, Database, Sparkles } from 'lucide-react';

/**
 * ThreeRevenueEngines — canonical investor framing (v2, Feb 2026).
 * Flywheel: Verified kWh → Data → AI → $ZSOLAR
 * Engine order (locked): 1) Token Economics  2) Subscription  3) Aggregated Data.
 * Deason AI is the $4.99/mo premium add-on inside Engine #2 — NOT its own engine.
 */
export function ThreeRevenueEngines() {
  return (
    <div className="space-y-8">
      {/* Flywheel headline */}
      <div className="rounded-3xl border border-border/60 bg-card/40 px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-center">
          <FlowStep label="Verified kWh" className="text-secondary" />
          <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
          <FlowStep label="Data" className="text-sky-400" />
          <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
          <FlowStep label="AI" className="text-eco" />
          <ArrowRight className="h-4 w-4 text-muted-foreground/60" />
          <FlowStep label="$ZSOLAR" className="text-amber-400" />
        </div>
        <p className="mt-4 text-center text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Every verified kWh produces data, data trains the AI, the AI drives retention and demand
          for the currency. Three revenue lines under one flywheel.
        </p>
      </div>

      {/* Three engine cards — Token first, Subscription second, Data third */}
      <div className="grid gap-4 md:grid-cols-3">
        <EngineCard
          number="01"
          icon={Coins}
          accent="text-amber-400"
          ring="hover:border-amber-400/40 ring-1 ring-amber-400/20"
          emphasized
          title="Token Economics"
          tagline="Core product. Primary revenue driver."
          body={
            <>
              1T hard cap. <span className="text-foreground">75 / 20 / 3 / 2 mint split</span>{' '}
              (user / burn / LP / treasury). $0.10 LP-seeded launch on Base. A{' '}
              <span className="text-foreground">7% transfer tax</span> (3% burn · 2% LP · 2%
              treasury) compounds liquidity depth and treasury yield perpetually as minting and
              trading volume grow.
            </>
          }
          metric="1T cap"
          metricLabel="$0.10 launch · 75/20/3/2 · 7% transfer tax"
        />

        <EngineCard
          number="02"
          icon={CreditCard}
          accent="text-eco"
          ring="hover:border-eco/40"
          title="Monthly Subscription"
          tagline="Base fee to be a ZenSolar user and mint tokens."
          body={
            <>
              Three tiers — <span className="text-foreground">$9.99 Base · $19.99 Regular ·
              $49.99 Power</span> — required to keep an account active and mint. 50% of every
              subscription dollar feeds LP, 50% feeds treasury, so revenue here directly
              strengthens the token in Engine #1.
            </>
          }
          bullets={[
            'Three tiers: $9.99 / $19.99 / $49.99',
            'Premium add-on: Deason AI $4.99/mo',
            'Deason ships the Monthly Clean Energy Report',
            '50% LP · 50% treasury on every sub dollar',
          ]}
          metric="$9.99+"
          metricLabel="base sub · +$4.99 Deason AI add-on"
        >
          {/* Deason AI premium add-on highlight */}
          <div className="mt-4 rounded-xl border border-eco/30 bg-eco/[0.06] p-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-eco" />
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-eco">
                Premium Add-on · Deason AI
              </span>
            </div>
            <p className="text-[12px] text-foreground/90 leading-relaxed">
              <span className="font-semibold text-foreground">$4.99/mo</span> layered on top of any
              base subscription. Delivers the{' '}
              <span className="text-foreground">Monthly Clean Energy Report</span>, bill analysis,
              rate-plan optimization, and device-aware advice. Primary upgrade incentive into the
              Power tier.
            </p>
          </div>
        </EngineCard>

        <EngineCard
          number="03"
          icon={Database}
          accent="text-sky-400"
          ring="hover:border-sky-400/40"
          title="Aggregated Energy Data"
          tagline="Valuable secondary revenue stream."
          body={
            <>
              Verified production, consumption, and device telemetry from Tesla, Enphase,
              SolarEdge, and Wallbox is already flowing through us to power minting.{' '}
              <span className="text-foreground">
                Anonymized and aggregated — never per-household PII.
              </span>{' '}
              Sold to utilities, ISOs / RTOs, REC registries (M-RETS, WREGIS, PJM-GATS), and
              climate researchers.{' '}
              <span className="text-foreground">
                Only possible because we built the first unified multi-OEM monitoring layer.
              </span>
            </>
          }
          metric="$2B+"
          metricLabel="U.S. utility analytics TAM"
        />
      </div>
    </div>
  );
}

function FlowStep({ label, className }: { label: string; className: string }) {
  return (
    <span className={`text-sm md:text-base font-semibold tracking-tight ${className}`}>
      {label}
    </span>
  );
}

function EngineCard({
  number,
  icon: Icon,
  accent,
  ring,
  emphasized,
  title,
  tagline,
  body,
  bullets,
  metric,
  metricLabel,
  children,
}: {
  number: string;
  icon: typeof Database;
  accent: string;
  ring: string;
  emphasized?: boolean;
  title: string;
  tagline: string;
  body: React.ReactNode;
  bullets?: string[];
  metric: string;
  metricLabel: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-border/60 bg-card/40 p-5 md:p-6 transition-colors ${ring} ${
        emphasized ? 'bg-card/60' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[11px] uppercase tracking-[0.22em] font-semibold ${accent}`}>
          Engine {number}
        </span>
        <Icon className={`h-5 w-5 ${accent}`} />
      </div>
      <h3 className="text-base md:text-lg font-semibold text-foreground leading-tight">{title}</h3>
      <p className={`text-xs md:text-sm mt-1 ${accent} italic`}>{tagline}</p>
      <p className="text-[12px] md:text-[13px] text-muted-foreground leading-relaxed mt-3">
        {body}
      </p>
      {bullets && (
        <ul className="mt-3 space-y-1">
          {bullets.map((b) => (
            <li
              key={b}
              className="text-[12px] text-foreground/90 flex items-start gap-2 leading-snug"
            >
              <span className={`mt-1 h-1 w-1 rounded-full shrink-0 ${accent.replace('text-', 'bg-')}`} />
              {b}
            </li>
          ))}
        </ul>
      )}
      {children}
      <div className="mt-4 pt-3 border-t border-border/40">
        <div className={`text-lg md:text-xl font-semibold ${accent}`}>{metric}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
          {metricLabel}
        </div>
      </div>
    </div>
  );
}

export default ThreeRevenueEngines;
