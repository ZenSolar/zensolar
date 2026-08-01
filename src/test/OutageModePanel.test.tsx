// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render as rtlRender, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/** OutageModePanel reaches react-router hooks; wrap every render. */
const render = (ui: import('react').ReactElement) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>);
import { OutageModePanel } from '@/components/dashboard/OutageModePanel';
import { _resetBackupSmoothing } from '@/lib/gridOutage';

describe('OutageModePanel', () => {
  // No `globals: true`, so RTL auto-cleanup is not installed. Without this,
  // each render stacks in the same document and queryBy* sees the prior tree.
  afterEach(cleanup);

  const baseProps = {
    socPct: 87,
    usableCapacityKwh: 13.5,
    dischargeKw: 0.4,
    outageStartedAt: new Date('2026-06-03T19:42:00'),
  };

  it('renders banner, backup label, SOC chip, and battery metric', () => {
    _resetBackupSmoothing();
    render(<OutageModePanel {...baseProps} smoothingKey="t1" />);
    expect(screen.getByText(/Grid Outage Active/i)).toBeTruthy();
    expect(screen.getByText(/Estimated backup remaining/i)).toBeTruthy();
    expect(screen.getByText(/Providing Backup Power/i)).toBeTruthy();
    expect(screen.getByText(/From Battery/i)).toBeTruthy();
    expect(screen.getByText('0.4')).toBeTruthy();
  });

  it('shows the future-tense solar footer when no solar', () => {
    _resetBackupSmoothing();
    render(<OutageModePanel {...baseProps} smoothingKey="t2" solarProducingKw={0} />);
    // No sun: the footer states the future-tense recharge line, not the
    // present-tense "is recharging" one.
    expect(screen.getByText(/Solar will recharge/i)).toBeTruthy();
    expect(screen.queryByText(/Solar is recharging/i)).toBeNull();
  });

  it('shows the present-tense solar footer when solar is producing', () => {
    _resetBackupSmoothing();
    render(<OutageModePanel {...baseProps} smoothingKey="t3" solarProducingKw={1.2} />);
    expect(screen.getByText(/Solar is recharging/i)).toBeTruthy();
  });
});
