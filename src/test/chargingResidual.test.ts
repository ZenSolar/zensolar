import { describe, expect, it } from 'vitest';
import { applyChargingResidual, resolveExclusions } from '../../supabase/functions/_shared/issuanceAuthority';

/**
 * RESIDUAL METHOD (E2) — a charger is authoritative only for the energy no
 * connected vehicle accounts for. These tests pin the two properties that
 * matter: nothing is double-counted, and a car we cannot read still earns.
 */

const VEHICLE = { device_id: 'vin-1', device_type: 'vehicle', provider: 'tesla' };
const EVSE = { device_id: 'wb-1', device_type: 'wallbox', provider: 'wallbox' };

const row = (id: string, device_id: string, provider: string, wh: number, at: string) => ({
  id,
  data_type: 'ev_charging',
  provider,
  device_id,
  production_wh: wh,
  recorded_at: at,
});

describe('charging authority is no longer a device-level demotion', () => {
  it('an EVSE beside a vehicle is not in resolveExclusions()', () => {
    const excl = resolveExclusions([VEHICLE, EVSE]);
    expect(excl.some((e) => e.device_id === 'wb-1')).toBe(false);
  });
});

describe('applyChargingResidual', () => {
  it('is a no-op when the account has no EVSE', () => {
    const rows = [row('a', 'vin-1', 'tesla_home_charging', 10_000, '2026-08-01T10:00:00Z')];
    const r = applyChargingResidual(rows, [VEHICLE]);
    expect(r.excluded).toHaveLength(0);
    expect(r.issuable).toHaveLength(1);
  });

  it('leaves EVSE energy intact when no vehicle reported that day', () => {
    const rows = [
      row('e1', 'wb-1', 'wallbox', 8_000, '2026-08-01T22:00:00Z'),
      row('v1', 'vin-1', 'tesla_home_charging', 12_000, '2026-07-31T22:00:00Z'),
    ];
    const r = applyChargingResidual(rows, [VEHICLE, EVSE]);
    // Aug 1 has no vehicle-reported charging, so the charger keeps all of it.
    expect(r.excluded.map((x) => x.id)).toEqual([]);
    const aug1 = r.notes.find((n) => n.day === '2026-08-01')!;
    expect(aug1.evse_issuable_wh).toBe(8_000);
  });

  it('drops EVSE rows covering the vehicle-reported overlap, fail-closed', () => {
    const rows = [
      row('v1', 'vin-1', 'tesla_home_charging', 10_000, '2026-08-01T02:00:00Z'),
      row('e1', 'wb-1', 'wallbox', 4_000, '2026-08-01T02:00:00Z'),
      row('e2', 'wb-1', 'wallbox', 7_000, '2026-08-01T03:00:00Z'),
      row('e3', 'wb-1', 'wallbox', 3_000, '2026-08-01T04:00:00Z'),
    ];
    const r = applyChargingResidual(rows, [VEHICLE, EVSE]);
    // Smallest-first until the dropped total covers 10 kWh: 3 + 4 = 7, then 7 => 14.
    expect(new Set(r.excluded.map((x) => x.id))).toEqual(new Set(['e3', 'e1', 'e2']));
    const note = r.notes[0];
    expect(note.vehicle_reported_wh).toBe(10_000);
    expect(note.evse_reported_wh).toBe(14_000);
    // Never credits less than zero, never credits the overlap.
    expect(note.evse_excluded_wh).toBeGreaterThanOrEqual(note.vehicle_reported_wh);
  });

  it('a second, unreadable EV on the charger still earns its own energy', () => {
    const rows = [
      // The Tesla reported 5 kWh; the charger saw 18 kWh that day because a
      // second, non-Tesla EV also charged. The remainder must survive.
      row('v1', 'vin-1', 'tesla_home_charging', 5_000, '2026-08-01T02:00:00Z'),
      row('e1', 'wb-1', 'wallbox', 6_000, '2026-08-01T02:00:00Z'),
      row('e2', 'wb-1', 'wallbox', 6_000, '2026-08-01T12:00:00Z'),
      row('e3', 'wb-1', 'wallbox', 6_000, '2026-08-01T20:00:00Z'),
    ];
    const r = applyChargingResidual(rows, [VEHICLE, EVSE]);
    expect(r.excluded).toHaveLength(1);
    expect(r.issuable.filter((x) => x.device_id === 'wb-1')).toHaveLength(2);
  });

  it('vehicle rows are never excluded by the residual', () => {
    const rows = [
      row('v1', 'vin-1', 'tesla_home_charging', 9_000, '2026-08-01T02:00:00Z'),
      row('e1', 'wb-1', 'wallbox', 9_000, '2026-08-01T02:00:00Z'),
    ];
    const r = applyChargingResidual(rows, [VEHICLE, EVSE]);
    expect(r.excluded.every((x) => x.device_id === 'wb-1')).toBe(true);
    expect(r.issuable.some((x) => x.id === 'v1')).toBe(true);
  });
});
