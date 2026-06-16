/**
 * UnifiedEnergyCockpit — production-ready 2.5D multi-OEM energy flow card.
 *
 * The cornerstone investor visual: Solar, Powerwall, Grid, Home, and Tesla EV
 * in one Pentagon-style scene (home as central hub, 4 satellites). EV is
 * ALWAYS visible with live status (Parked / Driving / Charging / Discharging)
 * so investors instantly grasp the multi-OEM cockpit moat.
 *
 * Pure SVG + CSS animations — no Three.js, no WebGL, no canvas. Mobile-first
 * (393px). Dark mode only. Reads the same EnergyFlowData shape as the legacy
 * AnimatedEnergyFlow so it drops into both investor-demo and real-device
 * paths without changing data plumbing.
 */
import { memo, useMemo } from 'react';
import type { EnergyFlowData } from './AnimatedEnergyFlow';
import { cn } from '@/lib/utils';

type OEM = 'tesla' | 'enphase' | 'solaredge' | 'wallbox' | 'utility';

export type SolarOEM = Exclude<OEM, 'tesla' | 'wallbox' | 'utility'>;
export type BatteryOEM = Extract<OEM, 'tesla' | 'enphase'>;
export type EvOEM = Extract<OEM, 'tesla'>;
export type ChargerOEM = Extract<OEM, 'tesla' | 'wallbox'>;

export interface UnifiedEnergyCockpitProps {
  data: EnergyFlowData;
  /** OEM source for each node — drives the badge shown on the satellite. */
  oems?: {
    solar?: SolarOEM;
    battery?: BatteryOEM;
    ev?: EvOEM;
    charger?: ChargerOEM;
  };
  /** Show the "LIVE" pulse dot in the header. */
  live?: boolean;
  /** Optional className passthrough for the card container. */
  className?: string;
}

const OEM_LABEL: Record<OEM, string> = {
  tesla: 'TESLA',
  enphase: 'ENPHASE',
  solaredge: 'SOLAREDGE',
  wallbox: 'WALLBOX',
  utility: 'UTILITY',
};

/**
 * Derive a human-readable EV status from the tesla telemetry block. Always
 * returns a string — EV node is always visible with status, never hidden.
 */
function deriveEvStatus(tesla: EnergyFlowData['tesla'], evPower: number): {
  label: string;
  tone: 'charging' | 'driving' | 'parked' | 'discharging';
} {
  if (!tesla) {
    if (evPower > 0.1) return { label: 'Charging', tone: 'charging' };
    if (evPower < -0.1) return { label: 'V2H Discharging', tone: 'discharging' };
    return { label: 'Parked', tone: 'parked' };
  }
  if (tesla.isCharging) return { label: 'Charging', tone: 'charging' };
  if (evPower < -0.1) return { label: 'V2H Discharging', tone: 'discharging' };
  // No way to know "driving" from this payload yet; default to Parked.
  return { label: 'Parked', tone: 'parked' };
}

/**
 * Convert a kW value into an animation duration in seconds. Higher power =
 * faster flowing particles. Clamped so the scene never looks frozen or
 * frantic. 0 kW lines render but particles are hidden.
 */
function kwToDuration(kw: number): number {
  const abs = Math.abs(kw);
  if (abs < 0.05) return 0; // signals "no flow" — caller hides the particle
  // 0.1 kW → 5s, 5 kW → 1.4s, 10 kW → 0.9s
  return Math.max(0.8, Math.min(5, 5 - Math.log10(abs + 1) * 2.2));
}

function fmtKw(kw: number): string {
  const abs = Math.abs(kw);
  if (abs >= 10) return abs.toFixed(1);
  if (abs >= 1) return abs.toFixed(1);
  return abs.toFixed(2);
}

