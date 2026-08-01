/**
 * Canonical reader for a Tesla charging session's REPORTED energy.
 *
 * Rule: only Tesla's reported energy fields may become kWh. Never derive kWh
 * from a fee. Supercharger fees are not purely energy-based — idle fees are
 * TIME-based — so a fee-derived kWh can invent energy from a parking penalty,
 * and supercharging credits 1:1, turning it straight into tokens.
 *
 * Key presence is explicit. A reported 0 stays 0 and never falls through to
 * the next key (same failure shape as the baseline incident).
 */

const REPORTED_ENERGY_KEYS = [
  "chargeEnergyAdded",
  "charge_energy_added",
  "energy_added",
  "energyAdded",
] as const;

export type SessionEnergy = {
  /** kWh to credit. 0 when Tesla reported 0 or reported nothing. */
  kwh: number;
  /** True when one of the reported-energy keys was present and numeric. */
  reported: boolean;
  /** The key that supplied the value, for audit logging. */
  sourceKey: string | null;
  /**
   * True when the session carries billing fees but no reported energy —
   * the shape that previously invented kWh from a fee. Credit nothing,
   * flag the row.
   */
  feeOnly: boolean;
};

function hasFees(session: Record<string, unknown>): boolean {
  const fees = (session as any)?.fees;
  return Array.isArray(fees) && fees.length > 0;
}

export function readSessionEnergy(session: Record<string, unknown>): SessionEnergy {
  for (const k of REPORTED_ENERGY_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(session, k)) continue;
    const raw = (session as any)[k];
    if (raw === null || raw === undefined || raw === "") continue;
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) continue;
    // An explicit 0 is a real reading and stops the lookup.
    return { kwh: n, reported: true, sourceKey: k, feeOnly: false };
  }
  return { kwh: 0, reported: false, sourceKey: null, feeOnly: hasFees(session) };
}

/** Stable-ish identifier for logging a flagged session. */
export function sessionRef(session: Record<string, unknown>): string {
  const s = session as any;
  return String(
    s.chargeStartDateTime ?? s.charge_start_date_time ?? s.startDateTime ?? s.sessionStartTime ?? "unknown-start",
  );
}
