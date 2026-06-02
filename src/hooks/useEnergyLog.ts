import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, subMonths, addMonths, eachDayOfInterval, isAfter } from 'date-fns';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

// Charging is split — supercharger (Tesla DC fast / billing) and home-charging
// (Wall Connector / Wallbox / Tesla home AC) are ALWAYS separate. Never combine.
export type ActivityType = 'solar' | 'battery' | 'supercharger' | 'home-charging' | 'ev-miles';

export interface DailyProduction {
  date: Date;
  kWh: number;
  /** Verified data providers that contributed on this day (for badges) */
  providers: string[];
}
export interface MonthData {
  days: DailyProduction[];
  totalKwh: number;
  avgKwh: number;
  bestDay: DailyProduction | null;
  daysWithData: number;
}

export interface SiteBreakdown {
  deviceId: string;
  label: string;
  provider: string;
  days: DailyProduction[];
  totalKwh: number;
}


// ── shared types & helpers ─────────────────────────────────────────────────

interface ProductionRow {
  production_wh: number;
  recorded_at: string;
  device_id: string;
  provider: string;
  data_type: string;
}

interface ChargingSessionRow {
  energy_kwh: number;
  session_date: string;
  charging_type: string;
  provider: string;
}

interface HomeSessionRow {
  total_session_kwh: number;
  start_time: string;
  device_id: string;
}

const MAX_DAILY_WH = 500_000; // 500 kWh/day per device sanity cap
const MAX_DAILY_MILES = 1_000;

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function addToDay(
  dailyByDay: Map<string, number>,
  providersByDay: Map<string, Set<string>>,
  dayKey: string,
  value: number,
  provider: string,
) {
  if (value <= 0) return;
  dailyByDay.set(dayKey, (dailyByDay.get(dayKey) || 0) + value);
  if (!providersByDay.has(dayKey)) providersByDay.set(dayKey, new Set());
  providersByDay.get(dayKey)!.add(provider);
}

/**
 * Compute per-day deltas for cumulative provider rows (Tesla, Enphase battery,
 * SolarEdge battery — all of which store cumulative `production_wh`).
 * - Groups by device+provider then sorts by day.
 * - delta = todayMax − prevDayMax, clamped at zero (mints reset the counter).
 */
function reduceCumulativeRows(
  rows: ProductionRow[],
  dailyByDay: Map<string, number>,
  providersByDay: Map<string, Set<string>>,
  unit: 'kwh' | 'miles',
) {
  const deviceDayMax = new Map<string, Map<string, { max: number; provider: string }>>();
  for (const r of rows) {
    const dayKey = format(new Date(r.recorded_at), 'yyyy-MM-dd');
    const groupKey = `${r.device_id}|${r.provider}`;
    if (!deviceDayMax.has(groupKey)) deviceDayMax.set(groupKey, new Map());
    const dayMap = deviceDayMax.get(groupKey)!;
    const existing = dayMap.get(dayKey);
    if (!existing || r.production_wh > existing.max) {
      dayMap.set(dayKey, { max: r.production_wh, provider: r.provider });
    }
  }

  for (const [, dayMap] of deviceDayMax) {
    const sortedDays = [...dayMap.entries()].sort(([a], [b]) => a.localeCompare(b));
    for (let i = 1; i < sortedDays.length; i++) {
      const [dayKey, { max, provider }] = sortedDays[i];
      const prevMax = sortedDays[i - 1][1].max;
      const delta = Math.max(0, max - prevMax);
      if (unit === 'miles') {
        if (delta > MAX_DAILY_MILES) continue;
        addToDay(dailyByDay, providersByDay, dayKey, round1(delta), provider);
      } else {
        if (delta > MAX_DAILY_WH) continue;
        addToDay(dailyByDay, providersByDay, dayKey, delta / 1000, provider);
      }
    }
  }
}

/**
 * Compute per-day values for daily-reset provider rows (Enphase solar,
 * SolarEdge solar, `tesla_historical` backfill). Day total = MAX per day.
 */
function reduceDailyResetRows(
  rows: ProductionRow[],
  dailyByDay: Map<string, number>,
  providersByDay: Map<string, Set<string>>,
) {
  const deviceDayMax = new Map<string, Map<string, { max: number; provider: string }>>();
  for (const r of rows) {
    const dayKey = format(new Date(r.recorded_at), 'yyyy-MM-dd');
    const groupKey = `${r.device_id}|${r.provider}`;
    if (!deviceDayMax.has(groupKey)) deviceDayMax.set(groupKey, new Map());
    const dayMap = deviceDayMax.get(groupKey)!;
    const existing = dayMap.get(dayKey);
    if (!existing || r.production_wh > existing.max) {
      dayMap.set(dayKey, { max: r.production_wh, provider: r.provider });
    }
  }
  for (const [, dayMap] of deviceDayMax) {
    for (const [dayKey, { max, provider }] of dayMap) {
      if (max <= 0 || max > MAX_DAILY_WH) continue;
      addToDay(dailyByDay, providersByDay, dayKey, max / 1000, provider);
    }
  }
}

