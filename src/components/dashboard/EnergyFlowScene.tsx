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
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { EnergyFlowData } from './AnimatedEnergyFlow';
import {
  resolveVehicleAsset,
  resolveVehicleWheelType,
  resolveVehicleDisplayName,
  type VehicleColor,
  type VehicleModel,
} from './EnergyFlowScene.scenes';
import { HOME_BLUEPRINT, BLUEPRINT_PATHS } from './HomeBlueprint';

import sceneDay from '@/assets/zencasa/house-day.png';
import sceneNight from '@/assets/zencasa/house-night.png';
import sceneNightEv from '@/assets/zencasa/house-night-ev.png';
import sceneRain from '@/assets/zencasa/house-rain.png';

export type SceneKey = 'day' | 'night' | 'night-ev' | 'rain';

/**
 * v5 — High-level composition archetype, separate from the baked PNG scene.
 * Drives overlay weighting, car size, and which halos light up.
 *
 *   full-stack    — solar + battery + EV  (current rich cockpit)
 *   ev-only       — Tesla connected, no PV / no battery
 *   solar-only    — PV only (roof emphasis)
 *   charger-only  — wallbox only (simple house + charger)
 *   outage        — amber/green backup styling (gated by useGridOutage)
 */
export type CompositionKey =
  | 'full-stack'
  | 'ev-only'
  | 'solar-only'
  | 'charger-only'
  | 'outage';

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

/**
 * v5 — Adaptive Scene Composer.
 *
 * Returns both the baked-PNG scene key and the high-level composition
 * archetype. Weather code (Open-Meteo WMO) optionally swaps `day` → `rain`
 * for stormy conditions so the sky matches what the user sees outside.
 */
