/**
 * useKpiContributions — fetches the individual activity rows that make up
 * the *pending* total shown on a Clean Energy Center KPI card.
 *
 * Powers the KPI Activity Log bottom sheet so users see the receipts
 * (Proof-of-Delta™) before they tap MINT (Proof-of-Mint™).
 *
 * IMPORTANT — "since last mint" semantics:
 *   The KPI tile shows *pending* kWh (everything not yet minted). The
 *   receipt list MUST agree with that headline, so every query in this
 *   hook is lower-bounded by the user's most recent confirmed
 *   mint_transactions.created_at. If the user has never minted, we show
 *   everything (genesis case).
 *
 * Data sources by category:
 *   solar         → energy_production (data_type='solar')
 *   battery       → energy_production (data_type='battery_discharge')
 *   ev_miles      → energy_production (data_type='ev_miles')
 *   supercharger  → charging_sessions (charging_type !== 'home')
 *   home_charger  → home_charging_sessions (+ charging_sessions where type='home')
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import type { MintCategory } from '@/components/dashboard/ActivityMetrics';

export interface KpiContributionRow {
  id: string;
  recordedAt: string;            // ISO timestamp (best available)
  hasRealTime: boolean;          // false when only a date was available (legacy backfill)
  durationMinutes?: number | null; // session length when start+end are known
  amount: number;                // kWh for energy categories, miles for ev_miles
  unit: 'kWh' | 'mi';
  provider: string;
  deviceId: string | null;
  deviceName?: string | null;
  location?: string | null;
  verified: boolean;
}

const ROW_LIMIT = 50;

/**
 * Resolve the "since last mint" lower-bound for a given category.
 *
 * The KPI tile computes pending = lifetime_totals − baseline_data per
 * device, and baselines are reset to lifetime on every successful mint.
 * The on-device anchor for that reset is `connected_devices.last_minted_at`,
 * NOT `mint_transactions.created_at` — they can differ (per-category mints,
 * partial mints, etc.). To keep the receipt list in lockstep with the
 * headline, we use the device-level anchor and fall back to the mint table
 * only when no device has minted yet.
 */
async function getSinceIsoForCategory(
  userId: string,
  category: MintCategory,
  deviceId?: string,
): Promise<string | null> {
  const typesByCategory: Record<string, string[] | null> = {
    solar: ['solar', 'tesla_solar', 'enphase_system', 'solaredge_system'],
    battery: ['battery', 'tesla_battery', 'powerwall'],
    ev_miles: ['vehicle', 'ev', 'tesla_vehicle'],
    supercharger: ['vehicle', 'ev', 'tesla_vehicle'],
    home_charger: ['charger', 'wallbox', 'home_charger', 'vehicle', 'ev', 'tesla_vehicle'],
    charging: null, // any device
    all: null,
  };
  const types = typesByCategory[category];

  let q = supabase
    .from('connected_devices')
    .select('device_id, device_type, last_minted_at')
    .eq('user_id', userId);
  if (deviceId) q = q.eq('device_id', deviceId);

  const { data: devices } = await q;
  const matched = (devices || []).filter((d: any) =>
    !types ? true : types.includes(String(d.device_type).toLowerCase()),
  );
  const stamps = matched
    .map((d: any) => d.last_minted_at)
    .filter(Boolean) as string[];

  if (stamps.length > 0) {
    // Earliest anchor across matching devices — anything newer is pending.
    return stamps.sort()[0];
  }

  // Fallback: most recent confirmed mint across the user
  const { data } = await supabase
    .from('mint_transactions')
    .select('created_at')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(1);
  return data?.[0]?.created_at ?? null;
}


function pickIso(...candidates: Array<string | null | undefined>): { iso: string; hasRealTime: boolean } | null {
  for (const c of candidates) {
    if (!c) continue;
    // Date-only strings like "2026-05-21" should be treated as no real time.
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(c);
    return { iso: c, hasRealTime: !isDateOnly };
  }
  return null;
}