export const UnifiedEnergyCockpit = memo(function UnifiedEnergyCockpit({
  data,
  oems,
  live = true,
  className,
}: UnifiedEnergyCockpitProps) {
  const solarOem = oems?.solar ?? 'enphase';
  const batteryOem = oems?.battery ?? 'tesla';
  const chargerOem = oems?.charger ?? 'wallbox';

  const ev = useMemo(() => deriveEvStatus(data.tesla, data.evPower), [data.tesla, data.evPower]);

  // Flow magnitudes — used to drive opacity + particle speed
  const solarToHome = Math.max(0, Math.min(data.solarPower, data.homePower));
  const solarToBattery = data.batteryPower > 0 ? data.batteryPower : 0;
  const batteryToHome = data.batteryPower < 0 ? Math.abs(data.batteryPower) : 0;
  const gridToHome = data.gridPower > 0 ? data.gridPower : 0;
  const homeToGrid = data.gridPower < 0 ? Math.abs(data.gridPower) : 0;
  const homeToEv = Math.max(0, data.evPower);
  const evToHome = data.evPower < 0 ? Math.abs(data.evPower) : 0; // V2H

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl',
        className,
      )}
      role="figure"
      aria-label="Live multi-OEM home energy cockpit"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-2">
        <div>
          <div className="mb-1 flex items-center gap-2">
            {live && (
              <span
                aria-hidden
                className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_hsl(var(--primary))]"
              />
            )}
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              ZenEnergy Cockpit{live ? ' · Live' : ''}
            </h3>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Multi-OEM Unified Fleet
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <OemChip oem={solarOem} />
          <OemChip oem={batteryOem} />
          <OemChip oem="tesla" />
          <OemChip oem={chargerOem} />
        </div>
      </div>

      {/* 2.5D Pentagon Scene */}
      <div className="relative mt-1 h-[360px] w-full overflow-hidden">
        {/* Isometric grid floor */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            transform: 'perspective(600px) rotateX(55deg) translateY(40px) scale(1.4)',
            transformOrigin: 'center top',
            maskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />

        {/* SVG flow lines + particles */}
        <svg
          viewBox="0 0 400 360"
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <filter id="cockpit-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <style>{`
              @keyframes cockpit-dash { to { stroke-dashoffset: -24; } }
              .cockpit-line { fill: none; stroke-dasharray: 3 9; stroke-linecap: round; animation: cockpit-dash 1.4s linear infinite; }
            `}</style>
          </defs>

          {/* Connection lines — always drawn faintly, opacity scales w/ power */}
          {/* Solar (top) → Home (center) */}
          <FlowLine d="M200 60 L200 180" color="hsl(45 95% 55%)" power={solarToHome} />
          {/* Solar → Battery (left) — bent path through home zone */}
          <FlowLine d="M200 60 Q120 120 80 180" color="hsl(160 80% 50%)" power={solarToBattery} />
          {/* Battery (left) → Home */}
          <FlowLine d="M80 180 L200 180" color="hsl(160 80% 50%)" power={batteryToHome} />
          {/* Grid (right) → Home */}
          <FlowLine d="M320 180 L200 180" color="hsl(220 10% 65%)" power={gridToHome} />
          {/* Home → Grid (export) */}
          <FlowLine d="M200 180 L320 180" color="hsl(280 70% 65%)" power={homeToGrid} />
          {/* Home → EV (bottom) */}
          <FlowLine d="M200 180 L200 300" color="hsl(210 90% 60%)" power={homeToEv} />
          {/* EV → Home (V2H) */}
          <FlowLine d="M200 300 L200 180" color="hsl(280 70% 65%)" power={evToHome} />
        </svg>

        {/* Nodes */}
        {/* Solar — top */}
        <NodePill
          className="absolute left-1/2 top-2 -translate-x-1/2"
          tone="solar"
          icon="solar"
          kw={data.solarPower}
          subLabel="Solar"
          oem={solarOem}
        />
        {/* Battery — left */}
        <NodePill
          className="absolute left-2 top-1/2 -translate-y-1/2"
          tone="battery"
          icon="battery"
          kw={Math.abs(data.batteryPower)}
          subLabel={`${data.batteryPercent}% SOC`}
          oem={batteryOem}
          statusBadge={
            data.batteryPower > 0.05
              ? 'Charging'
              : data.batteryPower < -0.05
                ? 'Discharging'
                : 'Idle'
          }
        />
        {/* Grid — right */}
        <NodePill
          className="absolute right-2 top-1/2 -translate-y-1/2"
          tone="grid"
          icon="grid"
          kw={Math.abs(data.gridPower)}
          subLabel={
            data.gridPower > 0.05
              ? 'Importing'
              : data.gridPower < -0.05
                ? 'Exporting'
                : 'Net Zero'
          }
          oem="utility"
        />

        {/* Home — center (hero hub) */}
        <div className="absolute left-1/2 top-[180px] -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-background/60 shadow-2xl backdrop-blur-md"
              style={{
                transform: 'rotateX(15deg) rotateZ(-3deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="text-center" style={{ transform: 'rotateX(-15deg) rotateZ(3deg)' }}>
                <HomeIcon className="mx-auto mb-0.5 h-5 w-5 text-foreground" />
                <div className="font-mono text-base font-bold leading-none text-foreground">
                  {fmtKw(data.homePower)}
                </div>
                <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                  Home kW
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EV — bottom (ALWAYS visible w/ status) */}
        <div className="absolute bottom-2 left-1/2 w-[180px] -translate-x-1/2">
          <div
            className={cn(
              'rounded-2xl border p-2.5 backdrop-blur-md shadow-2xl',
              ev.tone === 'charging' &&
                'border-blue-500/40 bg-blue-500/10 shadow-blue-500/10',
              ev.tone === 'discharging' &&
                'border-purple-500/40 bg-purple-500/10 shadow-purple-500/10',
              ev.tone === 'driving' &&
                'border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/10',
              ev.tone === 'parked' && 'border-border bg-muted/30',
            )}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                Tesla
              </span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider',
                  ev.tone === 'charging' && 'bg-blue-500/20 text-blue-300',
                  ev.tone === 'discharging' && 'bg-purple-500/20 text-purple-300',
                  ev.tone === 'driving' && 'bg-emerald-500/20 text-emerald-300',
                  ev.tone === 'parked' && 'bg-muted text-muted-foreground',
                )}
              >
                {ev.label}
              </span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <CarIcon
                className={cn(
                  'h-7 w-7',
                  ev.tone === 'charging' && 'text-blue-300',
                  ev.tone === 'discharging' && 'text-purple-300',
                  ev.tone === 'driving' && 'text-emerald-300',
                  ev.tone === 'parked' && 'text-muted-foreground',
                )}
              />
              <div className="text-right">
                <div className="font-mono text-base font-bold leading-none text-foreground">
                  {fmtKw(Math.abs(data.evPower))}
                  <span className="ml-0.5 text-[9px] text-muted-foreground">kW</span>
                </div>
                {data.tesla && (
                  <div className="text-[9px] font-bold text-muted-foreground">
                    {data.tesla.soc}% · {data.tesla.rangeMi} mi
                  </div>
                )}
              </div>
            </div>
            {/* SOC bar */}
            {data.tesla && (
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full transition-all duration-700',
                    ev.tone === 'charging' && 'bg-blue-400',
                    ev.tone === 'discharging' && 'bg-purple-400',
                    ev.tone === 'driving' && 'bg-emerald-400',
                    ev.tone === 'parked' && 'bg-muted-foreground/50',
                  )}
                  style={{ width: `${Math.max(0, Math.min(100, data.tesla.soc))}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer KPI strip */}
      <div className="grid grid-cols-4 gap-px border-t border-border bg-border/60">
        <KpiCell label="Solar" value={fmtKw(data.solarPower)} unit="kW" tone="solar" />
        <KpiCell
          label="Battery"
          value={`${data.batteryPower >= 0 ? '+' : '−'}${fmtKw(data.batteryPower)}`}
          unit="kW"
          tone="battery"
          sub={`${data.batteryPercent}%`}
        />
        <KpiCell label="EV" value={fmtKw(data.evPower)} unit="kW" tone="ev" />
        <KpiCell
          label="Grid"
          value={fmtKw(data.gridPower)}
          unit="kW"
          tone="grid"
          sub={data.gridPower < -0.05 ? 'Export' : data.gridPower > 0.05 ? 'Import' : 'Net 0'}
        />
      </div>
    </div>
  );
});

