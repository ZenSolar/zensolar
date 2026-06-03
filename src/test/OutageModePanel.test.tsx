// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OutageModePanel } from '@/components/dashboard/OutageModePanel';
import { _resetBackupSmoothing } from '@/lib/gridOutage';

describe('OutageModePanel', () => {
  const baseProps = {
    socPct: 87,
    usableCapacityKwh: 13.5,
    dischargeKw: 0.4,
    outageStartedAt: new Date('2026-06-03T19:42:00'),
  };

  it('renders banner, backup label, SOC chip, and battery metric', () => {
    _resetBackupSmoothing();
    render(<OutageModePanel {...baseProps} smoothingKey="t1" />);
    expect(screen.getByText(/Grid Outage Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated backup remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/Providing Backup Power/i)).toBeInTheDocument();
    expect(screen.getByText(/From Battery/i)).toBeInTheDocument();
    expect(screen.getByText('0.4')).toBeInTheDocument();
  });

  it('hides solar footer when no solar', () => {
    _resetBackupSmoothing();
    render(<OutageModePanel {...baseProps} smoothingKey="t2" solarProducingKw={0} />);
    expect(screen.queryByText(/Solar will recharge/i)).not.toBeInTheDocument();
  });

  it('shows solar footer when solar is producing', () => {
    _resetBackupSmoothing();
    render(<OutageModePanel {...baseProps} smoothingKey="t3" solarProducingKw={1.2} />);
    expect(screen.getByText(/Solar will recharge/i)).toBeInTheDocument();
  });
});
