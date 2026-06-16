// _shared/fsdSampler.ts
//
// Shared FSD-miles ingestion helpers used by:
//   - tesla-telemetry-webhook  (primary: SelfDrivingMilesSinceReset + AutopilotState stream)
//   - tesla-data               (opportunistic: piggy-backs on every dashboard refresh)
//   - tesla-fsd-sampler        (cron: adaptive polling fallback for HW3 vehicles)
//
// Two sources are supported and MUST NOT be summed:
//   - 'official'        — Tesla's SelfDrivingMilesSinceReset field (HW4 + recent fw)
//   - 'calculated_hw3'  — odometer-delta math gated on (AutopilotState engaged) AND
//                         (shift_state == D) AND (speed > 0). Per-sample glitch cap = 5 mi.
//                         When Tesla Fleet REST omits AutopilotState for HW3,
//                         the sampler may mark a moving Drive sample as
//                         `InferredDriveMoving` so real-time drives still accrue.
//
// Resolver rule: if EITHER source has ever produced a value for a VIN, use the
// 'official' value when present, otherwise fall back to 'calculated_hw3'. The
// `fsd_source` flag in connected_devices.last_known_state is what the UI reads
// to render its sub-label.

export const ENGAGED_AUTOPILOT_STATES = new Set([
  "Active",
  "Engaged",
  "FullSelfDriving",
  "Autosteer",
  "TrafficAwareCruiseControl",
  "InferredDriveMoving",
]);

export const MAX_PER_SAMPLE_DELTA_MI = 5;

export type FsdSource = "official" | "calculated_hw3";

export interface FsdSamplerState {
  /** Cumulative miles calculated from odometer deltas (HW3 fallback). */
  lifetime_fsd_miles_calc: number;
  /** Last odometer reading observed by the sampler. */
  last_odometer_mi: number;
  /** Last AutopilotState (string from Tesla). */
  last_autopilot_state: string | null;
  /** Last sample timestamp (ISO). Drives adaptive polling cadence. */
  last_sample_at: string | null;
  /** First time the sampler observed this VIN (ISO). Drives "since [date]" label. */
  first_sample_at: string | null;
  /** Counts of skipped samples for telemetry. */
  glitch_skips: number;
}

export function defaultSamplerState(seedOdo = 0): FsdSamplerState {
  return {
    lifetime_fsd_miles_calc: 0,
    last_odometer_mi: seedOdo,
    last_autopilot_state: null,
    last_sample_at: null,
    first_sample_at: null,
    glitch_skips: 0,
  };
}

/**
 * Extract Tesla's official `SelfDrivingMilesSinceReset` field from a
 * vehicle_data payload. Tesla returns this in `vehicle_state` on HW4 vehicles
 * with recent firmware. Returns null when absent (typical for HW3).
 */
export function extractOfficialFsdMiles(vehicleDataResponse: any): number | null {
  if (!vehicleDataResponse) return null;
  const vs = vehicleDataResponse.vehicle_state ?? vehicleDataResponse?.response?.vehicle_state;
  if (!vs) return null;
  const candidates = [
    vs.self_driving_miles_since_reset,
    vs.SelfDrivingMilesSinceReset,
    vs.fsd_miles_since_reset,
  ];
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c) && c >= 0) return c;
  }
  return null;
}

/**
 * Read the AutopilotState string from a vehicle_data payload. Tesla exposes
 * this in `vehicle_state` as `autopilot_state` (snake_case) on the REST API.
 */
export function extractAutopilotState(vehicleDataResponse: any): string | null {
  if (!vehicleDataResponse) return null;
  const vs = vehicleDataResponse.vehicle_state ?? vehicleDataResponse?.response?.vehicle_state;
  if (!vs) return null;
  return vs.autopilot_state ?? vs.AutopilotState ?? null;
}

export interface OdometerSampleInput {
  odometer_mi: number;
  autopilot_state: string | null;
  shift_state: string | null;
  speed: number | null;
  sample_at: string; // ISO
}

export interface OdometerSampleResult {
  state: FsdSamplerState;
  miles_added: number;
  reason: "credited" | "credited_inferred" | "first_sample" | "not_engaged" | "not_in_drive" | "not_moving" | "glitch" | "no_delta";
}

