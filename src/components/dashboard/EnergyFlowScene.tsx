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
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { EnergyFlowData } from './AnimatedEnergyFlow';
import {
  resolveVehicleAsset,
  resolveVehicleWheelType,
  resolveVehicleDisplayName,
  type VehicleColor,
  type VehicleModel,
} from './EnergyFlowScene.scenes';
import { HOME_BLUEPRINT, BLUEPRINT_PATHS, SCENE_CAMERA, camPctX, camPctY } from './HomeBlueprint';
import { Conductor, EvChargeCable, buildConductorSegments, SCENE_ANCHOR_LIST, SCENE_ANCHORS } from './ConductorNetwork';

import { HouseSceneV5 } from './HouseSceneV5';
import { fitVehicleToBay } from './carAutoFit';
import { useSpriteContentBox } from '@/hooks/useSpriteAspect';



// v5 Phase 1: legacy baked house PNG imports removed — HouseSceneV5 owns the
// hero render now. SCENE_SRC and the four PNG imports were deleted to prove
// the new bones are the only thing drawing the house.

export type SceneKey =
  | 'day'
  | 'dusk'
  | 'night'
  | 'night-ev'
  | 'night-pw-discharge'
  | 'night-pw-discharge-ev'
  | 'day-export'
  | 'rain';

/**
 * v5 — High-level composition archetype, separate from the scene palette.
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

/**
 * Pure scene-selection function.
 *
 * The dynamic vehicle overlay is preferred for every connected-car state
 * except `night-ev` (which has a baked-in Tesla + green charge plug we
 * cannot replicate at overlay quality).
 */
