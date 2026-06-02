import { describe, it, expect } from 'vitest';
import {
  pickSource,
  detectSolarConflict,
  detectChargingConflict,
  type DeviceLike,
  type ProfileLike,
  type Capability,
} from '@/lib/dataSourcePriority';

const dev = (provider: string, device_type: string, device_id = `${provider}-${device_type}`): DeviceLike => ({
  provider,
  device_type,
  device_id,
  device_name: `${provider} ${device_type}`,
});

describe('SSOT: Tesla vehicle charging rule', () => {
  it('returns Tesla charge_state when both Tesla vehicle and Wallbox are connected', () => {
    const devices = [dev('tesla', 'tesla_vehicle'), dev('wallbox', 'home_charger')];
    const choice = pickSource('charging', {} as ProfileLike, devices);
    expect(choice?.provider).toBe('tesla');
    expect(choice?.reason).toBe('tesla_vehicle_present');
  });

  it('falls through to the home charger when no Tesla vehicle is present', () => {
    const choice = pickSource('charging', {} as ProfileLike, [dev('wallbox', 'home_charger')]);
    expect(choice?.provider).toBe('wallbox');
  });

  it('flags a charging conflict when both sources coexist', () => {
    const result = detectChargingConflict([dev('tesla', 'tesla_vehicle'), dev('wallbox', 'home_charger')]);
    expect(result.conflicting).toBe(true);
    expect(result.hasTeslaVehicle).toBe(true);
    expect(result.hasHomeCharger).toBe(true);
  });
});

describe('SSOT: Solar production source rule', () => {
  it('honors solar_installer=tesla over Enphase hardware', () => {
    const devices = [dev('enphase', 'solar'), dev('tesla', 'solar')];
    const choice = pickSource('solar', { solar_installer: 'tesla' }, devices);
    expect(choice?.provider).toBe('tesla');
  });

  it('honors solar_inverter_brand=enphase when installer is "other"', () => {
    const devices = [dev('enphase', 'solar'), dev('solaredge', 'solar')];
    const choice = pickSource(
      'solar',
      { solar_installer: 'other', solar_inverter_brand: 'enphase' },
      devices,
    );
    expect(choice?.provider).toBe('enphase');
  });

  it('never picks Powerwall CTs as the solar source (no PV inverter present)', () => {
    const devices = [dev('tesla', 'powerwall')];
    const choice = pickSource('solar', { solar_installer: 'other' }, devices);
    expect(choice).toBeNull();
  });

  it('uses fallback order Enphase > SolarEdge > Tesla when profile is unset', () => {
    const devices = [dev('solaredge', 'solar'), dev('enphase', 'solar'), dev('tesla', 'solar')];
    const choice = pickSource('solar', {}, devices);
    expect(choice?.provider).toBe('enphase');
  });

  it('flags a solar conflict when multiple PV providers are connected', () => {
    const result = detectSolarConflict([dev('enphase', 'solar'), dev('solaredge', 'solar')]);
    expect(result.conflicting).toBe(true);
    expect(result.providers.sort()).toEqual(['enphase', 'solaredge']);
  });
});

describe('SSOT: Anti-double-count contract', () => {
  const allCapabilities: Capability[] = ['solar', 'battery', 'charging', 'consumption'];
  const profile: ProfileLike = { solar_installer: 'other', solar_inverter_brand: 'enphase' };
  const devices: DeviceLike[] = [
    dev('enphase', 'solar'),
    dev('solaredge', 'solar'),
    dev('tesla', 'powerwall'),
    dev('enphase', 'iq_battery'),
    dev('tesla', 'tesla_vehicle'),
    dev('wallbox', 'home_charger'),
  ];

  for (const cap of allCapabilities) {
    it(`pickSource('${cap}', …) returns exactly one provider (never merged)`, () => {
      const choice = pickSource(cap, profile, devices);
      expect(choice).not.toBeNull();
      // SourceChoice is a single object — there's no API surface that can
      // return more than one provider. This test locks that contract in.
      expect(typeof choice?.provider).toBe('string');
      expect(Array.isArray(choice)).toBe(false);
    });
  }

  it('battery picks Powerwall first, ignoring Enphase IQ Battery', () => {
    const choice = pickSource('battery', profile, devices);
    expect(choice?.provider).toBe('tesla');
  });
});