function computeSolarDaily(rows: ProductionRow[]): Map<string, { kwh: number; providers: Set<string> }> {

  const providers = new Set(rows.map((r) => r.provider));
  let chosen: 'enphase' | 'solaredge' | 'tesla' | null = null;
  if (providers.has('enphase')) chosen = 'enphase';
  else if (providers.has('solaredge')) chosen = 'solaredge';
  else if (providers.has('tesla') || providers.has('tesla_historical')) chosen = 'tesla';

  const dailyByDay = new Map<string, number>();
  const providersByDay = new Map<string, Set<string>>();

  if (chosen === 'enphase') {
    reduceDailyResetRows(rows.filter((r) => r.provider === 'enphase'), dailyByDay, providersByDay);
  } else if (chosen === 'solaredge') {
    reduceDailyResetRows(rows.filter((r) => r.provider === 'solaredge'), dailyByDay, providersByDay);
  } else if (chosen === 'tesla') {
    // tesla_historical = daily backfill (max per day = daily total)
    reduceDailyResetRows(rows.filter((r) => r.provider === 'tesla_historical'), dailyByDay, providersByDay);
    // tesla = cumulative pending (day-over-day deltas), but skip if backfill covers the period
    const teslaRows = rows.filter((r) => r.provider === 'tesla');
    if (!providers.has('tesla_historical')) {
      reduceCumulativeRows(teslaRows, dailyByDay, providersByDay, 'kwh');
    }
  }

  return mergeMaps(dailyByDay, providersByDay);
}

/**
 * Per-device solar breakdown — same provider-priority rule as computeSolarDaily,
 * but returns one daily map per device_id so multi-site users (e.g. Mike's 3 PV
 * arrays) see each system separately in the Energy Log.
 */
function computeSolarDailyPerDevice(
  rows: ProductionRow[],
): Map<string, { provider: string; daily: Map<string, { kwh: number; providers: Set<string> }> }> {
  const providers = new Set(rows.map((r) => r.provider));
  let chosen: 'enphase' | 'solaredge' | 'tesla' | null = null;
  if (providers.has('enphase')) chosen = 'enphase';
  else if (providers.has('solaredge')) chosen = 'solaredge';
  else if (providers.has('tesla') || providers.has('tesla_historical')) chosen = 'tesla';
  if (!chosen) return new Map();

  // Filter rows to the chosen OEM's providers
  const chosenRows = chosen === 'tesla'
    ? rows.filter((r) => r.provider === 'tesla' || r.provider === 'tesla_historical')
    : rows.filter((r) => r.provider === chosen);

  // Group by device_id
  const byDevice = new Map<string, ProductionRow[]>();
  for (const r of chosenRows) {
    if (!byDevice.has(r.device_id)) byDevice.set(r.device_id, []);
    byDevice.get(r.device_id)!.push(r);
  }

  const out = new Map<string, { provider: string; daily: Map<string, { kwh: number; providers: Set<string> }> }>();
  for (const [deviceId, deviceRows] of byDevice) {
    const dailyByDay = new Map<string, number>();
    const providersByDay = new Map<string, Set<string>>();
    const devProviders = new Set(deviceRows.map((r) => r.provider));
    if (chosen === 'tesla') {
      reduceDailyResetRows(deviceRows.filter((r) => r.provider === 'tesla_historical'), dailyByDay, providersByDay);
      if (!devProviders.has('tesla_historical')) {
        reduceCumulativeRows(deviceRows.filter((r) => r.provider === 'tesla'), dailyByDay, providersByDay, 'kwh');
      }
    } else {
      reduceDailyResetRows(deviceRows, dailyByDay, providersByDay);
    }
    out.set(deviceId, { provider: chosen, daily: mergeMaps(dailyByDay, providersByDay) });
  }
  return out;
}

/**
 * BATTERY: Tesla > Enphase > SolarEdge priority. Mirrors the KPI's
 * "one OEM per battery, never summed" rule.
 * - Tesla writes data_type='battery_discharge' (cumulative).
 * - Enphase/SolarEdge write data_type='battery' (cumulative lifetime).
 * All three use day-over-day deltas for the daily view.
 */
