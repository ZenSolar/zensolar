/**
 * useKpiContributions — fetches the individual activity rows that make up
 * the *pending* total shown on a Clean Energy Center KPI card.
 *
 * Powers the KPI Activity Log bottom sheet so users see the receipts
 * (Proof-of-Delta™) before they tap MINT (Proof-of-Mint™).
 *
 * Data sources by category:
 *   solar         → energy_production (data_type='solar')
 *   battery       → energy_production (data_type='battery_discharge')
 *   ev_miles      → energy_production (data_type='ev_miles')
 *   supercharger  → charging_sessions (charging_type !== 'home', source !== 'charge_monitor')
 *   home_charger  → home_charging_sessions (+ charging_sessions where type='home')
 *
 * Returns the most recent ~50 contributions for the connected user,
 * scoped to the optional deviceId when provided.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import type { MintCategory } from '@/components/dashboard/ActivityMetrics';

export interface KpiContributionRow {
  id: string;
  recordedAt: string;        // ISO timestamp
  amount: number;            // kWh for energy categories, miles for ev_miles
  unit: 'kWh' | 'mi';
  provider: string;          // 'tesla' | 'enphase' | 'solaredge' | 'wallbox' | …
  deviceId: string | null;
  deviceName?: string | null;
  location?: string | null;  // charging only
  verified: boolean;         // true when row came from an authenticated OEM source
}

const ROW_LIMIT = 50;

async function fetchEnergyProductionRows(
  userId: string,
  dataType: 'solar' | 'battery_discharge' | 'ev_miles',
  deviceId?: string,
): Promise<KpiContributionRow[]> {
  let query = supabase
    .from('energy_production')
    .select('id, production_wh, recorded_at, device_id, provider, data_type')
    .eq('user_id', userId)
    .eq('data_type', dataType)
    .order('recorded_at', { ascending: false })
    .limit(ROW_LIMIT);

  if (deviceId) query = query.eq('device_id', deviceId);

  const { data, error } = await query;
  if (error) throw error;

  const isMiles = dataType === 'ev_miles';
  return (data || []).map((r: any) => ({
    id: String(r.id),
    recordedAt: r.recorded_at,
    // EV miles stored directly; energy stored in Wh
    amount: isMiles
      ? Math.round(Number(r.production_wh) * 10) / 10
      : Math.round((Number(r.production_wh) / 1000) * 10) / 10,
    unit: isMiles ? 'mi' : 'kWh',
    provider: r.provider,
    deviceId: r.device_id,
    verified: ['tesla', 'enphase', 'solaredge', 'tesla_historical'].includes(r.provider),
  }));
}

async function fetchSuperchargerRows(userId: string, deviceId?: string): Promise<KpiContributionRow[]> {
  let query = supabase
    .from('charging_sessions')
    .select('id, session_date, energy_kwh, location, provider, device_id, charging_type, session_metadata')
    .eq('user_id', userId)
    .neq('charging_type', 'home')
    .order('session_date', { ascending: false })
    .limit(ROW_LIMIT);
  if (deviceId) query = query.eq('device_id', deviceId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((s: any) => ({
    id: String(s.id),
    recordedAt: (s.session_metadata?.start_time as string) || s.session_date,
    amount: Math.round(Number(s.energy_kwh) * 10) / 10,
    unit: 'kWh' as const,
    provider: s.provider || 'tesla',
    deviceId: s.device_id,
    location: s.location,
    verified: true,
  }));
}

async function fetchHomeChargerRows(userId: string, deviceId?: string): Promise<KpiContributionRow[]> {
  // home_charging_sessions is the source of truth for monitored home sessions
  let homeQ = supabase
    .from('home_charging_sessions')
    .select('id, start_time, end_time, total_session_kwh, location, device_id, session_metadata, status')
    .eq('user_id', userId)
    .order('start_time', { ascending: false })
    .limit(ROW_LIMIT);
  if (deviceId) homeQ = homeQ.eq('device_id', deviceId);

  // charging_sessions also stores billing-side home rows when source != charge_monitor
  let billQ = supabase
    .from('charging_sessions')
    .select('id, session_date, energy_kwh, location, provider, device_id, charging_type, session_metadata')
    .eq('user_id', userId)
    .eq('charging_type', 'home')
    .order('session_date', { ascending: false })
    .limit(ROW_LIMIT);
  if (deviceId) billQ = billQ.eq('device_id', deviceId);

  const [homeRes, billRes] = await Promise.all([homeQ, billQ]);
  if (homeRes.error) throw homeRes.error;
  if (billRes.error) throw billRes.error;

  const homeRows: KpiContributionRow[] = (homeRes.data || []).map((h: any) => ({
    id: `home-${h.id}`,
    recordedAt: h.start_time,
    amount: Math.round(Number(h.total_session_kwh || 0) * 10) / 10,
    unit: 'kWh' as const,
    provider: (h.session_metadata?.source === 'wallbox_backfill' ? 'wallbox' : 'tesla') as string,
    deviceId: h.device_id,
    location: h.location || 'Home',
    verified: true,
  }));

  const billRows: KpiContributionRow[] = ((billRes.data || []) as any[])
    .filter((s) => s.session_metadata?.source !== 'charge_monitor')
    .map((s: any) => ({
      id: `bill-${s.id}`,
      recordedAt: (s.session_metadata?.start_time as string) || s.session_date,
      amount: Math.round(Number(s.energy_kwh) * 10) / 10,
      unit: 'kWh' as const,
      provider: s.provider || 'tesla',
      deviceId: s.device_id,
      location: s.location || 'Home',
      verified: false,
    }));

  const all = [...homeRows, ...billRows];
  all.sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
  return all.slice(0, ROW_LIMIT);
}

export function useKpiContributions(
  category: MintCategory | null,
  deviceId?: string,
  enabled: boolean = true,
) {
  const viewAsUserId = useViewAsUserId();

  return useQuery({
    queryKey: ['kpi-contributions', viewAsUserId, category, deviceId ?? null],
    enabled: enabled && !!category,
    queryFn: async (): Promise<KpiContributionRow[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId || !category) return [];

      switch (category) {
        case 'solar':
          return fetchEnergyProductionRows(userId, 'solar', deviceId);
        case 'battery':
          return fetchEnergyProductionRows(userId, 'battery_discharge', deviceId);
        case 'ev_miles':
          return fetchEnergyProductionRows(userId, 'ev_miles', deviceId);
        case 'supercharger':
          return fetchSuperchargerRows(userId, deviceId);
        case 'home_charger':
          return fetchHomeChargerRows(userId, deviceId);
        case 'charging':
          // Combined fallback (rare) — merge super + home
          const [sup, home] = await Promise.all([
            fetchSuperchargerRows(userId, deviceId),
            fetchHomeChargerRows(userId, deviceId),
          ]);
          return [...sup, ...home]
            .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
            .slice(0, ROW_LIMIT);
        case 'all':
        default:
          return [];
      }
    },
  });
}