export function chooseSceneType(
  d: EnergyFlowData,
  devices: {
    hasSolar?: boolean;
    hasBattery?: boolean;
    hasTesla?: boolean;
    hasCharger?: boolean;
    isOutage?: boolean;
  } = {},
  opts: { weatherCode?: number | null; now?: Date } = {},
): { scene: SceneKey; composition: CompositionKey } {
  const now = opts.now ?? new Date();
  let scene = pickScene(d, now);
  // Weather override: rainy / showery WMO codes → rain scene (only when not night-ev).
  const wx = opts.weatherCode ?? null;
  const isRainy = wx !== null && ((wx >= 51 && wx <= 67) || (wx >= 80 && wx <= 82) || (wx >= 95 && wx <= 99));
  if (isRainy && scene !== 'night-ev') scene = scene === 'night' ? 'night' : 'rain';

  let composition: CompositionKey = 'full-stack';
  if (devices.isOutage) composition = 'outage';
  else if (devices.hasBattery || devices.hasTesla || (devices.hasSolar && devices.hasCharger)) composition = 'full-stack';
  else if (devices.hasTesla && !devices.hasSolar && !devices.hasBattery) composition = 'ev-only';
  else if (devices.hasSolar && !devices.hasBattery && !devices.hasTesla && !devices.hasCharger) composition = 'solar-only';
  else if (devices.hasCharger && !devices.hasSolar && !devices.hasBattery && !devices.hasTesla) composition = 'charger-only';

  return { scene, composition };
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
// Outage-mode visual tuning
// ─────────────────────────────────────────────────────────────────────────────
//
// During Grid Outage Mode, the Battery → Home line must read as the dominant
// route — but in the SAME visual language as the active Solar flow (a faint
// guide path with LED particles riding on top), just amber, denser, and
// slightly faster. The previous triple-halo stack read as a blurry smear;
// this matches the rest of the scene.
//
// Tuned 2026-06-03. Bumping any value? Update the snapshot test in
// src/test/EnergyFlowScene.outage.test.ts in the same commit.
export const OUTAGE_VISUAL = {
  /** Battery → Home hero flow during outage — mirrors active Solar style. */
  pwHome: {
    /** Faint guide path the particles ride on (cf. DottedFlow 0.45 / 0.18). */
    guideStrokeWidth: 0.55,
    guideStroke: 'hsl(38 95% 55%)',
    guideOpacity: 0.28,
    /** Single soft amber halo under the guide (replaces the 3-halo stack). */
    haloStrokeWidth: 1.6,
    haloStroke: 'hsl(38 95% 60% / 0.26)',
    haloPulse: { from: 0.18, to: 0.32, durMs: 1400 },
    /** Dense, fast LED particle stream — same animation profile as solar. */
    particleCount: 6,
    particleRadius: 0.75,
    particleColor: 'hsl(45 100% 80%)',
    /** Floor + factor for particle cadence. baseDur * factor, min floor. */
    particleMinDurSec: 1.6,
    particleDurFactor: 0.55,
  },
  /** Solar flows are dimmed during outage so the eye lands on pw-home. */
  solarDimOpacity: 0.35,
  /** Grid line is rendered broken/dashed to signal disconnect. */
  gridOffline: {
    stroke: 'hsl(0 65% 55% / 0.55)',
    strokeWidth: 0.55,
    strokeDasharray: '1.4 2.4',
    opacity: 0.7,
  },
} as const;


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
    <g style={{ pointerEvents: 'none', filter: 'blur(1.4px)' }}>
      <ellipse
        cx={HOME_BLUEPRINT.windows.x}
        cy={HOME_BLUEPRINT.windows.y}
        rx={7.2}
        ry={4.6}
        fill={WARM}
        opacity={0.22 * i}
      >
        <animate
          attributeName="opacity"
          values={`${0.18 * i};${0.32 * i};${0.18 * i}`}
          dur="4000ms"
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
  dur = 3.6,
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

/** Slower, calmer crawl — premium pace. Even high-power flows take ≥2s. */
const flowDur = (kw: number) => Math.max(2.0, 4.0 - Math.min(kw, 8) * 0.2);


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
  /** Number of connected Powerwall units (1 or 2). Default 1. */
  batteryCount?: number;
  /** Device presence flags — drive label/halo visibility so the scene never
   *  fabricates a Powerwall or Tesla for users who don't have one. */
  hasBattery?: boolean;
  hasCharger?: boolean;
  hasTesla?: boolean;
  /** When true, render the scene in Grid Outage mode (grid disabled,
   *  battery→home becomes the hero flow). */
  isOutage?: boolean;
  /** Outage hero stats — passed in by LiveEnergyMonitoringCard so all
   *  estimator math stays in one place. Only consumed when isOutage. */
  outageBackupLabel?: string;
  outageStartedAt?: Date | string;
  /** v5 — current Open-Meteo WMO weather code. Drives sky tinting and
   *  may swap day → rain when stormy. */
  weatherCode?: number | null;
  /** v5 — Tesla composition override for parents that already know it. */
  forceComposition?: CompositionKey;
}