function computeBatteryDaily(rows: ProductionRow[]): Map<string, { kwh: number; providers: Set<string> }> {
  const providers = new Set(rows.map((r) => r.provider));
  const hasTesla = providers.has('tesla') || providers.has('tesla_historical');
  let chosen: 'tesla' | 'enphase' | 'solaredge' | null = null;
  if (hasTesla) chosen = 'tesla';
  else if (providers.has('enphase')) chosen = 'enphase';
  else if (providers.has('solaredge')) chosen = 'solaredge';

  const dailyByDay = new Map<string, number>();
  const providersByDay = new Map<string, Set<string>>();

  if (chosen === 'tesla') {
    reduceDailyResetRows(rows.filter((r) => r.provider === 'tesla_historical'), dailyByDay, providersByDay);
    if (!providers.has('tesla_historical')) {
      reduceCumulativeRows(rows.filter((r) => r.provider === 'tesla'), dailyByDay, providersByDay, 'kwh');
    }
  } else if (chosen === 'enphase') {
    reduceCumulativeRows(rows.filter((r) => r.provider === 'enphase'), dailyByDay, providersByDay, 'kwh');
  } else if (chosen === 'solaredge') {
    reduceCumulativeRows(rows.filter((r) => r.provider === 'solaredge'), dailyByDay, providersByDay, 'kwh');
  }

  return mergeMaps(dailyByDay, providersByDay);
}

/**
 * EV MILES: Tesla odometer deltas. Matches KPI which reads
 * `connected_devices.lifetime_totals.odometer`.
 */
function computeEvMilesDaily(rows: ProductionRow[]): Map<string, { kwh: number; providers: Set<string> }> {
  const dailyByDay = new Map<string, number>();
  const providersByDay = new Map<string, Set<string>>();
  // tesla_historical: daily granularity already
  reduceDailyResetRows(rows.filter((r) => r.provider === 'tesla_historical'), dailyByDay, providersByDay);
  // tesla cumulative odometer: day-over-day deltas (only if no historical backfill)
  const providers = new Set(rows.map((r) => r.provider));
  if (!providers.has('tesla_historical')) {
    reduceCumulativeRows(rows.filter((r) => r.provider === 'tesla'), dailyByDay, providersByDay, 'miles');
  }
  // ev_miles is stored in MILES already (not Wh), so reduceCumulativeRows'/1000 path
  // would be wrong if we accidentally use kwh mode. Re-scale: divide by 1000 → undo.
  // (reduceCumulativeRows with 'miles' already returns delta directly.)
  return mergeMaps(dailyByDay, providersByDay);
}

/**
 * SUPERCHARGER: Tesla DC fast-charging only — from `charging_sessions`
 * (rows with charging_type='supercharger'). Mirrors the dashboard's
 * "Supercharger kWh" KPI exactly.
 */
function computeSuperchargerDaily(
  superchargerRows: ChargingSessionRow[],
): Map<string, { kwh: number; providers: Set<string> }> {
  const dailyByDay = new Map<string, number>();
  const providersByDay = new Map<string, Set<string>>();

  for (const s of superchargerRows) {
    if (s.charging_type !== 'supercharger') continue;
    const kwh = Number(s.energy_kwh || 0);
    if (kwh <= 0) continue;
    const dayKey = format(new Date(s.session_date), 'yyyy-MM-dd');
    addToDay(dailyByDay, providersByDay, dayKey, kwh, 'tesla_supercharger');
  }

  return mergeMaps(dailyByDay, providersByDay);
}

/**
 * HOME CHARGING: Wall Connector / Wallbox / Tesla AC at home only — from
 * `home_charging_sessions`. Mirrors the dashboard's "Home Charging kWh" KPI.
 * Never combined with supercharger anywhere in UX or data pulls.
 */
function computeHomeChargingDaily(
  homeRows: HomeSessionRow[],
): Map<string, { kwh: number; providers: Set<string> }> {
  const dailyByDay = new Map<string, number>();
  const providersByDay = new Map<string, Set<string>>();

  for (const h of homeRows) {
    const kwh = Number(h.total_session_kwh || 0);
    if (kwh <= 0) continue;
    const dayKey = format(new Date(h.start_time), 'yyyy-MM-dd');
    addToDay(dailyByDay, providersByDay, dayKey, kwh, 'home');
  }

  return mergeMaps(dailyByDay, providersByDay);
}

