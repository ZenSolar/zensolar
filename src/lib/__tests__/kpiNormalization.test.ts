/**
 * Proof-of-Delta golden fixtures.
 *
 * These tests are the contract: if any of them fail, the headline KPI and
 * the receipt list can diverge — which destroys user trust in the mint.
 *
 * If you change the normalization math, you MUST update these fixtures
 * AND document the user-facing impact in mem://features/proof-of-genesis-*.
 */
import { describe, expect, it } from 'vitest';
import {
  DAILY_PHYSICAL_CAP,
  dedupeSessionRows,
  normalizeDailyCounterRows,
  normalizeDailySolarRows,
  type DeltaRow,
  type NormalizationAnomaly,
} from '../kpiNormalization';
import { reconcileReceipts } from '../kpiReconciliation';

function counter(
  deviceId: string,
  recordedAt: string,
  amount: number,
  overrides: Partial<DeltaRow> = {},
): DeltaRow {
  return {
    id: `${deviceId}-${recordedAt}-${amount}`,
    recordedAt,
    hasRealTime: true,
    amount,
    unit: 'kWh',
    provider: 'tesla',
    deviceId,
    verified: true,
    ...overrides,
  };
}

describe('normalizeDailyCounterRows (Powerwall / odometer / supercharger lifetime)', () => {
  it('I2 — Σ(deltas) == lifetime_now − baseline', () => {
    const baseline = new Map([['pw1', 1000]]);
    const rows = [
      counter('pw1', '2026-05-20T08:00Z', 1010),
      counter('pw1', '2026-05-21T08:00Z', 1025),
      counter('pw1', '2026-05-22T08:00Z', 1060),
    ];
    const deltas = normalizeDailyCounterRows(rows, baseline);
    const sum = deltas.reduce((a, r) => a + r.amount, 0);
    expect(deltas).toHaveLength(3);
    expect(Math.round(sum * 10) / 10).toBe(60); // 1060 − 1000
    // Each day's delta is the day-over-day jump
    expect(deltas.map((d) => d.amount)).toEqual([10, 15, 35]);
  });

  it('takes the daily MAX across multiple intra-day samples', () => {
    const baseline = new Map([['pw1', 0]]);
    const rows = [
      counter('pw1', '2026-05-20T06:00Z', 5),
      counter('pw1', '2026-05-20T12:00Z', 12),
      counter('pw1', '2026-05-20T18:00Z', 18),
    ];
    const deltas = normalizeDailyCounterRows(rows, baseline);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].amount).toBe(18);
  });

  it('handles out-of-order ingest deterministically', () => {
    const baseline = new Map([['pw1', 100]]);
    const rows = [
      counter('pw1', '2026-05-22', 160),
      counter('pw1', '2026-05-20', 110),
      counter('pw1', '2026-05-21', 130),
    ];
    const deltas = normalizeDailyCounterRows(rows, baseline);
    const sum = deltas.reduce((a, r) => a + r.amount, 0);
    expect(Math.round(sum * 10) / 10).toBe(60);
  });

  it('I1 — Monotonicity: never emits a negative delta after a device reset', () => {
    const baseline = new Map([['ev1', 10000]]);
    const anomalies: NormalizationAnomaly[] = [];
    const rows = [
      counter('ev1', '2026-05-20', 10100),   // +100
      counter('ev1', '2026-05-21', 50, { unit: 'mi' }), // odometer reset (new vehicle / firmware glitch)
      counter('ev1', '2026-05-22', 75, { unit: 'mi' }), // +25 from reset baseline
    ];
    const deltas = normalizeDailyCounterRows(rows, baseline, {
      onAnomaly: (a) => anomalies.push(a),
    });
    expect(deltas.every((d) => d.amount > 0)).toBe(true);
    expect(deltas.find((d) => d.amount < 0)).toBeUndefined();
    expect(anomalies.some((a) => a.kind === 'non_monotonic')).toBe(true);
    // Only the +100 day mints; the post-reset +25 sits below the original baseline anchor.
    const sum = deltas.reduce((a, r) => a + r.amount, 0);
    expect(sum).toBe(100);
  });

  it('I3 — caps a single-day delta at the physical maximum', () => {
    const baseline = new Map([['inv1', 0]]);
    const anomalies: NormalizationAnomaly[] = [];
    const rows = [counter('inv1', '2026-05-20', 99_999)];
    const deltas = normalizeDailyCounterRows(rows, baseline, {
      cap: DAILY_PHYSICAL_CAP.solar_kwh,
      onAnomaly: (a) => anomalies.push(a),
    });
    expect(deltas[0].amount).toBe(DAILY_PHYSICAL_CAP.solar_kwh);
    expect(anomalies.find((a) => a.kind === 'over_physical_cap')).toBeDefined();
  });

  it('ignores samples at or below the baseline (post-mint state)', () => {
    const baseline = new Map([['pw1', 1000]]);
    const rows = [
      counter('pw1', '2026-05-19', 990),
      counter('pw1', '2026-05-20', 1000),
      counter('pw1', '2026-05-21', 1003),
    ];
    const deltas = normalizeDailyCounterRows(rows, baseline);
    expect(deltas).toHaveLength(1);
    expect(deltas[0].amount).toBe(3);
  });

  it('handles multiple devices independently', () => {
    const baseline = new Map([['a', 0], ['b', 500]]);
    const rows = [
      counter('a', '2026-05-20', 10),
      counter('b', '2026-05-20', 510),
      counter('a', '2026-05-21', 25),
      counter('b', '2026-05-21', 520),
    ];
    const deltas = normalizeDailyCounterRows(rows, baseline);
    const aSum = deltas.filter((d) => d.deviceId === 'a').reduce((s, r) => s + r.amount, 0);
    const bSum = deltas.filter((d) => d.deviceId === 'b').reduce((s, r) => s + r.amount, 0);
    expect(aSum).toBe(25);
    expect(bSum).toBe(20);
  });
});

