import { describe, it, expect } from 'vitest';
import { OUTAGE_VISUAL } from '@/components/dashboard/EnergyFlowScene';

/**
 * Visual-regression contract for EnergyFlowScene Outage Mode.
 *
 * The pw-home dominance + grid-offline visual hierarchy is critical UX during
 * a real outage: the user must see at a glance that they are running on
 * battery. These values were tuned over multiple field iterations (see
 * `.lovable/plan.md`, 2026-06-03).
 *
 * Bumping any number here intentionally? Update the snapshot in the same
 * commit and note the change in the EnergyFlowScene header comment.
 */
describe('EnergyFlowScene — OUTAGE_VISUAL contract', () => {
  it('pw-home stroke hierarchy: outer > mid > core (visual depth layering)', () => {
    const v = OUTAGE_VISUAL.pwHome;
    expect(v.outerHaloStrokeWidth).toBeGreaterThan(v.midHaloStrokeWidth);
    expect(v.midHaloStrokeWidth).toBeGreaterThan(v.coreStrokeWidth);
  });

  it('pw-home is the dominant route — core stroke noticeably thicker than calm DottedFlow (0.45)', () => {
    // DottedFlow's calm baseline guide path is strokeWidth 0.45.
    // Outage core must read as a real "current" line, not a hint.
    expect(OUTAGE_VISUAL.pwHome.coreStrokeWidth).toBeGreaterThanOrEqual(1.2);
  });

  it('particle stream is dense enough to read as continuous current', () => {
    expect(OUTAGE_VISUAL.pwHome.particleCount).toBeGreaterThanOrEqual(4);
    expect(OUTAGE_VISUAL.pwHome.particleRadius).toBeGreaterThanOrEqual(1.0);
  });

  it('particle animation has a minimum floor so motion stays legible at low kW', () => {
    expect(OUTAGE_VISUAL.pwHome.minParticleDurSec).toBeGreaterThan(0);
    expect(OUTAGE_VISUAL.pwHome.minParticleDurSec).toBeLessThanOrEqual(1.5);
  });

  it('outer halo breathes — pulse delta is perceptible (≥ 0.15)', () => {
    const p = OUTAGE_VISUAL.pwHome.outerHaloPulse;
    expect(p.to - p.from).toBeGreaterThanOrEqual(0.15);
    expect(p.durMs).toBeGreaterThanOrEqual(800);
    expect(p.durMs).toBeLessThanOrEqual(2000);
  });

  it('solar flows are clearly dimmed (≤ 0.5) so the eye lands on pw-home', () => {
    expect(OUTAGE_VISUAL.solarDimOpacity).toBeLessThanOrEqual(0.5);
    expect(OUTAGE_VISUAL.solarDimOpacity).toBeGreaterThan(0.15);
  });

  it('grid-offline line is dashed (not solid) so disconnect reads at a glance', () => {
    expect(OUTAGE_VISUAL.gridOffline.strokeDasharray).toMatch(/\d/);
    // Should be thinner than the pw-home core so it visibly recedes.
    expect(OUTAGE_VISUAL.gridOffline.strokeWidth).toBeLessThan(
      OUTAGE_VISUAL.pwHome.coreStrokeWidth,
    );
  });

  it('exact snapshot — locks the currently shipping tuning', () => {
    // Stringify the frozen palette + numerics so a single assertion fails
    // loudly when any knob shifts. Update intentionally with the commit.
    const expected =
      '{"pwHome":{"coreStrokeWidth":1.6,"coreStroke":"hsl(38 100% 65% / 0.95)","midHaloStrokeWidth":2.4,"midHalo":"hsl(38 95% 62% / 0.6)","outerHaloStrokeWidth":4,"outerHalo":"hsl(38 95% 60% / 0.28)","outerHaloPulse":{"from":0.18,"to":0.42,"durMs":1200},"particleCount":5,"particleRadius":1.1,"minParticleDurSec":0.9,"chevron":{"width":2.2,"height":1.4,"opacity":0.95}},"solarDimOpacity":0.35,"gridOffline":{"stroke":"hsl(0 65% 55% / 0.55)","strokeWidth":0.55,"strokeDasharray":"1.4 2.4","opacity":0.7}}';
    expect(JSON.stringify(OUTAGE_VISUAL)).toBe(expected);
  });
});

