import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import { useAuth } from '@/hooks/useAuth';

/**
 * Sum of lifetime Home & AC charging kWh for a specific vehicle (device_id / VIN),
 * pulled directly from `home_charging_sessions` — the authoritative live tracker.
 *
 * Why not lifetime_totals.charging_kwh? That value only refreshes when
 * tesla-data closes a session; it lags any in-progress charge and can be
 * zero for a new vehicle until its first backfill lands. Reading the sessions
 * table gives us the true running total (completed + charging), so a car that
 * is actively plugged in shows a value that grows in real time.
 */
export function usePerVehicleHomeChargingKwh(deviceId?: string) {
  const viewAsUserId = useViewAsUserId();
  const { user } = useAuth();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['per-vehicle-home-charging-kwh', effectiveUserId, deviceId ?? null];

  useEffect(() => {
    if (!effectiveUserId || !deviceId) return;
    const channel = supabase
      .channel(`per-vehicle-home-kwh-${effectiveUserId}-${deviceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'home_charging_sessions' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [effectiveUserId, deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  return useQuery({
    queryKey,
    enabled: !!effectiveUserId && !!deviceId,
    queryFn: async () => {
      if (!effectiveUserId || !deviceId) return 0;
      const { data, error } = await supabase
        .from('home_charging_sessions')
        .select('total_session_kwh')
        .eq('user_id', effectiveUserId)
        .eq('device_id', deviceId);
      if (error) return 0;
      return (data ?? []).reduce((sum, s: any) => sum + Number(s.total_session_kwh || 0), 0);
    },
    refetchInterval: 20_000,
  });
}
