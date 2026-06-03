// @vitest-environment jsdom
/**
 * Regression coverage for the Investor Demo "Simulate Grid Outage" toggle.
 *
 * We mount `InvestorEnergyFlowCard` with the lazy `EnergyFlowScene` mocked so
 * the test stays fast + stable, then assert:
 *
 *   • Sim OFF: chip reads "Live", Grid readout shows "0.0 kW", scene receives
 *     `isOutage={false}` and the normal flow fixture.
 *   • Sim ON: amber "Demo · Outage Mode Active" chip is in the DOM, Grid
 *     readout shows "Offline", scene receives `isOutage={true}` and the outage
 *     fixture (zero solar, negative battery power = discharging).
 *
 * This is the visual-regression contract for the investor outage demo: if any
 * of these break, the investor walkthrough will look wrong on the live URL.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Capture props passed into the lazy EnergyFlowScene.
const sceneProps: Array<Record<string, unknown>> = [];
vi.mock('@/components/dashboard/EnergyFlowScene', () => ({
  EnergyFlowScene: (props: Record<string, unknown>) => {
    sceneProps.push(props);
    return (
      <div
        data-testid="energy-flow-scene"
        data-is-outage={String((props as { isOutage?: boolean }).isOutage ?? false)}
        data-backup-label={String((props as { outageBackupLabel?: string }).outageBackupLabel ?? '')}
      />
    );
  },
}));

// Tooltip portal in jsdom is fine, but skip animations.
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { InvestorEnergyFlowCard } from '@/components/demo/InvestorEnergyFlowCard';
import { setInvestorOutageSim } from '@/hooks/useInvestorDemoMode';

beforeEach(() => {
  cleanup();
  localStorage.clear();
  sceneProps.length = 0;
  window.history.replaceState({}, '', '/demo?demo=investor');
});

async function flushLazy() {
  // Suspense for the lazy EnergyFlowScene resolves on a microtask.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Investor Demo · Grid Outage Simulation', () => {
  it('renders normal Live state when sim is OFF', async () => {
    setInvestorOutageSim(false);
    render(<InvestorEnergyFlowCard />);
    await flushLazy();

    expect(screen.queryByTestId('outage-sim-active-chip')).not.toBeInTheDocument();
    expect(screen.getByText(/^Live$/)).toBeInTheDocument();
    // Grid tile in normal mode
    expect(screen.getByText(/0\.0 kW/)).toBeInTheDocument();

    const last = sceneProps.at(-1)!;
    expect(last.isOutage).toBe(false);
  });

  it('renders Outage UI + amber chip + offline Grid when sim is ON', async () => {
    setInvestorOutageSim(true);
    render(<InvestorEnergyFlowCard />);
    await flushLazy();

    // Amber active chip is the user-visible confirmation.
    expect(screen.getByTestId('outage-sim-active-chip')).toBeInTheDocument();
    expect(screen.getByText(/Demo · Outage Mode Active/)).toBeInTheDocument();

    // Grid readout flips to Offline.
    expect(screen.getByText('Offline')).toBeInTheDocument();

    // EnergyFlowScene receives the outage flag + a backup label.
    const last = sceneProps.at(-1)!;
    expect(last.isOutage).toBe(true);
    expect(typeof last.outageBackupLabel).toBe('string');
    expect((last.outageBackupLabel as string).length).toBeGreaterThan(0);
    // The outage fixture has solar idle (0) and battery discharging (<0).
    const data = last.data as { solarPower: number; batteryPower: number };
    expect(data.solarPower).toBe(0);
    expect(data.batteryPower).toBeLessThan(0);
  });
});
