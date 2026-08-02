// @vitest-environment jsdom
/**
 * Regression: an actively charging car rendered with NO conductor.
 *
 * Live case (session 187023c7, ZenX at ZenAiredale): the wall connector had an
 * open home_charging_session at 11 kW with presence_evidence 'wall_connector',
 * while the vehicle itself was asleep and its telemetry payload reported
 * charger_power 0. The scene gated the EV conductor on the VEHICLE's kW, so the
 * branch was dropped entirely — the status pill said charging, the screen drew
 * nothing. These tests pin the wall connector as a valid witness.
 */
import { describe, it, expect } from 'vitest';
import { deriveTeslaFlow } from '@/components/dashboard/LiveEnergyMonitoringCard';
import { buildConductorSegments, SCENE_ANCHORS } from '@/components/dashboard/ConductorNetwork';

const COLORS = {
  solar: 'emerald',
  home: 'emerald',
  export: 'cyan',
  import: 'sky',
  ev: 'violet',
};

/** Vehicle asleep: charge state stale, no power reported by the car. */
const sleepingTesla = {
  oem: 'tesla',
  device_id: '5YJXCBE24MF323843',
  payload: {
    battery_level: 62,
    battery_range: 210,
    charging_state: 'Disconnected',
    charger_power: 0,
    charger_actual_current: 0,
    charger_voltage: 0,
  },
} as never;

describe('sleeping car, open wall-connector session', () => {
  it('reports the wall connector power, tagged as such', () => {
    const flow = deriveTeslaFlow(sleepingTesla, true, 11);
    expect(flow?.isCharging).toBe(true);
    expect(flow?.kW).toBe(11);
    expect(flow?.kwSource).toBe('wall_connector');
  });

  it('never classes a wall-connector fallback as supercharging', () => {
    const flow = deriveTeslaFlow(sleepingTesla, true, 11);
    expect(flow?.source).toBe('home');
  });

  it('prefers the vehicle reading when the car is awake', () => {
    const awake = {
      oem: 'tesla',
      device_id: '5YJXCBE24MF323843',
      payload: {
        battery_level: 62,
        battery_range: 210,
        charging_state: 'Charging',
        charger_power: 10.4,
      },
    } as never;
    const flow = deriveTeslaFlow(awake, true, 11);
    expect(flow?.kW).toBe(10.4);
    expect(flow?.kwSource).toBe('vehicle_api');
  });

  it('reports no power when nothing is charging', () => {
    const flow = deriveTeslaFlow(sleepingTesla, false, null);
    expect(flow?.isCharging).toBe(false);
    expect(flow?.kwSource).toBe('none');
  });

  it('draws branch-ev from chargePoint to evPort, not from wallJunction', () => {
    const flow = deriveTeslaFlow(sleepingTesla, true, 11);
    const segments = buildConductorSegments({
      solar: 0,
      home: 0.3,
      grid: 11.3,
      ev: flow!.kW,
      colors: COLORS,
    });
    const ev = segments.find((s) => s.id === 'branch-ev');
    expect(ev).toBeDefined();
    expect(ev!.color).toBe('violet');

    // The rendered polyline must actually start at chargePoint and end at
    // evPort — defining the anchors is not the same as reaching the render.
    const first = ev!.points[0];
    const last = ev!.points[ev!.points.length - 1];
    expect(first).toEqual(SCENE_ANCHORS.chargePoint);
    expect(last).toEqual(SCENE_ANCHORS.evPort);

    // And it must be nowhere near the house-right grid run.
    expect(SCENE_ANCHORS.evPort.x).toBeLessThan(SCENE_ANCHORS.homeWall.x);
    expect(ev!.points.every((p) => p.x < SCENE_ANCHORS.wallJunction.x)).toBe(true);
  });

  it('drops branch-ev when the session is closed', () => {
    const flow = deriveTeslaFlow(sleepingTesla, false, null);
    const segments = buildConductorSegments({
      solar: 0,
      home: 0.3,
      grid: 0.3,
      ev: flow!.kW,
      colors: COLORS,
    });
    expect(segments.find((s) => s.id === 'branch-ev')).toBeUndefined();
  });
});
