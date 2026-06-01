import { ArrowRight, CreditCard, Database, Sparkles, Coins } from 'lucide-react';

/**
 * ThreeRevenueEngines — canonical investor framing (v2.2, Jun 2026 corrections pass).
 * Flywheel: Verified kWh → Data → AI → $ZSOLAR
 * Engine order (locked):
 *   01) Monthly Subscription + Deason AI ($4.99 premium add-on)
 *   02) Token Economics (core product + long-term primary revenue driver)
 *   03) Aggregated Energy Data (secondary)
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
          A paid subscription unlocks minting and the Deason AI upgrade. Minting produces verified
          kWh data. Data + AI drive token demand and the aggregated-data revenue line. Every loop
          tightens the token.
        </p>
      </div>

      {/* Three engine cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 01 — Monthly Subscription + Deason AI */}
        <EngineCard
          number="01"
          icon={CreditCard}
          iconAux={Sparkles}
          accent="text-eco"
          ring="hover:border-eco/40"
          title="Monthly Subscription + Deason AI"
          tagline="The access fee, plus the premium AI upgrade on top."
          body={
            <>
              A paid base subscription is required to be a ZenSolar user and mint $ZSOLAR. Three
              tiers — <span className="text-foreground">$9.99 Base · $19.99 Regular · $49.99 Power</span>.
              Every paid tier opens <span className="text-foreground">Zen Monitoring</span> — the
              first-of-its-kind multi-OEM live energy cockpit that aggregates real-time data from
              Tesla, Enphase, SolarEdge, and Wallbox into one premium dashboard. Homeowners with
              mixed systems finally get unified visibility — and Proof-of-Genesis™ minting on top.
              On top of any tier, <span className="text-foreground">Deason AI is a $4.99/mo premium
              add-on</span> that delivers the Monthly Clean Energy Report, utility bill analysis,
              rate-plan optimization, and device-aware advice tuned to each home's actual telemetry.
            </>
          }

          bullets={[
            'Base sub: $9.99 / $19.99 / $49.99 — required to mint',
            'Deason AI: +$4.99/mo premium add-on (any tier)',
            'Monthly Clean Energy Report · bill + rate-plan optimization',
            '50% of every sub dollar feeds LP, 50% feeds treasury',
          ]}
          metric="$9.99 + $4.99"
          metricLabel="base sub · premium AI upgrade"
        />

        {/* 02 — Token Economics */}
        <EngineCard
          number="02"
          icon={Coins}
          accent="text-amber-400"
          ring="hover:border-amber-400/40 ring-1 ring-amber-400/20"
          emphasized
          title="Token Economics"
          tagline="Core product and primary long-term revenue driver."
          body={
            <>
              Core product and primary long-term revenue driver.{' '}
              <span className="text-foreground">1T hard cap. Every verified kWh shows 1:1 in the
              user's wallet, and the protocol matches it 1-for-1 in the background — 20% LP, 20%
              burn, 10% treasury</span>. Every mint deepens liquidity and tightens supply in the
              same transaction — a 401(k)-style match for clean energy.
            </>
          }
          bullets={[
            '1T hard cap · 50 user · 20 LP · 20 burn · 10 treasury',
            '$0.10 LP-seeded launch on Base',
            '7% transfer tax → 3% burn · 2% LP · 2% treasury',
            'Transfer-tax volume + treasury yield = long-term primary revenue',
          ]}
          metric="1T cap"
          metricLabel="transfer tax + treasury yield"
        />

        {/* 03 — Aggregated Energy Data */}
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

      <div className="mt-6">
        <div className="flex items-start gap-3 px-4 py-3 rounded-3xl bg-card/30 border border-border/50 text-sm shadow-sm">
          <span className="text-amber-500 text-xl leading-none">⚡</span>
          <div className="flex flex-wrap items-baseline gap-x-1.5 text-left">
            <span className="uppercase tracking-[0.5px] text-[10px] font-medium text-muted-foreground whitespace-nowrap">
              PHASE 2 UNLOCK
            </span>
            <span className="font-medium text-foreground">
              VPP tokenization — tech already built. Real-time $ZSOLAR minting + monthly cash settlement for grid dispatch events.
            </span>
          </div>
        </div>
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
  iconAux: IconAux,
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
  iconAux?: typeof Database;
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
        <div className="flex items-center gap-1.5">
          <Icon className={`h-5 w-5 ${accent}`} />
          {IconAux && <IconAux className={`h-5 w-5 ${accent} opacity-70`} />}
        </div>
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
