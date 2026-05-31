import { ArrowRight, Database, Sparkles, Coins } from 'lucide-react';

/**
 * ThreeRevenueEngines — canonical investor framing.
 * Flywheel: Verified kWh → Data → AI → $ZSOLAR
 * Three engines: Aggregated Data · Deason AI · Token Economics.
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

      {/* Three engine cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <EngineCard
          number="01"
          icon={Database}
          accent="text-sky-400"
          ring="hover:border-sky-400/40"
          title="Aggregated Energy Data"
          tagline="Aggregated kWh data, sold to utilities."
          body={
            <>
              Verified production, consumption, and device telemetry from Tesla, Enphase,
              SolarEdge, and Wallbox is already flowing through us to power minting.{' '}
              <span className="text-foreground">
                Anonymized and aggregated — never per-household PII.
              </span>{' '}
              High-value to utilities for load forecasting, DER visibility, and rate-plan design.
              Secondary buyers: ISOs / RTOs, REC registries (M-RETS, WREGIS, PJM-GATS), and climate
              researchers.{' '}
              <span className="text-foreground">
                This dataset is only possible because we built the first unified multi-OEM
                monitoring layer — competitors selling utility data are locked to a single
                manufacturer's API.
              </span>
            </>
          }
          metric="$2B+"
          metricLabel="U.S. utility analytics TAM"
        />

        <EngineCard
          number="02"
          icon={Sparkles}
          accent="text-eco"
          ring="hover:border-eco/40 ring-1 ring-eco/20"
          emphasized
          title="Deason AI Home Energy Optimizer"
          tagline="SaaS revenue, day one."
          body={
            <>
              AI bill analysis, rate-plan optimization, and device-aware advice. Saturday Weekly
              Energy Report (Gemini Pro on premium),{' '}
              <span className="text-foreground">Monthly Clean Energy Report</span> after every bill
              cycle, and <span className="text-foreground">ZenHome Flow</span> progression
              (insight → action → autonomy). Primary upgrade incentive into the Power tier.
            </>
          }
          bullets={[
            '$4.99/mo subscription',
            'Monthly Clean Energy Report',
            'ZenHome Flow progression',
            '$50M+ ARR at 1M subs @ 15% attach',
          ]}
          metric="$4.99/mo"
          metricLabel="add-on · $19.99 audit · Power $49.99"
        />

        <EngineCard
          number="03"
          icon={Coins}
          accent="text-amber-400"
          ring="hover:border-amber-400/40"
          title="Token Economics"
          tagline="LP fees + 2% treasury, on every mint."
          body={
            <>
              1T hard cap. 75/20/3/2 mint split (user / burn / LP / treasury). $0.10 LP-seeded
              launch on Base. Transfer tax compounds LP depth and treasury yield perpetually as
              minting and trading volume grow.
            </>
          }
          metric="1T cap"
          metricLabel="$0.10 launch · 75/20/3/2 · LP + treasury yield"
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
