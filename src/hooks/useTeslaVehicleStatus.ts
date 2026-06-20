import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

/**
 * Tesla vehicle status — drives the always-on TeslaStatusCard (Phase 2).
 *
 * Reads `connected_devices.last_known_state` (jsonb) for the user's first
 * Tesla vehicle. Returns null when no Tesla is connected — the card hides.
 */

export type ChargingState =
  | 'Charging'
  | 'Disconnected'
  | 'Stopped'
  | 'Complete'
  | 'NoPower'
  | 'Unknown';

export interface TeslaVehicleStatus {
  vehicle_id: string;
  display_name: string | null;
  /** 0-100 */
  battery_level: number | null;
  /** Estimated range, miles. UI converts for user preference. */
  range_mi: number | null;
  charging_state: ChargingState;
  /** 'Tesla' if charging at a Supercharger, otherwise null. */
  fast_charger_brand: string | null;
  fast_charger_present: boolean;
  last_seen_at: string | null;
}

function pickNum(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function useTeslaVehicleStatus() {
  const { user } = useAuth();
  const viewAsUserId = useViewAsUserId();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;

  return useQuery<TeslaVehicleStatus | null>({
    queryKey: ['tesla-vehicle-status', effectiveUserId],
    enabled: !!effectiveUserId,
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!effectiveUserId) return null;
      const { data } = await supabase
        .from('connected_devices')
        .select('device_id, device_name, last_known_state, updated_at, device_type')
        .eq('user_id', effectiveUserId)
        .eq('provider', 'tesla')
        .in('device_type', ['vehicle', 'ev', 'tesla_vehicle'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return null;
      const state = ((data as any).last_known_state ?? {}) as Record<string, any>;
      const charge = (state.charge_state ?? state.charging ?? state) as Record<string, any>;

      return {
        vehicle_id: (data as any).device_id as string,
        display_name: ((data as any).device_name as string | null) ?? null,
        battery_level: pickNum(charge.battery_level ?? state.battery_level),
        range_mi: pickNum(charge.battery_range ?? charge.ideal_battery_range ?? state.range_mi),
        charging_state: (charge.charging_state ?? 'Unknown') as ChargingState,
        fast_charger_brand: (charge.fast_charger_brand ?? null) as string | null,
        fast_charger_present: !!charge.fast_charger_present,
        last_seen_at: ((data as any).updated_at as string | null) ?? null,
      };
    },
  });
}