describe('normalizeDailySolarRows (Enphase / SolarEdge running daily total)', () => {
  it('takes the daily MAX, never the SUM', () => {
    const rows: DeltaRow[] = [
      counter('inv1', '2026-05-20T10:00Z', 12, { provider: 'enphase' }),
      counter('inv1', '2026-05-20T14:00Z', 28, { provider: 'enphase' }),
      counter('inv1', '2026-05-20T18:00Z', 42, { provider: 'enphase' }),
      counter('inv1', '2026-05-21T10:00Z', 8,  { provider: 'enphase' }),
      counter('inv1', '2026-05-21T18:00Z', 36, { provider: 'enphase' }),
    ];
    const norm = normalizeDailySolarRows(rows);
    expect(norm).toHaveLength(2);
    expect(norm.find((r) => r.recordedAt === '2026-05-20')?.amount).toBe(42);
    expect(norm.find((r) => r.recordedAt === '2026-05-21')?.amount).toBe(36);
  });

  it('skips non-solar providers', () => {
    const rows: DeltaRow[] = [counter('x', '2026-05-20T10:00Z', 99, { provider: 'tesla' })];
    expect(normalizeDailySolarRows(rows)).toEqual([]);
  });
});

describe('dedupeSessionRows', () => {
  it('drops bill rows that match a home row on device + day + kWh', () => {
    const home = [{ deviceId: 'wb1', recordedAt: '2026-05-22T07:50Z', amount: 17.5 }];
    const bill = [
      { deviceId: 'wb1', recordedAt: '2026-05-22T00:00Z', amount: 17.5 }, // duplicate
      { deviceId: 'wb1', recordedAt: '2026-05-21T00:00Z', amount: 12.0 }, // keep
    ];
    const out = dedupeSessionRows(home, bill);
    expect(out).toHaveLength(1);
    expect(out[0].amount).toBe(12.0);
  });

  it('respects the kWh tolerance', () => {
    const home = [{ deviceId: 'wb1', recordedAt: '2026-05-22', amount: 17.5 }];
    const bill = [{ deviceId: 'wb1', recordedAt: '2026-05-22', amount: 17.7 }];
    expect(dedupeSessionRows(home, bill, 0.2)).toHaveLength(0);
    expect(dedupeSessionRows(home, bill, 0.1)).toHaveLength(1);
  });

  it('does not dedupe across different devices', () => {
    const home = [{ deviceId: 'wb1', recordedAt: '2026-05-22', amount: 17.5 }];
    const bill = [{ deviceId: 'wb2', recordedAt: '2026-05-22', amount: 17.5 }];
    expect(dedupeSessionRows(home, bill)).toHaveLength(1);
  });
});

describe('reconcileReceipts (three-way Σ guard)', () => {
  it('matches within tolerance', () => {
    const r = reconcileReceipts('test', 100, [{ amount: 50 }, { amount: 49.8 }]);
    expect(r.matches).toBe(true);
    expect(r.diff).toBeCloseTo(0.2, 1);
  });

  it('flags drift outside tolerance', () => {
    const r = reconcileReceipts('test', 100, [{ amount: 80 }]);
    expect(r.matches).toBe(false);
    expect(r.diff).toBe(20);
  });

  it('property: any monotonic series + baseline reconciles exactly', () => {
    // Generate 50 random monotonic series and verify Σ(deltas) == latest − baseline.
    for (let trial = 0; trial < 50; trial++) {
      const baseline = Math.floor(Math.random() * 1000);
      const baselines = new Map([['d', baseline]]);
      let v = baseline;
      const rows: DeltaRow[] = [];
      const days = 1 + Math.floor(Math.random() * 14);
      for (let d = 0; d < days; d++) {
        v += Math.random() * 50;
        const day = `2026-05-${String(d + 1).padStart(2, '0')}`;
        rows.push(counter('d', day, Math.round(v * 10) / 10));
      }
      const deltas = normalizeDailyCounterRows(rows, baselines);
      const sum = Math.round(deltas.reduce((a, r) => a + r.amount, 0) * 10) / 10;
      const expected = Math.round((v - baseline) * 10) / 10;
      const recon = reconcileReceipts('property', expected, deltas);
      expect(recon.matches, `trial ${trial}: sum=${sum} expected=${expected}`).toBe(true);
    }
  });
});
