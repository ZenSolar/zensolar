import { describe, it, expect } from 'vitest';
import { chooseSceneType } from '@/components/dashboard/EnergyFlowScene';
import type { EnergyFlowData } from '@/components/dashboard/AnimatedEnergyFlow';

const NOON = new Date('2026-06-15T12:00:00');
const NIGHT = new Date('2026-06-15T22:00:00');

const empty: EnergyFlowData = {
  solarPower: 0,
  homePower: 0,
  batteryPower: 0,
  batteryPercent: 50,
  gridPower: 0,
};

describe('chooseSceneType — v5 adaptive composer', () => {
  it('returns day + full-stack when solar + battery + tesla are connected at noon', () => {
    const r = chooseSceneType(
      { ...empty, solarPower: 4 },
      { hasSolar: true, hasBattery: true, hasTesla: true },
      { now: NOON },
    );
    expect(r.scene).toBe('day');
    expect(r.composition).toBe('full-stack');
  });

  it('returns night-ev when Tesla is charging after sundown', () => {
    const r = chooseSceneType(
      { ...empty, tesla: { kW: 7, soc: 60, rangeMi: 200, isCharging: true, source: 'home' } },
      { hasTesla: true },
      { now: NIGHT },
    );
    expect(r.scene).toBe('night-ev');
  });

  it('returns night when nothing is producing and the sun is down', () => {
    const r = chooseSceneType(empty, { hasBattery: true }, { now: NIGHT });
    expect(r.scene).toBe('night');
  });

  it('forces rain scene for rainy WMO weather codes during the day', () => {
    const r = chooseSceneType(
      { ...empty, solarPower: 2 },
      { hasSolar: true, hasBattery: true },
      { now: NOON, weatherCode: 63 }, // moderate rain
    );
    expect(r.scene).toBe('rain');
  });

  it('does NOT swap to rain at night-ev (baked Tesla overlay must win)', () => {
    const r = chooseSceneType(
      { ...empty, tesla: { kW: 7, soc: 60, rangeMi: 200, isCharging: true, source: 'home' } },
      { hasTesla: true },
      { now: NIGHT, weatherCode: 82 },
    );
    expect(r.scene).toBe('night-ev');
  });

  it('returns outage composition when isOutage is set, regardless of devices', () => {
    const r = chooseSceneType(
      { ...empty, solarPower: 3 },
      { hasSolar: true, hasBattery: true, isOutage: true },
      { now: NOON },
    );
    expect(r.composition).toBe('outage');
  });

  it('returns solar-only composition when only PV is connected', () => {
    const r = chooseSceneType(
      { ...empty, solarPower: 3 },
      { hasSolar: true },
      { now: NOON },
    );
    expect(r.composition).toBe('solar-only');
  });

  it('returns charger-only composition when only a wallbox is connected', () => {
    const r = chooseSceneType(empty, { hasCharger: true }, { now: NOON });
    expect(r.composition).toBe('charger-only');
  });

  it('ignores null/undefined weather code', () => {
    const r = chooseSceneType(
      { ...empty, solarPower: 2 },
      { hasSolar: true },
      { now: NOON, weatherCode: null },
    );
    expect(r.scene).toBe('day');
  });

  it('is pure — calling twice with the same input returns the same result', () => {
    const a = chooseSceneType({ ...empty, solarPower: 1 }, { hasSolar: true }, { now: NOON });
    const b = chooseSceneType({ ...empty, solarPower: 1 }, { hasSolar: true }, { now: NOON });
    expect(a).toEqual(b);
  });
});
