import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import { oauthDiag } from '@/lib/oauthDiagnostics';


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

// Per-OEM override. Enphase middle ground:
//  - Rewards / history / minting lane (useDashboardData `fetchEnphaseData`)
//    stays at 24h to protect the daily API quota.
//  - Live Energy Diagram lane (this hook) fetches on-demand when the user
//    opens the dashboard / Zen Monitoring and caches the reading for 12 min.
//    Force refresh is still rate-limited to that 12 min window so we never
//    stream Enphase second-by-second.
const LIVE_ENPHASE_TTL_MS = 12 * 60 * 1000;
const OEM_TTL_OVERRIDE_MS: Partial<Record<OEM, number>> = {
  enphase: LIVE_ENPHASE_TTL_MS,
};

function ttlFor(oem: OEM, cap: Capability): number {
  return OEM_TTL_OVERRIDE_MS[oem] ?? TTL_MS[cap];
}

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

// -----------------------------------------------------------------------------
// Dedupe layer
// -----------------------------------------------------------------------------
// Multiple dashboard components (LiveEnergyMonitoringCard, ZenDriveLiveCard,
// ZenDriveMultiCard, SolarPlusCard, useGridOutage, ...) each call
// useBatteryTelemetry / useSolarTelemetry / useEVChargerTelemetry on mount.
// Without dedupe that's ~3× `connected_devices` reads and ~3× `tesla-data`
// invokes per capability per page load. These module-level caches collapse
// concurrent + near-concurrent identical fetches into one round trip.

const DEVICES_TTL_MS = 5_000;
const devicesCache = new Map<string, { at: number; rows: ConnectedDeviceRow[] }>();
const devicesInflight = new Map<string, Promise<ConnectedDeviceRow[]>>();

async function loadDevicesDeduped(userId: string): Promise<ConnectedDeviceRow[]> {
  const cached = devicesCache.get(userId);
  if (cached && Date.now() - cached.at < DEVICES_TTL_MS) return cached.rows;
  const inflight = devicesInflight.get(userId);
  if (inflight) return inflight;
  const p = (async () => {
    const { data, error } = await supabase
      .from('connected_devices')
      .select('provider, device_type, device_id, device_name')
      .eq('user_id', userId)
      .order('claimed_at', { ascending: true });
    if (error) throw error;
    const rows = (data as ConnectedDeviceRow[]) ?? [];
    devicesCache.set(userId, { at: Date.now(), rows });
    return rows;
  })();
  devicesInflight.set(userId, p);
  try {
    return await p;
  } finally {
    devicesInflight.delete(userId);
  }
}

// Dedupe concurrent OEM telemetry invokes (e.g. two mount effects racing
// during a single dashboard load). Keyed by user + oem + capability + siteId.
const oemInflight = new Map<string, Promise<any | null>>();

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
      expires_at: new Date(now + ttlFor(oem, cap)).toISOString(),
    },
    { onConflict: 'user_id,oem_type,device_type,site_id' }
  );
}

