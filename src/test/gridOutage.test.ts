import { describe, it, expect, beforeEach } from 'vitest';
import {
  estimateBackupTime,
  formatBackupLabel,
  _resetBackupSmoothing,
  detectTeslaOutage,
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
    expect(formatBackupLabel(0.7)).toBe('~40 min'); // 42 → nearest 5 = 40
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

describe('detectTeslaOutage', () => {
  it('returns true for explicit OffGrid', () => {
    expect(detectTeslaOutage({ grid_status: 'OffGrid' })).toBe(true);
  });
  it('returns true for Islanded (mixed case)', () => {
    expect(detectTeslaOutage({ grid_status: 'islanded' })).toBe(true);
  });
  it('returns true for Inactive', () => {
    expect(detectTeslaOutage({ grid_status: 'Inactive' })).toBe(true);
  });
  it('returns true for island_status off_grid', () => {
    expect(detectTeslaOutage({ island_status: 'off_grid' })).toBe(true);
  });
  it('returns false for Active grid', () => {
    expect(detectTeslaOutage({ grid_status: 'Active', grid_power: 1500 })).toBe(false);
  });
  it('returns true for Backup status', () => {
    expect(detectTeslaOutage({ grid_status: 'Backup' })).toBe(true);
  });
  it('returns true for BackupReady (mixed case)', () => {
    expect(detectTeslaOutage({ grid_status: 'backupready' })).toBe(true);
    expect(detectTeslaOutage({ grid_status: 'Backup_Ready' })).toBe(true);
  });
  it('Active status overrides off-grid behavior signals', () => {
    expect(detectTeslaOutage({
      grid_status: 'Active', grid_power: 0, battery_power: 1.2, load_power: 1.1,
    })).toBe(false);
  });
  it('uses behavior fallback when grid_status is missing', () => {
    expect(
      detectTeslaOutage({ grid_power: 0, battery_power: 1.2, load_power: 1.1 }),
    ).toBe(true);
    expect(
      detectTeslaOutage({ grid_power: 2.5, battery_power: 0, load_power: 2.4 }),
    ).toBe(false);
  });
  it('fires on the real-world 0.6 kW Powerwall discharge scenario', () => {
    expect(
      detectTeslaOutage({ grid_power: 0, battery_power: 0.6, load_power: 0.6 }),
    ).toBe(true);
  });
  it('normalizes watt-valued payloads (Tesla raw API)', () => {
    expect(
      detectTeslaOutage({ grid_power: 0, battery_power: 600, load_power: 600 }),
    ).toBe(true);
  });
  it('does NOT trigger on tiny discharge below threshold', () => {
    expect(
      detectTeslaOutage({ grid_power: 0, battery_power: 0.1, load_power: 0.1 }),
    ).toBe(false);
  });
  it('returns false on null/empty payload', () => {
    expect(detectTeslaOutage(null)).toBe(false);
    expect(detectTeslaOutage({})).toBe(false);
  });
});

