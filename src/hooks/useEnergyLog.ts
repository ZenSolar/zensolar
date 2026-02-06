import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths, addMonths, eachDayOfInterval, isAfter } from 'date-fns';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

export type ActivityType = 'solar' | 'battery' | 'ev-charging' | 'ev-miles';

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

interface RawRecord {
  production_wh: number;
  consumption_wh: number | null;
  recorded_at: string;
  device_id: string;
  provider: string;
  data_type: string;
}

/** Map UI tab to data_type stored in energy_production */
function tabToDataType(tab: ActivityType): string {
  switch (tab) {
    case 'solar': return 'solar';
    case 'battery': return 'battery_discharge';
    case 'ev-charging': return 'ev_charging';
    case 'ev-miles': return 'ev_miles';
  }
}

/**
 * Compute daily kWh from raw energy_production records.
 *
 * Provider-aware logic:
 * - Enphase / SolarEdge: production_wh = today's running total (resets daily).
 *   Daily production = MAX(production_wh) per device per day.
 * - Tesla: production_wh = cumulative pending since last mint.
 *   Daily production = delta between consecutive day maxes per device.
 *   Negative deltas (mint resets) are clamped to 0.
 */
function computeDailyFromRecords(records: RawRecord[], monthStart: Date, monthEnd: Date, activeTab: ActivityType): DailyProduction[] {
  // Solar priority: if a dedicated solar provider exists, skip Tesla solar data
  // This only applies to the solar tab
  let filteredRecords = records;
  if (activeTab === 'solar') {
    const providers = new Set(records.map(r => r.provider));
    const hasDedicatedSolar = providers.has('enphase') || providers.has('solaredge');
    if (hasDedicatedSolar) {
      filteredRecords = records.filter(r => r.provider !== 'tesla');
    }
  }

  // EV miles stores raw odometer (miles), not Wh — no /1000 conversion
  const isEvMiles = activeTab === 'ev-miles';

  // Group by device, then by day → max production_wh
  const deviceDayMax = new Map<string, Map<string, { max: number; provider: string }>>();

  for (const r of filteredRecords) {
    const dayKey = format(new Date(r.recorded_at), 'yyyy-MM-dd');
    if (!deviceDayMax.has(r.device_id)) deviceDayMax.set(r.device_id, new Map());
    const dayMap = deviceDayMax.get(r.device_id)!;
    const existing = dayMap.get(dayKey);
    if (!existing || r.production_wh > existing.max) {
      dayMap.set(dayKey, { max: r.production_wh, provider: r.provider });
    }
  }

  // For each device, compute daily production
  const dailyByDay = new Map<string, number>();

  for (const [, dayMap] of deviceDayMax) {
    const sortedDays = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b));
    const provider = sortedDays[0]?.[1].provider;

    // Cap daily values to filter out anomalous jumps
    const MAX_DAILY_WH = 500_000;
    const MAX_DAILY_MILES = 1_000; // no one drives 1000 miles in a day

    // Tesla always uses cumulative → delta logic for all data types
    // Enphase/SolarEdge use daily running totals (max = daily value)
    if (provider === 'tesla') {
      // Tesla: cumulative → day-over-day deltas
      for (let i = 0; i < sortedDays.length; i++) {
        const [dayKey, { max }] = sortedDays[i];
        if (i === 0) continue;
        const prevMax = sortedDays[i - 1][1].max;
        const delta = Math.max(0, max - prevMax); // clamp negative (mint reset)
        if (isEvMiles) {
          if (delta > MAX_DAILY_MILES) continue;
          // Miles stored directly — no conversion
          dailyByDay.set(dayKey, (dailyByDay.get(dayKey) || 0) + Math.round(delta * 10) / 10);
        } else {
          if (delta > MAX_DAILY_WH) continue;
          dailyByDay.set(dayKey, (dailyByDay.get(dayKey) || 0) + delta / 1000);
        }
      }
    } else {
      // Enphase / SolarEdge: MAX per day IS daily production
      for (const [dayKey, { max }] of sortedDays) {
        if (isEvMiles) {
          if (max > MAX_DAILY_MILES) continue;
          dailyByDay.set(dayKey, (dailyByDay.get(dayKey) || 0) + Math.round(max * 10) / 10);
        } else {
          if (max > MAX_DAILY_WH) continue;
          dailyByDay.set(dayKey, (dailyByDay.get(dayKey) || 0) + max / 1000);
        }
      }
    }
  }

  // Build array for every day in the month up to today
  const today = new Date();
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return allDays
    .filter(day => !isAfter(day, today))
    .map(day => ({
      date: day,
      kWh: Math.round((dailyByDay.get(format(day, 'yyyy-MM-dd')) || 0) * 10) / 10,
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

async function fetchMonthRecords(userId: string, monthStart: Date, monthEnd: Date, dataType: string): Promise<RawRecord[]> {
  const { data, error } = await supabase
    .from('energy_production')
    .select('production_wh, consumption_wh, recorded_at, device_id, provider, data_type')
    .eq('user_id', userId)
    .eq('data_type', dataType)
    .gte('recorded_at', monthStart.toISOString())
    .lte('recorded_at', monthEnd.toISOString())
    .order('recorded_at', { ascending: true });

  if (error) throw error;
  return (data || []) as RawRecord[];
}

export function useEnergyLog() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<ActivityType>('solar');
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

  const dataType = tabToDataType(activeTab);

  // Current month raw records
  const { data: currentRecords = [], isLoading: currentLoading } = useQuery({
    queryKey: ['energy-log-records', viewAsUserId, format(monthStart, 'yyyy-MM'), dataType],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return [];
      return fetchMonthRecords(userId, monthStart, monthEnd, dataType);
    },
  });

  // Previous month raw records (for comparison)
  const { data: compareRecords = [], isLoading: compareLoading } = useQuery({
    queryKey: ['energy-log-records', viewAsUserId, format(compareMonthStart, 'yyyy-MM'), dataType],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return [];
      return fetchMonthRecords(userId, compareMonthStart, compareMonthEnd, dataType);
    },
  });

  const currentMonthData = useMemo(() => {
    const days = computeDailyFromRecords(currentRecords, monthStart, monthEnd, activeTab);
    return computeMonthData(days);
  }, [currentRecords, monthStart, monthEnd, activeTab]);

  const compareMonthData = useMemo(() => {
    const days = computeDailyFromRecords(compareRecords, compareMonthStart, compareMonthEnd, activeTab);
    return computeMonthData(days);
  }, [compareRecords, compareMonthStart, compareMonthEnd, activeTab]);

  return {
    currentMonth,
    currentMonthData,
    compareMonthData,
    isLoading: currentLoading || compareLoading,
    goToPreviousMonth,
    goToNextMonth,
    canGoForward,
    activeTab,
    setActiveTab,
  };
}
