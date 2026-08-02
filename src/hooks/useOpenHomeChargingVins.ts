import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import { useAuth } from '@/hooks/useAuth';

/**
 * The set of vehicle ids (VINs) that currently have an OPEN
 * `home_charging_sessions` row (status = 'charging') for this account.
 *
 * This is the ONLY admissible proof that a vehicle is drawing power AT THIS
 * SITE. The previous heuristic — "AC charging without positive DC-fast
 * evidence must be home" — mislabels a car plugged into someone else's
 * Level 2 charger as home load, which makes the site residual subtract energy
 * the house never consumed and understates home.
 *
 * Display only. Nothing derived from this reaches the issuance path.
 */
export interface OpenHomeSession {
  deviceId: string;
  /** e.g. 'wall_connector' | 'geofence' | null */
  presenceEvidence: string | null;
}

export function useOpenHomeChargingVins() {
  const viewAsUserId = useViewAsUserId();
  const { user } = useAuth();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['open-home-charging-vins', effectiveUserId];

  useEffect(() => {
    if (!effectiveUserId) return;
    const channel = supabase
      .channel(`open-home-charging-vins-${effectiveUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'home_charging_sessions' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [effectiveUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = useQuery({
    queryKey,
    enabled: !!effectiveUserId,
    queryFn: async (): Promise<OpenHomeSession[]> => {
      if (!effectiveUserId) return [];
      const { data, error } = await supabase
        .from('home_charging_sessions')
        .select('device_id, session_metadata')
        .eq('user_id', effectiveUserId)
        .eq('status', 'charging');
      if (error) return [];
      return (data ?? []).map((r) => {
        const meta = (r.session_metadata ?? {}) as { presence_evidence?: string | null };
        return {
          deviceId: r.device_id,
          presenceEvidence: typeof meta.presence_evidence === 'string' ? meta.presence_evidence : null,
        };
      });
    },
    refetchInterval: 30_000,
  });

  const sessions = query.data ?? [];

  return {
    /** Every vehicle with an open home session, whatever the evidence type. */
    vins: new Set(sessions.map((s) => s.deviceId)),
    /**
     * §5 — vehicles whose co-location at this address is PROVEN by a wall
     * connector reporting their VIN under load. This, and only this, gates
     * whether a car is drawn in the scene. A vehicle's own telemetry saying
     * "charging" is not co-location proof and must not render a car.
     */
    provenAtHomeVins: new Set(
      sessions.filter((s) => s.presenceEvidence === 'wall_connector').map((s) => s.deviceId),
    ),
    sessions,
    loading: query.isLoading,
  };
}
