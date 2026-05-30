/**
 * Scene configuration for the ZenCasa-style Live Energy card.
 *
 * - VEHICLE_SRC maps a canonical Tesla model id to its 3D render asset.
 * - resolveVehicleModel() inspects a Tesla telemetry payload and returns the
 *   best-matching model id (or null if undetectable).
 *
 * These assets are stylized AI renders matched to the isometric night-mode
 * house scenes — same lighting direction, same camera angle, transparent
 * background so they can be composited over the driveway.
 */

import vehicleModel3 from '@/assets/zencasa/vehicles/tesla-model-3.png';
import vehicleModelY from '@/assets/zencasa/vehicles/tesla-model-y.png';
import vehicleModelS from '@/assets/zencasa/vehicles/tesla-model-s.png';
import vehicleModelX from '@/assets/zencasa/vehicles/tesla-model-x.png';
import vehicleCybertruck from '@/assets/zencasa/vehicles/tesla-cybertruck.png';

export type VehicleModel =
  | 'model3'
  | 'modely'
  | 'models'
  | 'modelx'
  | 'cybertruck';

export const VEHICLE_SRC: Record<VehicleModel, string> = {
  model3: vehicleModel3,
  modely: vehicleModelY,
  models: vehicleModelS,
  modelx: vehicleModelX,
  cybertruck: vehicleCybertruck,
};

export const VEHICLE_LABEL: Record<VehicleModel, string> = {
  model3: 'Model 3',
  modely: 'Model Y',
  models: 'Model S',
  modelx: 'Model X',
  cybertruck: 'Cybertruck',
};

/**
 * Resolve a canonical Tesla model id from arbitrary telemetry shapes.
 * Accepts the raw `payload` from useEVChargerTelemetry OR a plain string hint.
 */
export function resolveVehicleModel(
  input: unknown,
): VehicleModel | null {
  const candidates: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string' && v.length > 0) candidates.push(v);
  };

  if (typeof input === 'string') {
    push(input);
  } else if (input && typeof input === 'object') {
    const p = input as Record<string, any>;
    // Tesla Fleet API common fields
    push(p?.vehicle_config?.car_type);
    push(p?.vehicles?.[0]?.vehicle_config?.car_type);
    push(p?.response?.vehicle_config?.car_type);
    push(p?.car_type);
    // Display name fallback ("Joe's Model Y", "Cybertruck", etc.)
    push(p?.display_name);
    push(p?.vehicles?.[0]?.display_name);
    push(p?.response?.display_name);
    push(p?.model);
    push(p?.vehicle_model);
  }

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
