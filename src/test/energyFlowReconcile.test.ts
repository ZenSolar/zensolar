import { describe, it, expect } from 'vitest';
import { reconcileEnergyFlow, buildSourcesSinks } from '@/lib/energyFlowReconcile';

/**
 * §3 — pins the bug this card was rebuilt to kill: the banner read the RAW
 * grid CT while the diagram beside it drew the RECONCILED value, so the site
 * looked broken while both numbers were individually correct. There is now one
 * object, and everything downstream reads it.
 */
describe('reconciledFlow — one object, one grid value', () => {
  it('trusts the raw CT when the site balances within threshold', () => {
    const flow = reconcileEnergyFlow({
      solarKw: 4.2,
      batteryKw: -1.0, // discharging
      gridKwRaw: 0.3,
      homeKwEstimate: 5.5,
      evKw: 0,
    });
    expect(flow.gridSource).toBe('raw');
    expect(flow.gridKw).toBe(0.3);
    expect(flow.overrideReason).toBeNull();
  });

  it('substitutes a closing residual when the raw CT disagrees, and says why', () => {
    // The observed failure: raw CT reported +1.1 kW import while the rest of
    // the site said 0.8 kW export.
    const flow = reconcileEnergyFlow({
      solarKw: 5.4,
      batteryKw: 0.6,
      gridKwRaw: 1.1,
      homeKwEstimate: 4.0,
      evKw: 0,
    });
    expect(flow.gridSource).toBe('reconciled');
    expect(flow.gridKw).not.toBe(1.1);
    expect(flow.overrideReason).toMatch(/raw CT read 1\.1 kW import/);
    expect(flow.overrideReason).toMatch(/threshold/);
  });

  it('never marks home load as measured', () => {
    const flow = reconcileEnergyFlow({
      solarKw: 0,
      batteryKw: 0,
      gridKwRaw: 2,
      homeKwEstimate: 2,
      evKw: 0,
    });
    expect(flow.homeDerived).toBe(true);
  });

  it('surfaces an unexplained shortfall as unmeasured instead of hiding it', () => {
    const flow = reconcileEnergyFlow({
      solarKw: 0,
      batteryKw: 0,
      gridKwRaw: 0,
      homeKwEstimate: 3.0,
      evKw: 0,
    });
    const { unmeasuredKw, sinks } = buildSourcesSinks(flow);
    expect(unmeasuredKw).toBeGreaterThan(0);
    expect(sinks.some((s) => s.provenance === 'derived')).toBe(true);
  });
});