async function fetchFromOem(
  oem: OEM,
  siteId: string,
  capability: Capability,
  targetUserId?: string | null,
): Promise<any | null> {
  try {
    const headers = targetUserId ? { 'X-Target-User-Id': targetUserId } : undefined;
    const { data, error } = await supabase.functions.invoke(FN_BY_OEM[oem], {
      body: { mode: 'telemetry', capability, siteId },
      headers,
    });
    if (error) {
      try {
        const { parseFunctionInvokeError, warnReauthOnce } = await import('@/lib/functionsInvokeError');
        const parsed = await parseFunctionInvokeError(error);
        if (parsed.needsReauth) {
          warnReauthOnce(oem, parsed.status);
          return { __reauth: true, provider: oem };
        }
      } catch {
        /* ignore parser failures */
      }
      return null;
    }
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
  // EV: require vehicle_config so the Live scene can render the exact model + color.
  // Older cached payloads without vehicle_config are treated as stale to force a
  // fresh fetch via the upgraded tesla-data edge function.
  const hasCoreCharge =
    (payload.battery_level != null && payload.odometer != null) ||
    payload?.response?.charge_state != null;
  const hasVehicleConfig =
    payload?.vehicle_config != null ||
    payload?.response?.vehicle_config != null ||
    payload?.vehicles?.[0]?.vehicle_config != null;
  return hasCoreCharge && hasVehicleConfig;
}

function useTelemetry(capability: Capability, opts?: { pollMs?: number }) {
  const { user } = useAuth();
  const viewAsUserId = useViewAsUserId();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const [data, setData] = useState<CachedTelemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const pollMs = opts?.pollMs ?? 0;

  const refresh = useCallback(async (opts?: { force?: boolean }) => {
    if (!effectiveUserId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    let liveAttempts = 0;
    let liveSuccesses = 0;
    try {
      const { data: devices, error: devErr } = await supabase
        .from('connected_devices')
        .select('provider, device_type, device_id, device_name')
        .eq('user_id', effectiveUserId)
        .order('claimed_at', { ascending: true });
      if (devErr) throw devErr;

      const selected = pickOnePerCapability((devices as ConnectedDeviceRow[]) ?? [], capability);
      const out: CachedTelemetry[] = [];

      // When admin is viewing another user, route OEM calls through the
      // X-Target-User-Id header so the edge function authenticates as the
      // admin but reads/refreshes the target user's tokens.
      const targetHeaderId = viewAsUserId ?? null;

      for (const d of selected) {
        const oem = d.provider as OEM;
        const cached = await readCache(effectiveUserId, oem, capability, d.device_id);
        const withinTtl = cached
          ? (Date.now() - new Date(cached.cached_at).getTime()) < ttlFor(oem, capability)
          : false;
        // Enphase live lane is rate-limited: within the 12-min window we
        // never re-hit the OEM, even under a manual force refresh. Falls back
        // to the last cached reading below when a fresh fetch fails.
        const enphaseLocked = oem === 'enphase' && withinTtl;
        const fresh = (!opts?.force || enphaseLocked) && cached && withinTtl && new Date(cached.expires_at) > new Date() && hasCanonicalTelemetryShape(cached.payload, capability);
        if (fresh) {
          out.push({
            oem, capability, site_id: d.device_id, device_name: d.device_name,
            payload: cached.payload, cached_at: cached.cached_at,
            sample_at: extractSampleAt(cached.payload, capability),
            fresh: true,
          });
          continue;
        }
        liveAttempts++;
        const live = await fetchFromOem(oem, d.device_id, capability, targetHeaderId);
        if (live && !(live as any).error && !(live as any).__reauth) {
          liveSuccesses++;
          if (!targetHeaderId) {
            await writeCache(effectiveUserId, oem, capability, d.device_id, live);
          }
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
      // Backoff bookkeeping: any live-fetch success clears the streak; a
      // refresh that attempted live fetches and got zero successes counts as
      // a failure. Refreshes that only served cached rows are neutral.
      if (liveAttempts > 0 && liveSuccesses === 0) {
        setFailureCount((n) => n + 1);
      } else if (liveSuccesses > 0) {
        setFailureCount(0);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load telemetry');
      setFailureCount((n) => n + 1);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, viewAsUserId, capability]);

  // Force a fresh fetch when entering View-As so expired cached rows don't
  // render as Idle for the impersonated user.
  useEffect(() => {
    void refresh({ force: !!viewAsUserId });
  }, [refresh, viewAsUserId]);

  // Foreground polling — only when a caller opts in via pollMs. Paused when
  // the tab/PWA is hidden so we don't burn OEM quota in the background, and
  // resumed with an immediate refresh when the app returns to foreground.
  // Backoff: on consecutive live-fetch failures, delay grows 2^n (cap 16×);
  // after 10 consecutive failures we hard-stop the loop so a broken OEM
  // never spirals into 80+ edge-fn calls.
  useEffect(() => {
    if (!pollMs || pollMs <= 0 || !effectiveUserId) return;
    const MAX_FAILURES = 10;
    if (failureCount >= MAX_FAILURES) {
      setError('Live data paused after repeated failures — pull to refresh to retry.');
      try {
        oauthDiag('useDeviceTelemetry', 'poll:paused', { capability, failureCount });
      } catch { /* ignore */ }
      return;
    }
    const multiplier = Math.min(2 ** failureCount, 16);
    const effectiveMs = pollMs * multiplier;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        void refresh({ force: true });
      }, effectiveMs);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };
    const onVis = () => {
      if (typeof document === 'undefined') return;
      if (document.hidden) {
        stop();
      } else {
        void refresh({ force: true });
        start();
      }
    };
    start();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVis);
    }
    return () => {
      stop();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVis);
      }
    };
  }, [pollMs, effectiveUserId, refresh, failureCount, capability]);


  return { data, loading, error, refresh };
}

