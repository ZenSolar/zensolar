import { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { Sparkles, Sun, BatteryCharging, Car, Plug, Eye, EyeOff, Zap, ZapOff } from 'lucide-react';
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
import { OutageFooter } from '@/components/dashboard/OutageFooter';

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
 * Mounted in place of the lighter AnimatedEnergyFlow when Investor Demo
 * Mode is active. Includes a founder-only "Simulate Grid Outage" toggle
 * that flips the card into full Outage Mode (house diagram as hero,
 * integrated stats, Battery→Home dominant flow) and triggers the same
 * Deason outage context as a real outage — so the full Outage experience
 * + Deason behavior can be tested on demand.
 */
export function InvestorEnergyFlowCard() {
  const h = INVESTOR_DEMO_HEADLINE;
  const [showAnnotations, setShowAnnotations] = useState(true);
  const outageSim = useInvestorOutageSim();
  const outageActive = outageSim.active;

  // Select the dataset based on outage state.
  const flowData = outageActive ? INVESTOR_DEMO_OUTAGE_FLOW : INVESTOR_DEMO_FLOW;
  const teslaPayload = outageActive
    ? INVESTOR_DEMO_OUTAGE_TESLA_PAYLOAD
    : INVESTOR_DEMO_TESLA_PAYLOAD;

  // Outage hero stats (estimator math kept in lib/gridOutage to mirror live).
  const backupEst = outageActive
    ? estimateBackupTime({
        socPct: flowData.batteryPercent ?? 0,
        usableCapacityKwh: flowData.batteryCapacityKwh ?? 13.5,
        currentDischargeKw: Math.max(0, -(flowData.batteryPower ?? 0)),
        smoothingKey: 'investor-demo-outage',
      })
    : null;

  // Drive Deason's outage context whenever the simulation toggles. Mirrors
  // the seed payload `useOutageLifecycle` dispatches during a real outage
  // so chat chrome, transcript banner, and seeded assistant message all
  // light up identically.
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (outageActive && !wasActiveRef.current) {
      wasActiveRef.current = true;
      const startedAt = outageSim.startedAt ?? new Date();
      const label = backupEst?.label ?? '~3h';
      const soc = flowData.batteryPercent ?? null;
      const discharge = Math.max(0, -(flowData.batteryPower ?? 0));
      const startedClock = startedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const meta = {
        kind: 'grid_outage',
        phase: 'start',
        socPct: soc,
        backupLabel: label,
        dischargeKw: discharge,
        homeKw: flowData.homePower,
        source: 'demo',
        startedAt: startedAt.toISOString(),
        simulated: true,
      };
      const assistantSeed =
        `**Grid outage detected at ${startedClock}.** You're on Powerwall backup — everything important should stay on.\n\n` +
        `• **Backup remaining:** ~${label}` + (soc != null ? ` (battery ${Math.round(soc)}%)` : '') + `\n` +
        `• **Battery output:** ${discharge.toFixed(1)} kW\n` +
        `• **Home load:** about ${(flowData.homePower ?? 0).toFixed(1)} kW\n\n` +
        `**A few quick ways to stretch your backup:**\n` +
        `• **Pause EV charging** if anything is plugged in.\n` +
        `• **Hold off on the dryer, oven, or dishwasher** until grid power is back.\n` +
        `• **Nudge the thermostat** 2–3°F toward outside temp to ease the AC/heat-pump load.\n\n` +
        `**Stay safe** — if this outage lasts longer than expected or you need help, contact your utility company or 911 for emergencies.\n\n` +
        `_(Demo simulation — flip the toggle on the energy card to end.)_`;

      window.dispatchEvent(new CustomEvent('deason:nudge', { detail: { assistant: assistantSeed, meta } }));
      // Open after the context lands so chrome reflects outage state on first paint.
      window.setTimeout(() => window.dispatchEvent(new Event('deason:open')), 80);
    } else if (!outageActive && wasActiveRef.current) {
      wasActiveRef.current = false;
      window.dispatchEvent(
        new CustomEvent('deason:nudge', {
          detail: {
            assistant:
              '**Simulated outage ended.** Grid is back online and your battery will recharge from solar/grid. Toggle outage simulation again any time to retest the experience.',
            meta: { kind: 'grid_outage', phase: 'recovery', simulated: true },
          },
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outageActive]);

  return (
    <div
      className={`rounded-xl overflow-hidden p-4 transition-colors ${
        outageActive ? 'bg-amber-500/[0.03]' : 'bg-card/5'
      }`}
      style={{
        border: outageActive
          ? '1px solid hsla(38, 95%, 55%, 0.45)'
          : '1px solid hsla(170, 80%, 40%, 0.35)',
        boxShadow: outageActive
          ? '0 0 12px 1px hsla(38, 95%, 55%, 0.22), 0 0 30px 5px hsla(38, 95%, 55%, 0.10)'
          : '0 0 10px 1px hsla(170, 80%, 40%, 0.18), 0 0 28px 4px hsla(170, 80%, 40%, 0.08)',
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className={`h-4 w-4 ${outageActive ? 'text-amber-300' : 'text-primary'}`} />
            <h3 className="text-sm font-semibold text-foreground">
              {outageActive ? 'On Battery Backup' : 'ZenEnergy Monitoring · Live'}
            </h3>
            {outageActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                </span>
                Grid Offline
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
            <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200">
              {outageActive ? 'Demo: Outage Mode Active' : 'Demo'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {outageActive
              ? `Grid Outage · backup ~${backupEst?.label ?? '—'} · battery ${Math.round(flowData.batteryPercent ?? 0)}%`
              : 'Home Energy Cockpit · Enphase solar + Tesla Powerwall + Model Y + Wallbox'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            type="button"
            onClick={outageActive ? outageSim.disable : outageSim.enable}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] transition-colors ${
              outageActive
                ? 'border-amber-400/60 bg-amber-400/15 text-amber-200 hover:bg-amber-400/25'
                : 'border-primary/30 bg-background/50 text-foreground/85 hover:border-amber-400/50 hover:text-amber-200'
            }`}
            aria-pressed={outageActive}
          >
            {outageActive ? <ZapOff className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
            {outageActive ? 'End Outage Simulation' : 'Simulate Grid Outage'}
          </button>
          {!outageActive && (
            <button
              type="button"
              onClick={() => setShowAnnotations((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-background/40 px-2 py-0.5 text-[10px] font-medium text-foreground/80 hover:text-foreground hover:border-primary/40 transition-colors"
              aria-label={showAnnotations ? 'Hide annotations' : 'Show annotations'}
            >
              {showAnnotations ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showAnnotations ? 'Hide labels' : 'Show labels'}
            </button>
          )}
        </div>
      </div>


      <div
        className={`relative overflow-hidden rounded-xl border bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%),radial-gradient(circle_at_bottom,hsl(220_60%_8%/0.6),transparent_60%)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04),0_8px_30px_-8px_hsl(220_60%_4%/0.6)] ${
          outageActive ? 'border-amber-400/30' : 'border-primary/20'
        }`}
      >
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
            data={flowData}
            teslaPayload={teslaPayload}
            batteryCount={1}
            vehicleModel={null}
            isOutage={outageActive}
            outageBackupLabel={outageActive ? backupEst?.label : undefined}
            outageStartedAt={outageActive ? (outageSim.startedAt ?? undefined) : undefined}
          />
        </Suspense>

        {/* Inline annotation chips — explain what the investor is seeing.
            Hidden during outage so the hero diagram + integrated stats own
            the frame. */}
        {showAnnotations && !outageActive && (
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

      {/* Outage footer — slim load/capacity bar + history link. Mirrors the
          unified live-energy card during a real outage. */}
      {outageActive && (
        <div className="mt-2 rounded-xl border border-amber-400/25 overflow-hidden">
          <OutageFooter
            socPct={flowData.batteryPercent ?? 0}
            usableCapacityKwh={flowData.batteryCapacityKwh ?? 13.5}
            dischargeKw={Math.max(0, -(flowData.batteryPower ?? 0))}
            solarProducingKw={flowData.solarPower ?? 0}
          />
        </div>
      )}

      {/* Multi-OEM source chips — surface the foundational moat */}
      {!outageActive && (
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
      )}

      {/* Compact headline readout */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {outageActive ? (
          <>
            <ReadoutTile
              icon={<BatteryCharging className="h-3.5 w-3.5" />}
              label="From Battery"
              value={`${Math.max(0, -(flowData.batteryPower ?? 0)).toFixed(1)} kW`}
              tone="amber"
            />
            <ReadoutTile
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Backup"
              value={`~${backupEst?.label ?? '—'}`}
              tone="amber"
            />
            <ReadoutTile
              icon={<BatteryCharging className="h-3.5 w-3.5" />}
              label="Battery"
              value={`${Math.round(flowData.batteryPercent ?? 0)}%`}
              tone="amber"
            />
            <ReadoutTile
              icon={<Plug className="h-3.5 w-3.5" />}
              label="Grid"
              value="Offline"
              tone="muted"
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
        ? 'border-amber-400/35 bg-amber-400/[0.06]'
        : 'border-primary/15 bg-background/40';
  const iconClass =
    tone === 'amber' ? 'text-amber-300' : 'text-primary';
  return (
    <div
      className={`rounded-lg border ${toneClass} p-2 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <span className={iconClass}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-sm font-bold tabular-nums text-foreground">
        {value}
      </div>
    </div>
  );
}
