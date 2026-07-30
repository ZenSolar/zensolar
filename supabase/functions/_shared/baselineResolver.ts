// Canonical baseline resolver — single source of truth for every mint path.
//
// Containment rule: a delta may only be computed from a baseline we can
// positively read. Absent key, empty object, NULL, non-object, or non-numeric
// value => refuse. NEVER default to 0. A stored 0 is only mintable when the
// row carries an explicit first-claim marker.
//
// Returns an explicit three-way result instead of value-or-throw so callers
// can decide how to surface a refusal. `assertBaseline()` preserves the
// existing throw-based flow used by mint-onchain (HTTP 409, per-device
// refusal list, whole mint aborted).

export type BaselineResolution =
  | { kind: "baseline_present"; key: string; value: number }
  | { kind: "baseline_new_device"; key: string; value: 0 }
  | { kind: "baseline_absent"; reason: string };

/** Canonical baseline key per activity type. Legacy keys remain in storage
 *  but are no longer read by any mint path.
 *  NOTE: the battery key is intentionally NOT canonicalized yet — see the
 *  battery key census. Battery still uses its legacy precedence list. */
export const CANONICAL_BASELINE_KEYS = {
  ev_miles: ["odometer"],
  charging: ["charging_kwh"],
  supercharger: ["supercharger_kwh"],
  solar: ["solar_wh"],
} as const;

export class BaselineUnreadableError extends Error {
  constructor(
    public deviceRef: string,
    public activityType: string,
    public reason: string,
  ) {
    super(`BASELINE_UNREADABLE: device=${deviceRef} activity=${activityType} reason=${reason}`);
    this.name = "BaselineUnreadableError";
  }
}

export function hasFirstClaimMarker(b: Record<string, unknown> | null | undefined): boolean {
  return !!b && (
    (b as any).first_claim === true ||
    (b as any).first_claim_at != null ||
    (b as any).is_first_claim === true
  );
}

/**
 * Resolve a baseline value for one (device, activity_type).
 * `keys` are the canonical baseline keys for that activity, in precedence order.
 */
export function resolveBaseline(
  baselineData: unknown,
  keys: readonly string[],
): BaselineResolution {
  const b = baselineData as Record<string, unknown> | null;

  if (b === null || b === undefined || typeof b !== "object" || Array.isArray(b)) {
    return { kind: "baseline_absent", reason: "baseline_data_null_or_invalid" };
  }
  if (Object.keys(b).length === 0) {
    return { kind: "baseline_absent", reason: "baseline_data_empty" };
  }

  const key = keys.find(
    (k) => Object.prototype.hasOwnProperty.call(b, k) && b[k] !== null && b[k] !== undefined,
  );
  if (!key) {
    return { kind: "baseline_absent", reason: "canonical_key_absent" };
  }

  const raw = b[key];
  const value = typeof raw === "number" ? raw : Number.NaN;
  if (!Number.isFinite(value)) {
    return { kind: "baseline_absent", reason: `key_${key}_not_numeric` };
  }

  if (value === 0) {
    if (hasFirstClaimMarker(b)) {
      return { kind: "baseline_new_device", key, value: 0 };
    }
    return { kind: "baseline_absent", reason: `key_${key}_zero_without_first_claim_marker` };
  }

  return { kind: "baseline_present", key, value };
}

/** Throwing wrapper — preserves the existing fail-closed mint-onchain flow. */
export function assertBaseline(
  device: { device_id: string; baseline_data: unknown },
  activityType: string,
  keys: readonly string[],
): number {
  const res = resolveBaseline(device.baseline_data, keys);
  if (res.kind === "baseline_absent") {
    throw new BaselineUnreadableError(device.device_id, activityType, res.reason);
  }
  return res.value;
}
