/**
 * EnergyFlowScene — ZenEnergy Monitoring Live card (v4, clean-slate rebuild).
 *
 * Architecture:
 *   - 4 pre-rendered isometric 3D house PNGs (day/night/night-ev/rain). All
 *     four share identical camera, scale, and feature positions so a single
 *     HomeBlueprint locks every halo, dot, and dynamic-vehicle overlay.
 *   - One SVG overlay aligned to the hero PNG's content box, hosting:
 *       · DeviceHalo per device (primary visual language)
 *       · Glowing-windows warm overlay when home is drawing power
 *       · DottedFlow lines for at most 1–2 priority flows
 *       · Dynamic Tesla as an SVG <image> anchored to the blueprint's
 *         carPark coordinate — same coordinate space as halos, so it can
 *         never drift relative to the house.
 *   - Floating labels (Solar / Home / Powerwall / Grid) in card corners.
 *
 * Crossfade rules:
 *   - EV charging at night → baked `house-night-ev.png` and the dynamic car
 *     overlay is suppressed (the baked car is already in the garage).
 *   - All other states → base `house-day.png` / `house-night.png` and the
 *     dynamic car overlay parks in the driveway (only when telemetry tells
 *     us a Tesla is actually connected).
 *
 * v3 archived to ./archive/EnergyFlowScene.v3.tsx.
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { EnergyFlowData } from './AnimatedEnergyFlow';
import {
  resolveVehicleAsset,
  type VehicleColor,
  type VehicleModel,
} from './EnergyFlowScene.scenes';
import { HOME_BLUEPRINT, BLUEPRINT_PATHS } from './HomeBlueprint';

import sceneDay from '@/assets/zencasa/house-day.png';
import sceneNight from '@/assets/zencasa/house-night.png';
import sceneNightEv from '@/assets/zencasa/house-night-ev.png';
import sceneRain from '@/assets/zencasa/house-rain.png';

export type SceneKey = 'day' | 'night' | 'night-ev' | 'rain';

const SCENE_SRC: Record<SceneKey, string> = {
  day: sceneDay,
  night: sceneNight,
  'night-ev': sceneNightEv,
  rain: sceneRain,
};

/**
 * Pure scene-selection function.
 *
 * The dynamic vehicle overlay is preferred for every connected-car state
 * except `night-ev` (which has a baked-in Tesla + green charge plug we
 * cannot replicate at overlay quality).
 */
export function pickScene(d: EnergyFlowData, now: Date = new Date()): SceneKey {
  const solar = d.solarPower ?? 0;
  const evCharging = (d.tesla?.isCharging ?? false) || (d.evPower ?? 0) > 0.1;
  const sunUp = solar > 0.1;
  const hour = now.getHours();
  const isDayTime = hour >= 6 && hour < 19;

  if (!sunUp && evCharging) return 'night-ev';
  if (!sunUp && !isDayTime) return 'night';
  return 'day';
}

// ─────────────────────────────────────────────────────────────────────────────
// Color tokens
// ─────────────────────────────────────────────────────────────────────────────
const EMERALD = 'hsl(142 76% 55%)';
const EMERALD_LED = 'hsl(142 90% 78%)';
const AMBER = 'hsl(38 95% 55%)';
const AMBER_LED = 'hsl(45 100% 80%)';
const SKY = 'hsl(205 90% 60%)';
const SKY_LED = 'hsl(195 95% 80%)';
const CYAN = 'hsl(180 85% 55%)';
const CYAN_LED = 'hsl(180 95% 80%)';
const WARM = 'hsl(38 90% 62%)';

// ─────────────────────────────────────────────────────────────────────────────
// Overlay primitives (all rendered inside one SVG, viewBox 0–100)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Soft pulsing radial halo anchored on the house art. This is the primary
 * visual language — a device "lights up" when active so the scene reads at
 * a glance even without any flow lines.
 */