/**
 * Apply a single poll sample to the HW3 sampler accumulator.
 *
 * Credits the odometer delta to `lifetime_fsd_miles_calc` ONLY when:
 *   - PREVIOUS sample was Autopilot/FSD-engaged
 *   - current shift_state === 'D'
 *   - current speed > 0
 *   - delta ∈ (0, MAX_PER_SAMPLE_DELTA_MI]
 *
 * The "previous-was-engaged" gate avoids crediting the leading edge of the
 * very first engagement window; this is the same conservative pattern used
 * by Teslamate / TeslaFi.
 */
export function applyOdometerSample(
  prev: FsdSamplerState,
  sample: OdometerSampleInput,
): OdometerSampleResult {
  const next: FsdSamplerState = { ...prev };
  if (!next.first_sample_at) next.first_sample_at = sample.sample_at;
  next.last_sample_at = sample.sample_at;

  const odo = Number(sample.odometer_mi);
  if (!Number.isFinite(odo) || odo <= 0) {
    return { state: next, miles_added: 0, reason: "no_delta" };
  }

  // First-ever odometer reading: seed pointer, do not credit.
  if (!prev.last_odometer_mi || prev.last_odometer_mi <= 0) {
    next.last_odometer_mi = odo;
    next.last_autopilot_state = sample.autopilot_state;
    return { state: next, miles_added: 0, reason: "first_sample" };
  }

  const delta = odo - prev.last_odometer_mi;
  if (delta <= 0) {
    next.last_autopilot_state = sample.autopilot_state;
    return { state: next, miles_added: 0, reason: "no_delta" };
  }
  if (delta > MAX_PER_SAMPLE_DELTA_MI) {
    next.last_odometer_mi = odo;
    next.last_autopilot_state = sample.autopilot_state;
    next.glitch_skips = (next.glitch_skips || 0) + 1;
    return { state: next, miles_added: 0, reason: "glitch" };
  }

  // Gate the credit on engagement + current Drive + moving. For real-time HW3
  // polling, Tesla Fleet REST often omits AutopilotState; when the caller has
  // inferred engagement from Drive+moving, allow the current sample to credit
  // so a live FSD drive starts accruing immediately instead of waiting one cycle.
  const prevEngaged =
    !!prev.last_autopilot_state && ENGAGED_AUTOPILOT_STATES.has(prev.last_autopilot_state);
  const currentEngaged =
    !!sample.autopilot_state && ENGAGED_AUTOPILOT_STATES.has(sample.autopilot_state);
  const inferredCurrent = sample.autopilot_state === "InferredDriveMoving";
  const inDrive = (sample.shift_state ?? "").toUpperCase().startsWith("D");
  const moving = (sample.speed ?? 0) > 0;

  next.last_odometer_mi = odo;
  next.last_autopilot_state = sample.autopilot_state;

  if (!inDrive) return { state: next, miles_added: 0, reason: "not_in_drive" };
  if (!moving) return { state: next, miles_added: 0, reason: "not_moving" };
  if (!prevEngaged && !currentEngaged) return { state: next, miles_added: 0, reason: "not_engaged" };

  next.lifetime_fsd_miles_calc = (prev.lifetime_fsd_miles_calc || 0) + delta;
  if (!prevEngaged && inferredCurrent) return { state: next, miles_added: delta, reason: "credited_inferred" };
  return { state: next, miles_added: delta, reason: "credited" };
}

/**
 * Resolve which source value to publish for a VIN.
 *
 * - If `official` is present (HW4) → return it and flag the source as 'official'.
 * - Else → return the sampler's `lifetime_fsd_miles_calc` and flag 'calculated_hw3'.
 *
 * NEVER sum the two; they describe the same physical miles measured two ways.
 */
export function resolveFsdMiles(
  official: number | null,
  samplerState: FsdSamplerState | null,
): { miles: number; source: FsdSource } {
  if (typeof official === "number" && Number.isFinite(official) && official > 0) {
    return { miles: official, source: "official" };
  }
  const calc = samplerState?.lifetime_fsd_miles_calc ?? 0;
  return { miles: calc, source: "calculated_hw3" };
}

/**
 * Adaptive polling cadence (in seconds) given current activity.
 *   - active driving (in Drive, moving):  5 min
 *   - idle (online, not driving):         30 min
 *   - asleep / offline:                    6 h
 */
export function nextPollIntervalSec(opts: {
  in_drive: boolean;
  moving: boolean;
  awake: boolean;
}): number {
  if (opts.awake && opts.in_drive && opts.moving) return 5 * 60;
  if (opts.awake) return 30 * 60;
  return 6 * 60 * 60;
}
