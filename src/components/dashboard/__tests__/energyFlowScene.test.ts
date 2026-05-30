import { describe, it, expect } from 'vitest';
import { pickScene } from '../EnergyFlowScene';
import type { EnergyFlowData } from '../AnimatedEnergyFlow';

const base: EnergyFlowData = {
  solarPower: 0,
  homePower: 0,
  batteryPower: 0,
  batteryPercent: 50,
  gridPower: 0,
  evPower: 0,
};

const noon = new Date('2026-05-30T12:00:00Z');
const evening = new Date('2026-05-30T19:00:00Z');

describe('pickScene', () => {
  it('night when sun is down and nothing else happening', () => {
    expect(pickScene(base, noon)).toBe('night');
  });

  it('day when solar is producing midday', () => {
    expect(pickScene({ ...base, solarPower: 3 }, noon)).toBe('day');
  });

  it('dusk when solar is producing at evening hour', () => {
    expect(pickScene({ ...base, solarPower: 3 }, evening)).toBe('dusk');
  });

  it('day-export when exporting to grid in daylight', () => {
    expect(pickScene({ ...base, solarPower: 6, gridPower: -2 }, noon)).toBe('day-export');
  });

  it('night-pw-discharge when Powerwall powers home at night', () => {
    expect(pickScene({ ...base, batteryPower: -1.5 }, noon)).toBe('night-pw-discharge');
  });

  it('night-ev when EV charging at night (no PW discharge)', () => {
    expect(
      pickScene({ ...base, tesla: { kW: 11, soc: 50, rangeMi: 200, isCharging: true, source: 'home' } }, noon),
    ).toBe('night-ev');
  });

  it('night-pw-discharge-ev when both EV charges and PW discharges at night', () => {
    expect(
      pickScene(
        {
          ...base,
          batteryPower: -2,
          tesla: { kW: 11, soc: 50, rangeMi: 200, isCharging: true, source: 'home' },
        },
        noon,
      ),
    ).toBe('night-pw-discharge-ev');
  });

  it('falls back to evPower > 0.1 when tesla object is absent', () => {
    expect(pickScene({ ...base, evPower: 5 }, noon)).toBe('night-ev');
  });
});