export function pickScene(d: EnergyFlowData, now: Date = new Date()): SceneKey {
  const solar = d.solarPower ?? 0;
  const grid = d.gridPower ?? 0;
  const battery = d.batteryPower ?? 0;
  const evCharging = (d.tesla?.isCharging ?? false) || (d.evPower ?? 0) > 0.1;
  const pwDischarging = battery < -0.1;
  const exporting = grid < -0.1;
  const hour = now.getHours();
  // Scene time-of-day comes from the clock, not from a solar reading. A lagging
  // or zero inverter sample in the middle of the afternoon must never paint the
  // night sky — that misreads a display gap as "the sun is down".
  const isDaylight = hour >= 6 && hour < 20;
  const sunUp = solar > 0.1;

  if (!isDaylight) {
    if (pwDischarging && evCharging) return 'night-pw-discharge-ev';
    if (pwDischarging) return 'night-pw-discharge';
    if (evCharging) return 'night-ev';
    return 'night';
  }
  if (sunUp && exporting) return 'day-export';
  return hour >= 17 ? 'dusk' : 'day';
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


/**
 * v5 Phase B — Premium gradient ribbon flow.
 *
 * Replaces the legacy dotted-line look with a soft glowing stroke that
 * fades along the path (gradient `stroke-opacity`) plus two sparse,
 * larger LED particles. Reads as a clean energy ribbon, not a dotted
 * trail. Gradient + glow filter ids are scoped per-instance so multiple
 * ribbons in the same SVG never collide.
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
  const gradId = `${id}-grad`;
  const glowId = `${id}-glow`;
  return (
    <g style={{ pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.05" />
          <stop offset="35%" stopColor={color} stopOpacity="0.85" />
          <stop offset="65%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />

        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.55" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Soft outer halo stroke — wider glow for Tesla-style ribbon read */}
      <path
        d={d}
        stroke={color}
        strokeOpacity={0.22}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
        style={{ filter: 'blur(1.6px)' }}
      />
      {/* Hero ribbon — thicker gradient stroke with subtle glow */}
      <path
        id={id}
        d={d}
        stroke={`url(#${gradId})`}
        strokeWidth={1.1}
        strokeLinecap="round"
        fill="none"
        filter={`url(#${glowId})`}
      />

      {/* Two sparse traveling LED particles */}
      {[0, 0.5].map((offset) => (
        <circle key={`${id}-${offset}`} r={0.75} fill={color} opacity={0}>
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
            values="0;1;1;0"
            keyTimes="0;0.18;0.82;1"
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
    tl: 'top-2 left-2.5 items-start text-left',
    tr: 'top-2 right-2.5 items-end text-right',
    bl: 'bottom-2 left-2.5 items-start text-left',
    br: 'bottom-2 right-2.5 items-end text-right',
  };

  const dot: Record<NonNullable<typeof accent>, string> = {
    green: 'bg-emerald-400 shadow-[0_0_10px_hsla(142,76%,50%,0.85)]',
    amber: 'bg-amber-400 shadow-[0_0_10px_hsla(38,92%,55%,0.85)]',
    blue: 'bg-sky-400 shadow-[0_0_10px_hsla(205,90%,55%,0.85)]',
    muted: 'bg-muted-foreground/40',
  };
  // Readouts sit over open sky/roof, so no bloom behind them — a glow may
  // only render at a powered anchor, never behind a text label.
  const valueGlow: Record<NonNullable<typeof accent>, string> = {
    green: '',
    amber: '',
    blue: '',
    muted: '',
  };
  return (
    <div className={`pointer-events-none absolute z-20 flex max-w-[40%] flex-col gap-0.5 ${pos[position]}`}>
      <div className="flex items-center gap-1.5">
        {active && accent && accent !== 'muted' && (
          <span aria-hidden="true" className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot[accent]}`}>
            <span className={`absolute inset-0 inline-flex h-full w-full animate-ping rounded-full ${dot[accent]} opacity-70`} />
          </span>
        )}
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/90">
          {label}
        </span>
      </div>
      <div
        className={
          hero
            ? `text-[26px] sm:text-[32px] font-semibold tabular-nums leading-none tracking-tight text-foreground ${active && accent ? valueGlow[accent] : ''}`
            : `text-lg sm:text-xl font-light tabular-nums leading-none text-foreground ${active && accent ? valueGlow[accent] : ''}`
        }
        style={hero ? { textShadow: '0 1px 0 hsl(220 60% 4% / 0.6)' } : undefined}
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
 * §5/§6 — VEHICLE CHIP. Attached to a rendered car, never a standalone list
 * row. Carries name, live kW, SOC and a presence indicator. It states
 * presence-at-home, which is a co-location proof, and deliberately never
 * states a location: the vehicle's meter is the source, not a map.
 */
function VehicleChip({
  x,
  y,
  name,
  kw,
  soc,
  rangeMi,
  charging,
}: {
  x: number;
  y: number;
  name: string | null;
  kw: number | null;
  soc: number | null;
  rangeMi: number | null;
  charging: boolean;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-full"
      style={{ left: `${camPctX(x)}%`, top: `${camPctY(y)}%` }}
    >
      <div className="flex flex-col items-center gap-1">
        <div
          className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums backdrop-blur ${
            charging
              ? 'border-emerald-400/40 bg-background/85 text-emerald-300 shadow-[0_0_14px_hsla(142,76%,50%,0.35)]'
              : 'border-foreground/15 bg-background/80 text-foreground/85'
          }`}
        >
          <span className="relative inline-flex h-1.5 w-1.5">
            {charging && (
              <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:animate-none" />
            )}
            <span
              className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                charging ? 'bg-emerald-400' : 'bg-foreground/50'
              }`}
            />
          </span>
          {name ? <span className="max-w-[90px] truncate">{name}</span> : null}
          <span>
            {charging && kw !== null ? `Charging · ${kw.toFixed(1)} kW` : 'Parked'}
          </span>
          {(soc !== null || rangeMi !== null) && (
            <span className="font-medium text-foreground/70">
              ·{soc !== null ? ` ${soc}%` : ''}
              {rangeMi !== null ? ` · ${Math.round(rangeMi)} mi` : ''}
            </span>
          )}
        </div>

      </div>
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
  /**
   * §5 — CO-LOCATION PROOF for the primary vehicle. `true` only when an open
   * home_charging_session carries `presence_evidence: 'wall_connector'` — a
   * wall connector reporting this VIN under load. Fail-closed: when this prop
   * is supplied and false, no car is drawn, even if the vehicle's own
   * telemetry claims it is charging. That claim is not co-location proof.
   * Leave undefined for legacy callers (falls back to connection heuristics).
   */
  presenceProven?: boolean;
  /* EV2 removed: the scene renders exactly one vehicle until EV1 is solid. */
  /** §3 — grid provenance for this frame, from the single reconciledFlow. */
  gridSource?: 'raw' | 'reconciled';
  gridOverrideReason?: string | null;
  /** §4 — home load is derived (no meter). */
  homeDerived?: boolean;
}

/**
 * §8b — SPRITE LIGHTING. All 26 vehicle sprites are lit for daylight. Dropped
 * unmodified onto a dusk or night plate they read as cut-outs, because they
 * are. A per-scene filter on the sprite layer puts them in the same light as
 * the house.
 */
export const SPRITE_FILTER: Record<SceneKey, string | undefined> = {
  day: undefined,
  'day-export': undefined,
  dusk: 'brightness(0.85) saturate(0.9)',
  night: 'brightness(0.6) contrast(1.05)',
  'night-ev': 'brightness(0.6) contrast(1.05)',
  'night-pw-discharge': 'brightness(0.6) contrast(1.05)',
  'night-pw-discharge-ev': 'brightness(0.6) contrast(1.05)',
  rain: 'brightness(0.75) saturate(0.8)',
};

/** Blue ambient wash applied over sprites on night plates, matching the house. */
const NIGHT_SCENES: SceneKey[] = ['night', 'night-ev', 'night-pw-discharge', 'night-pw-discharge-ev'];

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
  presenceProven,
  gridSource = 'raw',
  gridOverrideReason = null,
  homeDerived = false,
}: EnergyFlowSceneProps) {


  // Minute-granularity clock tick: pickScene() reads the wall clock, so without a
  // time-based dependency the scene key freezes whenever telemetry stops changing.
  const [minuteBucket, setMinuteBucket] = useState(() => Math.floor(Date.now() / 60000));
  useEffect(() => {
    const id = window.setInterval(
      () => setMinuteBucket(Math.floor(Date.now() / 60000)),
      15000,
    );
    return () => window.clearInterval(id);
  }, []);

  const { scene, composition } = useMemo(
    () =>
      forceScene
        ? { scene: forceScene, composition: forceComposition ?? 'full-stack' as CompositionKey }
        : chooseSceneType(
            data,
            { hasSolar: true, hasBattery, hasTesla, hasCharger, isOutage },
            { weatherCode },
          ),
    // minuteBucket is intentionally a dependency: it re-evaluates the time-of-day scene.
    [forceScene, forceComposition, data, hasBattery, hasTesla, hasCharger, isOutage, weatherCode, minuteBucket],
  );


  // SCENE DIAGNOSTIC — `?scenedebug=1`.
  // Records what the clock actually evaluated to for this render, so a
  // night-at-midday report is attributed to the clock, the weather override,
  // a forced scene, or the asset — never guessed at after the fact.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!new URLSearchParams(window.location.search).has('scenedebug')) return;
    const now = new Date();
    // eslint-disable-next-line no-console
    console.info('[scenedebug]', {
      rendered_scene: scene,
      composition,
      forceScene: forceScene ?? null,
      pickScene_raw: forceScene ? null : pickScene(data, now),
      getHours: now.getHours(),
      iso: now.toISOString(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tzOffsetMin: now.getTimezoneOffset(),
      weatherCode: weatherCode ?? null,
      solarPower: data.solarPower ?? null,
      gridPower: data.gridPower ?? null,
      batteryPower: data.batteryPower ?? null,
    });
  }, [scene, composition, forceScene, data, weatherCode]);

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
  // v5.2: render the dynamic car whenever a Tesla is connected and we
  // have ANY usable silhouette — including the generic Model 3 fallback
  // returned by resolveVehicleAsset when telemetry hasn't yet revealed
  // the exact model. Previously `!vehicleGeneric` hid the EV node for
  // freshly-linked accounts, which was the "EV doesn't populate" bug.
  // §5 — presence is now provable, so it gates the scene. When the caller
  // supplies `presenceProven`, that boolean IS the gate: no wall-connector
  // VIN match, no car. The away-and-charging-elsewhere case renders an empty
  // driveway on purpose — that is the design working, not a missing sprite.
  // §8c — night-ev no longer suppresses the sprite; the baked car is swapped
  // out for the member's actual vehicle under a night filter instead.
  const showDynamicCar =
    (presenceProven === undefined ? carConnected : presenceProven) && Boolean(vehicleSrc);

  // §8c — when we are drawing a real sprite, never use a plate with a car
  // baked into it, or the household sees two cars.
  const bakedScene: SceneKey =
    showDynamicCar && scene === 'night-ev'
      ? 'night'
      : showDynamicCar && scene === 'night-pw-discharge-ev'
        ? 'night-pw-discharge'
        : scene;
  const spriteFilter = SPRITE_FILTER[scene];
  const spriteIsNight = NIGHT_SCENES.includes(scene);

  // v5.3 — measured intrinsic aspect ratio drives the auto-fit below.
  const primaryAspect = useSpriteContentBox(vehicleSrc);



  // Car geometry in viewBox (0–100) space. When actively charging at home,
  // pull up to the garage apron with the door visually "open"; otherwise
  // stay parked in the driveway.
  const prefersReducedMotion = useReducedMotion();

  // Temporary anchor-verification overlay: /home?anchors=1
  const showAnchorDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('anchors') === '1';


  // Trunk-and-branch conductor topology (see ConductorNetwork.tsx).
  // Battery and EV are branches of the same junction; in outage mode the
  // battery→home hero below owns that story instead.
  // The EV spoke exists ONLY while a proven vehicle is charging here. There
  // is no dimmed "inactive" EV branch — away or parked means absent.
  const teslaCharging = data.tesla?.isCharging === true && data.tesla?.source !== 'supercharger';
  const evBranchKw =
    teslaCharging && !isOutage && showDynamicCar
      ? Math.abs(data.tesla?.kW ?? data.evPower ?? 0)
      : 0;

  const conductorSegments = useMemo(
    () =>
      buildConductorSegments({
        solar,
        home,
        grid,
        battery: isOutage ? 0 : battery,
        ev: evBranchKw,
        colors: {
          solar: EMERALD_LED,
          home: EMERALD_LED,
          export: CYAN_LED,
          import: SKY_LED,
          // The EV run gets its own hue so it can never be mistaken for the
          // solar-to-home line it used to share both colour and origin with.
          ev: 'hsl(265 90% 78%)',
        },
        dimSolar: isOutage,
        hideGrid: isOutage,
      }),
    [solar, home, grid, battery, evBranchKw, isOutage],
  );



  // Supercharger detection reads the VEHICLE's own charge-port telemetry,
  // never the site. `fast_charger_brand` alone is unreliable — it lingers
  // from a previous DC session — so DC is only asserted when the port
  // reports a DC connector AND the vehicle is not proven at this site.
  const tp = teslaPayload as
    | {
        fast_charger_present?: boolean;
        fast_charger_brand?: string | null;
        conn_charge_cable?: string | null;
        charger_phases?: number | null;
        fast_charger_type?: string | null;
      }
    | undefined;
  // AC evidence from the onboard charger: phases reported (1 or 3) or a
  // non-DC cable type. Either one rules out supercharging outright.
  const acEvidence =
    (typeof tp?.charger_phases === 'number' && tp.charger_phases > 0) ||
    (typeof tp?.conn_charge_cable === 'string' &&
      tp.conn_charge_cable.length > 0 &&
      !/combo|ccs|gb|dc/i.test(tp.conn_charge_cable));
  const dcEvidence =
    tp?.fast_charger_present === true ||
    (typeof tp?.fast_charger_type === 'string' && /combo|ccs|supercharger/i.test(tp.fast_charger_type));

  const isSupercharging =
    isCharging && dcEvidence && !acEvidence && presenceProven !== true;

  const chargingAtHome = isCharging && !isSupercharging && !isOutage;

  // v5.4 — ONE FIXED DRIVEWAY POSE. EV1 always sits on the driveway apron,
  // parallel to the facade. Charging and "present, not charging" share the
  // same anchor; the only difference is whether the cable and EV spoke are
  // drawn. The sprite is contained inside the bay at its measured aspect
  // ratio and seated on the bay's contact line, so it holds at any width.
  const primaryBay = HOME_BLUEPRINT.bays.driveway;
  const carFit = useMemo(
    () => fitVehicleToBay(primaryBay, primaryAspect, 1),
    [primaryBay, primaryAspect],
  );
  const carAnchor = { x: carFit.cx, y: carFit.cy };
  const carW = carFit.width;
  const carH = carFit.height;
  const carX = carFit.x;
  const carY = carFit.y;

  /** The car's charge port, derived from the sprite's fitted footprint so the
   *  cable always lands on the bodywork, whatever sprite/aspect is in play. */
  const evPortPt = {
    x: carFit.cx + carFit.width * 0.30,
    y: carFit.groundY - carFit.height * 0.34,
  };

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
      data-grid-source={gridSource}
      data-grid-override={gridOverrideReason ?? ''}
      data-home-derived={homeDerived ? '1' : '0'}
    >
      {/* Atmosphere — a soft sky gradient behind the roofline that fades into
          the UI. Does most of the depth work; the scene reads flat without it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[62%] bg-[linear-gradient(to_bottom,hsl(205_45%_16%/0.85),hsl(210_45%_10%/0.45)_45%,transparent_100%)]"
      />

      {/* Ambient gradient floor with subtle depth */}

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_40%,hsl(220_50%_12%/0.85),transparent_65%),radial-gradient(circle_at_50%_95%,hsl(var(--primary)/0.14),transparent_55%),linear-gradient(to_bottom,hsl(220_60%_6%/0.4),hsl(220_70%_3%/0.7))]"
      />

      {/* v5 Phase C — weather sky tint. An ambient base tint sits BEHIND
          the house (sets the mood of the air around it), and a soft-light
          blended tint sits ABOVE the house so the building itself picks
          up the color cast — overcast greys the walls, rain cools them,
          storm pushes them violet. Both fade smoothly between codes. */}
      {skyTint && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-[5] transition-opacity duration-700"
            style={{ background: skyTint }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-700"
            style={{ background: skyTint, mixBlendMode: 'soft-light', zIndex: 10 }}
          />
        </>
      )}

      {/* v5 Phase 1 — pure-SVG HouseSceneV5 (replaces baked PNGs).
          Geometry & anchors live in HouseSceneV5.tsx + HomeBlueprint.ts. */}
      <AnimatePresence mode="sync">
        <motion.div
          key={bakedScene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <HouseSceneV5
            scene={bakedScene}
            homeActive={homeDrawing}
            solarActive={solarProducing}
            garageOpen={chargingAtHome || carConnected}
            weatherCode={weatherCode}
          />

        </motion.div>
      </AnimatePresence>

      {/* Behind-the-house conductor layer. Same viewBox + layout box as the
          front overlay, but painted UNDER the hero art (house img is z:2) so
          a run that physically passes behind the building never crosses the
          silhouette. */}
      <svg
        aria-hidden="true"
        viewBox={SCENE_CAMERA.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-full w-auto max-w-full -translate-y-1/2"
        style={{ aspectRatio: SCENE_CAMERA.aspect, zIndex: 1 }}
      >
        {conductorSegments
          .filter((s) => s.layer === 'behind')
          .map((s) => (
            <Conductor
              key={s.id}
              id={s.id}
              points={s.points}
              color={s.color}
              kw={s.kw}
              forward={s.forward}
              dimmed={s.dimmed}
              reducedMotion={Boolean(prefersReducedMotion)}
            />
          ))}
      </svg>


      {/* Single hero-aligned overlay: halos + dotted flows + dynamic car.
          Same layout classes as the hero <img>, so viewBox 0–100 maps 1:1
          to the painted house. This is the only coordinate system. */}
      <svg
        aria-hidden="true"
        viewBox={SCENE_CAMERA.viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-full w-auto max-w-full -translate-y-1/2"
        style={{ aspectRatio: SCENE_CAMERA.aspect, zIndex: 15 }}
      >
        {/* ── Device halos (primary visual language) ──
            RoofHalo / WindowsBloom retired: they were free-floating blooms
            anchored to the legacy blueprint coordinates, so they drifted off
            the roof plane and onto blank sky/wall. A glow may only render at
            a named anchor that is actually passing power. */}

        {/* Powerwall — only rendered when a battery is actually connected. */}
        {hasBattery && (
          <>
            <DeviceHalo
              cx={SCENE_ANCHORS.powerwall.x}
              cy={SCENE_ANCHORS.powerwall.y}
              color={EMERALD}
              active
              intensity={0.5}
              radius={3.8}
              pulseMs={5000}
            />
            <DeviceHalo
              cx={SCENE_ANCHORS.powerwall.x}
              cy={SCENE_ANCHORS.powerwall.y}
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
            .map((legacySlot, i) => {
              // Slots are laid out relative to the VERIFIED powerwall anchor.
              const slot = {
                x: SCENE_ANCHORS.powerwall.x + (i % 2 === 0 ? -3.4 : 3.4),
                y: SCENE_ANCHORS.powerwall.y + Math.floor(i / 2) * 4.2,
              };
              return (
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
              );
            })}




        {/* Service entrance state — drawn on the ONE meter object (the can at
            the base of the service panel), not on a second pedestal. The old
            free-floating meter halo on the right of the slab was a duplicate
            of the panel glyph's job and has been removed. */}
        <DeviceHalo
          cx={SCENE_ANCHORS.wallJunction.x}
          cy={SCENE_ANCHORS.wallJunction.y + 5.2}
          color={isOutage ? AMBER : gridExporting ? CYAN : SKY}
          active={isOutage || gridImporting || gridExporting}
          intensity={isOutage ? 0.35 : intensity(grid) * 0.6}
          radius={isOutage ? 3.0 : 3.2}
          pulseMs={isOutage ? 5200 : 2800}
        />
        {isOutage && (
          <g style={{ pointerEvents: 'none' }}>
            <path
              d={`M ${SCENE_ANCHORS.wallJunction.x - 1.2} ${SCENE_ANCHORS.wallJunction.y + 2.4} L ${SCENE_ANCHORS.wallJunction.x + 1.2} ${SCENE_ANCHORS.wallJunction.y + 4.8} M ${SCENE_ANCHORS.wallJunction.x + 1.2} ${SCENE_ANCHORS.wallJunction.y + 2.4} L ${SCENE_ANCHORS.wallJunction.x - 1.2} ${SCENE_ANCHORS.wallJunction.y + 4.8}`}
              stroke="hsl(0 85% 65%)"
              strokeWidth={0.55}
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}


        {/* Wall-connector halo retired: the baked art has no visible charger
            at that anchor, so it read as a free-floating bloom. Charge state is
            carried by the EV branch and the charge-port pulse. */}





        {/* ── Max 2 ultra-minimal dotted flow lines ── */}
        {/* In Outage Mode, solar flows are dimmed so the eye lands on
            battery → home as the dominant route. */}
        {/* ── Trunk-and-branch conductor network ──
            One junction, not two arcs: the trunk carries total production
            from the roof plane down to the main panel, then divides into the
            home-load branch and the grid branch. Import reverses the grid
            branch (dash, chevron and colour all flip). */}
        {/* v12c bakes the service panel + meter can into the equipment wall,
            so the drawn glyph would be a second, duplicate panel. Retired. */}


        {conductorSegments
          // `branch-ev` is rendered by `EvChargeCable` further down — a cable,
          // not a fixed conduit run, so it must not draw twice.
          .filter((s) => s.layer === 'front' && s.id !== 'branch-ev')
          .map((s) => (
            <Conductor
              key={s.id}
              id={s.id}
              points={s.points}
              color={s.color}
              kw={s.kw}
              forward={s.forward}
              dimmed={s.dimmed}
              reducedMotion={Boolean(prefersReducedMotion)}
            />
          ))}

        {/* Temporary anchor debug overlay — `?anchors=1`. Renders every named
            anchor at its overlay coordinate so it can be checked against the
            baked house art. Not reachable without the query flag. */}
        {showAnchorDebug &&
          SCENE_ANCHOR_LIST.map(([name, p]) => (
            <g key={name}>
              <circle cx={p.x} cy={p.y} r={1.1} fill="none" stroke="#ff2d55" strokeWidth={0.45} />
              <circle cx={p.x} cy={p.y} r={0.25} fill="#ff2d55" />
              <text
                x={p.x + 1.8}
                y={p.y + 0.6}
                fill="#ffe066"
                fontSize={1.9}
                fontFamily="ui-monospace, monospace"
              >
                {name} {p.x.toFixed(1)},{p.y.toFixed(1)}
              </text>
            </g>
          ))}







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





        {/* EV + battery runs are branches of the conductor network above. */}

        {/* Grid import/export is now the grid BRANCH of the conductor
            network above — no standalone roof→post arc. */}


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


        {/* EV1 stays on the driveway apron in every state. No garage-bay
            animation, and no cable unless power is actually flowing. */}


        {/* Charge point on the garage-side facade — the physical origin of the
            EV conductor. Without it the run began in mid-air, which is why the
            eye read it as a continuation of the solar-to-home line. */}
        {chargingAtHome && showDynamicCar && (
          <g style={{ pointerEvents: 'none' }} data-testid="charge-point">
            <rect
              x={SCENE_ANCHORS.chargePoint.x - 0.7}
              y={SCENE_ANCHORS.chargePoint.y - 2.6}
              width={1.4}
              height={2.6}
              rx={0.5}
              fill="hsl(220 14% 20%)"
              opacity={0.95}
              stroke="hsl(220 15% 62%)"
              strokeWidth={0.16}
            />
            <circle
              cx={SCENE_ANCHORS.chargePoint.x}
              cy={SCENE_ANCHORS.chargePoint.y - 1.5}
              r={0.36}
              fill="hsl(265 90% 78%)"
            >
              {!prefersReducedMotion && (
                <animate
                  attributeName="opacity"
                  values="0.45;1;0.45"
                  dur="1800ms"
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        )}

        {/* (charging cable renders AFTER the car sprite — see below) */}




        {/* ── Dynamic Tesla, locked to the same coordinate system ── */}
        {showDynamicCar && vehicleSrc && (
          <g>
            {/* GROUND SEATING — three layers, so a daylight side-profile sprite
                reads as parked on the driveway instead of pasted over it:
                  1. wide, very soft penumbra spreading onto the apron
                  2. tighter core shadow under the body
                  3. a hard, narrow contact shadow right at the tyre line
                Offsets are relative to the sprite's visual footprint, which
                sits ~0.22·carH below the anchor — not at 0.42·carH, where the
                old single ellipse fell clear of the car entirely. */}
            <ellipse
              cx={carFit.cx + carFit.width * 0.02}
              cy={carFit.groundY + carFit.height * 0.017}
              rx={carW * 0.52}
              ry={carH * 0.075}
              fill="hsl(220 60% 3%)"
              opacity={0.32}
              style={{ filter: 'blur(2.6px)' }}
            />
            <ellipse
              cx={carFit.cx}
              cy={carFit.groundY + carFit.height * 0.007}
              rx={carW * 0.38}
              ry={carH * 0.052}
              fill="hsl(220 70% 2%)"
              opacity={0.5}
              style={{ filter: 'blur(1.2px)' }}
            />
            <ellipse
              cx={carFit.cx}
              cy={carFit.groundY}
              rx={carW * 0.30}
              ry={carH * 0.022}
              fill="hsl(220 75% 1%)"
              opacity={0.62}
              style={{ filter: 'blur(0.45px)' }}
            />

            <image
              href={vehicleSrc}
              x={carX}
              y={carY}
              width={carW}
              height={carH}
              preserveAspectRatio="xMidYMid meet"
              style={{
                filter: [spriteFilter, 'drop-shadow(0 1.5px 2px hsl(220 70% 2% / 0.65))']
                  .filter(Boolean)
                  .join(' '),
              }}
            />
            {/* §8b — blue ambient wash so the sprite sits in the same night
                light as the house instead of reading as a daylight cut-out. */}
            {spriteIsNight && (
              <rect
                x={carX}
                y={carY}
                width={carW}
                height={carH}
                fill="hsl(220 70% 30%)"
                opacity={0.18}
                style={{ mixBlendMode: 'soft-light', pointerEvents: 'none' }}
              />
            )}
            {/* Emerald charge-port pulse while actively charging */}
            {chargingAtHome && (
              <g style={{ pointerEvents: 'none' }}>
                <circle
                  cx={evPortPt.x}
                  cy={evPortPt.y}
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
                  cx={evPortPt.x}
                  cy={evPortPt.y}
                  r={0.7}
                  fill={EMERALD_LED}
                  opacity={0.95}
                />
              </g>
            )}
          </g>
        )}

        {/* Live charging cable — the visible link from the wall charge point to
            the car's port. Drawn AFTER the sprite so it reads as plugged in
            rather than hidden behind the bodywork. Distinct in style from the
            fixed conductor runs: a short sagging catenary in violet with a
            travelling dash. */}
        {chargingAtHome && showDynamicCar && (
          <EvChargeCable
            to={evPortPt}
            reducedMotion={Boolean(prefersReducedMotion)}
          />
        )}



      </svg>

      {/* HTML overlay aligned to the same square as the hero PNG / SVG.
          Lets us drop a "Charging" pill that tracks the car anchor in
          the exact same 0–100 coordinate space. */}
      {/* §5 — vehicle chip, attached to the rendered car. A chip exists only
          where a car exists, and a car exists only where co-location is
          proven, so the chip never has to claim a location. */}
      {showDynamicCar && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-full max-w-full -translate-y-1/2"
          style={{ aspectRatio: SCENE_CAMERA.aspect, zIndex: 18 }}
        >
          <VehicleChip
            x={carFit.cx}
            y={carFit.y - 1}
            name={displayName}
            kw={chargingAtHome ? evKw : null}
            soc={typeof evSoc === 'number' ? evSoc : null}
            rangeMi={typeof evRange === 'number' ? evRange : null}
            charging={chargingAtHome}
          />
        </div>
      )}



      {/* v5 Phase B — Supercharging badge. Shown when Tesla telemetry
          reports a fast charger present (Supercharger, EA, etc). The car
          is away from home so the dynamic car + cable arc are suppressed;
          this pill keeps live charge state visible. It sits in the mid band
          of the scene so it never collides with the corner readouts. */}
      {isSupercharging && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[42%] z-30 flex justify-center px-3"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-amber-200 shadow-[0_0_18px_hsla(38,95%,55%,0.4)] backdrop-blur">
            <span className="text-[11px] leading-none">⚡</span>
            <span className="uppercase tracking-[0.14em]">Supercharging</span>
            <span className="text-amber-100/90">· {evKw.toFixed(0)} kW</span>
            {typeof evSoc === 'number' && (
              <span className="text-amber-100/70">· {evSoc}%</span>
            )}
          </div>
        </div>
      )}

      {/* AC charging badge — only when no car sprite is drawn. When the car
          IS drawn, its own attached VehicleChip already states the same
          fact, so showing both stacked two pills on top of each other. */}
      {chargingAtHome && !showDynamicCar && (evBranchKw > 0.1 || evKw > 0.1) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[42%] z-30 flex justify-center px-3"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/50 bg-violet-500/15 px-2.5 py-1 text-[10px] font-semibold tabular-nums text-violet-100 shadow-[0_0_18px_hsla(265,90%,70%,0.35)] backdrop-blur">
            <span className="text-[11px] leading-none">⚡</span>
            <span className="uppercase tracking-[0.14em]">AC Charging</span>
            <span className="text-violet-100/90">
              · {(evBranchKw > 0.1 ? evBranchKw : evKw).toFixed(1)} kW
            </span>
            {typeof evSoc === 'number' && (
              <span className="text-violet-100/70">· {evSoc}%</span>
            )}
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
          /* §4 — home load has no meter behind it. Permanent asterisk, always. */
          label={homeDerived ? 'Home *' : 'Home'}
          value={fmtKw(home)}
          sub={
            homeDerived
              ? `${homeDrawing ? 'Drawing' : 'Idle'} · derived`
              : homeDrawing
                ? 'Drawing'
                : 'Idle'
          }
          accent={homeDrawing ? 'green' : 'muted'}
          active={homeDrawing}
          hero
        />
      )}
      {hasBattery ? (
        <FlowLabel
          position="bl"
          label="Powerwall"
          // Caret follows the FLOW DIRECTION drawn in the diagram, not the raw
          // sign: charging = energy INTO the pack (▼), discharging = OUT (▲).
          value={`${fmtKw(battery)} ${pwCharging ? '▼' : pwDischarging ? '▲' : ''}`.trim()}
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
          /* §3 — grid is usually measured. The marker appears only on the
             frames where the raw CT disagreed with the rest of the site. */
          label={gridSource === 'reconciled' ? 'Grid ◆' : 'Grid'}
          value={`${fmtKw(grid)} ${arrow(grid)}`.trim()}
          sub={
            gridSource === 'reconciled'
              ? 'Reconciled this frame'
              : gridImporting
                ? 'Importing'
                : gridExporting
                  ? 'Exporting'
                  : 'Balanced'
          }
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
