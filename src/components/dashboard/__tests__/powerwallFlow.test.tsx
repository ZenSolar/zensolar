// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

// jsdom doesn't ship matchMedia; useIsMobile needs it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

import {
  AnimatedEnergyFlow,
  derivePowerwallDisplay,
  type EnergyFlowData,
} from '../AnimatedEnergyFlow';
import { batterySnapshot } from '../LiveEnergyMonitoringCard';


const SEP = '\u202F·\u202F';
const MINUS = '\u2212';

function baseFlow(overrides: Partial<EnergyFlowData> = {}): EnergyFlowData {
  return {
    solarPower: 0,
    homePower: 0,
    batteryPower: 0,
    batteryPercent: 100,
    batteryCapacityKwh: 13.5,
    batteryReserveKwh: 13.5,
    gridPower: 0,
    evPower: 0,
    ...overrides,
  };
}

describe('derivePowerwallDisplay', () => {
  it('idle full → "Full" with muted color, 13.5 / 13.5 kWh', () => {
    const d = derivePowerwallDisplay({ capacity: 13.5, reserve: 13.5, percent: 100, power: 0 });
    expect(d.primaryReserve).toBe('13.5');
    expect(d.primaryCapacity).toBe('13.5 kWh');
    expect(d.status).toBe(`100%${SEP}Full`);
    expect(d.statusColor).toBe('#6b7280');
    expect(d.isUnknown).toBe(false);
  });

  it('idle partial → "Idle", reserve derived from percent', () => {
    const d = derivePowerwallDisplay({ capacity: 13.5, reserve: undefined, percent: 64, power: 0 });
    expect(d.primaryReserve).toBe((13.5 * 0.64).toFixed(1));
    expect(d.status).toBe(`64%${SEP}Idle`);
    expect(d.statusColor).toBe('#6b7280');
  });

  it('charging → green "+kW"', () => {
    const d = derivePowerwallDisplay({ capacity: 13.5, reserve: 11.7, percent: 87, power: 3.2 });
    expect(d.status).toBe(`87%${SEP}+3.2 kW`);
    expect(d.statusColor).toBe('#22C55E');
  });

  it('discharging → amber with proper minus sign (U+2212)', () => {
    const d = derivePowerwallDisplay({ capacity: 13.5, reserve: 8.6, percent: 64, power: -2.1 });
    expect(d.status).toBe(`64%${SEP}${MINUS}2.1 kW`);
    expect(d.statusColor).toBe('#F59E0B');
    expect(d.status.includes('-2.1')).toBe(false);
  });

  it('|kW| ≥ 10 drops the decimal to fit mobile width', () => {
    const charging = derivePowerwallDisplay({ capacity: 27, reserve: 13.5, percent: 50, power: 12.4 });
    expect(charging.status).toBe(`50%${SEP}+12 kW`);
    const discharging = derivePowerwallDisplay({ capacity: 27, reserve: 13.5, percent: 50, power: -15.9 });
    expect(discharging.status).toBe(`50%${SEP}${MINUS}16 kW`);
  });

  it('unknown telemetry → "State pending", no NaN, no crash', () => {
    const d = derivePowerwallDisplay({ capacity: null, reserve: null, percent: null, power: null });
    expect(d.isUnknown).toBe(true);
    expect(d.primaryReserve).toBe('—');
    expect(d.primaryCapacity).toBe('— kWh');
    expect(d.status).toBe('State pending');
    expect(d.status.includes('NaN')).toBe(false);
  });

  it('multi-Powerwall (capacity ≥ 20) drops decimals on primary number', () => {
    const d = derivePowerwallDisplay({ capacity: 27, reserve: 13.5, percent: 50, power: 4 });
    expect(d.primaryReserve).toBe('14'); // rounded, no decimal
    expect(d.primaryCapacity).toBe('27 kWh');
    expect(d.status).toBe(`50%${SEP}+4.0 kW`);
  });

  it('reserve is clamped to capacity (never exceeds, never negative)', () => {
    const over = derivePowerwallDisplay({ capacity: 13.5, reserve: 99, percent: 100, power: 0 });
    expect(parseFloat(over.primaryReserve)).toBeLessThanOrEqual(13.5);

    const negative = derivePowerwallDisplay({ capacity: 13.5, reserve: -5, percent: 0, power: 0 });
    expect(parseFloat(negative.primaryReserve)).toBeGreaterThanOrEqual(0);
  });

  it('percent is clamped to [0, 100]', () => {
    const high = derivePowerwallDisplay({ capacity: 13.5, reserve: 13.5, percent: 150, power: 0 });
    expect(high.status).toBe(`100%${SEP}Full`);
    const low = derivePowerwallDisplay({ capacity: 13.5, reserve: 0, percent: -10, power: 0 });
    expect(low.status).toBe(`0%${SEP}Idle`);
  });
});

