import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

/**
 * Returns true if there's at least one home_charging_session with status='charging'.
 * Polls every 60s to stay reasonably fresh.
 */
export function useActiveChargingSession() {
  const viewAsUserId = useViewAsUserId();

  return useQuery({
    queryKey: ['active-charging-session', viewAsUserId],
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
    refetchInterval: 60_000,
  });
}
