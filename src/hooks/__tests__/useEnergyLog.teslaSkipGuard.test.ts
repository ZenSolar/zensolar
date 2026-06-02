import { describe, it, expect, vi, beforeEach } from 'vitest';

// Records every `.from(table)` call so tests can assert which tables were hit.
const fromCalls: string[] = [];

vi.mock('@/integrations/supabase/client', () => {
  function builder(table: string) {
    const state: { rows: any[] } = { rows: [] };

    // home_charging_sessions returns one row so we can prove it was skipped
    // when a Tesla vehicle is present.
    if (table === 'home_charging_sessions') {
      state.rows = [{ total_session_kwh: 5, start_time: new Date().toISOString(), device_id: 'wb-1' }];
    }

    const chain: any = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      gte: () => chain,
      lte: () => chain,
      limit: () => Promise.resolve({ data: (globalThis as any).__teslaVehicles ?? [], error: null }),
      then: (resolve: (v: any) => void) => resolve({ data: state.rows, error: null }),
    };
    return chain;
  }

  return {
    supabase: {
      from: (table: string) => {
        fromCalls.push(table);
        return builder(table);
      },
    },
  };
});

import { fetchHomeChargingRows } from '@/hooks/useEnergyLog';

describe('SSOT: Tesla vehicle skip guard in useEnergyLog', () => {
  beforeEach(() => {
    fromCalls.length = 0;
    (globalThis as any).__teslaVehicles = [];
  });

  it('skips home_charging_sessions entirely when a Tesla vehicle is connected', async () => {
    (globalThis as any).__teslaVehicles = [{ device_id: 'tesla-veh-1' }];

    const rows = await fetchHomeChargingRows(
      'user-1',
      new Date('2026-06-01'),
      new Date('2026-06-30'),
    );

    expect(rows).toEqual([]);
    expect(fromCalls).toContain('connected_devices');
    expect(fromCalls).not.toContain('home_charging_sessions');
  });

  it('queries home_charging_sessions when no Tesla vehicle is connected', async () => {
    (globalThis as any).__teslaVehicles = [];

    const rows = await fetchHomeChargingRows(
      'user-2',
      new Date('2026-06-01'),
      new Date('2026-06-30'),
    );

    expect(fromCalls).toContain('connected_devices');
    expect(fromCalls).toContain('home_charging_sessions');
    expect(rows.length).toBeGreaterThan(0);
  });
});
