/**
 * kpiNormalization — pure functions that turn raw ingest rows into the
 * day-bucketed delta receipts shown in the KPI Activity Log sheet.
 *
 * Pulled out of useKpiContributions so we can unit-test the Proof-of-Delta
 * math in isolation (no Supabase, no React Query).
 *
 * Invariants enforced here:
 *   I1 — Monotonicity: cumulative counters (solar, battery, odometer,
 *        supercharger lifetime) must never decrease. Negative jumps are
 *        treated as device resets and ignored, not propagated as deltas.
 *   I2 — Baseline anchoring: Σ(deltas) == latest_lifetime − baseline.
 *        We chain from the per-device stored baseline so receipts add up to
 *        exactly what the KPI tile shows as "pending".
 *   I3 — Physical cap: a single day's delta is capped at a generous
 *        physical maximum to defang Enphase/Tesla backfill flooding.
 *        Anything above the cap is logged and clipped, not minted.
 */

export interface RawCounterRow {
  /** Stable id (db row id or synthetic). */
  id: string;
  /** ISO timestamp of the sample. */
  recordedAt: string;
  /** Cumulative lifetime value at that sample (kWh or miles). */
  amount: number;
  unit: 'kWh' | 'mi';
  provider: string;
  deviceId: string | null;
  verified?: boolean;
}

export interface DeltaRow extends RawCounterRow {
  hasRealTime: boolean;
}

/** Physical caps for a single day's delta. Generous on purpose. */
export const DAILY_PHYSICAL_CAP = {
  /** Solar: ~14h × very large 200 kW residential array. */
  solar_kwh: 2800,
  /** Battery export: full 13.5 kWh Powerwall cycled ~10×/day per stack. */
  battery_kwh: 1350,
  /** EV miles: marathon road-trip ceiling. */
  ev_miles: 1500,
} as const;

/**
 * Enphase / SolarEdge write production_wh as the day's *running total*.
 * The receipt for that day is the MAX of all samples for that device+day,
 * not the SUM (which would multiply by the polling frequency).
 */
export function normalizeDailySolarRows(rows: DeltaRow[]): DeltaRow[] {
  const daily = new Map<string, DeltaRow>();
  for (const row of rows) {
    const provider = row.provider?.toLowerCase();
    if (provider !== 'enphase' && provider !== 'solaredge') continue;
    const dayKey = row.recordedAt.slice(0, 10);
    const key = `${row.deviceId ?? 'unknown'}|${provider}|${dayKey}`;
    const existing = daily.get(key);
    if (!existing || row.amount > existing.amount) {
      daily.set(key, { ...row, id: `daily-${key}`, recordedAt: dayKey, hasRealTime: false });
    }
  }
  return Array.from(daily.values()).sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
}

/**
 * Tesla Powerwall, EV odometer, Enphase lifetime — all monotonic cumulative
 * counters. Chain daily deltas from the per-device baseline so:
 *
 *   Σ(deltas) == latest_lifetime − baseline == headline "pending"
 *
 * Enforces invariants I1, I2, I3.
 */
export function normalizeDailyCounterRows(
  rows: DeltaRow[],
  baselinesByDevice: Map<string, number>,
  opts: { cap?: number; onAnomaly?: (a: NormalizationAnomaly) => void } = {},
): DeltaRow[] {
  const cap = opts.cap ?? Number.POSITIVE_INFINITY;
  const byDevice = new Map<string, Map<string, DeltaRow>>();

  // Take the day's MAX (cumulative counter — last sample of the day wins
  // when monotonic; max is robust to out-of-order ingest).
  for (const row of rows) {
    const device = row.deviceId ?? 'unknown';
    let daily = byDevice.get(device);
    if (!daily) { daily = new Map(); byDevice.set(device, daily); }
    const day = row.recordedAt.slice(0, 10);
    const existing = daily.get(day);
    if (!existing || row.amount > existing.amount) daily.set(day, row);
  }

  const deltas: DeltaRow[] = [];
  for (const [device, daily] of byDevice) {
    const days = Array.from(daily.keys()).sort();
    let prevValue = baselinesByDevice.get(device) ?? 0;
    for (const day of days) {
      const cur = daily.get(day)!;

      // I1 — Monotonicity: a counter that decreased = device reset / replacement.
      // Don't emit a negative delta; advance the cursor without minting.
      if (cur.amount < prevValue) {
        opts.onAnomaly?.({ kind: 'non_monotonic', device, day, prev: prevValue, cur: cur.amount });
        // Treat the new lower value as the new baseline going forward so we
        // don't re-mint the same kWh after a swap.
        prevValue = cur.amount;
        continue;
      }
      if (cur.amount <= prevValue) {
        prevValue = Math.max(prevValue, cur.amount);
        continue;
      }

      let delta = Math.round((cur.amount - prevValue) * 10) / 10;
      prevValue = cur.amount;
      if (delta <= 0) continue;

      // I3 — Physical cap: clip implausible jumps from backfill storms.
      if (delta > cap) {
        opts.onAnomaly?.({ kind: 'over_physical_cap', device, day, delta, cap });
        delta = cap;
      }

      deltas.push({
        ...cur,
        id: `daily-${device}-${day}`,
        recordedAt: day,
        hasRealTime: false,
        amount: delta,
      });
    }
  }

  return deltas.sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
}

export type NormalizationAnomaly =
  | { kind: 'non_monotonic'; device: string; day: string; prev: number; cur: number }
  | { kind: 'over_physical_cap'; device: string; day: string; delta: number; cap: number };

/**
 * Dedupe overlapping session ingests (e.g. Tesla SDK session row + billing
 * mirror row in `charging_sessions`). Two sessions are considered the same
 * plug-in event when device + day + kWh match within a small tolerance.
 *
 * Returns `b` rows that have no match in `a` rows (prefer the richer side).
 */
export function dedupeSessionRows<
  A extends { deviceId: string | null; recordedAt: string; amount: number },
  B extends { deviceId: string | null; recordedAt: string; amount: number },
>(preferred: A[], candidates: B[], kwhTolerance = 0.2): B[] {
  return candidates.filter((b) => {
    const bDay = b.recordedAt.slice(0, 10);
    return !preferred.some((a) =>
      (a.deviceId ?? '') === (b.deviceId ?? '')
      && a.recordedAt.slice(0, 10) === bDay
      && Math.abs(a.amount - b.amount) <= kwhTolerance,
    );
  });
}
