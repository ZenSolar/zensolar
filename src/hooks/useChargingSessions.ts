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
  charging_type: string;
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

      // Fetch both charging_sessions and home_charging_sessions in parallel
      const [billingRes, homeRes] = await Promise.all([
        supabase
          .from('charging_sessions')
          .select('*')
          .eq('user_id', userId)
          .gte('session_date', format(monthStart, 'yyyy-MM-dd'))
          .lte('session_date', format(monthEnd, 'yyyy-MM-dd'))
          .order('session_date', { ascending: false }),
        supabase
          .from('home_charging_sessions')
          .select('*')
          .eq('user_id', userId)
          .gte('start_time', monthStart.toISOString())
          .lte('start_time', monthEnd.toISOString())
          .order('start_time', { ascending: false }),
      ]);

      if (billingRes.error) throw billingRes.error;
      if (homeRes.error) throw homeRes.error;

      // Filter out charging_sessions rows that originated from charge_monitor
      // to avoid duplicates — home_charging_sessions is the source of truth for those
      const billingSessions = ((billingRes.data || []) as ChargingSession[]).filter((s) => {
        const meta = s.session_metadata as Record<string, unknown> | null;
        return meta?.source !== 'charge_monitor';
      });

      // Convert home_charging_sessions → ChargingSession format
      const homeSessions: ChargingSession[] = (homeRes.data || []).map((h: any) => ({
        id: h.id,
        provider: (h.session_metadata as any)?.source === 'wallbox_backfill' ? 'wallbox' : 'tesla',
        device_id: h.device_id,
        session_date: format(new Date(h.start_time), 'yyyy-MM-dd'),
        energy_kwh: Number(h.total_session_kwh || 0),
        location: h.location || 'Home',
        fee_amount: null,
        fee_currency: null,
        charging_type: 'home',
        session_metadata: {
          ...(h.session_metadata || {}),
          source: (h.session_metadata as any)?.source || 'charge_monitor',
          status: h.status,
          charger_power_kw: h.charger_power_kw,
          start_time: h.start_time,
          end_time: h.end_time,
        },
      }));

      // Merge and sort by date descending
      const all = [...billingSessions, ...homeSessions];
      all.sort((a, b) => b.session_date.localeCompare(a.session_date));
      return all;
    },
  });
}