function durationMin(startIso?: string | null, endIso?: string | null): number | null {
  if (!startIso || !endIso) return null;
  const a = Date.parse(startIso);
  const b = Date.parse(endIso);
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return null;
  return Math.max(1, Math.round((b - a) / 60000));
}

async function fetchEnergyProductionRows(
  userId: string,
  dataType: 'solar' | 'battery_discharge' | 'ev_miles',
  deviceId: string | undefined,
  sinceIso: string | null,
): Promise<KpiContributionRow[]> {
  let query = supabase
    .from('energy_production')
    .select('id, production_wh, recorded_at, device_id, provider, data_type')
    .eq('user_id', userId)
    .eq('data_type', dataType)
    .order('recorded_at', { ascending: false })
    .limit(ROW_LIMIT);

  if (deviceId) query = query.eq('device_id', deviceId);
  if (sinceIso) query = query.gt('recorded_at', sinceIso);

  const { data, error } = await query;
  if (error) throw error;

  const isMiles = dataType === 'ev_miles';
  return (data || []).map((r: any) => ({
    id: String(r.id),
    recordedAt: r.recorded_at,
    hasRealTime: true,
    amount: isMiles
      ? Math.round(Number(r.production_wh) * 10) / 10
      : Math.round((Number(r.production_wh) / 1000) * 10) / 10,
    unit: isMiles ? 'mi' : 'kWh',
    provider: r.provider,
    deviceId: r.device_id,
    verified: ['tesla', 'enphase', 'solaredge', 'tesla_historical'].includes(r.provider),
  }));
}

async function fetchSuperchargerRows(
  userId: string,
  deviceId: string | undefined,
  sinceIso: string | null,
  pendingTarget?: number,
): Promise<KpiContributionRow[]> {
  let query = supabase
    .from('charging_sessions')
    .select('id, session_date, energy_kwh, location, provider, device_id, charging_type, session_metadata')
    .eq('user_id', userId)
    .or('charging_type.is.null,charging_type.neq.home')
    .order('session_date', { ascending: false })
    .limit(ROW_LIMIT);
  if (deviceId) query = query.eq('device_id', deviceId);
  if (sinceIso && !pendingTarget) query = query.gt('session_date', sinceIso);
  const { data, error } = await query;
  if (error) throw error;
  const mapped = (data || []).map((s: any) => {
    const startIso = (s.session_metadata?.start_time || s.session_metadata?.chargeStartDateTime) as string | undefined;
    const endIso = (s.session_metadata?.end_time || s.session_metadata?.chargeStopDateTime) as string | undefined;
    const picked = pickIso(startIso, endIso, s.session_date);
    return {
      id: String(s.id),
      recordedAt: picked?.iso ?? s.session_date,
      hasRealTime: picked?.hasRealTime ?? false,
      durationMinutes: durationMin(startIso, endIso),
      amount: Math.round(Number(s.energy_kwh) * 10) / 10,
      unit: 'kWh' as const,
      provider: s.provider || 'tesla',
      deviceId: s.device_id,
      location: s.location,
      verified: true,
    };
  });

  if (!pendingTarget || pendingTarget <= 0) return mapped;

  const target = Math.max(0, pendingTarget - 0.5);
  let running = 0;
  const pendingRows: KpiContributionRow[] = [];
  for (const row of mapped) {
    pendingRows.push(row);
    running += row.amount;
    if (running >= target) break;
  }
  return pendingRows;
}

