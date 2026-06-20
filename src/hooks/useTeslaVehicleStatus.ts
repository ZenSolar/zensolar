import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

/**
 * Tesla vehicle status — drives the always-on TeslaStatusCard (Phase 2).
 *
 * Reads from `device_telemetry_cache` first (cheap, no fleet-API call).
 * Returns null when no Tesla is connected to the effective user — the card
 * is hidden in that case.
 */

export type ChargingState = 'Charging' | 'Disconnected' | 'Stopped' | 'Complete' | 'NoPower' | 'Unknown';

export interface TeslaVehicleStatus {
  vehicle_id: string;
  display_name: string | null;
  /** 0-100 */
  battery_level: number | null;
  /** Estimated range in user's preferred units (we store miles; UI converts) */
  range_mi: number | null;
  charging_state: ChargingState;
  /** 'Tesla' if charging at a Supercharger, otherwise null. */
  fast_charger_brand: string | null;
  fast_charger_present: boolean;
  last_seen_at: string | null;
}

interface CachedTelemetry {
  device_id: string;
  device_name: string | null;
  telemetry: Record<string, unknown> | null;
  last_synced_at: string | null;
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
        .from('device_telemetry_cache')
        .select('device_id, device_name, telemetry, last_synced_at')
        .eq('user_id', effectiveUserId)
        .eq('provider', 'tesla')
        .order('last_synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return null;
      const row = data as CachedTelemetry;
      const t = (row.telemetry ?? {}) as Record<string, any>;
      const charge = (t.charge_state ?? t.charging ?? {}) as Record<string, any>;

      return {
        vehicle_id: row.device_id,
        display_name: row.device_name,
        battery_level: pickNum(charge.battery_level ?? t.battery_level),
        range_mi: pickNum(charge.battery_range ?? charge.ideal_battery_range ?? t.range_mi),
        charging_state: (charge.charging_state ?? 'Unknown') as ChargingState,
        fast_charger_brand: (charge.fast_charger_brand ?? null) as string | null,
        fast_charger_present: !!charge.fast_charger_present,
        last_seen_at: row.last_synced_at,
      };
    },
  });
}
