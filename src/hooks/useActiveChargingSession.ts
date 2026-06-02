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
export function useActiveChargingSession() {
  const viewAsUserId = useViewAsUserId();
  const { user } = useAuth();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['active-charging-session', effectiveUserId];

  // Realtime: invalidate instantly whenever any home_charging_session row changes
  useEffect(() => {
    if (!effectiveUserId) return;
    const channel = supabase
      .channel(`active-charging-session-realtime-${effectiveUserId}`)
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
  }, [effectiveUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  return useQuery({
    queryKey,
    enabled: !!effectiveUserId,
    queryFn: async () => {
      if (!effectiveUserId) return false;

      const { data, error } = await supabase
        .from('home_charging_sessions')
        .select('id')
        .eq('user_id', effectiveUserId)
        .eq('status', 'charging')
        .limit(1);

      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    refetchInterval: 30_000,
  });
}
