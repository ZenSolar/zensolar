import { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { Sparkles, Sun, BatteryCharging, Car, Plug, Eye, EyeOff, Zap, ZapOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  INVESTOR_DEMO_FLOW,
  INVESTOR_DEMO_TESLA_PAYLOAD,
  INVESTOR_DEMO_SOURCES,
  INVESTOR_DEMO_HEADLINE,
  INVESTOR_DEMO_OUTAGE_FLOW,
  INVESTOR_DEMO_OUTAGE_TESLA_PAYLOAD,
} from '@/data/investorDemo/energyFlow';
import { useInvestorOutageSim } from '@/hooks/useInvestorDemoMode';
import { estimateBackupTime } from '@/lib/gridOutage';

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
  { id: 'ev',    x: 22, y: 56, label: 'Tesla via Wallbox' },
  { id: 'grid',  x: 90, y: 50, label: 'Grid · 0 kW' },
] as const;

/**
 * Investor-grade Live Energy Monitoring card.
 *
 * Renders the same production EnergyFlowScene used in the live dashboard,
 * but fed with rich seeded telemetry so every device "lights up": solar
 * producing, Powerwall charging, Tesla plugged-in charging at the Wallbox.
 *
 * Also supports an on-demand **Simulate Grid Outage** toggle (founder/demo
 * convenience). When active, the scene swaps to the outage fixture and
 * passes `isOutage` into EnergyFlowScene so the full hero-house outage UI
 * (calm header pill, backup time, kW from battery, amber Battery→Home flow)
 * renders without waiting for a real outage. Toggling on also opens Deason
 * with the proper grid_outage context.
 */