export function EnergyFlowScene({
  data,
  className,
  forceScene,
  vehicleModel,
  vehicleColor,
  teslaPayload,
  batteryCount = 1,
  hasBattery = true,
  hasCharger = true,
  hasTesla = true,
  isOutage = false,
  outageBackupLabel,
  outageStartedAt,
  weatherCode = null,
  forceComposition,
}: EnergyFlowSceneProps) {


  const { scene, composition } = useMemo(
    () =>
      forceScene
        ? { scene: forceScene, composition: forceComposition ?? 'full-stack' as CompositionKey }
        : chooseSceneType(
            data,
            { hasSolar: true, hasBattery, hasTesla, hasCharger, isOutage },
            { weatherCode },
          ),
    [forceScene, forceComposition, data, hasBattery, hasTesla, hasCharger, isOutage, weatherCode],
  );
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
    () => {
      const base = pickPrimaryFlows({
        solarProducing,
        pwCharging,
        pwDischarging,
        isCharging,
        gridExporting,
        gridImporting,
      });
      if (isOutage) {
        // Drop any grid flows and force battery→home as the hero flow
        // whenever the home is drawing or the battery is discharging.
        base.delete('home-grid');
        base.delete('grid-home');
        if (pwDischarging || homeDrawing) base.add('pw-home');
      }
      return base;
    },
    [solarProducing, pwCharging, pwDischarging, isCharging, gridExporting, gridImporting, isOutage, homeDrawing],
  );

  const fmtKw = (v: number) => `${Math.abs(v).toFixed(1)} kW`;
  const arrow = (v: number, threshold = 0.05) => (v > threshold ? '▲' : v < -threshold ? '▼' : '');
  const intensity = (kw: number) => Math.min(1, 0.55 + Math.abs(kw) / 6);

  // Only render the dynamic Tesla when the vehicle is actually connected to
  // the home (charging, plugged-idle, or temporarily stopped). When the car
  // is `Disconnected` or telemetry is missing entirely, hide it — there's no
  // car at this address right now.
  const chargingState =
    (teslaPayload as { charging_state?: string } | undefined)?.charging_state;
  const carConnected =
    chargingState === 'Charging' ||
    chargingState === 'Connected' ||
    chargingState === 'Complete' ||
    chargingState === 'Stopped' ||
    isCharging ||
    (data.evPower ?? 0) > 0.1;

  // Suppress dynamic car overlay when the baked night-ev art already shows
  // a Tesla parked in the garage. This is the only scene that bakes a car in.
  const showDynamicCar =
    scene !== 'night-ev' &&
    carConnected &&
    Boolean(vehicleSrc) &&
    !vehicleGeneric;

  // Car geometry in viewBox (0–100) space. When actively charging at home,
  // pull up to the garage apron with the door visually "open"; otherwise
  // stay parked in the driveway.
  const prefersReducedMotion = useReducedMotion();
  const chargingAtHome = isCharging && scene !== 'night-ev' && !isOutage;
  const carAnchor = chargingAtHome ? HOME_BLUEPRINT.garageFront : HOME_BLUEPRINT.carPark;
  const carW = HOME_BLUEPRINT.carWidth;
  const carH = HOME_BLUEPRINT.carHeight;
  const carX = carAnchor.x - carW / 2;
  const carY = carAnchor.y - carH / 2;
  const evKw = data.tesla?.kW ?? data.evPower ?? 0;
  const evSoc = data.tesla?.soc;
  const evRange = data.tesla?.rangeMi;

  // v5 — extract Tesla wheel_type and display_name for accuracy data-attrs
  const wheelType = useMemo(() => resolveVehicleWheelType(teslaPayload), [teslaPayload]);
  const displayName = useMemo(() => resolveVehicleDisplayName(teslaPayload), [teslaPayload]);

  // v5 — weather-aware sky tint. Cloudy/overcast → cool grey; rainy →
  // deep slate; thunderstorm → violet edge. Day-only; night scenes already
  // carry their own mood. Sits ABOVE the ambient floor but BELOW the hero img.
  const skyTint = useMemo<string | null>(() => {
    if (weatherCode == null || scene === 'night' || scene === 'night-ev') return null;
    if (weatherCode === 0 || weatherCode === 1) return null; // clear / mostly clear
    if (weatherCode === 2) return 'linear-gradient(to bottom, hsl(210 35% 35% / 0.18), transparent 55%)';
    if (weatherCode === 3) return 'linear-gradient(to bottom, hsl(210 20% 30% / 0.32), transparent 60%)';
    if (weatherCode >= 45 && weatherCode <= 48) return 'linear-gradient(to bottom, hsl(210 15% 40% / 0.40), transparent 60%)';
    if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) return 'linear-gradient(to bottom, hsl(215 35% 22% / 0.50), transparent 65%)';
    if (weatherCode >= 71 && weatherCode <= 86) return 'linear-gradient(to bottom, hsl(220 15% 55% / 0.30), transparent 60%)';
    if (weatherCode >= 95) return 'linear-gradient(to bottom, hsl(265 35% 20% / 0.55), transparent 65%)';
    return null;
  }, [weatherCode, scene]);

  return (
    <div
      className={`relative isolate aspect-square w-full overflow-hidden ${className ?? ''}`}
      data-scene={scene}
      data-composition={composition}
      data-weather-code={weatherCode ?? ''}
      data-vehicle={resolvedVehicle ?? (vehicleGeneric ? 'generic' : 'none')}
      data-vehicle-color={resolvedColor ?? 'none'}
      data-vehicle-wheel={wheelType ?? ''}
      data-vehicle-name={displayName ?? ''}
    >
      {/* Ambient gradient floor with subtle depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,hsl(220_50%_12%/0.85),transparent_65%),radial-gradient(circle_at_50%_95%,hsl(var(--primary)/0.14),transparent_55%),linear-gradient(to_bottom,hsl(220_60%_6%/0.4),hsl(220_70%_3%/0.7))]"
      />

      {/* v5 — weather sky tint overlay (only when conditions warrant) */}
      {skyTint && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-[5] transition-opacity duration-700"
          style={{ background: skyTint }}
        />
      )}

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

        {/* Powerwall — only rendered when a battery is actually connected. */}
        {hasBattery && (
          <>
            <DeviceHalo
              cx={HOME_BLUEPRINT.powerwall.x}
              cy={HOME_BLUEPRINT.powerwall.y}
              color={EMERALD}
              active
              intensity={0.5}
              radius={3.8}
              pulseMs={5000}
            />
            <DeviceHalo
              cx={HOME_BLUEPRINT.powerwall.x}
              cy={HOME_BLUEPRINT.powerwall.y}
              color={isOutage ? AMBER : pwCharging ? EMERALD : AMBER}
              active={isOutage || pwCharging || pwDischarging}
              intensity={isOutage ? Math.max(0.95, intensity(battery)) : intensity(battery)}
              radius={isOutage ? 6.4 : 4.6}
              pulseMs={isOutage ? 1100 : pwCharging ? 2800 : 2400}
            />
          </>
        )}

        {/* v5 — Additional Powerwalls (slots 2..N), capped at 5 total.
            Each unit gets the same halo pair as the primary so 1–5+ stacks
            read cleanly along the front porch. */}
        {hasBattery && batteryCount >= 2 &&
          HOME_BLUEPRINT.powerwallSlots
            .slice(1, Math.min(5, batteryCount))
            .map((slot, i) => (
              <g key={`pw-slot-${i + 1}`}>
                <DeviceHalo
                  cx={slot.x}
                  cy={slot.y}
                  color={EMERALD}
                  active
                  intensity={0.5}
                  radius={3.8}
                  pulseMs={5000}
                />
                <DeviceHalo
                  cx={slot.x}
                  cy={slot.y}
                  color={pwCharging ? EMERALD : AMBER}
                  active={pwCharging || pwDischarging}
                  intensity={intensity(battery)}
                  radius={4.6}
                  pulseMs={pwCharging ? 2800 : 2400}
                />
              </g>
            ))}




        {/* Grid meter — sky on import, cyan on export, muted amber + X on outage */}
        <DeviceHalo
          cx={HOME_BLUEPRINT.gridMeter.x}
          cy={HOME_BLUEPRINT.gridMeter.y}
          color={isOutage ? AMBER : gridExporting ? CYAN : SKY}
          active={isOutage || gridImporting || gridExporting}
          intensity={isOutage ? 0.35 : intensity(grid) * 0.75}
          radius={isOutage ? 3.4 : 4.0}
          pulseMs={isOutage ? 5200 : 2800}
        />
        {isOutage && (
          <g style={{ pointerEvents: 'none' }}>
            <circle
              cx={HOME_BLUEPRINT.gridMeter.x}
              cy={HOME_BLUEPRINT.gridMeter.y}
              r={2.2}
              fill="hsl(220 60% 6%)"
              opacity={0.85}
              stroke="hsl(0 75% 55% / 0.7)"
              strokeWidth={0.4}
            />
            <path
              d={`M ${HOME_BLUEPRINT.gridMeter.x - 1.2} ${HOME_BLUEPRINT.gridMeter.y - 1.2} L ${HOME_BLUEPRINT.gridMeter.x + 1.2} ${HOME_BLUEPRINT.gridMeter.y + 1.2} M ${HOME_BLUEPRINT.gridMeter.x + 1.2} ${HOME_BLUEPRINT.gridMeter.y - 1.2} L ${HOME_BLUEPRINT.gridMeter.x - 1.2} ${HOME_BLUEPRINT.gridMeter.y + 1.2}`}
              stroke="hsl(0 85% 65%)"
              strokeWidth={0.55}
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {/* Wall connector (inside garage) — soft standby when a charger is
            connected, emerald-pulse when an EV is actively charging. */}
        {(hasCharger || hasTesla) && (
          <>
            <DeviceHalo
              cx={HOME_BLUEPRINT.wallCharger.x}
              cy={HOME_BLUEPRINT.wallCharger.y}
              color={EMERALD}
              active={hasCharger || hasTesla}
              intensity={0.45}
              radius={3.6}
              pulseMs={5200}
            />
            <DeviceHalo
              cx={HOME_BLUEPRINT.wallCharger.x}
              cy={HOME_BLUEPRINT.wallCharger.y}
              color={EMERALD}
              active={isCharging}
              intensity={intensity(data.evPower ?? 7)}
              radius={4.2}
              pulseMs={2400}
            />
          </>
        )}


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
        {/* In Outage Mode, solar flows are dimmed so the eye lands on
            battery → home as the dominant route. */}
        {flows.has('solar-home') && (
          <g opacity={isOutage ? OUTAGE_VISUAL.solarDimOpacity : 1}>
            <DottedFlow id="flow-solar-home" d={BLUEPRINT_PATHS.solarToHome} color={EMERALD_LED} dur={flowDur(solar)} />
          </g>
        )}
        {flows.has('solar-pw') && (
          <g opacity={isOutage ? OUTAGE_VISUAL.solarDimOpacity : 1}>
            <DottedFlow id="flow-solar-pw" d={BLUEPRINT_PATHS.solarToPowerwall} color={EMERALD_LED} dur={flowDur(battery)} />
          </g>
        )}
        {flows.has('solar-pw') && batteryCount >= 2 && (
          <g opacity={isOutage ? OUTAGE_VISUAL.solarDimOpacity : 1}>
            <DottedFlow id="flow-solar-pw-2" d={BLUEPRINT_PATHS.solarToPowerwall2} color={EMERALD_LED} dur={flowDur(battery)} />
          </g>
        )}


        {/* Outage-mode hero: Battery → Home rendered in the SAME visual
            language as the active Solar flow — a faint guide path with
            dense, fast LED particles riding on top — just amber. A single
            soft halo replaces the previous triple-blur stack so the line
            reads crisp, not smudged. All knobs live in OUTAGE_VISUAL.pwHome. */}
        {flows.has('pw-home') && isOutage && (() => {
          const v = OUTAGE_VISUAL.pwHome;
          const baseDur = flowDur(Math.max(0.5, Math.abs(battery)));
          const particleDur = Math.max(v.particleMinDurSec, baseDur * v.particleDurFactor);
          return (
            <g style={{ pointerEvents: 'none' }} data-testid="outage-pw-home">
              {/* Soft single halo — breathes gently underneath the guide. */}
              <path
                d={BLUEPRINT_PATHS.powerwallToHome}
                stroke={v.haloStroke}
                strokeWidth={v.haloStrokeWidth}
                strokeLinecap="round"
                fill="none"
                style={{ filter: 'blur(2px)' }}
              >
                <animate
                  attributeName="stroke-opacity"
                  values={`${v.haloPulse.from};${v.haloPulse.to};${v.haloPulse.from}`}
                  dur={`${v.haloPulse.durMs}ms`}
                  repeatCount="indefinite"
                />
              </path>
              {/* Faint guide path the particles ride on (mirrors DottedFlow). */}
              <path
                id="flow-pw-home"
                d={BLUEPRINT_PATHS.powerwallToHome}
                stroke={v.guideStroke}
                strokeOpacity={v.guideOpacity}
                strokeWidth={v.guideStrokeWidth}
                strokeLinecap="round"
                fill="none"
              />
              {/* Dense, fast LED particle stream — same fade profile as solar. */}
              {Array.from({ length: v.particleCount }, (_, i) => i / v.particleCount).map((offset) => (
                <circle key={`pw-home-out-${offset}`} r={v.particleRadius} fill={v.particleColor} opacity={0}>
                  <animateMotion
                    dur={`${particleDur}s`}
                    repeatCount="indefinite"
                    begin={`${offset * particleDur}s`}
                    calcMode="linear"
                    keyPoints="0;1"
                    keyTimes="0;1"
                  >
                    <mpath href="#flow-pw-home" />
                  </animateMotion>
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.12;0.88;1"
                    dur={`${particleDur}s`}
                    repeatCount="indefinite"
                    begin={`${offset * particleDur}s`}
                  />
                </circle>
              ))}
            </g>
          );
        })()}

        {flows.has('pw-home') && !isOutage && (
          <DottedFlow
            id="flow-pw-home"
            d={BLUEPRINT_PATHS.powerwallToHome}
            color={AMBER_LED}
            dur={flowDur(Math.max(0.5, Math.abs(battery)))}
          />
        )}
        {flows.has('pw-home') && batteryCount >= 2 && (
          <DottedFlow id="flow-pw-home-2" d={BLUEPRINT_PATHS.powerwall2ToHome} color={AMBER_LED} dur={flowDur(Math.max(0.5, Math.abs(battery)))} />
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

        {/* Outage: render a clearly broken/dashed grid line so the
            disconnection is obvious at a glance. No animation, low opacity. */}
        {isOutage && (
          <path
            data-testid="outage-grid-offline"
            d={BLUEPRINT_PATHS.gridToHome}
            stroke={OUTAGE_VISUAL.gridOffline.stroke}
            strokeWidth={OUTAGE_VISUAL.gridOffline.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={OUTAGE_VISUAL.gridOffline.strokeDasharray}
            fill="none"
            opacity={OUTAGE_VISUAL.gridOffline.opacity}
          />
        )}


        {/* ── Open-garage warm bloom when EV is charging at home ── */}
        {chargingAtHome && showDynamicCar && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Inner darker "open mouth" */}
            <rect
              x={HOME_BLUEPRINT.garageOpening.x + 2}
              y={HOME_BLUEPRINT.garageOpening.y + 2}
              width={HOME_BLUEPRINT.garageOpening.w - 4}
              height={HOME_BLUEPRINT.garageOpening.h - 4}
              rx={1.2}
              fill="hsl(28 60% 8%)"
              opacity={0.55}
            />
            {/* Warm interior bloom */}
            <rect
              x={HOME_BLUEPRINT.garageOpening.x}
              y={HOME_BLUEPRINT.garageOpening.y}
              width={HOME_BLUEPRINT.garageOpening.w}
              height={HOME_BLUEPRINT.garageOpening.h}
              rx={2}
              fill={WARM}
              opacity={0.22}
              style={{ filter: 'blur(2.2px)' }}
            >
              {!prefersReducedMotion && (
                <animate
                  attributeName="opacity"
                  values="0.18;0.30;0.18"
                  dur="3600ms"
                  repeatCount="indefinite"
                />
              )}
            </rect>
          </g>
        )}

        {/* ── Dynamic Tesla, locked to the same coordinate system ── */}
        {showDynamicCar && vehicleSrc && (
          <g>
            {/* Soft ground shadow — tracks the active anchor */}
            <ellipse
              cx={carAnchor.x}
              cy={carAnchor.y + carH * 0.42}
              rx={carW * 0.42}
              ry={1.8}
              fill="hsl(220 70% 2%)"
              opacity={0.55}
              style={{ filter: 'blur(1.4px)' }}
            />
            <image
              href={vehicleSrc}
              x={carX}
              y={carY}
              width={carW}
              height={carH}
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: 'drop-shadow(0 1.5px 2px hsl(220 70% 2% / 0.65))' }}
            />
            {/* Emerald charge-port pulse while actively charging */}
            {chargingAtHome && (
              <g style={{ pointerEvents: 'none' }}>
                <circle
                  cx={carAnchor.x + carW * 0.30}
                  cy={carAnchor.y - carH * 0.05}
                  r={1.6}
                  fill={EMERALD}
                  opacity={0.35}
                  style={{ filter: 'blur(0.8px)' }}
                >
                  {!prefersReducedMotion && (
                    <animate
                      attributeName="opacity"
                      values="0.25;0.65;0.25"
                      dur="1400ms"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
                <circle
                  cx={carAnchor.x + carW * 0.30}
                  cy={carAnchor.y - carH * 0.05}
                  r={0.7}
                  fill={EMERALD_LED}
                  opacity={0.95}
                />
              </g>
            )}
          </g>
        )}
      </svg>

      {/* HTML overlay aligned to the same square as the hero PNG / SVG.
          Lets us drop a "Charging" pill that tracks the car anchor in
          the exact same 0–100 coordinate space. */}
      {showDynamicCar && chargingAtHome && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[80%] -translate-y-1/2"
          style={{ aspectRatio: '1 / 1', maxWidth: '94%', zIndex: 18 }}
        >
          <div
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{
              left: `${carAnchor.x}%`,
              top: `${carAnchor.y - carH / 2 - 1}%`,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-background/85 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-300 shadow-[0_0_14px_hsla(142,76%,50%,0.35)] backdrop-blur">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Charging · {evKw.toFixed(1)} kW
              </div>
              {(typeof evSoc === 'number' || typeof evRange === 'number') && (
                <div className="rounded-full bg-background/70 px-1.5 py-[1px] text-[9px] font-medium tabular-nums text-foreground/80 backdrop-blur">
                  {typeof evSoc === 'number' ? `${evSoc}%` : ''}
                  {typeof evSoc === 'number' && typeof evRange === 'number' ? ' · ' : ''}
                  {typeof evRange === 'number' ? `${evRange} mi` : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Floating labels — during outage, top-right and bottom-right are
          re-purposed as the integrated outage hero stats so the house
          diagram itself carries the critical numbers (no separate panel). */}
      <FlowLabel
        position="tl"
        label="Solar"
        value={fmtKw(solar)}
        sub={solarProducing ? 'Producing' : 'Idle'}
        accent="green"
        active={solarProducing}
      />
      {isOutage ? (
        <FlowLabel
          position="tr"
          label="Backup remaining"
          value={outageBackupLabel ?? '—'}
          sub={`Battery ${soc}% · Providing backup`}
          accent="amber"
          active
          hero
        />
      ) : (
        <FlowLabel
          position="tr"
          label="Home"
          value={fmtKw(home)}
          sub={homeDrawing ? 'Drawing' : 'Idle'}
          accent={homeDrawing ? 'green' : 'muted'}
          active={homeDrawing}
          hero
        />
      )}
      {hasBattery ? (
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
      ) : hasCharger ? (
        <FlowLabel
          position="bl"
          label="Charger"
          value={isCharging ? fmtKw(data.evPower ?? 0) : 'Idle'}
          sub={isCharging ? 'Charging EV' : 'Standby'}
          accent={isCharging ? 'green' : 'muted'}
          active={isCharging}
        />
      ) : null}

      {isOutage ? (
        <FlowLabel
          position="br"
          label="From Battery"
          value={fmtKw(Math.max(0, -battery))}
          sub="Powering your home"
          accent="amber"
          active
        />
      ) : (
        <FlowLabel
          position="br"
          label="Grid"
          value={`${fmtKw(grid)} ${arrow(grid)}`.trim()}
          sub={gridImporting ? 'Importing' : gridExporting ? 'Exporting' : 'Balanced'}
          accent={gridExporting ? 'blue' : gridImporting ? 'amber' : 'muted'}
          active={Math.abs(grid) > 0.05}
        />
      )}

      {/* Calm "On Battery Backup" banner overlaid at the top of the scene
          during outage. Single line, low chrome — the house diagram + corner
          stats carry the visual weight. */}
      {isOutage && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-3 pt-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200 shadow-[0_4px_16px_-6px_hsl(38_95%_30%/0.5)] backdrop-blur-sm">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-amber-400 motion-reduce:animate-none" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
            On Battery Backup
            {outageStartedAt && (
              <span className="ml-1 font-medium normal-case tracking-normal text-amber-200/80">
                · {formatOutageSince(outageStartedAt)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Format "Since 4:32 PM · 12 min ago" for the calm outage banner. */
function formatOutageSince(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const clock = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const elapsed = Date.now() - d.getTime();
  if (elapsed >= 0 && elapsed < 60 * 60_000) {
    const mins = Math.max(1, Math.round(elapsed / 60_000));
    return `Since ${clock} · ${mins} min ago`;
  }
  return `Since ${clock}`;
}
