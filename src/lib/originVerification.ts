/**
 * Proof-of-Origin pure verification helpers.
 *
 * These functions are the contract for "where did this energy come from?".
 * They run identically in the client, in edge functions, and in tests.
 * If you change them, update src/lib/__tests__/originVerification.test.ts
 * and document user-facing impact in mem://features/proof-of-genesis-*.
 *
 * Rules enforced here (mirrors db migration 2026-05-24):
 *   O1. Device fingerprint uniqueness — (provider, device_id) is one physical thing.
 *   O2. Provider whitelist — only known integrations can submit production.
 *   O4. Device handoff — owner change zeroes baseline; new owner starts at 0.
 *   O6. Geo-fence sanity — implausible same-hour location deltas are flagged.
 */

export const CONNECTED_DEVICE_PROVIDERS = [
  'tesla',
  'enphase',
  'solaredge',
  'wallbox',
] as const;

export const ENERGY_PRODUCTION_PROVIDERS = [
  'tesla',
  'tesla_home_charging',
  'tesla_historical',
  'enphase',
  'solaredge',
  'wallbox',
] as const;

export type ConnectedDeviceProvider = (typeof CONNECTED_DEVICE_PROVIDERS)[number];
export type EnergyProductionProvider = (typeof ENERGY_PRODUCTION_PROVIDERS)[number];

export interface DeviceFingerprint {
  provider: string;
  device_id: string;
}

export interface DeviceClaim extends DeviceFingerprint {
  user_id: string;
}

export interface GeoEvent {
  user_id: string;
  device_id: string;
  recorded_at: string; // ISO
  latitude: number;
  longitude: number;
}

export interface OriginAnomaly {
  code:
    | 'provider_not_whitelisted'
    | 'duplicate_device_claim'
    | 'cross_user_device_collision'
    | 'geo_fence_violation'
    | 'handoff_baseline_not_reset';
  message: string;
  fingerprint?: DeviceFingerprint;
  details?: Record<string, unknown>;
}

/** O2 — provider whitelist for connected_devices */
export function isConnectedDeviceProvider(p: string): p is ConnectedDeviceProvider {
  return (CONNECTED_DEVICE_PROVIDERS as readonly string[]).includes(p);
}

/** O2 — provider whitelist for energy_production rows */
export function isEnergyProductionProvider(p: string): p is EnergyProductionProvider {
  return (ENERGY_PRODUCTION_PROVIDERS as readonly string[]).includes(p);
}

/** Stable canonical fingerprint string. Use for client-side dedup keys. */
export function deviceFingerprintKey(d: DeviceFingerprint): string {
  return `${d.provider.toLowerCase()}::${d.device_id}`;
}

/**
 * O1 — Detect duplicate device claims in a list of connected_devices rows.
 * The DB enforces this with a unique index; this is the client-side mirror so
 * we can show a clear error before submitting.
 */
export function findDuplicateDeviceClaims(claims: DeviceClaim[]): OriginAnomaly[] {
  const seen = new Map<string, DeviceClaim>();
  const anomalies: OriginAnomaly[] = [];
  for (const c of claims) {
    const key = deviceFingerprintKey(c);
    const prior = seen.get(key);
    if (!prior) {
      seen.set(key, c);
      continue;
    }
    if (prior.user_id === c.user_id) {
      anomalies.push({
        code: 'duplicate_device_claim',
        message: `Device ${key} appears multiple times for the same user.`,
        fingerprint: c,
      });
    } else {
      anomalies.push({
        code: 'cross_user_device_collision',
        message: `Device ${key} is claimed by ${prior.user_id} and ${c.user_id}. Only one wallet may own a physical device.`,
        fingerprint: c,
        details: { previous_user_id: prior.user_id, new_user_id: c.user_id },
      });
    }
  }
  return anomalies;
}

/**
 * O4 — A device handoff (user_id change) MUST zero lifetime_totals and
 * baseline_data. This mirrors the DB trigger so callers can self-check before
 * a write, and so tests can fuzz it.
 */
export function detectHandoffViolation(
  before: { user_id: string; lifetime_totals?: Record<string, unknown> | null; baseline_data?: Record<string, unknown> | null },
  after: { user_id: string; lifetime_totals?: Record<string, unknown> | null; baseline_data?: Record<string, unknown> | null },
): OriginAnomaly | null {
  if (before.user_id === after.user_id) return null;
  const lt = after.lifetime_totals ?? {};
  const bl = after.baseline_data ?? {};
  const hasLt = lt && Object.keys(lt as object).length > 0;
  const hasBl = bl && Object.keys(bl as object).length > 0;
  if (hasLt || hasBl) {
    return {
      code: 'handoff_baseline_not_reset',
      message: 'Device ownership changed but lifetime_totals/baseline_data were not zeroed. New owner would inherit prior energy.',
      details: { before_user_id: before.user_id, after_user_id: after.user_id, lifetime_totals: lt, baseline_data: bl },
    };
  }
  return null;
}

/**
 * Great-circle distance in miles between two points (Haversine).
 * Used by geo-fence sanity. Pure, deterministic, no globals.
 */
export function haversineMiles(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 3958.7613; // Earth radius miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * O6 — Geo-fence sanity check.
 * If a single device emits two events from locations >MAX_MILES apart within
 * MAX_HOURS, the data is physically implausible and is flagged for review.
 *
 * Defaults: 500 mi within 1 h (faster than any consumer EV or stationary device
 * could plausibly relocate). Tune per device class via opts.
 */
export interface GeoFenceOptions {
  maxMilesPerHour?: number;
}

export function findGeoFenceViolations(
  events: GeoEvent[],
  opts: GeoFenceOptions = {},
): OriginAnomaly[] {
  const maxMph = opts.maxMilesPerHour ?? 500;
  const byDevice = new Map<string, GeoEvent[]>();
  for (const e of events) {
    const arr = byDevice.get(e.device_id) ?? [];
    arr.push(e);
    byDevice.set(e.device_id, arr);
  }
  const out: OriginAnomaly[] = [];
  for (const [deviceId, arr] of byDevice) {
    const sorted = [...arr].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const hours = (new Date(curr.recorded_at).getTime() - new Date(prev.recorded_at).getTime()) / 3_600_000;
      if (hours <= 0) continue;
      const miles = haversineMiles(prev, curr);
      const mph = miles / hours;
      if (mph > maxMph) {
        out.push({
          code: 'geo_fence_violation',
          message: `Device ${deviceId} moved ${miles.toFixed(0)} mi in ${hours.toFixed(2)} h (${mph.toFixed(0)} mph). Physically implausible.`,
          details: { device_id: deviceId, miles, hours, mph, from: prev, to: curr },
        });
      }
    }
  }
  return out;
}