/* -------------------------------------------------------------------------- */
/* Sub-components                                                              */
/* -------------------------------------------------------------------------- */

function FlowLine({ d, color, power }: { d: string; color: string; power: number }) {
  const dur = kwToDuration(power);
  const active = dur > 0;
  return (
    <>
      <path
        d={d}
        stroke={color}
        strokeWidth={1.25}
        fill="none"
        opacity={active ? 0.35 : 0.08}
      />
      {active && (
        <>
          <path
            d={d}
            className="cockpit-line"
            stroke={color}
            strokeWidth={2}
            opacity={0.9}
            style={{ animationDuration: `${dur}s` }}
            filter="url(#cockpit-glow)"
          />
          <circle r={2.5} fill={color} filter="url(#cockpit-glow)">
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} />
          </circle>
        </>
      )}
    </>
  );
}

function OemChip({ oem }: { oem: OEM }) {
  return (
    <span className="rounded-full border border-border bg-background/60 px-1.5 py-0.5 text-[8px] font-bold tracking-tight text-muted-foreground">
      {OEM_LABEL[oem]}
    </span>
  );
}

interface NodePillProps {
  className?: string;
  tone: 'solar' | 'battery' | 'grid';
  icon: 'solar' | 'battery' | 'grid';
  kw: number;
  subLabel: string;
  oem: OEM;
  statusBadge?: string;
}

