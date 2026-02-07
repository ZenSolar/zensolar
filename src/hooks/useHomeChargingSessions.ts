import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

export interface HomeChargingSession {
  id: string;
  device_id: string;
  start_time: string;
  end_time: string | null;
  start_kwh_added: number;
  end_kwh_added: number;
  total_session_kwh: number;
  status: string;
  location: string | null;
  charger_power_kw: number;
  session_metadata: Record<string, unknown> | null;
}

export function useHomeChargingSessions(currentMonth: Date) {
  const viewAsUserId = useViewAsUserId();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  return useQuery({
    queryKey: ['home-charging-sessions', viewAsUserId, monthStart.toISOString().slice(0, 7)],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from('home_charging_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString())
        .order('start_time', { ascending: false });

      if (error) throw error;
      return (data || []) as HomeChargingSession[];
    },
  });
}

export function useHomeChargingLifetime() {
  const viewAsUserId = useViewAsUserId();

  return useQuery({
    queryKey: ['home-charging-lifetime', viewAsUserId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return { totalKwh: 0, sessionCount: 0 };

      const { data, error } = await supabase
        .from('home_charging_sessions')
        .select('total_session_kwh')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (error) throw error;
      const totalKwh = (data || []).reduce((sum, s) => sum + Number(s.total_session_kwh || 0), 0);
      return { totalKwh, sessionCount: (data || []).length };
    },
  });
}
