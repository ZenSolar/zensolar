/**
 * Scene configuration for the ZenCasa-style Live Energy card.
 *
 * - VEHICLE_SRC (legacy) — single-color asset per model. Used as fallback
 *   when no color match is found.
 * - VEHICLE_COLOR_SRC — model × color matrix of high-quality pre-rendered
 *   PNGs. Drives "exact car" parity with Tesla's native app.
 * - resolveVehicleModel() — model id from telemetry.
 * - resolveVehicleColor() — canonical Tesla color id from telemetry.
 * - resolveVehicleAsset() — combines both and returns the best PNG src.
 */

import vehicleModel3 from '@/assets/zencasa/vehicles/tesla-model-3.png';
import vehicleModelY from '@/assets/zencasa/vehicles/tesla-model-y.png';
import vehicleModelS from '@/assets/zencasa/vehicles/tesla-model-s.png';
import vehicleModelX from '@/assets/zencasa/vehicles/tesla-model-x.png';
import vehicleCybertruck from '@/assets/zencasa/vehicles/tesla-cybertruck.png';

// Colored matrix
import m3PearlWhite from '@/assets/zencasa/vehicles/model-3-pearl-white.png';
import m3SolidBlack from '@/assets/zencasa/vehicles/model-3-solid-black.png';
import m3DeepBlue from '@/assets/zencasa/vehicles/model-3-deep-blue.png';
import m3Red from '@/assets/zencasa/vehicles/model-3-red.png';
import m3StealthGrey from '@/assets/zencasa/vehicles/model-3-stealth-grey.png';

import myPearlWhite from '@/assets/zencasa/vehicles/model-y-pearl-white.png';
import mySolidBlack from '@/assets/zencasa/vehicles/model-y-solid-black.png';
import myDeepBlue from '@/assets/zencasa/vehicles/model-y-deep-blue.png';
import myRed from '@/assets/zencasa/vehicles/model-y-red.png';
import myStealthGrey from '@/assets/zencasa/vehicles/model-y-stealth-grey.png';

import msPearlWhite from '@/assets/zencasa/vehicles/model-s-pearl-white.png';
import msSolidBlack from '@/assets/zencasa/vehicles/model-s-solid-black.png';
import msDeepBlue from '@/assets/zencasa/vehicles/model-s-deep-blue.png';
import msRed from '@/assets/zencasa/vehicles/model-s-red.png';
import msStealthGrey from '@/assets/zencasa/vehicles/model-s-stealth-grey.png';

import mxPearlWhite from '@/assets/zencasa/vehicles/model-x-pearl-white.png';
import mxSolidBlack from '@/assets/zencasa/vehicles/model-x-solid-black.png';
import mxDeepBlue from '@/assets/zencasa/vehicles/model-x-deep-blue.png';
import mxRed from '@/assets/zencasa/vehicles/model-x-red.png';
import mxStealthGrey from '@/assets/zencasa/vehicles/model-x-stealth-grey.png';

import cybertruckStainless from '@/assets/zencasa/vehicles/cybertruck-stainless.png';

export type VehicleModel =
  | 'model3'
  | 'modely'
  | 'models'
  | 'modelx'
  | 'cybertruck';

export type VehicleColor =
  | 'pearl-white'
  | 'solid-black'
  | 'deep-blue'
  | 'red'
  | 'stealth-grey'
  | 'stainless';

/** Legacy single-asset map — used as final fallback. */
export const VEHICLE_SRC: Record<VehicleModel, string> = {
  model3: vehicleModel3,
  modely: vehicleModelY,
  models: vehicleModelS,
  modelx: vehicleModelX,
  cybertruck: vehicleCybertruck,
};

/** Model × color matrix. Cybertruck only has stainless. */
export const VEHICLE_COLOR_SRC: Record<
  VehicleModel,
  Partial<Record<VehicleColor, string>>
> = {
  model3: {
    'pearl-white': m3PearlWhite,
    'solid-black': m3SolidBlack,
    'deep-blue': m3DeepBlue,
    red: m3Red,
    'stealth-grey': m3StealthGrey,
  },
  modely: {
    'pearl-white': myPearlWhite,
    'solid-black': mySolidBlack,
    'deep-blue': myDeepBlue,
    red: myRed,
    'stealth-grey': myStealthGrey,
  },
  models: {
    'pearl-white': msPearlWhite,
    'solid-black': msSolidBlack,
    'deep-blue': msDeepBlue,
    red: msRed,
    'stealth-grey': msStealthGrey,
  },
  modelx: {
    'pearl-white': mxPearlWhite,
    'solid-black': mxSolidBlack,
    'deep-blue': mxDeepBlue,
    red: mxRed,
    'stealth-grey': mxStealthGrey,
  },
  cybertruck: {
    stainless: cybertruckStainless,
  },
};