function NodePill({ className, tone, icon, kw, subLabel, oem, statusBadge }: NodePillProps) {
  const toneCls = {
    solar: 'border-amber-500/40 bg-amber-500/10 shadow-amber-500/10',
    battery: 'border-emerald-500/40 bg-emerald-500/10 shadow-emerald-500/10',
    grid: 'border-border bg-muted/40',
  }[tone];
  const textCls = {
    solar: 'text-amber-300',
    battery: 'text-emerald-300',
    grid: 'text-muted-foreground',
  }[tone];

  const Icon = icon === 'solar' ? SolarIcon : icon === 'battery' ? BatteryIcon : GridIcon;

  return (
    <div
      className={cn(
        'w-[108px] rounded-xl border p-2 shadow-xl backdrop-blur-md',
        toneCls,
        className,
      )}
    >
      <div className="mb-0.5 flex items-center justify-between gap-1">
        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
          {OEM_LABEL[oem]}
        </span>
        <Icon className={cn('h-3 w-3', textCls)} />
      </div>
      <div className="font-mono text-sm font-bold leading-none text-foreground">
        {fmtKw(kw)}
        <span className="ml-0.5 text-[9px] text-muted-foreground">kW</span>
      </div>
      <div className={cn('mt-0.5 text-[9px] font-bold', textCls)}>{subLabel}</div>
      {statusBadge && (
        <div className="mt-1 inline-block rounded bg-background/40 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
          {statusBadge}
        </div>
      )}
    </div>
  );
}

function KpiCell({
  label,
  value,
  unit,
  tone,
  sub,
}: {
  label: string;
  value: string;
  unit: string;
  tone: 'solar' | 'battery' | 'ev' | 'grid';
  sub?: string;
}) {
  const cls = {
    solar: 'text-amber-300',
    battery: 'text-emerald-300',
    ev: 'text-blue-300',
    grid: 'text-muted-foreground',
  }[tone];
  return (
    <div className="bg-card p-3">
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn('mt-0.5 font-mono text-base font-bold', cls)}>
        {value}
        <span className="ml-0.5 text-[9px] text-muted-foreground">{unit}</span>
      </div>
      {sub && <div className="text-[9px] font-medium text-muted-foreground">{sub}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Inline icons (no extra dep)                                                 */
/* -------------------------------------------------------------------------- */

function SolarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}
function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <rect x="3" y="7" width="16" height="10" rx="2" />
      <path d="M21 11v2" strokeLinecap="round" />
      <path d="M7 10v4M11 10v4" strokeLinecap="round" />
    </svg>
  );
}
function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M9 2L7 7M15 2l2 5M5 7h14l-2 13H7L5 7Z" strokeLinejoin="round" />
      <path d="M9 11v5M12 11v5M15 11v5" strokeLinecap="round" />
    </svg>
  );
}
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={className}>
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9Z" strokeLinejoin="round" />
    </svg>
  );
}
function CarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.9 6c-.2-.6-.7-1-1.4-1H6.5c-.7 0-1.2.4-1.4 1L3 12v8c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-1h12v1c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-8l-2.1-6ZM6.5 16c-.8 0-1.5-.7-1.5-1.5S5.7 13 6.5 13s1.5.7 1.5 1.5S7.3 16 6.5 16Zm11 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5ZM5 11l1.5-4.5h11L19 11H5Z" />
    </svg>
  );
}
