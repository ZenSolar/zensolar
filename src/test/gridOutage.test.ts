import { describe, it, expect, beforeEach } from 'vitest';
import {
  estimateBackupTime,
  formatBackupLabel,
  _resetBackupSmoothing,
} from '@/lib/gridOutage';

describe('formatBackupLabel', () => {
  it('flags reserve when hours <= 0', () => {
    expect(formatBackupLabel(0)).toBe('Reserve reached');
  });
  it('caps long durations', () => {
    expect(formatBackupLabel(40)).toBe('>24 hours');
    expect(formatBackupLabel(Infinity)).toBe('>24 hours');
  });
  it('uses ~Xh for >= 1h with small minutes', () => {
    expect(formatBackupLabel(3.1)).toBe('~3h');
  });
  it('uses ~Xh Ym when minutes >= 15', () => {
    expect(formatBackupLabel(3.5)).toBe('~3h 30m');
  });
  it('rounds sub-hour to nearest 5 min', () => {
    expect(formatBackupLabel(0.7)).toBe('~45 min'); // 42 → 45
    expect(formatBackupLabel(0.05)).toBe('~5 min'); // 3 → 5 floor
  });
});

describe('estimateBackupTime', () => {
  beforeEach(() => _resetBackupSmoothing());

  it('returns Reserve reached at or below reserve', () => {
    const r = estimateBackupTime({
      socPct: 20,
      usableCapacityKwh: 13.5,
      currentDischargeKw: 1,
      reservePct: 20,
    });
    expect(r.label).toBe('Reserve reached');
    expect(r.hours).toBe(0);
  });

  it('treats idle load as >24 hours', () => {
    const r = estimateBackupTime({
      socPct: 80,
      usableCapacityKwh: 13.5,
      currentDischargeKw: 0,
      smoothingKey: 'idle-test',
    });
    expect(r.label).toBe('>24 hours');
    expect(r.hours).toBe(Infinity);
  });

  it('computes ~14h for a typical Powerwall scenario', () => {
    const r = estimateBackupTime({
      socPct: 87,
      usableCapacityKwh: 13.5,
      currentDischargeKw: 0.65,
      reservePct: 20,
      smoothingKey: 'typical',
    });
    // (87-20)/100 * 13.5 = 9.045 kWh ; /0.65 ≈ 13.9h → "~13h 54m"-ish
    expect(r.hours).toBeGreaterThan(13);
    expect(r.hours).toBeLessThan(15);
    expect(r.label.startsWith('~13h') || r.label.startsWith('~14h')).toBe(true);
  });

  it('smooths jitter across successive calls', () => {
    const inputs = [0.4, 0.42, 0.41, 0.4, 8.0]; // last sample is a spike
    let last = 0;
    for (const kw of inputs) {
      last = estimateBackupTime({
        socPct: 80,
        usableCapacityKwh: 13.5,
        currentDischargeKw: kw,
        smoothingKey: 'jitter',
      }).hours;
    }
    // Without smoothing the final spike would give ~1h; smoothing keeps it much higher.
    expect(last).toBeGreaterThan(2);
  });
});
