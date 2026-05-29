import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Live telemetry hooks for Premium Energy Insights.
 *
 * Rules:
 *  - One OEM per capability per site. First claimed wins per (capability).
 *  - Battery telemetry cached 12h, EV telemetry cached 15m, solar 1h.
 *  - Fetches via existing OEM edge functions with { mode: 'telemetry' }.
 */

type Capability = 'battery' | 'ev' | 'solar';
type OEM = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';

const TTL_MS: Record<Capability, number> = {
  battery: 12 * 60 * 60 * 1000,
  ev: 15 * 60 * 1000,
  solar: 60 * 60 * 1000,
};

const FN_BY_OEM: Record<OEM, string> = {
  tesla: 'tesla-data',
  enphase: 'enphase-data',
  solaredge: 'solaredge-data',
  wallbox: 'wallbox-data',
};

// Map stored connected_devices.device_type → canonical capability
const DEVICE_TYPE_TO_CAPABILITY: Record<string, Capability> = {
  powerwall: 'battery',
  battery: 'battery',
  vehicle: 'ev',
  ev: 'ev',
  ev_charger: 'ev',
  tesla_vehicle: 'ev',
  solar: 'solar',
  solar_system: 'solar',
  pv: 'solar',
};

export interface CachedTelemetry {
  oem: OEM;
  capability: Capability;
  site_id: string;
  device_name: string | null;
  payload: any;
  cached_at: string;
  fresh: boolean;
}

interface ConnectedDeviceRow {
  provider: string;
  device_type: string;
  device_id: string;
  device_name: string | null;
}

function pickOnePerCapability(rows: ConnectedDeviceRow[], cap: Capability): ConnectedDeviceRow[] {
  const out: ConnectedDeviceRow[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (DEVICE_TYPE_TO_CAPABILITY[r.device_type] !== cap) continue;
    if (!FN_BY_OEM[r.provider as OEM]) continue;
    const key = `${cap}::${r.device_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

async function readCache(userId: string, oem: OEM, cap: Capability, siteId: string) {
  const { data } = await supabase
    .from('device_telemetry_cache')
    .select('payload, cached_at, expires_at')
    .eq('user_id', userId)
    .eq('oem_type', oem)
    .eq('device_type', cap)
    .eq('site_id', siteId)
    .maybeSingle();
  return data ?? null;
}

async function writeCache(userId: string, oem: OEM, cap: Capability, siteId: string, payload: any) {
  const now = Date.now();
  await supabase.from('device_telemetry_cache').upsert(
    {
      user_id: userId,
      oem_type: oem,
      device_type: cap,
      site_id: siteId,
      payload,
      cached_at: new Date(now).toISOString(),
      expires_at: new Date(now + TTL_MS[cap]).toISOString(),
    },
    { onConflict: 'user_id,oem_type,device_type,site_id' }
  );
}

async function fetchFromOem(oem: OEM, siteId: string, capability: Capability): Promise<any | null> {
  try {
    const { data, error } = await supabase.functions.invoke(FN_BY_OEM[oem], {
      body: { mode: 'telemetry', capability, siteId },
    });
    if (error) return null;
    return data ?? null;
  } catch {
    return null;
  }
}

function useTelemetry(capability: Capability) {
  const { user } = useAuth();
  const [data, setData] = useState<CachedTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: devices, error: devErr } = await supabase
        .from('connected_devices')
        .select('provider, device_type, device_id, device_name')
        .eq('user_id', user.id)
        .order('claimed_at', { ascending: true });
      if (devErr) throw devErr;

      const selected = pickOnePerCapability((devices as ConnectedDeviceRow[]) ?? [], capability);
      const out: CachedTelemetry[] = [];

      for (const d of selected) {
        const oem = d.provider as OEM;
        const cached = await readCache(user.id, oem, capability, d.device_id);
        const fresh = cached && new Date(cached.expires_at) > new Date();
        if (fresh) {
          out.push({
            oem, capability, site_id: d.device_id, device_name: d.device_name,
            payload: cached.payload, cached_at: cached.cached_at, fresh: true,
          });
          continue;
        }
        const live = await fetchFromOem(oem, d.device_id, capability);
        if (live) {
          await writeCache(user.id, oem, capability, d.device_id, live);
          out.push({
            oem, capability, site_id: d.device_id, device_name: d.device_name,
            payload: live, cached_at: new Date().toISOString(), fresh: true,
          });
        } else if (cached) {
          out.push({
            oem, capability, site_id: d.device_id, device_name: d.device_name,
            payload: cached.payload, cached_at: cached.cached_at, fresh: false,
          });
        }
      }
      setData(out);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load telemetry');
    } finally {
      setLoading(false);
    }
  }, [user, capability]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export const useBatteryTelemetry = () => useTelemetry('battery');
export const useEVChargerTelemetry = () => useTelemetry('ev');
export const useSolarTelemetry = () => useTelemetry('solar');

/** Last-N-days totals for EV charging (home + supercharger), from session tables. */
export function useEVTotals(days = 7) {
  const { user } = useAuth();
  const [totals, setTotals] = useState<{ home_kwh: number; supercharger_kwh: number }>({
    home_kwh: 0,
    supercharger_kwh: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const sinceDate = since.slice(0, 10);
      const [{ data: home }, { data: sc }] = await Promise.all([
        supabase
          .from('home_charging_sessions')
          .select('total_session_kwh')
          .eq('user_id', user.id)
          .gte('start_time', since),
        supabase
          .from('charging_sessions')
          .select('energy_kwh')
          .eq('user_id', user.id)
          .eq('charging_type', 'supercharger')
          .gte('session_date', sinceDate),
      ]);
      if (cancelled) return;
      const home_kwh = (home ?? []).reduce((s: number, r: any) => s + Number(r.total_session_kwh || 0), 0);
      const supercharger_kwh = (sc ?? []).reduce((s: number, r: any) => s + Number(r.energy_kwh || 0), 0);
      setTotals({ home_kwh, supercharger_kwh });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, days]);

  return { totals, loading };
}
