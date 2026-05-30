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

// TTLs are tuned for the Live Energy cockpit (must match what users see in
// the Tesla / Enphase apps within ~1 minute). Hooks that need coarser cadence
// for summaries / history MUST define their own TTL map — do NOT import this.
const TTL_MS: Record<Capability, number> = {
  battery: 60 * 1000,
  ev: 90 * 1000,
  solar: 60 * 1000,
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
  /**
   * Sample timestamp as reported by the OEM (e.g. Tesla `charge_state.timestamp`,
   * Enphase `last_report_at`, SolarEdge `lastUpdateTime`). Falls back to `cached_at`
   * when the payload doesn't expose one. The Live cockpit MUST prefer this over
   * `cached_at` so the "Updated Nm ago" pill reflects reality, not cache writes.
   */
  sample_at?: string | null;
  fresh: boolean;
}

/**
 * Extract the OEM-reported sample timestamp from a telemetry payload.
 * Returns ISO string or null when nothing usable is present.
 */
function extractSampleAt(payload: any, capability: Capability): string | null {
  if (!payload) return null;
  const candidates: unknown[] = [];
  if (capability === 'ev') {
    candidates.push(
      payload?.response?.charge_state?.timestamp,
      payload?.charge_state?.timestamp,
      payload?.vehicles?.[0]?.charge_state?.timestamp,
    );
  } else if (capability === 'battery') {
    candidates.push(
      payload?.energy_sites?.[0]?.timestamp,
      payload?.timestamp,
      payload?.last_report_at,
      payload?.read_at,
    );
  } else if (capability === 'solar') {
    candidates.push(
      payload?.energy_sites?.[0]?.timestamp,
      payload?.last_report_at,
      payload?.read_at,
      payload?.lastUpdateTime,
      payload?.timestamp,
    );
  }
  for (const c of candidates) {
    if (c == null) continue;
    if (typeof c === 'number' && Number.isFinite(c)) {
      // Tesla returns unix seconds; Enphase often seconds too.
      const ms = c > 1e12 ? c : c * 1000;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    if (typeof c === 'string' && c.length > 0) {
      // SolarEdge format: "YYYY-MM-DD HH:mm:ss" (space, no TZ) — assume local UTC-ish.
      const normalized = c.includes('T') || c.includes('Z') ? c : c.replace(' ', 'T') + 'Z';
      const d = new Date(normalized);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return null;
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

function hasCanonicalTelemetryShape(payload: any, capability: Capability): boolean {
  if (!payload) return false;
  if (capability === 'solar') {
    return (
      payload.current_power_w != null ||
      payload.solar_power != null ||
      payload?.energy_sites?.[0]?.solar_power != null
    );
  }
  if (capability === 'battery') {
    return (
      payload.percentage_charged != null ||
      payload?.energy_sites?.[0]?.percentage_charged != null
    );
  }
  return (
    (payload.battery_level != null && payload.odometer != null) ||
    payload?.response?.charge_state != null
  );
}

function useTelemetry(capability: Capability) {
  const { user } = useAuth();
  const [data, setData] = useState<CachedTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { force?: boolean }) => {
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
        // Tighten against TTL_MS as well as DB expires_at — older rows in the
        // table may have been written when battery TTL was 12h, so we must not
        // trust them past the new short window.
        const withinTtl = cached
          ? (Date.now() - new Date(cached.cached_at).getTime()) < TTL_MS[capability]
          : false;
        const fresh = !opts?.force && cached && withinTtl && new Date(cached.expires_at) > new Date() && hasCanonicalTelemetryShape(cached.payload, capability);
        if (fresh) {
          out.push({
            oem, capability, site_id: d.device_id, device_name: d.device_name,
            payload: cached.payload, cached_at: cached.cached_at,
            sample_at: extractSampleAt(cached.payload, capability),
            fresh: true,
          });
          continue;
        }
        const live = await fetchFromOem(oem, d.device_id, capability);
        if (live) {
          await writeCache(user.id, oem, capability, d.device_id, live);
          out.push({
            oem, capability, site_id: d.device_id, device_name: d.device_name,
            payload: live, cached_at: new Date().toISOString(),
            sample_at: extractSampleAt(live, capability),
            fresh: true,
          });
        } else if (cached) {
          out.push({
            oem, capability, site_id: d.device_id, device_name: d.device_name,
            payload: cached.payload, cached_at: cached.cached_at,
            sample_at: extractSampleAt(cached.payload, capability),
            fresh: false,
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