function DeviceHalo({
  cx,
  cy,
  color,
  active,
  intensity = 1,
  radius = 7,
  pulseMs = 3000,
}: {
  cx: number;
  cy: number;
  color: string;
  active: boolean;
  intensity?: number;
  radius?: number;
  pulseMs?: number;
}) {
  if (!active) return null;
  const i = Math.max(0.5, Math.min(1, intensity));
  return (
    <g style={{ pointerEvents: 'none', filter: 'blur(0.9px)' }}>
      <circle cx={cx} cy={cy} r={radius} fill={color} opacity={0.12 * i}>
        <animate
          attributeName="opacity"
          values={`${0.08 * i};${0.15 * i};${0.08 * i}`}
          dur={`${pulseMs}ms`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
          keyTimes="0;0.5;1"
        />
        <animate
          attributeName="r"
          values={`${radius * 0.9};${radius * 1.05};${radius * 0.9}`}
          dur={`${pulseMs}ms`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
          keyTimes="0;0.5;1"
        />
      </circle>
      <circle cx={cx} cy={cy} r={radius * 0.42} fill={color} opacity={0.22 * i}>
        <animate
          attributeName="opacity"
          values={`${0.16 * i};${0.26 * i};${0.16 * i}`}
          dur={`${pulseMs}ms`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
          keyTimes="0;0.5;1"
        />
      </circle>
    </g>
  );
}

/** Wide elliptical halo sized to sit inside the solar roof panel array. */
function RoofHalo({ active, intensity }: { active: boolean; intensity: number }) {
  if (!active) return null;
  const i = Math.max(0.5, Math.min(1, intensity));
  return (
    <g style={{ pointerEvents: 'none', filter: 'blur(1px)' }}>
      <ellipse
        cx={HOME_BLUEPRINT.solar.x}
        cy={HOME_BLUEPRINT.solar.y}
        rx={14}
        ry={5}
        fill={EMERALD}
        opacity={0.10 * i}
      >
        <animate
          attributeName="opacity"
          values={`${0.06 * i};${0.15 * i};${0.06 * i}`}
          dur="3200ms"
          repeatCount="indefinite"
        />
      </ellipse>
      <ellipse
        cx={HOME_BLUEPRINT.solar.x}
        cy={HOME_BLUEPRINT.solar.y}
        rx={8}
        ry={2.8}
        fill={EMERALD}
        opacity={0.18 * i}
      >
        <animate
          attributeName="opacity"
          values={`${0.12 * i};${0.24 * i};${0.12 * i}`}
          dur="3200ms"
          repeatCount="indefinite"
        />
      </ellipse>
    </g>
  );
}

/**
 * Warm bloom over the lit-window cluster — sells "house is drawing power"
 * without overpowering the scene.
 */
function WindowsBloom({ active, intensity }: { active: boolean; intensity: number }) {
  if (!active) return null;
  const i = Math.max(0.5, Math.min(1, intensity));
  return (
    <g style={{ pointerEvents: 'none', filter: 'blur(1.2px)' }}>
      <ellipse
        cx={HOME_BLUEPRINT.windows.x}
        cy={HOME_BLUEPRINT.windows.y}
        rx={6.5}
        ry={4.2}
        fill={WARM}
        opacity={0.12 * i}
      >
        <animate
          attributeName="opacity"
          values={`${0.08 * i};${0.18 * i};${0.08 * i}`}
          dur="6000ms"
          repeatCount="indefinite"
        />
      </ellipse>
    </g>
  );
}

/**
 * Ultra-minimal flow: faint guide path + 3 traveling dots that fade in at
 * the source and fade out at the destination (no floating endpoint dots).
 */
function DottedFlow({
  id,
  d,
  color,
  dur = 1.8,
}: {
  id: string;
  d: string;
  color: string;
  dur?: number;
}) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <path
        id={id}
        d={d}
        stroke={color}
        strokeOpacity={0.18}
        strokeWidth={0.45}
        strokeLinecap="round"
        fill="none"
      />
      {[0, 0.33, 0.66].map((offset) => (
        <circle key={`${id}-${offset}`} r={0.6} fill={color} opacity={0}>
          <animateMotion
            dur={`${dur}s`}
            repeatCount="indefinite"
            begin={`${offset * dur}s`}
            calcMode="linear"
            keyPoints="0;1"
            keyTimes="0;1"
          >
            <mpath href={`#${id}`} />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;0.95;0.95;0"
            keyTimes="0;0.15;0.85;1"
            dur={`${dur}s`}
            repeatCount="indefinite"
            begin={`${offset * dur}s`}
          />
        </circle>
      ))}
    </g>
  );
}

/** Faster crawl when more power is flowing. */
const flowDur = (kw: number) => Math.max(0.9, 2.0 - Math.min(kw, 8) * 0.13);

/**
 * Priority queue: returns the (max 2) flow IDs that should render as lines.
 * Everything else is communicated via DeviceHalo alone — keeps the scene calm.
 */
type FlowId = 'solar-home' | 'solar-pw' | 'pw-home' | 'charger-ev' | 'home-grid' | 'grid-home';

function pickPrimaryFlows(args: {
  solarProducing: boolean;
  pwCharging: boolean;
  pwDischarging: boolean;
  isCharging: boolean;
  gridExporting: boolean;
  gridImporting: boolean;
}): Set<FlowId> {
  const q: FlowId[] = [];
  // Most important: where is solar going?
  if (args.solarProducing && args.pwCharging) q.push('solar-pw');
  if (args.solarProducing) q.push('solar-home');
  if (!args.solarProducing && args.pwDischarging) q.push('pw-home');
  // EV is its own important story
  if (args.isCharging) q.push('charger-ev');
  // Grid only if nothing else fits
  if (args.gridExporting) q.push('home-grid');
  else if (args.gridImporting) q.push('grid-home');
  return new Set(q.slice(0, 3));
}

/**
 * Dev-only calibration overlay. Renders labeled dots at every blueprint
 * anchor so we can verify halos land on painted devices. Gated by
 * `import.meta.env.DEV && ?debug=1`. Never shipped on in prod.
 */
function DebugAnchors() {
  const anchors: Array<[string, { x: number; y: number }, string]> = [
    ['solar', HOME_BLUEPRINT.solar, '#22d3ee'],
    ['powerwall', HOME_BLUEPRINT.powerwall, '#34d399'],
    ['windows', HOME_BLUEPRINT.windows, '#fbbf24'],
    ['frontDoor', HOME_BLUEPRINT.frontDoor, '#a78bfa'],
    ['gridMeter', HOME_BLUEPRINT.gridMeter, '#60a5fa'],
    ['wallCharger', HOME_BLUEPRINT.wallCharger, '#f472b6'],
    ['carPark', HOME_BLUEPRINT.carPark, '#f87171'],
  ];
  return (
    <g style={{ pointerEvents: 'none' }}>
      {anchors.map(([name, a, color]) => (
        <g key={name}>
          <circle cx={a.x} cy={a.y} r={1.2} fill={color} stroke="white" strokeWidth={0.25} />
          <text x={a.x + 1.8} y={a.y - 1.4} fontSize={2} fill={color} stroke="black" strokeWidth={0.12} paintOrder="stroke">
            {name}
          </text>
        </g>
      ))}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating label (4 corners)
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export interface EnergyFlowSceneProps {
  data: EnergyFlowData;
  className?: string;
  forceScene?: SceneKey;
  vehicleModel?: VehicleModel | null;
  vehicleColor?: VehicleColor | null;
  teslaPayload?: unknown;
  /** Kept for backwards-compat with v3 callers; unused in v4. */
  batteryPayload?: unknown;
}

export function EnergyFlowScene({
  data,
  className,
  forceScene,
  vehicleModel,
  vehicleColor,
  teslaPayload,
}: EnergyFlowSceneProps) {
  const scene = useMemo(() => forceScene ?? pickScene(data), [forceScene, data]);
  const [searchParams] = useSearchParams();
  const debug = import.meta.env.DEV && searchParams.get('debug') === '1';
  const hasTeslaConnection =
    Boolean(teslaPayload) || Boolean(data.tesla) || (data.evPower ?? 0) > 0.1;

  const {
    model: resolvedVehicle,
    color: resolvedColor,
    src: vehicleSrc,
    generic: vehicleGeneric,
  } = useMemo(
    () =>
      resolveVehicleAsset(
        teslaPayload,
        { model: vehicleModel, color: vehicleColor },
        { fallbackWhenConnected: hasTeslaConnection },
      ),
    [teslaPayload, vehicleModel, vehicleColor, hasTeslaConnection],
  );

  const solar = data.solarPower ?? 0;
  const home = data.homePower ?? 0;
  const battery = data.batteryPower ?? 0;
  const grid = data.gridPower ?? 0;
  const soc = Math.round(data.batteryPercent ?? 0);
  const isCharging = data.tesla?.isCharging ?? false;
  const isPluggedIdle = hasTeslaConnection && !isCharging;
  const pwDischarging = battery < -0.05;
  const pwCharging = battery > 0.05;
  const gridImporting = grid > 0.05;
  const gridExporting = grid < -0.05;
  const solarProducing = solar > 0.1;
  const homeDrawing = home > 0.05;

  const flows = useMemo(
    () =>
      pickPrimaryFlows({
        solarProducing,
        pwCharging,
        pwDischarging,
        isCharging,
        gridExporting,
        gridImporting,
      }),
    [solarProducing, pwCharging, pwDischarging, isCharging, gridExporting, gridImporting],
  );

  const fmtKw = (v: number) => `${Math.abs(v).toFixed(1)} kW`;
  const arrow = (v: number, threshold = 0.05) => (v > threshold ? '▲' : v < -threshold ? '▼' : '');
  const intensity = (kw: number) => Math.min(1, 0.55 + Math.abs(kw) / 6);

  // Suppress dynamic car overlay when the baked night-ev art already shows
  // a Tesla parked in the garage. This is the only scene that bakes a car in.
  const showDynamicCar =
    scene !== 'night-ev' && Boolean(vehicleSrc) && !vehicleGeneric;

  // Car geometry in viewBox (0–100) space.
  const carW = HOME_BLUEPRINT.carWidth;
  const carH = HOME_BLUEPRINT.carHeight;
  const carX = HOME_BLUEPRINT.carPark.x - carW / 2;
  const carY = HOME_BLUEPRINT.carPark.y - carH / 2;

  return (
    <div
      className={`relative isolate aspect-square w-full overflow-hidden ${className ?? ''}`}
      data-scene={scene}
      data-vehicle={resolvedVehicle ?? (vehicleGeneric ? 'generic' : 'none')}
      data-vehicle-color={resolvedColor ?? 'none'}
    >
      {/* Ambient gradient floor with subtle depth */}
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

      {/* Single hero-aligned overlay: halos + dotted flows + dynamic car.
          Same layout classes as the hero <img>, so viewBox 0–100 maps 1:1
          to the painted house. This is the only coordinate system. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[80%] w-auto max-w-[94%] -translate-y-1/2"
        style={{ aspectRatio: '1 / 1', zIndex: 15 }}
      >
        {/* ── Device halos (primary visual language) ── */}
        <RoofHalo active={solarProducing} intensity={intensity(solar)} />
        <WindowsBloom active={homeDrawing} intensity={intensity(home)} />

        {/* Powerwall — emerald when charging, amber when discharging */}
        <DeviceHalo
          cx={HOME_BLUEPRINT.powerwall.x}
          cy={HOME_BLUEPRINT.powerwall.y}
          color={pwCharging ? EMERALD : AMBER}
          active={pwCharging || pwDischarging}
          intensity={intensity(battery)}
          radius={4.6}
          pulseMs={pwCharging ? 2800 : 2400}
        />

        {/* Grid meter — sky on import, cyan on export */}
        <DeviceHalo
          cx={HOME_BLUEPRINT.gridMeter.x}
          cy={HOME_BLUEPRINT.gridMeter.y}
          color={gridExporting ? CYAN : SKY}
          active={gridImporting || gridExporting}
          intensity={intensity(grid) * 0.75}
          radius={4.0}
          pulseMs={2800}
        />

        {/* Wall connector (inside garage) — emerald when EV is charging */}
        <DeviceHalo
          cx={HOME_BLUEPRINT.wallCharger.x}
          cy={HOME_BLUEPRINT.wallCharger.y}
          color={EMERALD}
          active={isCharging}
          intensity={intensity(data.evPower ?? 7)}
          radius={4.2}
          pulseMs={2400}
        />

        {/* Tiny green plug LED on the parked car when plugged & idle */}
        {isPluggedIdle && showDynamicCar && (
          <circle
            cx={HOME_BLUEPRINT.carPark.x + 6}
            cy={HOME_BLUEPRINT.carPark.y - 2}
            r={0.7}
            fill={EMERALD}
            opacity={0.85}
          />
        )}

        {/* ── Max 2 ultra-minimal dotted flow lines ── */}
        {flows.has('solar-home') && (
          <DottedFlow id="flow-solar-home" d={BLUEPRINT_PATHS.solarToHome} color={EMERALD_LED} dur={flowDur(solar)} />
        )}
        {flows.has('solar-pw') && (
          <DottedFlow id="flow-solar-pw" d={BLUEPRINT_PATHS.solarToPowerwall} color={EMERALD_LED} dur={flowDur(battery)} />
        )}
        {flows.has('pw-home') && (
          <DottedFlow id="flow-pw-home" d={BLUEPRINT_PATHS.powerwallToHome} color={AMBER_LED} dur={flowDur(Math.abs(battery))} />
        )}
        {flows.has('charger-ev') && (
          <DottedFlow id="flow-charger-ev" d={BLUEPRINT_PATHS.chargerToEv} color={EMERALD_LED} dur={flowDur(data.evPower ?? 7)} />
        )}
        {flows.has('home-grid') && (
          <DottedFlow id="flow-home-grid" d={BLUEPRINT_PATHS.homeToGrid} color={CYAN_LED} dur={flowDur(Math.abs(grid))} />
        )}
        {flows.has('grid-home') && (
          <DottedFlow id="flow-grid-home" d={BLUEPRINT_PATHS.gridToHome} color={SKY_LED} dur={flowDur(grid)} />
        )}

        {/* ── Dynamic Tesla, locked to the same coordinate system ── */}
        {showDynamicCar && vehicleSrc && (
          <g>
            {/* Soft ground shadow */}
            <ellipse
              cx={HOME_BLUEPRINT.carPark.x}
              cy={HOME_BLUEPRINT.carPark.y + carH * 0.42}
              rx={carW * 0.42}
              ry={1.4}
              fill="hsl(220 70% 2%)"
              opacity={0.5}
              style={{ filter: 'blur(1.2px)' }}
            />
            <image
              href={vehicleSrc}
              x={carX}
              y={carY}
              width={carW}
              height={carH}
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: 'drop-shadow(0 1px 1.5px hsl(220 70% 2% / 0.6))' }}
            />
          </g>
        )}
      </svg>

      {/* Floating labels */}
      <FlowLabel
        position="tl"
        label="Solar"
        value={fmtKw(solar)}
        sub={solarProducing ? 'Producing' : 'Idle'}
        accent="green"
        active={solarProducing}
      />
      <FlowLabel
        position="tr"
        label="Home"
        value={fmtKw(home)}
        sub={homeDrawing ? 'Drawing' : 'Idle'}
        accent={homeDrawing ? 'green' : 'muted'}
        active={homeDrawing}
        hero
      />
      <FlowLabel
        position="bl"
        label="Powerwall"
        value={`${fmtKw(battery)} ${arrow(battery)}`.trim()}
        sub={
          pwCharging
            ? `${soc}% · Charging`
            : pwDischarging
              ? `${soc}% · Discharging`
              : `${soc}% · ${soc >= 99 ? 'Full' : 'Idle'}`
        }
        accent={pwCharging ? 'green' : pwDischarging ? 'amber' : 'muted'}
        active={Math.abs(battery) > 0.05}
      />
      <FlowLabel
        position="br"
        label="Grid"
        value={`${fmtKw(grid)} ${arrow(grid)}`.trim()}
        sub={gridImporting ? 'Importing' : gridExporting ? 'Exporting' : 'Balanced'}
        accent={gridExporting ? 'blue' : gridImporting ? 'amber' : 'muted'}
        active={Math.abs(grid) > 0.05}
      />
    </div>
  );
}
