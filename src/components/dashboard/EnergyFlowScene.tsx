/**
 * Live Energy Monitoring — ZenCasa-style scene renderer.
 *
 * Replaces the legacy SVG `AnimatedEnergyFlow` for production use.
 * Strategy:
 *   - 7 pre-rendered isometric 3D house PNGs (one per energy state).
 *   - Selector picks the right scene from `EnergyFlowData`; transitions crossfade.
 *   - Four floating labels (Solar / Home / Powerwall / Grid) overlay the image.
 *   - No orbiting particles, no perimeter node grid, no text-on-house overlap.
 *
 * Hero assets in src/assets/zencasa/ are AI-generated for v1 — they share an
 * asset slot (same names, same dimensions) so commissioned Blender renders
 * can be dropped in pre-launch without touching this file.
 */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EnergyFlowData } from './AnimatedEnergyFlow';

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

/** Pure scene-selection function — easy to unit-test. */
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

  // Combined night states win first (they show the most context)
  if (!sunUp && evCharging && pwDischarging) return 'night-pw-discharge-ev';
  if (!sunUp && evCharging) return 'night-ev';
  if (!sunUp && pwDischarging) return 'night-pw-discharge';
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
}: {
  position: 'tl' | 'tr' | 'bl' | 'br';
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'amber' | 'blue' | 'muted';
  active?: boolean;
}) {
  const pos: Record<typeof position, string> = {
    tl: 'top-2 left-2 items-start text-left',
    tr: 'top-2 right-2 items-end text-right',
    bl: 'bottom-2 left-2 items-start text-left',
    br: 'bottom-2 right-2 items-end text-right',
  };
  const dot: Record<NonNullable<typeof accent>, string> = {
    green: 'bg-emerald-400 shadow-[0_0_8px_hsla(142,76%,50%,0.7)]',
    amber: 'bg-amber-400 shadow-[0_0_8px_hsla(38,92%,55%,0.7)]',
    blue: 'bg-sky-400 shadow-[0_0_8px_hsla(205,90%,55%,0.7)]',
    muted: 'bg-muted-foreground/40',
  };
  return (
    <div className={`pointer-events-none absolute z-10 flex flex-col gap-0.5 ${pos[position]}`}>
      <div className="flex items-center gap-1.5">
        {active && accent && accent !== 'muted' && (
          <span aria-hidden="true" className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot[accent]}`}>
            <span className={`absolute inset-0 inline-flex h-full w-full animate-ping rounded-full ${dot[accent]} opacity-70`} />
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="text-xl font-light tabular-nums leading-none text-foreground sm:text-2xl">
        {value}
      </div>
      {sub && (
        <div className="text-[10px] font-medium tracking-wide text-muted-foreground/90">
          {sub}
        </div>
      )}
    </div>
  );
}

export interface EnergyFlowSceneProps {
  data: EnergyFlowData;
  className?: string;
  /** Override scene selection — used by admin preview. */
  forceScene?: SceneKey;
}

export function EnergyFlowScene({ data, className, forceScene }: EnergyFlowSceneProps) {
  const scene = useMemo(() => forceScene ?? pickScene(data), [forceScene, data]);

  const solar = data.solarPower ?? 0;
  const battery = data.batteryPower ?? 0;
  const grid = data.gridPower ?? 0;
  const soc = Math.round(data.batteryPercent ?? 0);

  const fmtKw = (v: number) => `${Math.abs(v).toFixed(1)} kW`;
  const arrow = (v: number, threshold = 0.05) =>
    v > threshold ? '▲' : v < -threshold ? '▼' : '';

  return (
    <div
      className={`relative isolate aspect-square w-full overflow-hidden ${className ?? ''}`}
      data-scene={scene}
    >
      {/* Ambient gradient floor */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,hsl(220_50%_10%/0.7),transparent_70%),radial-gradient(circle_at_bottom,hsl(var(--primary)/0.08),transparent_60%)]"
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
          className="absolute inset-x-0 top-1/2 mx-auto h-[78%] w-auto max-w-[92%] -translate-y-1/2 select-none object-contain"
          draggable={false}
        />
      </AnimatePresence>

      {/* Floating labels — Tesla ZenCasa layout (4 corners, no house overlap) */}
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
        accent="muted"
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
