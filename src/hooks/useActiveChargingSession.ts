import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

/**
 * Returns true if there's at least one home_charging_session with status='charging'.
 * Uses Realtime subscription for instant updates + 30s polling fallback.
 */
export function useActiveChargingSession() {
  const viewAsUserId = useViewAsUserId();
  const queryClient = useQueryClient();
  const queryKey = ['active-charging-session', viewAsUserId];

  // Realtime: invalidate instantly whenever any home_charging_session row changes
  useEffect(() => {
    const channel = supabase
      .channel('active-charging-session-realtime')
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
  }, [viewAsUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return false;

      const { data, error } = await supabase
        .from('home_charging_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'charging')
        .limit(1);

      if (error) return false;
      return (data?.length ?? 0) > 0;
    },
    refetchInterval: 30_000, // Fallback poll every 30s in case realtime misses something
  });
}
