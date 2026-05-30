/**
 * Live Energy Monitoring — ZenCasa-style scene renderer.
 *
 * Replaces the legacy SVG `AnimatedEnergyFlow` for production use.
 * Strategy:
 *   - 7 pre-rendered isometric 3D house PNGs (one per energy state).
 *   - Optional Tesla vehicle PNG composited over the driveway, model-aware.
 *   - SVG overlay draws a dramatic glowing conduit when the Powerwall
 *     discharges into the home (Tesla ZenCasa "alive at night" feel).
 *   - Four floating labels (Solar / Home / Powerwall / Grid) overlay the
 *     image with hero-grade typography on Home kW.
 *
 * Hero assets in src/assets/zencasa/ are AI-generated for v1 — they share an
 * asset slot (same names, same dimensions) so commissioned Blender renders
 * can be dropped in pre-launch without touching this file.
 */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EnergyFlowData } from './AnimatedEnergyFlow';
import {
  collectBatteryTelemetryDebug,
  resolveVehicleAsset,
  type VehicleColor,
  type VehicleModel,
} from './EnergyFlowScene.scenes';

import sceneDay from '@/assets/zencasa/house-day.png';
import sceneDusk from '@/assets/zencasa/house-dusk.png';
import sceneNight from '@/assets/zencasa/house-night.png';
import sceneNightEv from '@/assets/zencasa/house-night-ev.png';
import sceneNightPw from '@/assets/zencasa/house-night-pw-discharge.png';
import sceneNightPwEv from '@/assets/zencasa/house-night-pw-discharge-ev.png';
import sceneDayExport from '@/assets/zencasa/house-day-export.png';

export type SceneKey =
  | 'day'
  | 'dusk'
  | 'night'
  | 'night-ev'
  | 'night-pw-discharge'
  | 'night-pw-discharge-ev'
  | 'day-export';

const SCENE_SRC: Record<SceneKey, string> = {
  day: sceneDay,
  dusk: sceneDusk,
  night: sceneNight,
  'night-ev': sceneNightEv,
  'night-pw-discharge': sceneNightPw,
  'night-pw-discharge-ev': sceneNightPwEv,
  'day-export': sceneDayExport,
};

/**
 * Pure scene-selection function — easy to unit-test.
 *
 * Note: the dynamically-overlaid Tesla render (model + color matched) is the
 * single source of truth for the vehicle, so this picker prefers base scenes
 * (no baked-in EV) whenever an overlay is available. The `*-ev` baked scenes
 * remain available as fallbacks when no overlay can be rendered.
 */
export function pickScene(
  d: EnergyFlowData,
  now: Date = new Date(),
): SceneKey {
  const solar = d.solarPower ?? 0;
  const grid = d.gridPower ?? 0;
  const battery = d.batteryPower ?? 0;
  const evCharging = (d.tesla?.isCharging ?? false) || (d.evPower ?? 0) > 0.1;
  const pwDischarging = battery < -0.1;
  const exporting = grid < -0.1;
  const sunUp = solar > 0.1;

  if (!sunUp && pwDischarging) return 'night-pw-discharge';
  if (!sunUp && evCharging) return 'night-ev';
  if (sunUp && exporting) return 'day-export';
  if (sunUp) {
    const hour = now.getHours();
    return hour >= 17 || hour < 6 ? 'dusk' : 'day';
  }
  return 'night';
}

