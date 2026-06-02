import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

export interface ChargerDevice {
  device_id: string;
  device_name: string | null;
  provider: string;
  lifetime_kwh: number | null;
  total_sessions: number | null;
  last_synced_at: string | null;
}

/**
 * Selects `connected_devices` rows where `device_type='home_charger'`
 * (Wallbox, etc). Used by LiveEnergyMonitoringCard to detect charger-only
 * beta users so we never fall back to the legacy AnimatedEnergyFlow mock
 * when a real device is connected (just not solar/battery/Tesla EV).
 *
 * Honors the View-As context so admin "View as User" shows the impersonated
 * user's chargers, not the admin's.
 */
export function useChargerDevices() {
  const { user } = useAuth();
  const viewAsUserId = useViewAsUserId();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const [data, setData] = useState<ChargerDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveUserId) {
      setData([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from('connected_devices')
        .select('device_id, device_name, provider, lifetime_totals, updated_at')
        .eq('user_id', effectiveUserId)
        .eq('device_type', 'home_charger');
      if (cancelled) return;
      const mapped: ChargerDevice[] = (rows ?? []).map((r: any) => {
        const lt = r?.lifetime_totals ?? {};
        const lifetime = Number(
          lt?.lifetime_charging_kwh ?? lt?.charging_kwh ?? lt?.total_kwh,
        );
        const sessions = Number(lt?.total_sessions);
        return {
          device_id: String(r.device_id),
          device_name: r.device_name ?? null,
          provider: String(r.provider ?? 'wallbox'),
          lifetime_kwh: Number.isFinite(lifetime) ? lifetime : null,
          total_sessions: Number.isFinite(sessions) ? sessions : null,
          last_synced_at: r.updated_at ?? null,
        };
      });
      setData(mapped);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveUserId]);

  return { data, loading };
}
