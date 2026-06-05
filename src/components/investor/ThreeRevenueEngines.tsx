import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, Database, Sparkles, Coins, ChevronRight } from 'lucide-react';

/**
 * ThreeRevenueEngines — canonical investor framing (v2.3, Jun 2026 face-lift).
 * Major copy reduction. Visual flywheel as centerpiece. Each engine ≤ 2 bullets.
 * Locked SSOT numbers (50/25/20/5 mint split, $0.10 launch, 1T cap, 3% tax,
 * $9.99/$19.99/$49.99 subs, $4.99 Deason add-on) are preserved verbatim.
 */
export function ThreeRevenueEngines() {
  return (
    <div className="space-y-10">
      {/* Visual flywheel — centerpiece */}
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/60 to-card/20 px-4 py-8 md:px-10 md:py-10">
        <div className="text-center text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-5">
          The Flywheel
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2">
          <FlowChip label="Verified kWh" tone="secondary" />
          <FlowArrow />
          <FlowChip label="Data" tone="sky" />
          <FlowArrow />
          <FlowChip label="AI" tone="eco" />
          <FlowArrow />
          <FlowChip label="$ZSOLAR" tone="amber" emphasized />
        </div>
        <p className="mt-5 text-center text-xs md:text-sm text-muted-foreground max-w-lg mx-auto">
          Every loop tightens the token.
        </p>
      </div>

      {/* Three engine cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <EngineCard
          number="01"
          icon={CreditCard}
          iconAux={Sparkles}
          accent="text-eco"
          ring="hover:border-eco/40"
          title="Subscription + Deason AI"
          tagline="The access fee — and the premium AI upgrade."
          body="Paid tiers unlock Zen Monitoring — the first unified multi-OEM cockpit. Deason AI is a $4.99 add-on."
          bullets={[
            'Tiers: $9.99 · $19.99 · $49.99 — required to mint',
            'Deason AI: +$4.99/mo · bills, rates, telemetry advice',
          ]}
          metric="$9.99 + $4.99"
          metricLabel="base sub · premium AI"
        />

        <EngineCard
          number="02"
          icon={Coins}
          accent="text-amber-400"
          ring="hover:border-amber-400/40 ring-1 ring-amber-400/20"
          emphasized
          title="Token Economics"
          tagline="The core product. The long-term driver."
          body="1T hard cap. Every verified kWh shows 1:1 in the user's wallet — protocol matches it behind the scenes."
          bullets={[
            '$0.10 LP-seeded launch on Base · 1T hard cap',
            '3% transfer tax recycled to LP (separate from mint)',
          ]}
          metric="1T cap"
          metricLabel="LP-deepening · supply-tightening"
        />

        <EngineCard
          number="03"
          icon={Database}
          accent="text-sky-400"
          ring="hover:border-sky-400/40"
          title="Aggregated Energy Data"
          tagline="A valuable secondary revenue line."
          body="Anonymized Tesla, Enphase, SolarEdge, and Wallbox telemetry — licensed to utilities, ISOs, and REC registries."
          bullets={[
            'Never per-household PII · enterprise-licensed',
            'Only possible because of our multi-OEM layer',
          ]}
          metric="$2B+"
          metricLabel="U.S. utility analytics TAM"
        />
      </div>

      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-card/30 border border-border/50 text-xs md:text-sm">
        <span className="text-amber-500 text-lg leading-none">⚡</span>
        <span className="text-muted-foreground">
          <span className="uppercase tracking-[0.18em] text-[10px] font-semibold text-foreground/90 mr-2">
            Phase 2
          </span>
          VPP tokenization — tech already built. ~$50–150 / household / yr in grid-services revenue, all upside, no CapEx.
        </span>
      </div>
    </div>
  );
}

function FlowChip({
  label,
  tone,
  emphasized,
}: {
  label: string;
  tone: 'secondary' | 'sky' | 'eco' | 'amber';
  emphasized?: boolean;
}) {
  const tones: Record<string, string> = {
    secondary: 'text-secondary border-secondary/40 bg-secondary/5',
    sky: 'text-sky-400 border-sky-400/40 bg-sky-400/5',
    eco: 'text-eco border-eco/40 bg-eco/5',
    amber: 'text-amber-400 border-amber-400/40 bg-amber-400/5',
  };
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm md:text-base font-semibold tracking-tight ${tones[tone]} ${
        emphasized ? 'shadow-[0_0_24px_-8px_hsl(var(--secondary)/0.6)]' : ''
      }`}
    >
      {label}
    </span>
  );
}

function FlowArrow() {
  return (
    <>
      <ChevronRight className="hidden md:block h-4 w-4 text-muted-foreground/50" />
      <ArrowRight className="md:hidden h-4 w-4 text-muted-foreground/50 rotate-90" />
    </>
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
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-border/60 bg-card/40 p-6 transition-colors ${ring} ${
        emphasized ? 'bg-card/60' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`text-[11px] uppercase tracking-[0.22em] font-semibold ${accent}`}>
          Engine {number}
        </span>
        <div className="flex items-center gap-1.5">
          <Icon className={`h-5 w-5 ${accent}`} />
          {IconAux && <IconAux className={`h-5 w-5 ${accent} opacity-70`} />}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground leading-tight">{title}</h3>
      <p className={`text-xs mt-1 ${accent} italic`}>{tagline}</p>
      <p className="text-[13px] text-muted-foreground leading-relaxed mt-3">{body}</p>
      {bullets && (
        <ul className="mt-4 space-y-1.5">
          {bullets.map((b) => (
            <li
              key={b}
              className="text-[12px] text-foreground/85 flex items-start gap-2 leading-snug"
            >
              <span className={`mt-1.5 h-1 w-1 rounded-full shrink-0 ${accent.replace('text-', 'bg-')}`} />
              {b}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5 pt-4 border-t border-border/40">
        <div className={`text-xl font-semibold ${accent}`}>{metric}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
          {metricLabel}
        </div>
      </div>
      <Link
        to="/deck"
        className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        Details in deck
        <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}

export default ThreeRevenueEngines;
