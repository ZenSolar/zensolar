/**
 * Proof-of-Origin golden fixtures.
 *
 * These tests are the contract for the Proof-of-Origin pillar. If they fail,
 * a user could claim someone else's device, inherit prior production after a
 * handoff, or submit physically implausible location data.
 *
 * If you change originVerification.ts, you MUST update these fixtures AND
 * document the user-facing impact in mem://features/proof-of-genesis-*.
 */
import { describe, expect, it } from 'vitest';
import {
  CONNECTED_DEVICE_PROVIDERS,
  ENERGY_PRODUCTION_PROVIDERS,
  detectHandoffViolation,
  deviceFingerprintKey,
  findDuplicateDeviceClaims,
  findGeoFenceViolations,
  haversineMiles,
  isConnectedDeviceProvider,
  isEnergyProductionProvider,
  type DeviceClaim,
  type GeoEvent,
} from '../originVerification';

describe('Proof-of-Origin: provider whitelist (O2)', () => {
  it('accepts every connected_device provider in the canonical list', () => {
    for (const p of CONNECTED_DEVICE_PROVIDERS) {
      expect(isConnectedDeviceProvider(p)).toBe(true);
    }
  });
  it('accepts every energy_production provider in the canonical list', () => {
    for (const p of ENERGY_PRODUCTION_PROVIDERS) {
      expect(isEnergyProductionProvider(p)).toBe(true);
    }
  });
  it('rejects unknown providers', () => {
    expect(isConnectedDeviceProvider('rogue_inverter')).toBe(false);
    expect(isConnectedDeviceProvider('')).toBe(false);
    expect(isEnergyProductionProvider('manual')).toBe(false);
    expect(isEnergyProductionProvider('tesla_fake')).toBe(false);
  });
});

describe('Proof-of-Origin: device fingerprint uniqueness (O1)', () => {
  const u1 = '11111111-1111-1111-1111-111111111111';
  const u2 = '22222222-2222-2222-2222-222222222222';

  it('treats provider as case-insensitive in fingerprint key', () => {
    expect(deviceFingerprintKey({ provider: 'TESLA', device_id: 'abc' })).toBe(
      deviceFingerprintKey({ provider: 'tesla', device_id: 'abc' }),
    );
  });

  it('flags the same device claimed twice by the same user', () => {
    const claims: DeviceClaim[] = [
      { provider: 'tesla', device_id: 'vin-1', user_id: u1 },
      { provider: 'tesla', device_id: 'vin-1', user_id: u1 },
    ];
    const out = findDuplicateDeviceClaims(claims);
    expect(out).toHaveLength(1);
    expect(out[0].code).toBe('duplicate_device_claim');
  });

  it('flags the same device claimed by two different users (sybil block)', () => {
    const claims: DeviceClaim[] = [
      { provider: 'enphase', device_id: 'site-7', user_id: u1 },
      { provider: 'enphase', device_id: 'site-7', user_id: u2 },
    ];
    const out = findDuplicateDeviceClaims(claims);
    expect(out).toHaveLength(1);
    expect(out[0].code).toBe('cross_user_device_collision');
    expect(out[0].details).toMatchObject({ previous_user_id: u1, new_user_id: u2 });
  });

  it('passes clean fixtures with distinct fingerprints', () => {
    const claims: DeviceClaim[] = [
      { provider: 'tesla', device_id: 'vin-1', user_id: u1 },
      { provider: 'tesla', device_id: 'vin-2', user_id: u1 },
      { provider: 'solaredge', device_id: 'site-9', user_id: u2 },
    ];
    expect(findDuplicateDeviceClaims(claims)).toEqual([]);
  });
});

describe('Proof-of-Origin: device handoff baseline reset (O4)', () => {
  const u1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const u2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  it('no anomaly when ownership is unchanged', () => {
    expect(
      detectHandoffViolation(
        { user_id: u1, lifetime_totals: { solar_wh: 1000 } },
        { user_id: u1, lifetime_totals: { solar_wh: 1500 } },
      ),
    ).toBeNull();
  });

  it('no anomaly when handoff correctly zeros lifetime and baseline', () => {
    expect(
      detectHandoffViolation(
        { user_id: u1, lifetime_totals: { solar_wh: 5000 }, baseline_data: { solar_wh: 5000 } },
        { user_id: u2, lifetime_totals: {}, baseline_data: {} },
      ),
    ).toBeNull();
  });

  it('FLAGS handoff that left prior lifetime_totals on the device', () => {
    const a = detectHandoffViolation(
      { user_id: u1, lifetime_totals: { solar_wh: 5000 } },
      { user_id: u2, lifetime_totals: { solar_wh: 5000 } },
    );
    expect(a?.code).toBe('handoff_baseline_not_reset');
  });

  it('FLAGS handoff that left prior baseline_data on the device', () => {
    const a = detectHandoffViolation(
      { user_id: u1, baseline_data: { miles: 12000 } },
      { user_id: u2, lifetime_totals: {}, baseline_data: { miles: 12000 } },
    );
    expect(a?.code).toBe('handoff_baseline_not_reset');
  });
});

