import { describe, it, expect } from 'vitest';
import { teslaRecCo2, GRID_KG_PER_KWH, EV_MI_PER_KWH, CO2_KG_PER_EV_MILE } from '@/lib/co2Math';

describe('teslaRecCo2', () => {
  it('Tesla REC line is always zero', () => {
    expect(teslaRecCo2(0).tesla_rec_kg).toBe(0);
    expect(teslaRecCo2(10).tesla_rec_kg).toBe(0);
    expect(teslaRecCo2(123.45).tesla_rec_kg).toBe(0);
  });
  it('Grid-avg comparator equals kWh × grid factor', () => {
    expect(teslaRecCo2(10).grid_avg_kg).toBeCloseTo(10 * GRID_KG_PER_KWH, 6);
  });
  it('ICE miles avoided uses EV efficiency × per-mile factor', () => {
    expect(teslaRecCo2(10).ice_miles_avoided_kg).toBeCloseTo(10 * EV_MI_PER_KWH * CO2_KG_PER_EV_MILE, 6);
  });
  it('Negative or NaN kWh clamps to zero', () => {
    expect(teslaRecCo2(-5).grid_avg_kg).toBe(0);
    expect(teslaRecCo2(NaN).grid_avg_kg).toBe(0);
  });
});