function mergeMaps(
  dailyByDay: Map<string, number>,
  providersByDay: Map<string, Set<string>>,
): Map<string, { kwh: number; providers: Set<string> }> {
  const out = new Map<string, { kwh: number; providers: Set<string> }>();
  for (const [k, v] of dailyByDay) {
    out.set(k, { kwh: v, providers: providersByDay.get(k) ?? new Set() });
  }
  return out;
}

function buildMonthDays(
  byDay: Map<string, { kwh: number; providers: Set<string> }>,
  monthStart: Date,
  monthEnd: Date,
): DailyProduction[] {
  const today = new Date();
  return eachDayOfInterval({ start: monthStart, end: monthEnd })
    .filter((day) => !isAfter(day, today))
    .map((day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const entry = byDay.get(dayKey);
      return {
        date: day,
        kWh: round1(entry?.kwh ?? 0),
        providers: Array.from(entry?.providers ?? []),
      };
    });
}

function computeMonthData(days: DailyProduction[]): MonthData {
  const daysWithData = days.filter((d) => d.kWh > 0).length;
  const totalKwh = round1(days.reduce((sum, d) => sum + d.kWh, 0));
  const avgKwh = daysWithData > 0 ? round1(totalKwh / daysWithData) : 0;
  const bestDay = days.reduce<DailyProduction | null>((best, d) => (!best || d.kWh > best.kWh ? d : best), null);
  return { days, totalKwh, avgKwh, bestDay, daysWithData };
}

// ── data fetchers ──────────────────────────────────────────────────────────

async function fetchSolarRows(userId: string, monthStart: Date, monthEnd: Date): Promise<ProductionRow[]> {
  const { data, error } = await supabase
    .from('energy_production')
    .select('production_wh, recorded_at, device_id, provider, data_type')
    .eq('user_id', userId)
    .eq('data_type', 'solar')
    .gte('recorded_at', monthStart.toISOString())
    .lte('recorded_at', monthEnd.toISOString())
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ProductionRow[];
}

async function fetchBatteryRows(userId: string, monthStart: Date, monthEnd: Date): Promise<ProductionRow[]> {
  // Tesla writes data_type='battery_discharge', Enphase/SolarEdge write 'battery'.
  // We pull BOTH so the priority filter has everything it needs.
  const { data, error } = await supabase
    .from('energy_production')
    .select('production_wh, recorded_at, device_id, provider, data_type')
    .eq('user_id', userId)
    .in('data_type', ['battery', 'battery_discharge'])
    .gte('recorded_at', monthStart.toISOString())
    .lte('recorded_at', monthEnd.toISOString())
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ProductionRow[];
}

async function fetchEvMilesRows(userId: string, monthStart: Date, monthEnd: Date): Promise<ProductionRow[]> {
  const { data, error } = await supabase
    .from('energy_production')
    .select('production_wh, recorded_at, device_id, provider, data_type')
    .eq('user_id', userId)
    .eq('data_type', 'ev_miles')
    .gte('recorded_at', monthStart.toISOString())
    .lte('recorded_at', monthEnd.toISOString())
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ProductionRow[];
}

async function fetchSuperchargerRows(
  userId: string,
  monthStart: Date,
  monthEnd: Date,
): Promise<ChargingSessionRow[]> {
  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(monthEnd, 'yyyy-MM-dd');
  const { data, error } = await supabase
    .from('charging_sessions')
    .select('energy_kwh, session_date, charging_type, provider')
    .eq('user_id', userId)
    .eq('charging_type', 'supercharger')
    .gte('session_date', startDate)
    .lte('session_date', endDate);
  if (error) throw error;
  return (data || []) as ChargingSessionRow[];
}

