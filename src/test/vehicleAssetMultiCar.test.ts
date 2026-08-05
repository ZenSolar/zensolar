/**
 * Multi-car vehicle art regression.
 *
 * TesYto (pearl-white Model Y) and ZenX (black Model X) live in the same
 * household. The per-vehicle hero image must resolve from that vehicle's own
 * Tesla `vehicle_config`, and the localStorage last-known cache must be scoped
 * per VIN so a payload gap on one car never renders the other car's art.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveVehicleAsset } from '@/components/dashboard/EnergyFlowScene.scenes';

const ZENX_VIN = '5YJXCBE24MF323843';
const TESYTO_VIN = '7SAYGDED1TA688212';

const zenxPayload = {
  charging_state: 'Charging',
  charger_power: 11,
  vehicle_config: { car_type: 'modelx', exterior_color: 'Black' },
};

const tesytoPayload = {
  charging_state: 'Charging',
  charger_power: 7.6,
  vehicle_config: { car_type: 'modely', exterior_color: 'PearlWhite' },
};

describe('per-vehicle hero art', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('resolves TesYto from its own Tesla config while charging', () => {
    const a = resolveVehicleAsset(tesytoPayload, undefined, {
      fallbackWhenConnected: true,
      vehicleKey: TESYTO_VIN,
    });
    expect(a.model).toBe('modely');
    expect(a.color).toBe('pearl-white');
    expect(a.generic).toBe(false);
    expect(a.src).toBeTruthy();
  });

  it('renders ZenX and TesYto with different art in the same session', () => {
    const zenx = resolveVehicleAsset(zenxPayload, undefined, {
      fallbackWhenConnected: true,
      vehicleKey: ZENX_VIN,
    });
    const tesyto = resolveVehicleAsset(tesytoPayload, undefined, {
      fallbackWhenConnected: true,
      vehicleKey: TESYTO_VIN,
    });
    expect(zenx.model).toBe('modelx');
    expect(tesyto.model).toBe('modely');
    expect(zenx.src).not.toBe(tesyto.src);
  });

  it('does not inherit the other car when TesYto telemetry drops vehicle_config', () => {
    // ZenX renders first and warms the cache.
    resolveVehicleAsset(zenxPayload, undefined, { fallbackWhenConnected: true, vehicleKey: ZENX_VIN });
    // TesYto had already resolved once, then its payload gaps.
    resolveVehicleAsset(tesytoPayload, undefined, { fallbackWhenConnected: true, vehicleKey: TESYTO_VIN });
    const gap = resolveVehicleAsset(
      { charging_state: 'Charging', charger_power: 7.6 },
      undefined,
      { fallbackWhenConnected: true, vehicleKey: TESYTO_VIN },
    );
    expect(gap.model).toBe('modely');
    expect(gap.color).toBe('pearl-white');
  });
});