function FlowLabel({
  position,
  label,
  value,
  sub,
  accent,
  active,
  hero,
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'amber' | 'blue' | 'muted';
  active?: boolean;
  /** Hero typography (used for Home kW). */
  hero?: boolean;
}) {
  const pos: Record<typeof position, string> = {
    tl: 'top-2.5 left-2.5 items-start text-left',
    tr: 'top-2.5 right-2.5 items-end text-right',
    bl: 'bottom-2.5 left-2.5 items-start text-left',
    br: 'bottom-2.5 right-2.5 items-end text-right',
  };
  const dot: Record<NonNullable<typeof accent>, string> = {
    green: 'bg-emerald-400 shadow-[0_0_10px_hsla(142,76%,50%,0.85)]',
    amber: 'bg-amber-400 shadow-[0_0_10px_hsla(38,92%,55%,0.85)]',
    blue: 'bg-sky-400 shadow-[0_0_10px_hsla(205,90%,55%,0.85)]',
    muted: 'bg-muted-foreground/40',
  };
  const valueGlow: Record<NonNullable<typeof accent>, string> = {
    green: 'drop-shadow-[0_0_14px_hsla(142,76%,55%,0.55)]',
    amber: 'drop-shadow-[0_0_14px_hsla(38,92%,60%,0.55)]',
    blue: 'drop-shadow-[0_0_14px_hsla(205,90%,60%,0.55)]',
    muted: '',
  };
  return (
    <div className={`pointer-events-none absolute z-20 flex max-w-[55%] flex-col gap-0.5 ${pos[position]}`}>
      <div className="flex items-center gap-1.5">
        {active && accent && accent !== 'muted' && (
          <span aria-hidden="true" className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot[accent]}`}>
            <span className={`absolute inset-0 inline-flex h-full w-full animate-ping rounded-full ${dot[accent]} opacity-70`} />
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
          {label}
        </span>
      </div>
      <div
        className={
          hero
            ? `text-[34px] sm:text-[42px] font-semibold tabular-nums leading-none tracking-tight text-foreground ${active && accent ? valueGlow[accent] : ''}`
            : `text-xl sm:text-[22px] font-light tabular-nums leading-none text-foreground ${active && accent ? valueGlow[accent] : ''}`
        }
        style={hero ? { textShadow: '0 1px 0 hsl(220 60% 4% / 0.6), 0 0 32px hsl(var(--primary) / 0.18)' } : undefined}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] font-medium tracking-wide text-muted-foreground/95">
          {sub}
        </div>
      )}
    </div>
  );
}

/**
 * Generic animated conduit with LED-crawl. Used for every directional
 * energy flow in the scene. Colors are kept consistent across the app:
 *   - emerald → clean energy production / charging (solar, PW charging, EV charging)
 *   - amber   → Powerwall discharging
 *   - sky     → grid import
 *   - cyan    → grid export
 */
function FlowConduit({
  active,
  d,
  color,
  edgeColor,
  ledColor,
  dur = 1.4,
  reverse = false,
  width = 2,
  zIndex = 15,
}: {
  active: boolean;
  d: string;
  color: string;
  edgeColor: string;
  ledColor: string;
  dur?: number;
  reverse?: boolean;
  width?: number;
  zIndex?: number;
}) {
  if (!active) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex }}
    >
      <defs>
        <filter id={`glow-${d.length}-${color.length}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={d} stroke={edgeColor} strokeOpacity="0.22" strokeWidth={width + 3} strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeOpacity="0.85" strokeWidth={width} strokeLinecap="round" fill="none" />
      <path
        d={d}
        stroke={ledColor}
        strokeWidth={Math.max(1, width - 0.6)}
        strokeLinecap="round"
        fill="none"
        strokeDasharray="3 12"
        opacity="0.95"
      >
        <animate
          attributeName="stroke-dashoffset"
          from={reverse ? '-30' : '0'}
          to={reverse ? '0' : '-30'}
          dur={`${dur}s`}
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

// Anchor points (viewBox 0–100):
//   Solar (rooftop center)  : 50, 22
//   Home  (center hub)      : 55, 50
//   Powerwall (lower-left)  : 20, 76
//   Grid  (right edge)      : 92, 46
//   EV    (driveway car)    : 35, 82
const PATH_SOLAR_HOME = 'M 50 22 Q 53 36 55 50';
const PATH_SOLAR_PW = 'M 50 22 Q 32 48 22 74';
const PATH_PW_HOME = 'M 22 76 Q 38 66 55 52';
const PATH_GRID_HOME = 'M 90 46 Q 75 49 56 50';
const PATH_HOME_EV = 'M 55 52 Q 46 68 36 80';

const EMERALD = 'hsl(142 76% 55%)';
const EMERALD_LED = 'hsl(142 90% 78%)';
const AMBER = 'hsl(38 95% 55%)';
const AMBER_LED = 'hsl(45 100% 80%)';
const SKY = 'hsl(205 90% 60%)';
const SKY_LED = 'hsl(195 95% 80%)';
const CYAN = 'hsl(180 85% 55%)';
const CYAN_LED = 'hsl(180 95% 80%)';

function BatteryDebugPanel({ rows }: { rows: ReturnType<typeof collectBatteryTelemetryDebug> }) {
  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-2 z-30 rounded-lg border border-primary/20 bg-background/80 p-2 text-[9px] shadow-[0_10px_28px_hsl(220_70%_3%/0.5)] backdrop-blur-md">
      <div className="mb-1 flex items-center justify-between gap-2 font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <span>Powerwall debug</span>
        <span className="normal-case tracking-normal text-primary">+ charging · − discharging</span>
      </div>
      <div className="grid grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr] gap-x-2 gap-y-0.5 font-mono tabular-nums text-muted-foreground">
        {rows.map((row) => (
          <div key={row.key} className={`contents ${row.used ? 'text-foreground' : ''}`}>
            <span className={`truncate ${row.used ? 'font-semibold text-primary' : ''}`}>{row.used ? '✓ ' : ''}{row.key}</span>
            <span>{row.raw === null ? '—' : row.raw.toFixed(2)}</span>
            <span>{row.renderedKw === null ? '—' : `${row.sign}${Math.abs(row.renderedKw).toFixed(2)} kW`}</span>
            <span className={row.meaning === 'Charging' ? 'text-emerald-300' : row.meaning === 'Discharging' ? 'text-amber-300' : ''}>{row.meaning}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface EnergyFlowSceneProps {
  data: EnergyFlowData;
  className?: string;
  /** Override scene selection — used by admin preview. */
  forceScene?: SceneKey;
  /** Override vehicle model — used by admin preview. */
  vehicleModel?: VehicleModel | null;
  /** Override vehicle color — used by admin preview. */
  vehicleColor?: VehicleColor | null;
  /** Raw Tesla payload — used to auto-detect model + color when overrides omitted. */
  teslaPayload?: unknown;
  /** Raw Powerwall/battery payload — debug-only readout for sign/source verification. */
  batteryPayload?: unknown;
}

export function EnergyFlowScene({
  data,
  className,
  forceScene,
  vehicleModel,
  vehicleColor,
  teslaPayload,
  batteryPayload,
}: EnergyFlowSceneProps) {
  const scene = useMemo(() => forceScene ?? pickScene(data), [forceScene, data]);
  const hasTeslaConnection = Boolean(teslaPayload) || Boolean(data.tesla) || (data.evPower ?? 0) > 0.1;

  const { model: resolvedVehicle, color: resolvedColor, src: vehicleSrc } = useMemo(
    () =>
      resolveVehicleAsset(teslaPayload, {
        model: vehicleModel,
        color: vehicleColor,
      }, { fallbackWhenConnected: hasTeslaConnection }),
    [teslaPayload, vehicleModel, vehicleColor, hasTeslaConnection],
  );

  const solar = data.solarPower ?? 0;
  const battery = data.batteryPower ?? 0;
  const grid = data.gridPower ?? 0;
  const soc = Math.round(data.batteryPercent ?? 0);
  const isCharging = data.tesla?.isCharging ?? false;
  const pwDischarging = battery < -0.05;
  const batteryDebugRows = useMemo(
    () => collectBatteryTelemetryDebug(batteryPayload, battery),
    [batteryPayload, battery],
  );

  const fmtKw = (v: number) => `${Math.abs(v).toFixed(1)} kW`;
  const arrow = (v: number, threshold = 0.05) =>
    v > threshold ? '▲' : v < -threshold ? '▼' : '';

  return (
    <div
      className={`relative isolate aspect-square w-full overflow-hidden ${className ?? ''}`}
      data-scene={scene}
      data-vehicle={resolvedVehicle ?? 'none'}
      data-vehicle-color={resolvedColor ?? 'none'}
    >
      {/* Ambient gradient floor with stronger depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,hsl(220_50%_12%/0.85),transparent_65%),radial-gradient(circle_at_50%_95%,hsl(var(--primary)/0.14),transparent_55%),linear-gradient(to_bottom,hsl(220_60%_6%/0.4),hsl(220_70%_3%/0.7))]"
      />

      {/* Crossfading hero scene */}
      <AnimatePresence mode="sync">
        <motion.img
          key={scene}
          src={SCENE_SRC[scene]}
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="absolute inset-x-0 top-1/2 mx-auto h-[80%] w-auto max-w-[94%] -translate-y-1/2 select-none object-contain drop-shadow-[0_24px_40px_hsl(220_70%_3%/0.55)]"
          draggable={false}
        />
      </AnimatePresence>

      {/* Dramatic Powerwall → Home discharge conduit */}
      <DischargeConduit active={pwDischarging} />

      {/* Dynamic Tesla vehicle in driveway — exact model + color */}
      {resolvedVehicle && vehicleSrc && (
        <AnimatePresence mode="sync">
          <motion.div
            key={`${resolvedVehicle}-${resolvedColor ?? 'default'}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="pointer-events-none absolute bottom-[14%] left-[18%] z-[12] w-[34%]"
          >
            {/* Soft contact shadow */}
            <div
              aria-hidden="true"
              className="absolute inset-x-2 bottom-1 h-3 rounded-full bg-[radial-gradient(ellipse_at_center,hsl(220_70%_2%/0.7),transparent_70%)] blur-[2px]"
            />
            <img
              src={vehicleSrc}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="relative h-auto w-full select-none object-contain drop-shadow-[0_14px_22px_hsl(220_70%_3%/0.6)]"
              draggable={false}
            />
            {/* Charge-port glow when actively charging */}
            {isCharging && (
              <span
                aria-hidden="true"
                className="absolute right-[10%] top-1/2 inline-flex h-2 w-2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_16px_4px_hsla(142,76%,55%,0.8)]"
              >
                <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Floating labels — Tesla ZenCasa layout */}
      <FlowLabel
        position="tl"
        label="Solar"
        value={fmtKw(solar)}
        sub={solar > 0.1 ? 'Producing' : 'Idle'}
        accent="amber"
        active={solar > 0.1}
      />
      <FlowLabel
        position="tr"
        label="Home"
        value={fmtKw(data.homePower ?? 0)}
        sub={(data.homePower ?? 0) > 0.05 ? 'Drawing' : 'Idle'}
        accent={(data.homePower ?? 0) > 0.05 ? 'green' : 'muted'}
        active={(data.homePower ?? 0) > 0.05}
        hero
      />
      <FlowLabel
        position="bl"
        label="Powerwall"
        value={`${fmtKw(battery)} ${arrow(battery)}`.trim()}
        sub={
          battery > 0.05
            ? `${soc}% · Charging`
            : battery < -0.05
              ? `${soc}% · Discharging`
              : `${soc}% · ${soc >= 99 ? 'Full' : 'Idle'}`
        }
        accent={battery > 0.05 ? 'green' : battery < -0.05 ? 'amber' : 'muted'}
        active={Math.abs(battery) > 0.05}
      />
      <FlowLabel
        position="br"
        label="Grid"
        value={`${fmtKw(grid)} ${arrow(grid)}`.trim()}
        sub={
          grid > 0.05 ? 'Importing' : grid < -0.05 ? 'Exporting' : 'Balanced'
        }
        accent={grid < -0.05 ? 'blue' : grid > 0.05 ? 'amber' : 'muted'}
        active={Math.abs(grid) > 0.05}
      />
    </div>
  );
}
