import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Live telemetry hooks for Premium Energy Insights.
 *
 * Rules:
 *  - One OEM per capability per site. If the user has Enphase battery on
 *    site A, we never also fetch SolarEdge battery for site A. The first
 *    matching `connected_devices` row per (device_type, site) wins.
 *  - Battery telemetry cached 12h, EV charger telemetry cached 1h
 *    (enforced by the `expires_at` column in `device_telemetry_cache`).
 *  - Fetches happen via existing OEM edge functions (tesla-data,
 *    enphase-data, solaredge-data, wallbox-data). If a fresh-enough cache
 *    row exists, we skip the network round-trip.
 */

type DeviceType = 'battery' | 'ev_charger' | 'solar';
type OEM = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';

const TTL_MS: Record<DeviceType, number> = {
  battery: 12 * 60 * 60 * 1000,
  ev_charger: 60 * 60 * 1000,
  solar: 12 * 60 * 60 * 1000,
};

const FN_BY_OEM: Record<OEM, string> = {
  tesla: 'tesla-data',
  enphase: 'enphase-data',
  solaredge: 'solaredge-data',
  wallbox: 'wallbox-data',
};

export interface CachedTelemetry {
  oem: OEM;
  device_type: DeviceType;
  site_id: string;
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

/** Pick one OEM per (device_type, site_id) — first claimed wins. */
function applyExclusivity(rows: ConnectedDeviceRow[], deviceType: DeviceType): ConnectedDeviceRow[] {
  const seen = new Set<string>();
  const out: ConnectedDeviceRow[] = [];
  for (const r of rows) {
    if (r.device_type !== deviceType) continue;
    const key = `${deviceType}::${r.device_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

async function readCache(
  userId: string,
  oem: OEM,
  deviceType: DeviceType,
  siteId: string
): Promise<{ payload: any; cached_at: string; expires_at: string } | null> {
  const { data } = await supabase
    .from('device_telemetry_cache')
    .select('payload, cached_at, expires_at')
    .eq('user_id', userId)
    .eq('oem_type', oem)
    .eq('device_type', deviceType)
    .eq('site_id', siteId)
    .maybeSingle();
  return data ?? null;
}

async function writeCache(
  userId: string,
  oem: OEM,
  deviceType: DeviceType,
  siteId: string,
  payload: any
) {
  const now = Date.now();
  const expires = new Date(now + TTL_MS[deviceType]).toISOString();
  await supabase.from('device_telemetry_cache').upsert(
    {
      user_id: userId,
      oem_type: oem,
      device_type: deviceType,
      site_id: siteId,
      payload,
      cached_at: new Date(now).toISOString(),
      expires_at: expires,
    },
    { onConflict: 'user_id,oem_type,device_type,site_id' }
  );
}

async function fetchFromOem(oem: OEM, siteId: string, deviceType: DeviceType): Promise<any | null> {
  const fn = FN_BY_OEM[oem];
  try {
    const { data, error } = await supabase.functions.invoke(fn, {
      body: { siteId, deviceType, mode: 'telemetry' },
    });
    if (error) return null;
    return data ?? null;
  } catch {
    return null;
  }
}

function useTelemetry(deviceType: DeviceType) {
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

      const selected = applyExclusivity((devices as ConnectedDeviceRow[]) ?? [], deviceType);
      const out: CachedTelemetry[] = [];

      for (const d of selected) {
        const oem = d.provider as OEM;
        if (!FN_BY_OEM[oem]) continue;
        const cached = await readCache(user.id, oem, deviceType, d.device_id);
        const fresh = cached && new Date(cached.expires_at) > new Date();
        if (fresh) {
          out.push({
            oem,
            device_type: deviceType,
            site_id: d.device_id,
            payload: cached.payload,
            cached_at: cached.cached_at,
            fresh: true,
          });
          continue;
        }
        const live = await fetchFromOem(oem, d.device_id, deviceType);
        if (live) {
          await writeCache(user.id, oem, deviceType, d.device_id, live);
          out.push({
            oem,
            device_type: deviceType,
            site_id: d.device_id,
            payload: live,
            cached_at: new Date().toISOString(),
            fresh: true,
          });
        } else if (cached) {
          out.push({
            oem,
            device_type: deviceType,
            site_id: d.device_id,
            payload: cached.payload,
            cached_at: cached.cached_at,
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
  }, [user, deviceType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export const useBatteryTelemetry = () => useTelemetry('battery');
export const useEVChargerTelemetry = () => useTelemetry('ev_charger');
