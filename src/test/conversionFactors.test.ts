/**
 * FACTOR-PINNING TEST — the guardrail for issuance rates.
 *
 * This app once credited every category 1:1 while the spec said otherwise and
 * nothing caught it. These assertions exist so that changing ANY rate requires
 * editing this file, forcing a deliberate decision instead of a silent drift.
 * Same reasoning as the coverage invariant.
 *
 * If you are here because a test failed: do not "fix" the test to match the
 * code. Confirm the rate change was decided, then change both together.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CONVERSION_FACTORS,
  HOME_CHARGING_SOLAR_NETTING_FACTOR,
  ISSUANCE_PIPELINE_ORDER,
  tokensForCategory,
} from '@/lib/mintFactors';
import { runIssuancePipeline } from '@/lib/issuancePipeline';

/** LOCKED VALUES — home charging moved 0.25 -> 1 on 2026-08-04. */
const LOCKED: Record<string, number> = {
  solar_kwh: 1,
  battery_export_kwh: 1,
  supercharging_kwh: 1,
  home_charging_kwh: 1,
  fsd_miles: 1,
  ev_miles: 0.1,
};

describe('conversion factors are pinned', () => {
  it('pins all six categories to their locked values', () => {
    expect(CONVERSION_FACTORS).toEqual(LOCKED);
  });

  it('exposes exactly six categories — a new one must be pinned here too', () => {
    expect(Object.keys(CONVERSION_FACTORS).sort()).toEqual(Object.keys(LOCKED).sort());
  });

  it('home charging is 1:1 with or without a solar-connected home', () => {
    expect(HOME_CHARGING_SOLAR_NETTING_FACTOR).toBe(1);
    expect(tokensForCategory('home_charging_kwh', 10, { solarConnectedHome: true })).toBe(10);
    expect(tokensForCategory('home_charging_kwh', 10, { solarConnectedHome: false })).toBe(10);
  });

  it('the edge-function mirror declares the same factors', () => {
    const mirror = readFileSync(
      resolve(process.cwd(), 'supabase/functions/_shared/mintFactors.ts'),
      'utf8',
    );
    for (const [cat, val] of Object.entries(LOCKED)) {
      expect(mirror).toMatch(new RegExp(`${cat}:\\s*${val}\\s*,`));
    }
    expect(mirror).toMatch(/HOME_CHARGING_SOLAR_NETTING_FACTOR\s*=\s*1\b/);
  });
});

describe('issuance pipeline shape', () => {
  it('keeps the declared stage order netting -> stack_bonus -> allowance_cap', () => {
    expect([...ISSUANCE_PIPELINE_ORDER]).toEqual(['netting', 'stack_bonus', 'allowance_cap']);
    const trace = runIssuancePipeline(
      { home_charging_kwh: 40 },
      { userId: 'u', solarConnectedHome: true },
    );
    expect(trace.order).toEqual(['netting', 'stack_bonus', 'allowance_cap']);
  });

  it('applies no stage — all three are no-ops today', () => {
    const trace = runIssuancePipeline(
      { home_charging_kwh: 40, solar_kwh: 10 },
      { userId: 'u', solarConnectedHome: true },
    );
    expect(trace.stages.every((s) => s.applied === false)).toBe(true);
    expect(trace.quantities).toEqual({ home_charging_kwh: 40, solar_kwh: 10 });
    expect(trace.userTokens).toBe(50);
  });
});