async function fetchHomeChargingRows(
  userId: string,
  monthStart: Date,
  monthEnd: Date,
): Promise<HomeSessionRow[]> {
  // ── Tesla vehicle skip guard ──────────────────────────────────────────────
  // SSOT rule (see `src/lib/dataSourcePriority.ts` + memory
  // `features/data-source-of-truth.md`): when the user owns a Tesla vehicle,
  // Tesla `charge_state` is the single source of truth for charging energy.
  // Returning `home_charging_sessions` alongside it would double-count kWh
  // (Wallbox / third-party charger reports the SAME charge the vehicle does).
  const { data: teslaVehicles } = await supabase
    .from('connected_devices')
    .select('device_id')
    .eq('user_id', userId)
    .in('device_type', ['vehicle', 'ev', 'tesla_vehicle'])
    .limit(1);
  if (teslaVehicles && teslaVehicles.length > 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('home_charging_sessions')
    .select('total_session_kwh, start_time, device_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('start_time', monthStart.toISOString())
    .lte('start_time', monthEnd.toISOString());
  if (error) throw error;
  return (data || []) as HomeSessionRow[];
}

  


// ── hook ───────────────────────────────────────────────────────────────────

export function useEnergyLog() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<ActivityType>('solar');
  const viewAsUserId = useViewAsUserId();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const compareMonthStart = startOfMonth(subMonths(currentMonth, 1));
  const compareMonthEnd = endOfMonth(subMonths(currentMonth, 1));

  const canGoForward = isAfter(startOfMonth(addMonths(currentMonth, 1)), new Date()) === false;
  const goToPreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const goToNextMonth = () => {
    if (canGoForward) setCurrentMonth((prev) => addMonths(prev, 1));
  };

  async function loadMonth(
    userId: string,
    mStart: Date,
    mEnd: Date,
    tab: ActivityType,
  ): Promise<{ days: DailyProduction[]; sites: SiteBreakdown[] }> {
    if (tab === 'solar') {
      const rows = await fetchSolarRows(userId, mStart, mEnd);
      const days = buildMonthDays(computeSolarDaily(rows), mStart, mEnd);

      // Per-site breakdown — only meaningful when the user has 2+ PV systems
      // on the chosen OEM (e.g. Mike Pessah's 3 Tesla solar arrays).
      const perDevice = computeSolarDailyPerDevice(rows);
      let sites: SiteBreakdown[] = [];
      if (perDevice.size > 1) {
        // Fetch device names so each site has a friendly label
        const { data: devices } = await supabase
          .from('connected_devices')
          .select('device_id, device_name')
          .eq('user_id', userId);
        const labelMap = new Map<string, string>();
        for (const d of (devices || []) as Array<{ device_id: string; device_name: string | null }>) {
          if (d.device_name) labelMap.set(d.device_id, d.device_name);
        }
        sites = Array.from(perDevice.entries()).map(([deviceId, { provider, daily }], i) => {
          const siteDays = buildMonthDays(daily, mStart, mEnd);
          return {
            deviceId,
            label: labelMap.get(deviceId) || `Solar Site ${i + 1}`,
            provider,
            days: siteDays,
            totalKwh: round1(siteDays.reduce((s, d) => s + d.kWh, 0)),
          };
        });
        // Largest producer first
        sites.sort((a, b) => b.totalKwh - a.totalKwh);
      }

      return { days, sites };
    }
    if (tab === 'battery') {
      const rows = await fetchBatteryRows(userId, mStart, mEnd);
      return { days: buildMonthDays(computeBatteryDaily(rows), mStart, mEnd), sites: [] };
    }
    if (tab === 'ev-miles') {
      const rows = await fetchEvMilesRows(userId, mStart, mEnd);
      return { days: buildMonthDays(computeEvMilesDaily(rows), mStart, mEnd), sites: [] };
    }
    if (tab === 'supercharger') {
      const rows = await fetchSuperchargerRows(userId, mStart, mEnd);
      return { days: buildMonthDays(computeSuperchargerDaily(rows), mStart, mEnd), sites: [] };
    }
    const rows = await fetchHomeChargingRows(userId, mStart, mEnd);
    return { days: buildMonthDays(computeHomeChargingDaily(rows), mStart, mEnd), sites: [] };
  }

  const { data: currentResult, isLoading: currentLoading } = useQuery({
    queryKey: ['energy-log-v2', viewAsUserId, format(monthStart, 'yyyy-MM'), activeTab],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return { days: [] as DailyProduction[], sites: [] as SiteBreakdown[] };
      return loadMonth(userId, monthStart, monthEnd, activeTab);
    },
  });

  const { data: compareResult, isLoading: compareLoading } = useQuery({
    queryKey: ['energy-log-v2', viewAsUserId, format(compareMonthStart, 'yyyy-MM'), activeTab],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId) return { days: [] as DailyProduction[], sites: [] as SiteBreakdown[] };
      return loadMonth(userId, compareMonthStart, compareMonthEnd, activeTab);
    },
  });

  const currentDays = currentResult?.days ?? [];
  const compareDays = compareResult?.days ?? [];
  const currentSites = currentResult?.sites ?? [];

  const currentMonthData = useMemo(() => computeMonthData(currentDays), [currentDays]);
  const compareMonthData = useMemo(() => computeMonthData(compareDays), [compareDays]);

  return {
    currentMonth,
    currentMonthData,
    compareMonthData,
    currentSites,
    isLoading: currentLoading || compareLoading,
    goToPreviousMonth,
    goToNextMonth,
    canGoForward,
    activeTab,
    setActiveTab,
  };
}