describe('Proof-of-Origin: geo-fence sanity (O6)', () => {
  const dev = (id: string, t: string, lat: number, lon: number): GeoEvent => ({
    user_id: 'u',
    device_id: id,
    recorded_at: t,
    latitude: lat,
    longitude: lon,
  });

  it('haversine — known distance NYC → LAX is ~2451 mi (±10)', () => {
    const miles = haversineMiles(
      { latitude: 40.6413, longitude: -73.7781 },
      { latitude: 33.9416, longitude: -118.4085 },
    );
    expect(miles).toBeGreaterThan(2440);
    expect(miles).toBeLessThan(2470);
  });

  it('no anomaly for stationary home-charger pings', () => {
    const events = [
      dev('wb-1', '2026-05-24T10:00:00Z', 30.2672, -97.7431),
      dev('wb-1', '2026-05-24T11:00:00Z', 30.2672, -97.7431),
      dev('wb-1', '2026-05-24T12:00:00Z', 30.2673, -97.7432),
    ];
    expect(findGeoFenceViolations(events)).toEqual([]);
  });

  it('no anomaly for plausible same-day EV travel', () => {
    // ~70 mi in 2 h = 35 mph, well under the 500 mph default
    const events = [
      dev('vin-1', '2026-05-24T09:00:00Z', 30.2672, -97.7431),
      dev('vin-1', '2026-05-24T11:00:00Z', 31.1, -97.74),
    ];
    expect(findGeoFenceViolations(events)).toEqual([]);
  });

  it('FLAGS NYC → LAX within 1h on the same device', () => {
    const events = [
      dev('vin-x', '2026-05-24T10:00:00Z', 40.6413, -73.7781),
      dev('vin-x', '2026-05-24T11:00:00Z', 33.9416, -118.4085),
    ];
    const out = findGeoFenceViolations(events);
    expect(out).toHaveLength(1);
    expect(out[0].code).toBe('geo_fence_violation');
  });

  it('isolates violations per device — one bad device does not flag others', () => {
    const events = [
      dev('good', '2026-05-24T10:00:00Z', 40.0, -74.0),
      dev('good', '2026-05-24T11:00:00Z', 40.1, -74.1),
      dev('bad', '2026-05-24T10:00:00Z', 40.0, -74.0),
      dev('bad', '2026-05-24T10:30:00Z', 33.9, -118.4),
    ];
    const out = findGeoFenceViolations(events);
    expect(out).toHaveLength(1);
    expect(out[0].details).toMatchObject({ device_id: 'bad' });
  });
});

describe('Proof-of-Origin: 50-trial fuzz — randomized claims never let two users own one fingerprint', () => {
  it('cross-user collision is always caught', () => {
    const rand = (n: number) => Math.floor(Math.random() * n);
    for (let trial = 0; trial < 50; trial++) {
      const providers = ['tesla', 'enphase', 'solaredge', 'wallbox'];
      const userIds = Array.from({ length: 5 }, (_, i) => `u-${i}`);
      const deviceIds = Array.from({ length: 8 }, (_, i) => `dev-${i}`);
      const claims: DeviceClaim[] = [];
      for (let i = 0; i < 30; i++) {
        claims.push({
          provider: providers[rand(providers.length)],
          device_id: deviceIds[rand(deviceIds.length)],
          user_id: userIds[rand(userIds.length)],
        });
      }
      // Force at least one cross-user collision
      claims.push({ provider: 'tesla', device_id: 'collide-vin', user_id: 'u-0' });
      claims.push({ provider: 'tesla', device_id: 'collide-vin', user_id: 'u-1' });

      const out = findDuplicateDeviceClaims(claims);
      const collision = out.find((a) => a.code === 'cross_user_device_collision');
      expect(collision, `trial ${trial} failed to detect collision`).toBeDefined();
    }
  });
});