async function fetchHomeChargerRows(
  userId: string,
  deviceId: string | undefined,
  sinceIso: string | null,
): Promise<KpiContributionRow[]> {
  let homeQ = supabase
    .from('home_charging_sessions')
    .select('id, start_time, end_time, total_session_kwh, location, device_id, session_metadata, status')
    .eq('user_id', userId)
    .order('start_time', { ascending: false })
    .limit(ROW_LIMIT);
  if (deviceId) homeQ = homeQ.eq('device_id', deviceId);
  if (sinceIso) homeQ = homeQ.gt('start_time', sinceIso);

  let billQ = supabase
    .from('charging_sessions')
    .select('id, session_date, energy_kwh, location, provider, device_id, charging_type, session_metadata')
    .eq('user_id', userId)
    .eq('charging_type', 'home')
    .order('session_date', { ascending: false })
    .limit(ROW_LIMIT);
  if (deviceId) billQ = billQ.eq('device_id', deviceId);
  if (sinceIso) billQ = billQ.gt('session_date', sinceIso);

  const [homeRes, billRes] = await Promise.all([homeQ, billQ]);
  if (homeRes.error) throw homeRes.error;
  if (billRes.error) throw billRes.error;

  const homeRows: KpiContributionRow[] = (homeRes.data || []).map((h: any) => ({
    id: `home-${h.id}`,
    recordedAt: h.start_time,
    hasRealTime: true,
    durationMinutes: durationMin(h.start_time, h.end_time),
    amount: Math.round(Number(h.total_session_kwh || 0) * 10) / 10,
    unit: 'kWh' as const,
    provider: (h.session_metadata?.source === 'wallbox_backfill' ? 'wallbox' : 'tesla') as string,
    deviceId: h.device_id,
    location: h.location || 'Home',
    verified: true,
  }));

  const billRows: KpiContributionRow[] = ((billRes.data || []) as any[])
    .filter((s) => s.session_metadata?.source !== 'charge_monitor')
    .map((s: any) => {
      const startIso = s.session_metadata?.start_time as string | undefined;
      const endIso = s.session_metadata?.end_time as string | undefined;
      const picked = pickIso(startIso, endIso, s.session_date);
      return {
        id: `bill-${s.id}`,
        recordedAt: picked?.iso ?? s.session_date,
        hasRealTime: picked?.hasRealTime ?? false,
        durationMinutes: durationMin(startIso, endIso),
        amount: Math.round(Number(s.energy_kwh) * 10) / 10,
        unit: 'kWh' as const,
        provider: s.provider || 'tesla',
        deviceId: s.device_id,
        location: s.location || 'Home',
        verified: false,
      };
    });

  const all = [...homeRows, ...billRows];
  all.sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
  return all.slice(0, ROW_LIMIT);
}

export function useKpiContributions(
  category: MintCategory | null,
  deviceId?: string,
  enabled: boolean = true,
  pendingTarget?: number,
) {
  const viewAsUserId = useViewAsUserId();

  return useQuery({
    queryKey: ['kpi-contributions', viewAsUserId, category, deviceId ?? null, Math.floor(pendingTarget ?? 0)],
    enabled: enabled && !!category,
    queryFn: async (): Promise<KpiContributionRow[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = viewAsUserId || user?.id;
      if (!userId || !category) return [];

      const sinceIso = await getSinceIsoForCategory(userId, category, deviceId);

      switch (category) {
        case 'solar':
          return fetchEnergyProductionRows(userId, 'solar', deviceId, sinceIso);
        case 'battery':
          return fetchEnergyProductionRows(userId, 'battery_discharge', deviceId, sinceIso);
        case 'ev_miles':
          return fetchEnergyProductionRows(userId, 'ev_miles', deviceId, sinceIso);
        case 'supercharger':
          return fetchSuperchargerRows(userId, deviceId, sinceIso, pendingTarget);
        case 'home_charger':
          return fetchHomeChargerRows(userId, deviceId, sinceIso);
        case 'charging': {
          const [sup, home] = await Promise.all([
            fetchSuperchargerRows(userId, deviceId, sinceIso, pendingTarget),
            fetchHomeChargerRows(userId, deviceId, sinceIso),
          ]);
          return [...sup, ...home]
            .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))
            .slice(0, ROW_LIMIT);
        }
        case 'all':
        default:
          return [];
      }
    },
  });
}
