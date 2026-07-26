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

/**
 * Pending Tesla Supercharging kWh for a specific vehicle (VIN), sourced from
 * `charging_sessions` instead of the dashboard's local activity cache. This is
 * intentionally VIN-scoped so multi-car households do not inherit another
 * vehicle's public fast-charging history.
 */
export function usePerVehicleSuperchargerKwh(deviceId?: string) {
  const viewAsUserId = useViewAsUserId();
  const { user } = useAuth();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['per-vehicle-supercharger-kwh', effectiveUserId, deviceId ?? null];

  useEffect(() => {
    if (!effectiveUserId || !deviceId) return;
    const channel = supabase
      .channel(`per-vehicle-supercharger-kwh-${effectiveUserId}-${deviceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'charging_sessions' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connected_devices' },
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
      const [{ data: sessions, error: sessionError }, { data: device, error: deviceError }] = await Promise.all([
        supabase
          .from('charging_sessions')
          .select('energy_kwh')
          .eq('user_id', effectiveUserId)
          .eq('device_id', deviceId)
          .eq('charging_type', 'supercharger'),
        supabase
          .from('connected_devices')
          .select('baseline_data')
          .eq('user_id', effectiveUserId)
          .eq('device_id', deviceId)
          .maybeSingle(),
      ]);
      if (sessionError || deviceError) return 0;
      const lifetimeKwh = (sessions ?? []).reduce((sum, s: any) => sum + Number(s.energy_kwh || 0), 0);
      const baselineKwh = Number((device?.baseline_data as any)?.supercharger_kwh || 0);
      return Math.max(0, lifetimeKwh - baselineKwh);
    },
    refetchInterval: 60_000,
  });
}