export function InvestorEnergyFlowCard() {
  const h = INVESTOR_DEMO_HEADLINE;
  const [showAnnotations, setShowAnnotations] = useState(true);
  const { enabled: outageSim, toggle: toggleOutage } = useInvestorOutageSim();
  const outageStartRef = useRef<Date | null>(null);
  const prevSimRef = useRef<boolean>(false);

  // Stable outage start timestamp — first tick the sim flips on.
  if (outageSim && !outageStartRef.current) {
    outageStartRef.current = new Date();
  }
  if (!outageSim && outageStartRef.current) {
    outageStartRef.current = null;
  }

  const data = outageSim ? INVESTOR_DEMO_OUTAGE_FLOW : INVESTOR_DEMO_FLOW;
  const teslaPayload = outageSim
    ? INVESTOR_DEMO_OUTAGE_TESLA_PAYLOAD
    : INVESTOR_DEMO_TESLA_PAYLOAD;

  const backupEst = outageSim
    ? estimateBackupTime({
        socPct: data.batteryPercent ?? 0,
        usableCapacityKwh: data.batteryCapacityKwh ?? 13.5,
        currentDischargeKw: Math.max(0, -(data.batteryPower ?? 0)),
        smoothingKey: 'investor-demo-outage',
      })
    : null;

  // When the sim flips on/off, drive Deason: seed the same outage context
  // the real `useOutageLifecycle` hook would, and dispatch open. When it
  // flips off, send a calm recovery nudge.
  useEffect(() => {
    if (outageSim === prevSimRef.current) return;
    prevSimRef.current = outageSim;
    if (typeof window === 'undefined') return;

    if (outageSim) {
      const started = outageStartRef.current ?? new Date();
      const dischargeKw = Math.max(0, -(data.batteryPower ?? 0));
      const socRounded = Math.round(data.batteryPercent ?? 0);
      const label = backupEst?.label ?? '>24 hours';
      const meta = {
        kind: 'grid_outage',
        phase: 'start',
        socPct: data.batteryPercent ?? null,
        backupLabel: label,
        dischargeKw,
        homeKw: data.homePower ?? null,
        source: 'tesla',
        startedAt: started.toISOString(),
        simulated: true,
      };
      const startedClock = started.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const assistantSeed =
        `**Grid outage detected at ${startedClock}.** You're on Powerwall backup — everything important should stay on.\n\n` +
        `• **Backup remaining:** ~${label} (battery ${socRounded}%)\n` +
        `• **Battery output:** ${dischargeKw.toFixed(1)} kW\n` +
        `• **Home load:** ${(data.homePower ?? 0).toFixed(1)} kW\n\n` +
        `**A few quick ways to stretch your backup:**\n` +
        `• Your load is already lean — nice. Keep big appliances off and you're in great shape.\n` +
        `• Skip the dryer/oven until grid power is back.\n` +
        `• If you have an EV plugged in, pause charging just in case.\n\n` +
        `**Stay safe** — if this outage lasts longer than expected or you need help, contact your utility company or 911 for emergencies.\n\n` +
        `I'll keep monitoring and ping you the moment your backup window changes or power comes back.`;

      window.dispatchEvent(
        new CustomEvent('deason:nudge', { detail: { assistant: assistantSeed, meta } }),
      );
      window.dispatchEvent(new Event('deason:open'));
      window.setTimeout(() => window.dispatchEvent(new Event('deason:open')), 400);
    } else {
      window.dispatchEvent(
        new CustomEvent('deason:nudge', {
          detail: {
            assistant:
              'Power is back (demo). Your battery would now recharge from the grid — toggle the simulation again any time to retest the outage flow.',
            meta: { kind: 'grid_outage', phase: 'recovery', simulated: true },
          },
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outageSim]);

  return (
    <div
      className="rounded-xl overflow-hidden bg-card/5 p-4"
      style={{
        border: outageSim
          ? '1px solid hsla(35, 95%, 55%, 0.5)'
          : '1px solid hsla(170, 80%, 40%, 0.35)',
        boxShadow: outageSim
          ? '0 0 12px 1px hsla(35, 95%, 55%, 0.22), 0 0 30px 4px hsla(35, 95%, 55%, 0.10)'
          : '0 0 10px 1px hsla(170, 80%, 40%, 0.18), 0 0 28px 4px hsla(170, 80%, 40%, 0.08)',
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              ZenEnergy Monitoring · Live
            </h3>
            {outageSim ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/40"
                title="Grid outage simulation is active — UI, stats, and Deason are running in outage mode."
                aria-label="Demo Outage Mode Active"
                data-testid="outage-sim-active-chip"
              >
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                </span>
                Demo · Outage Mode Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Live
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {outageSim
              ? 'Simulated grid outage · Powerwall powering essentials · Tesla parked'
              : 'Home Energy Cockpit · Enphase solar + Tesla Powerwall + Model Y + Wallbox'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <TooltipProvider delayDuration={250}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleOutage}
                  aria-pressed={outageSim}
                  data-testid="outage-sim-toggle"
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                    outageSim
                      ? 'border border-amber-400/60 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                      : 'border border-primary/25 bg-background/40 text-foreground/80 hover:text-foreground hover:border-primary/50'
                  }`}
                >
                  {outageSim ? <ZapOff className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
                  {outageSim ? 'End Outage Simulation' : 'Simulate Grid Outage'}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px] text-[11px] leading-snug">
                {outageSim
                  ? 'Stops the simulation and restores normal solar + grid telemetry. Deason returns to its standard chat context.'
                  : 'Simulates a full grid outage so you can test Outage Mode UI (hero house, backup time, Battery→Home flow) and Deason\'s outage context without waiting for a real one.'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <button
            type="button"
            onClick={() => setShowAnnotations((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background/40 px-2 py-0.5 text-[10px] font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 transition-colors"
            aria-label={showAnnotations ? 'Hide annotations' : 'Show annotations'}
          >
            {showAnnotations ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showAnnotations ? 'Hide labels' : 'Show labels'}
          </button>
        </div>
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
            data={data}
            teslaPayload={teslaPayload}
            batteryCount={1}
            vehicleModel={null}
            isOutage={outageSim}
            outageBackupLabel={backupEst?.label}
            outageStartedAt={outageSim ? outageStartRef.current ?? undefined : undefined}
          />
        </Suspense>

        {/* Inline annotation chips — explain what the investor is seeing.
            Suppressed during outage so they don't fight with the in-scene
            hero stats. */}
        {showAnnotations && !outageSim && (
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
              className={`h-1.5 w-1.5 rounded-full ${
                outageSim && s.id !== 'powerwall'
                  ? 'bg-muted-foreground/50'
                  : 'bg-emerald-400 shadow-[0_0_6px_hsl(142_76%_55%/0.8)]'
              }`}
            />
            <span>{s.label}</span>
            <span className="text-muted-foreground/70">· {s.detail}</span>
          </span>
        ))}
      </div>

      {/* Compact headline readout */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {outageSim ? (
          <>
            <ReadoutTile
              icon={<Sun className="h-3.5 w-3.5" />}
              label="Producing"
              value="0.0 kW"
              tone="muted"
            />
            <ReadoutTile
              icon={<BatteryCharging className="h-3.5 w-3.5" />}
              label="Battery"
              value={`-${Math.abs(data.batteryPower ?? 0).toFixed(1)} kW · ${Math.round(data.batteryPercent ?? 0)}%`}
              tone="amber"
            />
            <ReadoutTile
              icon={<Car className="h-3.5 w-3.5" />}
              label="Tesla"
              value="Parked · 64%"
              tone="muted"
            />
            <ReadoutTile
              icon={<Plug className="h-3.5 w-3.5" />}
              label="Grid"
              value="Offline"
              tone="amber"
            />
          </>
        ) : (
          <>
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
          </>
        )}
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
  tone: 'green' | 'muted' | 'amber';
}) {
  const toneClass =
    tone === 'green'
      ? 'border-emerald-400/30 bg-emerald-400/5'
      : tone === 'amber'
        ? 'border-amber-400/40 bg-amber-400/10'
        : 'border-primary/15 bg-background/40';
  return (
    <div
      className={`rounded-lg border ${toneClass} p-2 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className={tone === 'amber' ? 'text-amber-300' : 'text-primary'}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-bold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