describe('AnimatedEnergyFlow → Powerwall SVG node', () => {
  it('renders idle full state with "Full" status', () => {
    const { container } = render(
      <AnimatedEnergyFlow data={baseFlow({ batteryPercent: 100, batteryPower: 0, batteryReserveKwh: 13.5 })} showHeader={false} />
    );
    expect(container.textContent).toContain('13.5');
    expect(container.textContent).toContain('13.5 kWh');
    expect(container.textContent).toContain('Full');
  });

  it('renders charging state with green +kW', () => {
    const { container } = render(
      <AnimatedEnergyFlow data={baseFlow({ batteryPercent: 87, batteryPower: 3.2, batteryReserveKwh: 11.7 })} showHeader={false} />
    );
    expect(container.textContent).toContain('+3.2 kW');
  });

  it('renders discharging state with minus sign', () => {
    const { container } = render(
      <AnimatedEnergyFlow data={baseFlow({ batteryPercent: 64, batteryPower: -2.1, batteryReserveKwh: 8.6 })} showHeader={false} />
    );
    expect(container.textContent).toContain(`${MINUS}2.1 kW`);
  });

  it('renders multi-Powerwall (27 kWh) without decimals on primary', () => {
    const { container } = render(
      <AnimatedEnergyFlow data={baseFlow({
        batteryPercent: 50, batteryPower: 4, batteryCapacityKwh: 27, batteryReserveKwh: 13.5,
      })} showHeader={false} />
    );
    expect(container.textContent).toContain('27 kWh');
    expect(container.textContent).not.toContain('27.0 kWh');
  });

  it('renders unknown telemetry without NaN', () => {
    const { container } = render(
      <AnimatedEnergyFlow data={baseFlow({
        batteryPercent: NaN as unknown as number,
        batteryPower: NaN as unknown as number,
        batteryCapacityKwh: undefined,
        batteryReserveKwh: undefined,
      })} showHeader={false} />
    );
    expect(container.textContent).not.toContain('NaN');
    expect(container.textContent).toContain('State pending');
});

describe('AnimatedEnergyFlow → Powerwall discharge animation', () => {
  it('discharging renders Powerwall→Home flow group and data-state="discharging"', () => {
    const { container } = render(
      <AnimatedEnergyFlow data={baseFlow({ batteryPercent: 64, batteryPower: -0.8, batteryReserveKwh: 8.6 })} showHeader={false} />
    );
    expect(container.querySelector('[data-flow="powerwall-home"]')).not.toBeNull();
    expect(container.querySelector('[data-state="discharging"]')).not.toBeNull();
  });

  it('charging does NOT render discharge flow group and is data-state="charging"', () => {
    const { container } = render(
      <AnimatedEnergyFlow data={baseFlow({ batteryPercent: 87, batteryPower: 3.2, batteryReserveKwh: 11.7 })} showHeader={false} />
    );
    expect(container.querySelector('[data-flow="powerwall-home"]')).toBeNull();
    expect(container.querySelector('[data-state="charging"]')).not.toBeNull();
  });

  it('idle is data-state="idle" with no discharge flow', () => {
    const { container } = render(
      <AnimatedEnergyFlow data={baseFlow({ batteryPercent: 100, batteryPower: 0, batteryReserveKwh: 13.5 })} showHeader={false} />
    );
    expect(container.querySelector('[data-flow="powerwall-home"]')).toBeNull();
    expect(container.querySelector('[data-state="idle"]')).not.toBeNull();
  });

  it('unknown telemetry is data-state="unknown" with no discharge flow', () => {
    const { container } = render(
      <AnimatedEnergyFlow data={baseFlow({
        batteryPercent: NaN as unknown as number,
        batteryPower: NaN as unknown as number,
        batteryCapacityKwh: undefined,
        batteryReserveKwh: undefined,
      })} showHeader={false} />
    );
    expect(container.querySelector('[data-flow="powerwall-home"]')).toBeNull();
    expect(container.querySelector('[data-state="unknown"]')).not.toBeNull();
  });
});


describe('batterySnapshot → Tesla Fleet API sign convention', () => {
  // Tesla's /energy_sites/{id}/live_status uses positive=discharging.
  // batterySnapshot must invert to our internal +charging convention.
  const teslaCached = (battery_power: number, soc = 100) => ({
    oem: 'tesla' as const,
    capability: 'battery' as const,
    site_id: 'site-1',
    device_name: 'Powerwall',
    payload: { battery_power, percentage_charged: soc, total_pack_energy: 13500 },
    cached_at: new Date().toISOString(),
    fresh: true,
  });

  it('Tesla payload with battery_power=800 (W) → powerKw=-0.8, Discharging', () => {
    const snap = batterySnapshot(teslaCached(800, 100));
    expect(snap.powerKw).toBeCloseTo(-0.8, 2);
    expect(snap.status).toBe('Discharging');
  });

  it('Tesla payload with battery_power=-1200 (W) → powerKw=+1.2, Charging', () => {
    const snap = batterySnapshot(teslaCached(-1200, 64));
    expect(snap.powerKw).toBeCloseTo(1.2, 2);
    expect(snap.status).toBe('Charging');
  });

  it('Tesla idle (battery_power=0) → Idle', () => {
    const snap = batterySnapshot(teslaCached(0, 100));
    expect(snap.status).toBe('Idle');
  });
});
