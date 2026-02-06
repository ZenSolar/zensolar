import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths, addMonths, eachDayOfInterval, isSameDay, isAfter } from 'date-fns';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

export interface DailyProduction {
  date: Date;
  kWh: number;
}

export interface MonthData {
  days: DailyProduction[];
  totalKwh: number;
  avgKwh: number;
  bestDay: DailyProduction | null;
  daysWithData: number;
}

async function fetchMonthProduction(userId: string, monthStart: Date, monthEnd: Date): Promise<DailyProduction[]> {
  const { data, error } = await supabase
    .from('energy_production')
    .select('production_wh, recorded_at')
    .eq('user_id', userId)
    .gte('recorded_at', monthStart.toISOString())
    .lte('recorded_at', monthEnd.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) throw error;

  // Group by day and sum production
  const dayMap = new Map<string, number>();
  for (const row of data || []) {
    const dayKey = format(new Date(row.recorded_at), 'yyyy-MM-dd');
    dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + (row.production_wh / 1000)); // Wh to kWh
  }

  // Build array for every day in the month
  const today = new Date();
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return allDays
    .filter(day => !isAfter(day, today))
    .map(day => ({
      date: day,
      kWh: Math.round((dayMap.get(format(day, 'yyyy-MM-dd')) || 0) * 10) / 10,
    }));
}

function computeMonthData(days: DailyProduction[]): MonthData {
  const daysWithData = days.filter(d => d.kWh > 0).length;
  const totalKwh = Math.round(days.reduce((sum, d) => sum + d.kWh, 0) * 10) / 10;
  const avgKwh = daysWithData > 0 ? Math.round((totalKwh / daysWithData) * 10) / 10 : 0;
  const bestDay = days.reduce<DailyProduction | null>((best, d) => {
    if (!best || d.kWh > best.kWh) return d;
    return best;
  }, null);

  return { days, totalKwh, avgKwh, bestDay, daysWithData };
}

export function useEnergyLog() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const viewAsUserId = useViewAsUserId();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const compareMonthStart = startOfMonth(subMonths(currentMonth, 1));
  const compareMonthEnd = endOfMonth(subMonths(currentMonth, 1));

  const canGoForward = isAfter(startOfMonth(addMonths(currentMonth, 1)), new Date()) === false;

  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToNextMonth = () => {
    if (canGoForward) setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Current month data
  const { data: currentDays = [], isLoading: currentLoading } = useQuery({
    queryKey: ['energy-log', viewAsUserId, format(monthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return [];
      return fetchMonthProduction(userId, monthStart, monthEnd);
    },
  });

  // Previous month data (for comparison)
  const { data: compareDays = [], isLoading: compareLoading } = useQuery({
    queryKey: ['energy-log', viewAsUserId, format(compareMonthStart, 'yyyy-MM')],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return [];
      return fetchMonthProduction(userId, compareMonthStart, compareMonthEnd);
    },
  });

  const currentMonthData = useMemo(() => computeMonthData(currentDays), [currentDays]);
  const compareMonthData = useMemo(() => computeMonthData(compareDays), [compareDays]);

  return {
    currentMonth,
    currentMonthData,
    compareMonthData,
    isLoading: currentLoading || compareLoading,
    goToPreviousMonth,
    goToNextMonth,
    canGoForward,
  };
}