export const VEHICLE_LABEL: Record<VehicleModel, string> = {
  model3: 'Model 3',
  modely: 'Model Y',
  models: 'Model S',
  modelx: 'Model X',
  cybertruck: 'Cybertruck',
};

export const VEHICLE_COLOR_LABEL: Record<VehicleColor, string> = {
  'pearl-white': 'Pearl White',
  'solid-black': 'Solid Black',
  'deep-blue': 'Deep Blue Metallic',
  red: 'Red Multi-Coat',
  'stealth-grey': 'Stealth Grey',
  stainless: 'Stainless Steel',
};

/** Per-model default color when no telemetry hint is available. */
const DEFAULT_COLOR: Record<VehicleModel, VehicleColor> = {
  model3: 'pearl-white',
  modely: 'pearl-white',
  models: 'pearl-white',
  modelx: 'pearl-white',
  cybertruck: 'stainless',
};

/**
 * Resolve a canonical Tesla model id from arbitrary telemetry shapes.
 */
export function resolveVehicleModel(
  input: unknown,
): VehicleModel | null {
  const candidates = collectStrings(input, [
    'vehicle_config.car_type',
    'vehicles.0.vehicle_config.car_type',
    'response.vehicle_config.car_type',
    'car_type',
    'display_name',
    'vehicles.0.display_name',
    'response.display_name',
    'model',
    'vehicle_model',
  ]);

  for (const raw of candidates) {
    const s = raw.toLowerCase().replace(/[\s_-]/g, '');
    if (s.includes('cybertruck') || s.includes('cyber')) return 'cybertruck';
    if (s.includes('modely') || /\bmy\b/.test(raw.toLowerCase())) return 'modely';
    if (s.includes('model3') || /\bm3\b/.test(raw.toLowerCase())) return 'model3';
    if (s.includes('models')) return 'models';
    if (s.includes('modelx')) return 'modelx';
  }
  return null;
}

/**
 * Resolve a canonical Tesla color id from arbitrary telemetry shapes.
 * Reads vehicle_config.exterior_color and common variants.
 */
export function resolveVehicleColor(
  input: unknown,
): VehicleColor | null {
  const candidates = collectStrings(input, [
    'vehicle_config.exterior_color',
    'vehicles.0.vehicle_config.exterior_color',
    'response.vehicle_config.exterior_color',
    'exterior_color',
    'color',
    'paint_color',
  ]);

  for (const raw of candidates) {
    const s = raw.toLowerCase().replace(/[\s_-]/g, '');
    // Tesla canonical exterior_color strings: PearlWhite, MidnightSilver,
    // DeepBlue, Red / RedMulti, SolidBlack, StealthGrey, Quicksilver,
    // SilverMetallic, UltraRed, etc.
    if (s.includes('pearlwhite') || s === 'white') return 'pearl-white';
    if (s.includes('solidblack') || s === 'black' || s.includes('obsidian'))
      return 'solid-black';
    if (s.includes('deepblue') || s.includes('blue')) return 'deep-blue';
    if (s.includes('red')) return 'red';
    if (
      s.includes('stealthgrey') ||
      s.includes('stealthgray') ||
      s.includes('midnightsilver') ||
      s.includes('quicksilver') ||
      s.includes('grey') ||
      s.includes('gray') ||
      s.includes('silver')
    )
      return 'stealth-grey';
    if (s.includes('stainless') || s.includes('steel')) return 'stainless';
  }
  return null;
}

/**
 * High-level helper: returns the best asset src for the user's car.
 * Falls back across: (model + color) → (model + default color) → legacy.
 */
export function resolveVehicleAsset(
  input: unknown,
  overrides?: { model?: VehicleModel | null; color?: VehicleColor | null },
): { model: VehicleModel | null; color: VehicleColor | null; src: string | null } {
  const model = overrides?.model ?? resolveVehicleModel(input);
  if (!model) return { model: null, color: null, src: null };

  const detected = overrides?.color ?? resolveVehicleColor(input);
  const color = detected ?? DEFAULT_COLOR[model];

  const matrix = VEHICLE_COLOR_SRC[model];
  const src =
    matrix[color] ??
    matrix[DEFAULT_COLOR[model]] ??
    VEHICLE_SRC[model] ??
    null;

  return { model, color, src };
}

// ---------- internal ----------

function collectStrings(input: unknown, paths: string[]): string[] {
  const out: string[] = [];
  if (typeof input === 'string') {
    out.push(input);
    return out;
  }
  if (!input || typeof input !== 'object') return out;
  for (const p of paths) {
    const v = getPath(input, p);
    if (typeof v === 'string' && v.length > 0) out.push(v);
  }
  return out;
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<any>((acc, key) => {
    if (acc == null) return undefined;
    return acc[key];
  }, obj);
}
