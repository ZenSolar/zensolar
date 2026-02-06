import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

export interface ChargingSession {
  id: string;
  provider: string;
  device_id: string;
  session_date: string;
  energy_kwh: number;
  location: string | null;
  fee_amount: number | null;
  fee_currency: string | null;
  session_metadata: Record<string, unknown> | null;
}

export function useChargingSessions(currentMonth: Date) {
  const viewAsUserId = useViewAsUserId();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  return useQuery({
    queryKey: ['charging-sessions', viewAsUserId, format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('charging_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('session_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('session_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('session_date', { ascending: false });

      if (error) throw error;
      return (data || []) as ChargingSession[];
    },
  });
}
