import { Suspense, lazy, useState } from 'react';
import { Sparkles, Sun, BatteryCharging, Car, Plug, Eye, EyeOff } from 'lucide-react';
import {
  INVESTOR_DEMO_FLOW,
  INVESTOR_DEMO_TESLA_PAYLOAD,
  INVESTOR_DEMO_SOURCES,
  INVESTOR_DEMO_HEADLINE,
} from '@/data/investorDemo/energyFlow';

const EnergyFlowScene = lazy(() =>
  import('@/components/dashboard/EnergyFlowScene').then((m) => ({
    default: m.EnergyFlowScene,
  })),
);

/** Inline annotation chips — coordinates in % of the SVG/PNG square.
 *  Kept short + corner-anchored to avoid colliding with the in-card
 *  Charging pill, Powerwall halo, or the 4 corner readouts. */
const ANNOTATIONS = [
  { id: 'solar', x: 35, y: 10, label: 'Solar · 5.4 kW' },
  { id: 'pw',    x: 78, y: 40, label: 'Powerwall +2.1 kW' },
  { id: 'ev',    x: 22, y: 60, label: 'Tesla · 7.2 kW' },
  { id: 'grid',  x: 90, y: 50, label: 'Grid · 0 kW' },
] as const;

/**
 * Investor-grade Live Energy Monitoring card.
 *
 * Renders the same production EnergyFlowScene used in the live dashboard,
 * but fed with rich seeded telemetry so every device "lights up": solar
 * producing, Powerwall charging, Tesla plugged-in charging at the Wallbox.
 *
 * Mounted in place of the lighter AnimatedEnergyFlow when Investor Demo
 * Mode is active.
 */
export function InvestorEnergyFlowCard() {
  const h = INVESTOR_DEMO_HEADLINE;
  const [showAnnotations, setShowAnnotations] = useState(true);
  return (
    <div
      className="rounded-xl overflow-hidden bg-card/5 p-4"
      style={{
        border: '1px solid hsla(170, 80%, 40%, 0.35)',
        boxShadow:
          '0 0 10px 1px hsla(170, 80%, 40%, 0.18), 0 0 28px 4px hsla(170, 80%, 40%, 0.08)',
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              ZenEnergy Monitoring · Live
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Home Energy Cockpit · Enphase solar + Tesla Powerwall + Model Y + Wallbox
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAnnotations((v) => !v)}
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background/40 px-2 py-0.5 text-[10px] font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 transition-colors"
          aria-label={showAnnotations ? 'Hide annotations' : 'Show annotations'}
        >
          {showAnnotations ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {showAnnotations ? 'Hide labels' : 'Show labels'}
        </button>
      </div>


      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%),radial-gradient(circle_at_bottom,hsl(220_60%_8%/0.6),transparent_60%)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04),0_8px_30px_-8px_hsl(220_60%_4%/0.6)]">
        <Suspense
          fallback={
            <div
              className="aspect-square w-full animate-pulse bg-card/10"
              aria-hidden="true"
            />
          }
        >
          <EnergyFlowScene
            className="aspect-square w-full"
            data={INVESTOR_DEMO_FLOW}
            teslaPayload={INVESTOR_DEMO_TESLA_PAYLOAD}
            batteryCount={1}
            vehicleModel={null}
          />
        </Suspense>

        {/* Inline annotation chips — explain what the investor is seeing. */}
        {showAnnotations && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            {ANNOTATIONS.map((a) => (
              <div
                key={a.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md border border-emerald-400/40 bg-background/85 px-1.5 py-0.5 text-[9px] font-medium text-emerald-200 shadow-[0_0_10px_hsla(142,76%,50%,0.25)] backdrop-blur whitespace-nowrap"
                style={{ left: `${a.x}%`, top: `${a.y}%` }}
              >
                {a.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Multi-OEM source chips — surface the foundational moat */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          Sources
        </span>
        {INVESTOR_DEMO_SOURCES.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background/40 px-2 py-0.5 text-[10px] font-medium text-foreground/90"
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_hsl(142_76%_55%/0.8)]"
            />
            <span>{s.label}</span>
            <span className="text-muted-foreground/70">· {s.detail}</span>
          </span>
        ))}
      </div>

      {/* Compact headline readout */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ReadoutTile
          icon={<Sun className="h-3.5 w-3.5" />}
          label="Producing"
          value={`${h.producing.toFixed(1)} kW`}
          tone="green"
        />
        <ReadoutTile
          icon={<BatteryCharging className="h-3.5 w-3.5" />}
          label="Battery"
          value={`+${h.batteryDeltaKw.toFixed(1)} kW · 87%`}
          tone="green"
        />
        <ReadoutTile
          icon={<Car className="h-3.5 w-3.5" />}
          label="Tesla"
          value={`${h.evChargingKw.toFixed(1)} kW · 64%`}
          tone="green"
        />
        <ReadoutTile
          icon={<Plug className="h-3.5 w-3.5" />}
          label="Grid"
          value={`${h.gridKw.toFixed(1)} kW`}
          tone="muted"
        />
      </div>
    </div>
  );
}

function ReadoutTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'green' | 'muted';
}) {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-400/30 bg-emerald-400/5'
      : 'border-primary/15 bg-background/40';
  return (
    <div
      className={`rounded-lg border ${toneClass} p-2 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-bold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
