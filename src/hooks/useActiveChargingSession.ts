import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns true if there's at least one home_charging_session with status='charging'
 * for the effective user (signed-in or impersonated via View-As).
 *
 * Hooks are always called in the same order — no Web3-readiness early return —
 * because QueryClientProvider is mounted at the app root. The previous
 * `useWeb3Ready` guard caused "Rendered fewer hooks than expected" crashes
 * when Web3 finished loading mid-mount.
 */
export function useActiveChargingSession(deviceId?: string) {
  const viewAsUserId = useViewAsUserId();
  const { user } = useAuth();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['active-charging-session', effectiveUserId, deviceId ?? null];

  // Realtime: invalidate instantly whenever any home_charging_session row changes
  useEffect(() => {
    if (!effectiveUserId) return;
    const channel = supabase
      .channel(`active-charging-session-realtime-${effectiveUserId}-${deviceId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'home_charging_sessions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveUserId, deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  return useQuery({
    queryKey,
    enabled: !!effectiveUserId,
    queryFn: async () => {
      if (!effectiveUserId) return false;

      let q = supabase
        .from('home_charging_sessions')
        .select('id')
        .eq('user_id', effectiveUserId)
        .eq('status', 'charging')
        .limit(1);
      if (deviceId) q = q.eq('device_id', deviceId);

      const { data, error } = await q;

      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    refetchInterval: 30_000,
  });
}

export interface ActiveChargingDetail {
  active: boolean;
  /** Power the WALL CONNECTOR reports for the open session, in kW. This is a
   *  measured value from site hardware — it stays valid while the vehicle
   *  itself is asleep and its own API payload reports 0 kW. */
  chargerKw: number | null;
  deviceId: string | null;
  presenceEvidence: string | null;
  sessionId: string | null;
}

/**
 * Same query as useActiveChargingSession, but returns the session's measured
 * power instead of just a boolean.
 *
 * Why this exists: the scene's EV conductor was gated on `tesla.kW`, which is
 * read only from the VEHICLE's telemetry payload. A parked, charging Tesla
 * stops answering and that payload goes to 0, so an actively charging car
 * rendered with no conductor at all while the status pill still said
 * "Charging" — evidence present in the database, absent on screen. The wall
 * connector is the better witness here: it is mains-powered, always awake,
 * and it is what opened the session in the first place.
 */
export function useActiveChargingSessionDetail(deviceId?: string) {
  const viewAsUserId = useViewAsUserId();
  const { user } = useAuth();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['active-charging-session-detail', effectiveUserId, deviceId ?? null];

  useEffect(() => {
    if (!effectiveUserId) return;
    const channel = supabase
      .channel(`active-charging-detail-${effectiveUserId}-${deviceId ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'home_charging_sessions' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveUserId, deviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const empty: ActiveChargingDetail = {
    active: false,
    chargerKw: null,
    deviceId: null,
    presenceEvidence: null,
    sessionId: null,
  };

  return useQuery({
    queryKey,
    enabled: !!effectiveUserId,
    queryFn: async (): Promise<ActiveChargingDetail> => {
      if (!effectiveUserId) return empty;

      let q = supabase
        .from('home_charging_sessions')
        .select('id, device_id, charger_power_kw, session_metadata')
        .eq('user_id', effectiveUserId)
        .eq('status', 'charging')
        .order('start_time', { ascending: false })
        .limit(1);
      if (deviceId) q = q.eq('device_id', deviceId);

      const { data, error } = await q;
      if (error || !data?.length) return empty;

      const row = data[0] as {
        id: string;
        device_id: string | null;
        charger_power_kw: number | null;
        session_metadata: Record<string, unknown> | null;
      };
      const kw = typeof row.charger_power_kw === 'number' ? row.charger_power_kw : null;
      const pe = row.session_metadata?.['presence_evidence'];

      return {
        active: true,
        chargerKw: kw !== null && kw > 0 ? kw : null,
        deviceId: row.device_id ?? null,
        presenceEvidence: typeof pe === 'string' ? pe : null,
        sessionId: row.id,
      };
    },
    refetchInterval: 30_000,
  });
}

