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
    queryFn: async (): Promise<string[]> => {
      if (!effectiveUserId) return [];
      const { data, error } = await supabase
        .from('home_charging_sessions')
        .select('device_id')
        .eq('user_id', effectiveUserId)
        .eq('status', 'charging');
      if (error) return [];
      return Array.from(new Set((data ?? []).map((r: { device_id: string }) => r.device_id)));
    },
    refetchInterval: 30_000,
  });

  return {
    vins: new Set(query.data ?? []),
    loading: query.isLoading,
  };
}
