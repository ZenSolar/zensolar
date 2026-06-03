import { describe, it, expect } from 'vitest';
import { OUTAGE_VISUAL } from '@/components/dashboard/EnergyFlowScene';

/**
 * Visual-regression contract for EnergyFlowScene Outage Mode.
 *
 * v2 (2026-06-03): pw-home now mirrors the active Solar `DottedFlow`
 * language (faint guide path + dense LED particles) — just amber, denser,
 * and faster. The previous triple-halo stack was replaced with a single
 * breathing amber halo. Update the snapshot below in the same commit when
 * any value here intentionally moves.
 */
describe('EnergyFlowScene — OUTAGE_VISUAL contract', () => {
  it('pw-home uses the same faint-guide language as solar DottedFlow', () => {
    const v = OUTAGE_VISUAL.pwHome;
    // Guide path is faint but slightly stronger than calm solar (0.45 / 0.18)
    // so the dominance still reads at a glance.
    expect(v.guideStrokeWidth).toBeGreaterThanOrEqual(0.5);
    expect(v.guideStrokeWidth).toBeLessThanOrEqual(0.9);
    expect(v.guideOpacity).toBeGreaterThanOrEqual(0.2);
    expect(v.guideOpacity).toBeLessThanOrEqual(0.45);
  });

  it('halo is a single soft layer — not the old triple-blur stack', () => {
    const v = OUTAGE_VISUAL.pwHome;
    // Single halo should sit above the guide width but stay subtle.
    expect(v.haloStrokeWidth).toBeGreaterThan(v.guideStrokeWidth);
    expect(v.haloStrokeWidth).toBeLessThanOrEqual(2.4);
  });

  it('particle stream is dense and fast enough to read as active current', () => {
    expect(OUTAGE_VISUAL.pwHome.particleCount).toBeGreaterThanOrEqual(5);
    expect(OUTAGE_VISUAL.pwHome.particleRadius).toBeGreaterThan(0.6);
    expect(OUTAGE_VISUAL.pwHome.particleDurFactor).toBeLessThanOrEqual(0.7);
  });

  it('particle animation has a minimum floor so motion stays legible at low kW', () => {
    expect(OUTAGE_VISUAL.pwHome.particleMinDurSec).toBeGreaterThan(0);
    expect(OUTAGE_VISUAL.pwHome.particleMinDurSec).toBeLessThanOrEqual(2.0);
  });

  it('halo breathes — pulse delta is perceptible (≥ 0.10)', () => {
    const p = OUTAGE_VISUAL.pwHome.haloPulse;
    expect(p.to - p.from).toBeGreaterThanOrEqual(0.10);
    expect(p.durMs).toBeGreaterThanOrEqual(900);
    expect(p.durMs).toBeLessThanOrEqual(2000);
  });

  it('solar flows are clearly dimmed (≤ 0.5) so the eye lands on pw-home', () => {
    expect(OUTAGE_VISUAL.solarDimOpacity).toBeLessThanOrEqual(0.5);
    expect(OUTAGE_VISUAL.solarDimOpacity).toBeGreaterThan(0.15);
  });

  it('grid-offline line is dashed (not solid) so disconnect reads at a glance', () => {
    expect(OUTAGE_VISUAL.gridOffline.strokeDasharray).toMatch(/\d/);
    // Should be no thicker than the guide so it visibly recedes.
    expect(OUTAGE_VISUAL.gridOffline.strokeWidth).toBeLessThanOrEqual(
      OUTAGE_VISUAL.pwHome.guideStrokeWidth + 0.01,
    );
  });

  it('exact snapshot — locks the currently shipping tuning', () => {
    const expected =
      '{"pwHome":{"guideStrokeWidth":0.55,"guideStroke":"hsl(38 95% 55%)","guideOpacity":0.28,"haloStrokeWidth":1.6,"haloStroke":"hsl(38 95% 60% / 0.26)","haloPulse":{"from":0.18,"to":0.32,"durMs":1400},"particleCount":6,"particleRadius":0.75,"particleColor":"hsl(45 100% 80%)","particleMinDurSec":1.6,"particleDurFactor":0.55},"solarDimOpacity":0.35,"gridOffline":{"stroke":"hsl(0 65% 55% / 0.55)","strokeWidth":0.55,"strokeDasharray":"1.4 2.4","opacity":0.7}}';
    expect(JSON.stringify(OUTAGE_VISUAL)).toBe(expected);
  });
});