export const useBatteryTelemetry = (opts?: { pollMs?: number }) => useTelemetry('battery', opts);
export const useEVChargerTelemetry = (opts?: { pollMs?: number }) => useTelemetry('ev', opts);
export const useSolarTelemetry = (opts?: { pollMs?: number }) => useTelemetry('solar', opts);


/** Last-N-days totals for EV charging (home + supercharger), from session tables.
 * Pass `deviceId` to scope totals to a single vehicle (VIN). */
export function useEVTotals(days = 7, deviceId?: string) {
  const { user } = useAuth();
  const viewAsUserId = useViewAsUserId();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const [totals, setTotals] = useState<{ home_kwh: number; supercharger_kwh: number }>({
    home_kwh: 0,
    supercharger_kwh: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchTotals = useCallback(async () => {
    if (!effectiveUserId) {
      setTotals({ home_kwh: 0, supercharger_kwh: 0 });
      setLoading(false);
      return;
    }
    // days <= 1 → scope to "today" (local midnight → now), otherwise rolling N×24h window.
    let sinceMs: number;
    if (days <= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      sinceMs = d.getTime();
    } else {
      sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;
    }
    const since = new Date(sinceMs).toISOString();
    const sinceDate = since.slice(0, 10);
    let homeQ = supabase
      .from('home_charging_sessions')
      .select('total_session_kwh')
      .eq('user_id', effectiveUserId)
      .gte('start_time', since);
    let scQ = supabase
      .from('charging_sessions')
      .select('energy_kwh')
      .eq('user_id', effectiveUserId)
      .eq('charging_type', 'supercharger')
      .gte('session_date', sinceDate);
    if (deviceId) {
      homeQ = homeQ.eq('device_id', deviceId);
      scQ = scQ.eq('device_id', deviceId);
    }
    const [{ data: home }, { data: sc }] = await Promise.all([homeQ, scQ]);
    const home_kwh = (home ?? []).reduce((s: number, r: any) => s + Number(r.total_session_kwh || 0), 0);
    const supercharger_kwh = (sc ?? []).reduce((s: number, r: any) => s + Number(r.energy_kwh || 0), 0);
    setTotals({ home_kwh, supercharger_kwh });
    setLoading(false);
  }, [effectiveUserId, days, deviceId]);


  useEffect(() => {
    setLoading(true);
    void fetchTotals();
  }, [fetchTotals]);

  // Realtime: whenever a session row for this user is inserted / updated
  // (tesla-charge-monitor writes energy_kwh + total_session_kwh incrementally),
  // re-aggregate immediately so the tile advances as kWh commit.
  useEffect(() => {
    if (!effectiveUserId) return;
    const channel = supabase
      .channel(`ev-totals-realtime-${effectiveUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'home_charging_sessions', filter: `user_id=eq.${effectiveUserId}` },
        () => { void fetchTotals(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'charging_sessions', filter: `user_id=eq.${effectiveUserId}` },
        () => { void fetchTotals(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [effectiveUserId, fetchTotals]);

  return { totals, loading, refetch: fetchTotals };
}

