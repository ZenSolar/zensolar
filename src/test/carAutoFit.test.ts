import { describe, it, expect } from 'vitest';
import { fitVehicleToBay, SPRITE_CONTACT_RATIO } from '@/components/dashboard/carAutoFit';
import { HOME_BLUEPRINT } from '@/components/dashboard/HomeBlueprint';

const bay = HOME_BLUEPRINT.bays.garage;

describe('fitVehicleToBay', () => {
  it('never breaks the sprite aspect ratio', () => {
    for (const aspect of [1, 1.4, 50 / 28, 2.6, 3.2]) {
      const f = fitVehicleToBay(bay, aspect);
      expect(f.width / f.height).toBeCloseTo(aspect, 5);
    }
  });

  it('stays inside the bay budget at every aspect', () => {
    for (const aspect of [0.8, 1.5, 2, 4]) {
      const f = fitVehicleToBay(bay, aspect);
      expect(f.width).toBeLessThanOrEqual(bay.maxWidth + 1e-6);
      expect(f.height).toBeLessThanOrEqual(bay.maxHeight + 1e-6);
    }
  });

  it('seats the tyres on the bay contact line', () => {
    const f = fitVehicleToBay(bay, 2.1);
    expect(f.y + f.height * SPRITE_CONTACT_RATIO).toBeCloseTo(bay.groundY, 5);
  });

  it('scales the car down when a scale factor is supplied', () => {
    const solo = fitVehicleToBay(HOME_BLUEPRINT.bays.driveway, 1.8);
    const scaled = fitVehicleToBay(HOME_BLUEPRINT.bays.driveway, 1.8, 0.84);
    expect(scaled.width).toBeLessThan(solo.width);
  });

  it('clamps a very wide sprite inside the viewBox', () => {
    const f = fitVehicleToBay({ cx: 4, groundY: 90, maxWidth: 50, maxHeight: 28 }, 3);
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.x + f.width).toBeLessThanOrEqual(100);
  });

  it('falls back to a sane box for a bad aspect value', () => {
    const f = fitVehicleToBay(bay, Number.NaN);
    expect(f.width).toBeGreaterThan(0);
    expect(f.height).toBeGreaterThan(0);
  });
});
