// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  deriveTeslaFlow,
  TeslaStatusPill,
  type TeslaFlow,
} from '../LiveEnergyMonitoringCard';
import type { CachedTelemetry } from '@/hooks/useDeviceTelemetry';

function tesla(payload: any): CachedTelemetry {
  return {
    oem: 'tesla',
    capability: 'ev',
    site_id: 'vin-1',
    device_name: 'Model Y',
    payload,
    cached_at: new Date().toISOString(),
    fresh: true,
  };
}

describe('deriveTeslaFlow', () => {
  it('returns null when telemetry is missing', () => {
    expect(deriveTeslaFlow(undefined, false)).toBeNull();
  });

  it('returns null when oem is not tesla', () => {
    const t = { ...tesla({}), oem: 'enphase' as const };
    expect(deriveTeslaFlow(t, false)).toBeNull();
  });

  it('charging at home with active session → home / Wall Connector', () => {
    const f = deriveTeslaFlow(
      tesla({
        battery_level: 62,
        battery_range: 210,
        charging_state: 'Charging',
        charge_rate_kw: 7.4,
        charger_phases: 1,
      }),
      true,
    );
    expect(f).toMatchObject({
      state: 'charging',
      source: 'home',
      sourceLabel: 'Wall Connector',
      isCharging: true,
    });
    expect(f!.kW).toBeCloseTo(7.4);
  });

  it('charging at home — API reports charging, no session yet, phases=1 (regression: NOT Public L2)', () => {
    const f = deriveTeslaFlow(
      tesla({
        battery_level: 50,
        charging_state: 'Charging',
        charger_actual_current: 32,
        charger_voltage: 240,
        charger_phases: 1,
      }),
      false,
    );
    expect(f!.state).toBe('charging');
    expect(f!.source).toBe('home');
    expect(f!.sourceLabel).not.toBe('Public L2');
    expect(f!.sourceLabel).toBe('Wall Connector');
  });

  it('supercharging → supercharger / Supercharger', () => {
    const f = deriveTeslaFlow(
      tesla({
        battery_level: 40,
        charging_state: 'Charging',
        fast_charger_type: 'Tesla',
        charge_rate_kw: 150,
      }),
      false,
    );
    expect(f).toMatchObject({
      state: 'charging',
      source: 'supercharger',
      sourceLabel: 'Supercharger',
    });
  });

  it('plugged idle — Stopped → idle', () => {
    const f = deriveTeslaFlow(
      tesla({ battery_level: 80, charging_state: 'Stopped' }),
      false,
    );
    expect(f!.state).toBe('idle');
  });

  it('plugged idle — Complete → idle', () => {
    const f = deriveTeslaFlow(
      tesla({ battery_level: 100, charging_state: 'Complete' }),
      false,
    );
    expect(f!.state).toBe('idle');
  });

  it('not plugged in — Disconnected → unplugged', () => {
    const f = deriveTeslaFlow(
      tesla({ battery_level: 73, charging_state: 'Disconnected' }),
      false,
    );
    expect(f!.state).toBe('unplugged');
    expect(f!.source).toBe('none');
  });

  it('kW falls back to amps × volts / 1000 when charge_rate_kw missing', () => {
    const f = deriveTeslaFlow(
      tesla({
        battery_level: 50,
        charging_state: 'Charging',
        charger_actual_current: 40,
        charger_voltage: 240,
      }),
      false,
    );
    expect(f!.kW).toBeCloseTo(9.6, 2);
  });
});

const baseFlow: TeslaFlow = {
  kW: 0,
  soc: 50,
  rangeMi: 200,
  isCharging: false,
  source: 'none',
  state: 'unplugged',
  sourceLabel: 'Wall Connector',
  rawChargingState: null,
  fastChargerType: null,
  phases: null,
  timeToFullHrs: null,
  energyAdded: null,
};

describe('TeslaStatusPill', () => {
  it('renders nothing when tesla is null', () => {
    const { container } = render(<TeslaStatusPill tesla={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('charging state — has accessible label with kW and visible text', () => {
    render(
      <TeslaStatusPill
        tesla={{ ...baseFlow, state: 'charging', isCharging: true, source: 'home', kW: 7.4, soc: 62 }}
      />,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-label', expect.stringMatching(/charging/i));
    expect(btn.getAttribute('aria-label')).toMatch(/7\.4 kilowatts/);
    expect(btn).toHaveTextContent(/Tesla Charging/);
    expect(btn.querySelector('[role="status"]')).toHaveAttribute('aria-live', 'polite');
  });

  it('idle state — aria-label says Plugged and Idle, no pulse element', () => {
    render(<TeslaStatusPill tesla={{ ...baseFlow, state: 'idle', soc: 80 }} />);
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-label')).toMatch(/plugged in and idle/i);
    expect(btn.querySelector('.animate-ping')).toBeNull();
  });

  it('unplugged state — aria-label says Not Plugged In', () => {
    render(<TeslaStatusPill tesla={{ ...baseFlow, state: 'unplugged', soc: 73, rangeMi: 240 }} />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toMatch(/not plugged in/i);
  });

  it('click invokes onClick', () => {
    const onClick = vi.fn();
    render(<TeslaStatusPill tesla={{ ...baseFlow, state: 'idle' }} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
