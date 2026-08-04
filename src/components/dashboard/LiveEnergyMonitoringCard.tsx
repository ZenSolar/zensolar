import { createContext, lazy, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BatteryCharging, Car, Clock3, Gauge, Home, Loader2, RefreshCw, Route, Sparkles, Sun, Zap, type LucideIcon } from 'lucide-react';
import { useActiveChargingSessionDetail } from '@/hooks/useActiveChargingSession';
import { useOpenHomeChargingVins } from '@/hooks/useOpenHomeChargingVins';
import {
  useBatteryTelemetry,
  useEVChargerTelemetry,
  useSolarTelemetry,
  useEVTotals,
  type CachedTelemetry,
} from '@/hooks/useDeviceTelemetry';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import { useHaptics } from '@/hooks/useHaptics';
import { computeCo2 } from '@/lib/co2Math';
import { computeSiteBalance, balanceNotice } from '@/lib/siteBalance';
import { reconcileEnergyFlow, buildSourcesSinks } from '@/lib/energyFlowReconcile';
import { SourcesSinksStrip } from './SourcesSinksStrip';
import { supabase } from '@/integrations/supabase/client';

const EnergyFlowScene = lazy(() =>
  import('./EnergyFlowScene').then((m) => ({ default: m.EnergyFlowScene }))
);
const AnimatedEnergyFlow = lazy(() =>
  import('./AnimatedEnergyFlow').then((m) => ({ default: m.AnimatedEnergyFlow }))
);
import { ZenXPill } from './ZenXPill';
import { FreshnessException } from './FreshnessNote';
import { isDarkReading } from '@/lib/telemetryFreshness';
import { computeCardFreshness } from '@/lib/cardFreshness';

/**
 * The card polls every source together, so it states its age ONCE in the
 * header. Rows read this shared timestamp and only speak up when they diverge.
 */
export const CardFreshnessContext = createContext<string | null>(null);


import { LiveCardHeader } from './LiveCardHeader';
import { TelemetrySyncBadge } from './TelemetrySyncBadge';
import { SolarSiteTabs } from './SolarSiteTabs';
import { useWeather } from '@/hooks/useWeather';
import { useLifetimeTotals } from '@/hooks/useLifetimeTotals';
// SolarPlusCard is no longer in the render matrix — every connected user
// now routes to the rich EnergyFlowScene (device-aware).

import { ChargerOnlyLiveCard } from './ChargerOnlyLiveCard';
import { useChargerDevices } from '@/hooks/useChargerDevices';
import { OutageModePanel } from './OutageModePanel';
import { OutageFooter } from './OutageFooter';
import { useGridOutage } from '@/hooks/useGridOutage';
import { useOutageLifecycle } from '@/hooks/useOutageLifecycle';
import { estimateBackupTime } from '@/lib/gridOutage';
import { resolveVehicleAsset, VEHICLE_LABEL, VEHICLE_COLOR_LABEL } from './EnergyFlowScene.scenes';

function getPath(payload: any, path: string): unknown {
  return path.split('.').reduce((acc, key) => {
    if (acc == null) return undefined;
    if (/^\d+$/.test(key)) return Array.isArray(acc) ? acc[Number(key)] : undefined;
    return acc?.[key];
  }, payload);
}

function pickNumber(payload: any, keys: string[]): number | null {
  for (const k of keys) {
    const v = getPath(payload, k) ?? getPath(payload?.response, k) ?? getPath(payload?.data, k);
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

function pickString(payload: any, keys: string[]): string | null {
  for (const k of keys) {
    const v = getPath(payload, k) ?? getPath(payload?.response, k) ?? getPath(payload?.data, k);
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
}

function formatKw(v: number | null, decimals = 2) {
  return v === null ? '—' : `${v.toFixed(decimals)} kW`;
}

function formatKwh(v: number | null, decimals = 1) {
  return v === null ? '—' : `${v.toFixed(decimals)} kWh`;
}

function normalizeWattsToKw(v: number | null) {
  if (v === null) return null;
  return Math.abs(v) > 100 ? v / 1000 : v;
}

/**
 * REMOVED 2026-08-02 — `readLastKnownHomeKw()` / `rememberLastKnownHomeKw()`.
 *
 * These persisted the last non-zero home load to `localStorage` and replayed it
 * as the CURRENT home draw whenever the Powerwall `load_power` field was
 * missing or zero, capped at 20 kW. A number from the browser's previous page
 * view is not stale telemetry — it is not telemetry at all, and it was
 * indistinguishable on the card from a live CT reading.
 *
 * When `load_power` is absent, home load is now either the balance-derived
 * value (labelled as derived) or nothing. Never a cached browser number.
 */


function formatAge(iso: string | null) {
  if (!iso) return 'Sync pending';
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `Updated ${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `Updated ${mins}m ago`;
  return `Updated ${Math.floor(mins / 60)}h ago`;
}

function freshnessClass(iso: string | null, fresh: boolean) {
  if (!iso || !fresh) return 'bg-muted/40 text-muted-foreground ring-muted/50';
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 2) return 'bg-primary/20 text-primary ring-primary/30';
  if (mins < 15) return 'bg-primary/10 text-primary/80 ring-primary/20';
  return 'bg-muted/40 text-muted-foreground ring-muted/50';
}

function useTodayMintImpact() {
  const { user } = useAuth();
  const viewAsUserId = useViewAsUserId();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const [impact, setImpact] = useState({ tokens: 0, co2Kg: 0, loading: true });

  useEffect(() => {
    if (!effectiveUserId) {
      setImpact({ tokens: 0, co2Kg: 0, loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('mint_transactions')
        .select('tokens_minted, kwh_delta, miles_delta, source_breakdown')
        .eq('user_id', effectiveUserId)
        .gte('created_at', start.toISOString());
      if (cancelled) return;
      const totals = (data ?? []).reduce(
        (acc, row: any) => {
          const co2 = computeCo2({
            tokens_minted: row.tokens_minted,
            kwh_delta: row.kwh_delta,
            miles_delta: row.miles_delta,
            source_breakdown: row.source_breakdown ?? null,
          });
          return {
            tokens: acc.tokens + Number(row.tokens_minted || 0),
            co2Kg: acc.co2Kg + co2.co2Kg,
          };
        },
        { tokens: 0, co2Kg: 0 }
      );
      setImpact({ ...totals, loading: false });
    })();
    return () => { cancelled = true; };
  }, [effectiveUserId]);

  return impact;
}

function oemLabel(oem: string) {
  return oem.charAt(0).toUpperCase() + oem.slice(1);
}

function solarSnapshot(t: CachedTelemetry | undefined) {
  const p = t?.payload;
  const currentW = pickNumber(p, ['current_power_w', 'per_system.0.current_power_w', 'solar_power', 'energy_sites.0.solar_power']);
  const todayWh = pickNumber(p, ['energy_today_wh', 'energy_today', 'totals.energy_today_wh', 'per_system.0.energy_today_wh']);
  const lifetimeWh = pickNumber(p, ['energy_lifetime_wh', 'totals.lifetime_solar_wh', 'per_system.0.lifetime_wh']);
  return {
    currentKw: currentW !== null ? currentW / 1000 : null,
    todayKwh: todayWh !== null ? todayWh / 1000 : null,
    lifetimeMwh: lifetimeWh !== null ? lifetimeWh / 1_000_000 : null,
    label: t ? `${oemLabel(t.oem)}${t.device_name ? ` · ${t.device_name}` : ''}` : 'Solar',
  };
}

// Single Powerwall nameplate capacity (kWh). Used as a fallback when telemetry
// doesn't expose total_pack_energy. Real households may have multiple units;
// we'd prefer to read this from telemetry whenever possible.
const POWERWALL_DEFAULT_CAPACITY_KWH = 13.5;

export function batterySnapshot(t: CachedTelemetry | undefined) {
  const p = t?.payload;
  // Tesla Fleet API live_status uses: battery_power > 0 = DISCHARGING, < 0 = CHARGING.
  // Our internal convention (used by derivePowerwallDisplay + tests) is the opposite:
  // + = charging INTO pack, − = discharging OUT of pack. Invert ONLY for Tesla-shaped keys.
  const teslaRaw = pickNumber(p, ['battery_power', 'energy_sites.0.battery_power']);
  const otherRaw = pickNumber(p, ['power_kw', 'charge_power']);
  const rawPower = teslaRaw !== null ? teslaRaw : otherRaw;
  const normalized = rawPower !== null ? (Math.abs(rawPower) > 100 ? rawPower / 1000 : rawPower) : null;
  const powerKw = normalized !== null
    ? (teslaRaw !== null ? -normalized : normalized)
    : null;
  const soc = pickNumber(p, ['percentage_charged', 'energy_sites.0.percentage_charged', 'battery_soc', 'soc', 'state_of_charge']);
  const energyLeftRaw = pickNumber(p, ['energy_left', 'energy_sites.0.energy_left']);
  // Tesla reports Wh; normalize to kWh if value looks like watt-hours.
  const energyLeftKwh = energyLeftRaw !== null
    ? (energyLeftRaw > 1000 ? energyLeftRaw / 1000 : energyLeftRaw)
    : null;

  // Derive capacity from telemetry when available; fall back to nameplate × unit count.
  const totalPackRaw = pickNumber(p, [
    'total_pack_energy',
    'energy_sites.0.total_pack_energy',
    'battery_capacity',
    'energy_sites.0.battery_capacity',
    'nameplate_energy',
    'energy_sites.0.nameplate_energy',
  ]);
  let capacityKwh: number | null = totalPackRaw !== null
    ? (totalPackRaw > 1000 ? totalPackRaw / 1000 : totalPackRaw)
    : null;
  if (capacityKwh === null && energyLeftKwh !== null && soc !== null && soc > 1) {
    capacityKwh = energyLeftKwh / (soc / 100);
  }
  // Multi-Powerwall fallback: read unit count from telemetry when capacity is unknown.
  if (capacityKwh === null && (t || soc !== null)) {
    const unitCount = pickNumber(p, [
      'battery_count',
      'energy_sites.0.battery_count',
      'num_batteries',
      'energy_sites.0.num_batteries',
    ]) ?? (Array.isArray((p as any)?.battery_blocks) ? (p as any).battery_blocks.length : null)
       ?? (Array.isArray((p as any)?.components?.batteries) ? (p as any).components.batteries.length : null)
       ?? 1;
    capacityKwh = Math.max(1, Math.round(unitCount)) * POWERWALL_DEFAULT_CAPACITY_KWH;
  }

  const reserveKwh = soc !== null && capacityKwh !== null
    ? (energyLeftKwh ?? (capacityKwh * (soc / 100)))
    : null;

  return {
    soc,
    powerKw,
    energyLeft: energyLeftKwh,
    capacityKwh,
    reserveKwh,
    status: powerKw === null ? 'State pending' : powerKw > 0.05 ? 'Charging' : powerKw < -0.05 ? 'Discharging' : 'Idle',
    label: t ? `${oemLabel(t.oem)}${t.device_name ? ` · ${t.device_name}` : ''}` : 'Battery',
  };
}

function chargerKindBadge(fastChargerType: string | null, chargerPhases: number | null): { icon: LucideIcon; label: string } {
  const t = (fastChargerType ?? '').toLowerCase();
  if (t.includes('supercharger') || t.includes('combo') || t.includes('chademo')) {
    return { icon: Zap, label: 'Supercharger' };
  }
  if (t.includes('wall') || t === 'mc' || t === 'gb_ac') return { icon: Home, label: 'Wall Connector' };
  if (chargerPhases && chargerPhases >= 1) return { icon: Zap, label: 'Public L2' };
  return { icon: Car, label: 'Plug' };
}

export function EVTile({ t, totals7d, liveDot, sourceLabel: sourceLabelOverride }: { t: CachedTelemetry; totals7d: { home_kwh: number; supercharger_kwh: number }; liveDot?: boolean; sourceLabel?: string }) {
  const soc = pickNumber(t.payload, ['battery_level', 'vehicles.0.battery_level', 'usable_battery_level', 'response.charge_state.battery_level']);
  const range = pickNumber(t.payload, ['battery_range', 'vehicles.0.battery_range', 'ideal_battery_range', 'est_battery_range', 'response.charge_state.battery_range']);
  const odometer = pickNumber(t.payload, ['odometer', 'vehicles.0.odometer', 'response.drive_state.odometer']);
  const chargingState = pickString(t.payload, ['charging_state', 'vehicles.0.charging_state', 'state', 'charger_status', 'status', 'response.charge_state.charging_state']);
  const isCharging = (chargingState ?? '').toLowerCase() === 'charging';
  const directKw = pickNumber(t.payload, ['charge_rate_kw', 'charger_power', 'vehicles.0.charger_power', 'response.charge_state.charger_power']);
  const ivKw =
    ((pickNumber(t.payload, ['charger_actual_current', 'response.charge_state.charger_actual_current']) ?? 0) *
      (pickNumber(t.payload, ['charger_voltage', 'response.charge_state.charger_voltage']) ?? 0)) /
    1000;
  const chargeRateKw = directKw ?? (ivKw > 0 ? ivKw : null);
  const energyAdded = pickNumber(t.payload, ['charge_energy_added', 'vehicles.0.charge_energy_added', 'response.charge_state.charge_energy_added']);
  const timeToFullHrs = pickNumber(t.payload, ['time_to_full_charge', 'response.charge_state.time_to_full_charge']);
  const fastChargerType = pickString(t.payload, ['fast_charger_type', 'charger_type', 'response.charge_state.fast_charger_type']);
  const phases = pickNumber(t.payload, ['charger_phases', 'response.charge_state.charger_phases']);
  const { icon: KindIcon, label: kindLabelDefault } = chargerKindBadge(fastChargerType, phases);
  const kindLabel = sourceLabelOverride ?? kindLabelDefault;
  const label = t.oem === 'tesla' ? `Vehicle · Tesla${t.device_name ? ' · ' + t.device_name : ''}` : `EV · ${oemLabel(t.oem)}`;
  const showLive = liveDot ?? isCharging;
  const cardIso = useContext(CardFreshnessContext);

  return (
    <div className="rounded-lg border border-primary/20 bg-background/45 p-3 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)] transition-colors hover:border-primary/35">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
          {showLive && (
            <span role="status" aria-live="polite" className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
              <span aria-hidden="true" className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="sr-only">Live charging </span>Live
            </span>
          )}

        </div>
        <FreshnessException
          iso={t.sample_at ?? t.cached_at ?? null}
          fresh={t.fresh}
          cardIso={cardIso}
          className="mt-0"
        />
      </div>


      {/* Row A: live charge session */}
      {isCharging && (
        <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <KindIcon className="h-3 w-3" />
            <span>{kindLabel}</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            {chargeRateKw !== null && (
              <span className="text-lg font-bold text-foreground">{chargeRateKw.toFixed(1)} kW</span>
            )}
            {soc !== null && <span className="text-xs text-muted-foreground">{Math.round(soc)}% SOC</span>}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {energyAdded !== null ? `+${energyAdded.toFixed(1)} kWh added` : ''}
            {timeToFullHrs ? ` · ${Math.round(timeToFullHrs * 60)} min to full` : ''}
          </div>
        </div>
      )}

      {/* Row B: vehicle status (when not actively charging) */}
      {!isCharging && (
        <div className="mt-2">
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {soc !== null ? `${Math.round(soc)}%` : '—'}
            </span>
            {range !== null && <span className="text-xs text-primary">{Math.round(range)} mi</span>}
            </div>
            {odometer !== null && (
              <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                {Math.round(odometer).toLocaleString()} mi
              </span>
            )}
          </div>
          <div className="text-[10px] capitalize text-muted-foreground">
            {(chargingState ?? 'idle').toLowerCase()}
          </div>
        </div>
      )}

      {/* Row C: last 7d totals */}
      <div className="mt-2 flex items-center gap-3 border-t border-primary/10 pt-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-primary" />
          Super 7d: <span className="font-semibold text-foreground">{totals7d.supercharger_kwh.toFixed(1)} kWh</span>
        </span>
        <span className="flex items-center gap-1">
          <Home className="h-3 w-3 text-primary" />
          Home 7d: <span className="font-semibold text-foreground">{totals7d.home_kwh.toFixed(1)} kWh</span>
        </span>
      </div>
    </div>
  );
}

export function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
  sublabel,
  tone,
  asOf,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  sublabel?: React.ReactNode;
  tone?: 'orange' | 'green' | 'blue' | 'teal';
  /** Reading provenance. Every telemetry-backed number states its own age. */
  asOf?: { iso: string | null; fresh: boolean };
}) {
  const cardIso = useContext(CardFreshnessContext);

  const toneMap = {
    orange: {
      border: 'border-amber-400/25 hover:border-amber-400/45',
      bg: 'from-amber-500/[0.06] to-transparent',
      icon: 'text-amber-300',
      value: 'text-amber-50 [text-shadow:_0_0_18px_hsla(38,95%,60%,0.35)]',
      ring: 'ring-amber-400/20',
    },
    green: {
      border: 'border-emerald-400/25 hover:border-emerald-400/45',
      bg: 'from-emerald-500/[0.06] to-transparent',
      icon: 'text-emerald-300',
      value: 'text-emerald-50 [text-shadow:_0_0_18px_hsla(142,76%,55%,0.35)]',
      ring: 'ring-emerald-400/20',
    },
    blue: {
      border: 'border-sky-400/25 hover:border-sky-400/45',
      bg: 'from-sky-500/[0.06] to-transparent',
      icon: 'text-sky-300',
      value: 'text-sky-50 [text-shadow:_0_0_18px_hsla(205,90%,60%,0.35)]',
      ring: 'ring-sky-400/20',
    },
    teal: {
      border: 'border-teal-400/25 hover:border-teal-400/45',
      bg: 'from-teal-500/[0.06] to-transparent',
      icon: 'text-teal-300',
      value: 'text-teal-50 [text-shadow:_0_0_18px_hsla(180,85%,55%,0.35)]',
      ring: 'ring-teal-400/20',
    },
  } as const;
  const t = tone ? toneMap[tone] : null;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-3.5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] transition-colors ${
        t
          ? `${t.border} bg-gradient-to-br ${t.bg} bg-background/40`
          : 'border-border/40 bg-background/40 hover:border-primary/30'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
        <span className={t ? `inline-flex h-5 w-5 items-center justify-center rounded-md bg-background/40 ring-1 ${t.ring}` : ''}>
          <Icon className={`h-3.5 w-3.5 ${t ? t.icon : 'text-primary/80'}`} />
        </span>
        {label}
      </div>
      <div className={`mt-2.5 text-[22px] font-bold leading-none tabular-nums ${t ? t.value : 'text-foreground'}`}>{value}</div>
      <div className="mt-1.5 text-[11px] leading-snug text-muted-foreground/80">{detail}</div>
      {sublabel ? <div className="mt-1 text-[11px] leading-snug">{sublabel}</div> : null}
      {/* Exception-only: silent when this row shares the card's freshness. */}
      {asOf ? <FreshnessException iso={asOf.iso} fresh={asOf.fresh} cardIso={cardIso} className="block" /> : null}

    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="px-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
      {children}
    </div>
  );
}


export type TeslaPillState = 'charging' | 'idle' | 'unplugged';

export interface TeslaFlow {
  kW: number;
  soc: number;
  rangeMi: number;
  isCharging: boolean;
  /** Where the kW figure came from. 'wall_connector' means the car is asleep
   *  and the site hardware is the witness. */
  kwSource: 'vehicle_api' | 'wall_connector' | 'none';
  source: 'home' | 'supercharger' | 'public' | 'none';
  state: TeslaPillState;
  sourceLabel: string;
  rawChargingState: string | null;
  fastChargerType: string | null;
  phases: number | null;
  timeToFullHrs: number | null;
  energyAdded: number | null;
}


export function deriveTeslaFlow(
  t: CachedTelemetry | undefined,
  sessionActive: boolean,
  /** Measured wall-connector power for the open session, kW. Used when the
   *  vehicle's own payload reports 0 — a sleeping car is not a stopped car. */
  sessionChargerKw?: number | null,
): TeslaFlow | null {
  if (!t || t.oem !== 'tesla') return null;
  const p = t.payload;
  const soc = pickNumber(p, ['battery_level', 'vehicles.0.battery_level', 'usable_battery_level', 'response.charge_state.battery_level']) ?? 0;
  const rangeMi = pickNumber(p, ['battery_range', 'vehicles.0.battery_range', 'ideal_battery_range', 'est_battery_range', 'response.charge_state.battery_range']) ?? 0;
  const rawChargingState = pickString(p, ['charging_state', 'vehicles.0.charging_state', 'state', 'charger_status', 'status', 'response.charge_state.charging_state']);
  const directKw = pickNumber(p, ['charge_rate_kw', 'charger_power', 'vehicles.0.charger_power', 'response.charge_state.charger_power']);
  const ivKw =
    ((pickNumber(p, ['charger_actual_current', 'response.charge_state.charger_actual_current']) ?? 0) *
      (pickNumber(p, ['charger_voltage', 'response.charge_state.charger_voltage']) ?? 0)) /
    1000;
  const vehicleKw = directKw ?? (ivKw > 0 ? ivKw : 0);
  // Provenance-explicit: prefer the car's own reading, fall back to the wall
  // connector while a session is open. Both are measured; neither is derived.
  const kwSource: TeslaFlow['kwSource'] =
    vehicleKw > 0 ? 'vehicle_api'
      : sessionActive && (sessionChargerKw ?? 0) > 0 ? 'wall_connector'
        : 'none';
  const kW = kwSource === 'wall_connector' ? (sessionChargerKw as number) : vehicleKw;
  const energyAdded = pickNumber(p, ['charge_energy_added', 'vehicles.0.charge_energy_added', 'response.charge_state.charge_energy_added']);
  const timeToFullHrs = pickNumber(p, ['time_to_full_charge', 'response.charge_state.time_to_full_charge']);
  const fastChargerType = pickString(p, ['fast_charger_type', 'charger_type', 'response.charge_state.fast_charger_type']);
  const fastChargerPresent = (p as any)?.fast_charger_present === true ||
    (p as any)?.response?.charge_state?.fast_charger_present === true ||
    (p as any)?.vehicles?.[0]?.fast_charger_present === true;
  // fast_charger_brand intentionally not used — "Tesla" appears on Wall Connectors too.
  const phases = pickNumber(p, ['charger_phases', 'response.charge_state.charger_phases']);

  const stateStr = (rawChargingState ?? '').toLowerCase();
  const apiCharging = stateStr === 'charging';
  const isCharging = apiCharging || sessionActive;

  // Source detection — mirror tesla-charge-monitor backend heuristic:
  // unknown AC charging defaults to HOME (not Public L2). Only label
  // 'supercharger' when we have positive DC-fast evidence.
  //
  // NOTE: Tesla's `fast_charger_type` returns "Tesla" for BOTH Superchargers
  // and Tesla Wall Connectors, and `fast_charger_brand` is "Tesla" on any
  // Tesla-branded charger. Neither string alone proves DC-fast. The reliable
  // positive signals are `fast_charger_present === true`, an explicit
  // non-Tesla DC connector (CCS/Combo/CHAdeMO), or delivered power above
  // ~25 kW (Wall Connectors top out around 11.5 kW). AC charging on a Wall
  // Connector will report `fast_charger_present: false` even when
  // `fast_charger_type: "Tesla"` — so we no longer treat that string as DC.
  const fc = (fastChargerType ?? '').toLowerCase();
  const isDcConnector =
    fc.includes('combo') || fc.includes('ccs') || fc.includes('chademo') ||
    fc.includes('supercharger');
  // DC-fast detection must read the VEHICLE's number: a wall-connector
  // fallback is by definition AC and must never be classed as supercharging.
  // The onboard charger reporting phases (1 or 3) is definitive AC evidence
  // and overrides any stale fast_charger_* field left over from a DC session.
  const acEvidence = (phases ?? 0) > 0;
  const isDcFast =
    !acEvidence && (fastChargerPresent === true || isDcConnector || vehicleKw > 25);

  let source: TeslaFlow['source'];
  let sourceLabel: string;
  if (isDcFast) {
    source = 'supercharger';
    sourceLabel = 'Supercharger';
  } else if (isCharging) {
    // AC charging — assume home (matches backend default).
    source = 'home';
    sourceLabel = 'Wall Connector';
  } else {
    source = 'none';
    sourceLabel = 'Wall Connector';
  }

  // 3-state pill
  let pillState: TeslaPillState;
  if (isCharging) {
    pillState = 'charging';
  } else if (['stopped', 'complete', 'nopower', 'starting'].includes(stateStr)) {
    pillState = 'idle';
  } else {
    pillState = 'unplugged';
  }

  return {
    kW,
    soc,
    rangeMi,
    isCharging,
    kwSource,
    source,
    state: pillState,
    sourceLabel,
    rawChargingState,
    fastChargerType,
    phases,
    timeToFullHrs,
    energyAdded,
  };
}


export function TeslaStatusPill({ tesla, onClick }: { tesla: TeslaFlow | null; onClick?: () => void }) {
  if (!tesla) return null;
  const sourceText =
    tesla.source === 'supercharger' ? 'at a Supercharger' :
    tesla.source === 'public' ? 'on a public charger' :
    'at home';
  const config = {
    charging: {
      dot: 'bg-emerald-400',
      dotGlow: 'shadow-[0_0_8px_hsla(142,76%,50%,0.7)]',
      ring: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
      visible: `Tesla Charging • ${tesla.kW.toFixed(1)} kW • ${Math.round(tesla.soc)}% SOC`,
      aria: `Tesla charging ${sourceText}, ${tesla.kW.toFixed(1)} kilowatts, ${Math.round(tesla.soc)} percent state of charge. Activate to view details.`,
      pulse: true,
    },
    idle: {
      dot: 'bg-amber-400',
      dotGlow: 'shadow-[0_0_6px_hsla(38,92%,55%,0.6)]',
      ring: 'border-amber-400/35 bg-amber-400/10 text-amber-300',
      visible: `Tesla Plugged · Idle • ${Math.round(tesla.soc)}% SOC`,
      aria: `Tesla plugged in and idle, ${Math.round(tesla.soc)} percent state of charge. Activate to view details.`,
      pulse: false,
    },
    unplugged: {
      dot: 'bg-muted-foreground/60',
      dotGlow: '',
      ring: 'border-muted-foreground/20 bg-muted/30 text-muted-foreground',
      visible: `Tesla Not Plugged In • ${Math.round(tesla.soc)}% · ${Math.round(tesla.rangeMi)} mi`,
      aria: `Tesla not plugged in, ${Math.round(tesla.soc)} percent state of charge, ${Math.round(tesla.rangeMi)} miles range. Activate to view details.`,
      pulse: false,
    },
  }[tesla.state];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={config.aria}
      className={`group inline-flex min-h-11 w-full items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto ${config.ring}`}
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-2 w-2 rounded-full ${config.dot} ${config.dotGlow}`}
      >
        {config.pulse && (
          <span className={`absolute inset-0 inline-flex h-full w-full animate-ping rounded-full ${config.dot} opacity-75`} />
        )}
      </span>
      <span role="status" aria-live="polite" aria-atomic="true" className="truncate">
        {config.visible}
      </span>
      {tesla.state === 'charging' && tesla.source === 'supercharger' && (
        <span aria-hidden="true" className="ml-auto rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-rose-300">
          Supercharger
        </span>
      )}
    </button>
  );
}


export interface LiveEnergyMonitoringCardProps {
  /** Optional override: forces Outage Mode regardless of live detection. */
  outage?: { active: boolean; startedAt: Date | string };
  /**
   * When true, this card behaves as the pure "ZenEnergy · Live" surface:
   * Solar + Powerwall + Grid + Home only. The Tesla vehicle is removed
   * from the scene, the ZenX pill is hidden, the Live Devices (EV) tile
   * is suppressed, and the EV-only metric tiles are dropped. The vehicle
   * lives on its own ZenDrive card.
   */
  hideVehicle?: boolean;
  /** Daily battery energy exported (kWh) — overrides the live reserve snapshot. */
  batteryKwhExportedToday?: number;
}

export function LiveEnergyMonitoringCard({ outage: outageOverride, hideVehicle = false, batteryKwhExportedToday }: LiveEnergyMonitoringCardProps = {}) {
  const solar = useSolarTelemetry();
  const battery = useBatteryTelemetry();
  const ev = useEVChargerTelemetry();
  const chargers = useChargerDevices();
  const evTotals = useEVTotals(1);
  const { totals: lifetime } = useLifetimeTotals();
  const mintImpact = useTodayMintImpact();
  const { data: activeSession } = useActiveChargingSessionDetail();
  const isActivelyCharging = activeSession?.active ?? false;
  /** Measured wall-connector power for the open session. Survives the vehicle
   *  falling asleep, which is exactly when the vehicle payload reads 0 kW. */
  const sessionChargerKw = activeSession?.chargerKw ?? null;
  const { vins: openHomeChargingVins, provenAtHomeVins } = useOpenHomeChargingVins();
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const lastChargingRef = useRef<boolean | undefined>(undefined);
  const evTileRef = useRef<HTMLDivElement | null>(null);
  const [pingTile, setPingTile] = useState(false);
  const haptics = useHaptics();
  const autoOutage = useGridOutage();
  const outage = outageOverride ?? (autoOutage.isGridOutage
    ? { active: true, startedAt: autoOutage.since ?? new Date() }
    : undefined);


  // When a home charging session starts/stops, bypass cache and pull fresh EV + battery telemetry
  useEffect(() => {
    if (lastChargingRef.current === undefined) {
      lastChargingRef.current = !!isActivelyCharging;
      return;
    }
    if (lastChargingRef.current !== !!isActivelyCharging) {
      lastChargingRef.current = !!isActivelyCharging;
      void ev.refresh({ force: true });
      void battery.refresh({ force: true });
    }
  }, [isActivelyCharging, ev, battery]);

  // While actively charging, poll EV telemetry every 60s with force-refresh so kW / SOC tick up
  useEffect(() => {
    if (!isActivelyCharging) return;
    const id = window.setInterval(() => {
      void ev.refresh({ force: true });
      void battery.refresh({ force: true });
    }, 60_000);
    return () => window.clearInterval(id);
  }, [isActivelyCharging, ev, battery]);

  const handleManualRefresh = async () => {
    if (manualRefreshing) return;
    setManualRefreshing(true);
    try {
      await Promise.all([
        solar.refresh({ force: true }),
        battery.refresh({ force: true }),
        ev.refresh({ force: true }),
      ]);
    } finally {
      setManualRefreshing(false);
    }
  };


  const loading =
    (solar.loading || battery.loading || ev.loading) &&
    solar.data.length === 0 && battery.data.length === 0 && ev.data.length === 0;

  // Device-combination detection — drives the render matrix below.
  const hasSolar = solar.data.length > 0;
  const hasBattery = battery.data.length > 0;
  const hasTeslaRaw = ev.data.some((t) => t.oem === 'tesla');
  const hasTesla = hideVehicle ? false : hasTeslaRaw;
  const hasCharger = chargers.data.length > 0;
  const hasRichCockpit = hasBattery || hasTesla; // EnergyFlowScene needs ≥1 of these
  const empty =
    !loading && !hasSolar && !hasBattery && !hasTeslaRaw && !hasCharger;

  // v5 — multi-PV: let user pick which PV system feeds the scene + tiles.
  const [activeSolarSiteId, setActiveSolarSiteId] = useState<string | null>(null);
  const primarySolar = useMemo(
    () => solar.data.find((s) => s.site_id === activeSolarSiteId) ?? solar.data[0],
    [solar.data, activeSolarSiteId],
  );
  const primaryBattery = battery.data[0];
  /**
   * DISPLAY-ONLY presence fallback.
   *
   * A wall connector that has not yet named a VIN leaves an actively AC-charging
   * car invisible. For RENDERING only, a vehicle whose own charge port reports
   * an AC charge (phases present / SAE-style cable, no DC-fast brand) is drawn
   * at this site. Issuance and `evHomeKw` still require an open
   * `home_charging_sessions` row — nothing here reaches the mint path.
   */
  const acAtSiteVins = useMemo(() => {
    const s = new Set<string>();
    if (hideVehicle) return s;
    for (const t of ev.data) {
      const state = (pickString(t.payload, ['charging_state', 'vehicles.0.charging_state']) ?? '').toLowerCase();
      if (state !== 'charging') continue;
      const phases = pickNumber(t.payload, ['charger_phases', 'vehicles.0.charger_phases']);
      const brand = (pickString(t.payload, ['fast_charger_brand']) ?? '').toLowerCase();
      const dcFast = brand !== '' && brand !== '<invalid>' && brand !== 'invalid';
      if (phases != null && phases > 0 && !dcFast) s.add(t.site_id);
    }
    return s;
  }, [hideVehicle, ev.data]);

  const displayAtSiteVins = useMemo(
    () => new Set<string>([...provenAtHomeVins, ...acAtSiteVins]),
    [provenAtHomeVins, acAtSiteVins],
  );

  // The car the scene leads with is the one with the STRONGEST proof of being
  // at this site — a wall connector naming its VIN under load beats a
  // vehicle's own "I'm AC charging" claim, which beats whatever telemetry row
  // happened to be cached most recently. This is what puts ZenX (proven by
  // the ZenAiredale wall connector) back in the lead slot.
  const primaryEv = useMemo(() => {
    if (!ev.data.length) return undefined;
    return (
      ev.data.find((t) => provenAtHomeVins.has(t.site_id)) ??
      ev.data.find((t) => acAtSiteVins.has(t.site_id)) ??
      ev.data[0]
    );
  }, [ev.data, provenAtHomeVins, acAtSiteVins]);


  const solarStatsRaw = solarSnapshot(primarySolar);
  const batteryStats = batterySnapshot(primaryBattery);

  /**
   * SITE-METER SOLAR FALLBACK.
   * The Enphase inverter can report `current_power_w: 0` with `status: meter_issue`
   * while the Tesla site meter behind the same array reads real production. When
   * that happens the card used to say "Idle" on a producing roof. Take the larger
   * of the two readings for the SAME array — never a sum, so no double counting.
   */
  const siteSolarKw = useMemo(() => {
    const w = pickNumber(primaryBattery?.payload, ['solar_power', 'energy_sites.0.solar_power']);
    return w === null ? null : normalizeWattsToKw(w);
  }, [primaryBattery]);

  const solarStats = useMemo(() => {
    if (siteSolarKw === null) return solarStatsRaw;
    const best = Math.max(solarStatsRaw.currentKw ?? 0, siteSolarKw);
    if (best === (solarStatsRaw.currentKw ?? 0)) return solarStatsRaw;
    return { ...solarStatsRaw, currentKw: best };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarStatsRaw.currentKw, solarStatsRaw.todayKwh, solarStatsRaw.label, siteSolarKw]);


  // Pull exact model + color from Tesla vehicle_config so the EV area
  // mirrors the user's actual car (matches the Tesla app).
  const vehicleAsset = useMemo(
    () => resolveVehicleAsset(primaryEv?.payload ?? primaryEv, undefined, {
      fallbackWhenConnected: ev.data.length > 0,
    }),
    [primaryEv, ev.data.length],
  );

  // v5 Phase 5 — aggregate across ALL connected PV systems for supporting tiles.
  // Scene still uses primarySolar (per active tab); tiles show whole-home truth.
  const solarStatsAll = useMemo(() => {
    if (solar.data.length <= 1) return solarStats;
    const snaps = solar.data.map(solarSnapshot);
    const sum = (xs: Array<number | null>) =>
      xs.some((v) => v !== null) ? xs.reduce<number>((a, v) => a + (v ?? 0), 0) : null;
    return {
      currentKw: sum(snaps.map((s) => s.currentKw)),
      todayKwh: sum(snaps.map((s) => s.todayKwh)),
      lifetimeMwh: sum(snaps.map((s) => s.lifetimeMwh)),
      label: `${solar.data.length} systems`,
    };
  }, [solar.data, solarStats]);

  // TESTING ONLY — simulated battery charge line.
  // ON by default in the dev preview (4.2 kW charging @ 62% SOC). Override with
  // ?simBattery=-3.1 (discharge) or turn it off with ?simBattery=0.
  // Never active in a production build.
  const simBatteryKw = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const raw = new URLSearchParams(window.location.search).get('simBattery');
    if (raw === '0' || raw === 'off' || raw === 'false') return null;
    if (raw === null) return import.meta.env.DEV ? 4.2 : null;
    if (raw === '' || raw === '1' || raw === 'true' || raw === 'charging') return 4.2;
    if (raw === 'discharging') return -3.1;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 4.2;
  }, []);

  // v5 Phase 5 — aggregate across ALL connected Powerwalls / batteries.
  const batteryStatsAll = useMemo(() => {
    const withSim = <T extends { powerKw: number | null; soc: number | null; capacityKwh: number | null; reserveKwh: number | null; status: string }>(s: T): T => {
      if (simBatteryKw === null) return s;
      const capacityKwh = s.capacityKwh ?? POWERWALL_DEFAULT_CAPACITY_KWH;
      // Force a plausible mid-pack SOC so "99% · Charging" can't happen.
      const soc = simBatteryKw > 0 ? 62 : 78;

      const reserveKwh = Math.round(capacityKwh * (soc / 100) * 10) / 10;
      return {
        ...s,
        powerKw: simBatteryKw,
        soc,
        capacityKwh,
        reserveKwh,
        energyLeft: reserveKwh,
        status: simBatteryKw > 0.05 ? 'Charging' : simBatteryKw < -0.05 ? 'Discharging' : 'Idle',
      } as T;
    };
    if (battery.data.length <= 1) return withSim(batteryStats);
    const snaps = battery.data.map(batterySnapshot);
    const sumNonNull = (xs: Array<number | null>) =>
      xs.some((v) => v !== null) ? xs.reduce<number>((a, v) => a + (v ?? 0), 0) : null;
    const cap = sumNonNull(snaps.map((s) => s.capacityKwh));
    const reserve = sumNonNull(snaps.map((s) => s.reserveKwh));
    const power = sumNonNull(snaps.map((s) => s.powerKw));
    // Capacity-weighted SOC so two unequal packs report a true blended %.
    const socs = snaps
      .map((s) => ({ soc: s.soc, cap: s.capacityKwh ?? POWERWALL_DEFAULT_CAPACITY_KWH }))
      .filter((s) => s.soc !== null) as Array<{ soc: number; cap: number }>;
    const totalCap = socs.reduce((a, s) => a + s.cap, 0) || 1;
    const soc = socs.length
      ? socs.reduce((a, s) => a + s.soc * (s.cap / totalCap), 0)
      : null;
    return withSim({
      ...batteryStats,
      soc,
      powerKw: power,
      capacityKwh: cap,
      reserveKwh: reserve,
      energyLeft: reserve,
      status:
        power === null ? 'State pending' : power > 0.05 ? 'Charging' : power < -0.05 ? 'Discharging' : 'Idle',
      label: `${battery.data.length} Powerwalls`,
    });
  }, [battery.data, batteryStats, simBatteryKw]);



  // Current household load (kW) — also re-derived below as `homeKwRaw`,
  // computed here so we can feed it into the outage-lifecycle hook.
  const { weather: liveWeather } = useWeather();
  const weatherCodeForScene = liveWeather?.weatherCode ?? null;
  const outageHomeKw = normalizeWattsToKw(
    pickNumber(primaryBattery?.payload, ['load_power', 'energy_sites.0.load_power'])
  );

  // Side-effects on outage transitions: push notifications, proactive Deason,
  // and outage-history logging (peak load + Deason-interacted flag). Renders nothing.
  useOutageLifecycle({
    isGridOutage: autoOutage.isGridOutage,
    since: autoOutage.since,
    source: autoOutage.source ?? 'tesla',
    batteryStats: {
      soc: batteryStats.soc,
      capacityKwh: batteryStats.capacityKwh,
      powerKw: batteryStats.powerKw,
    },
    solarKw: solarStats.currentKw ?? 0,
    homeKw: outageHomeKw,
    primaryBattery: primaryBattery
      ? {
          device_id: (primaryBattery as { device_id?: string | null }).device_id ?? null,
          device_name: (primaryBattery as { device_name?: string | null }).device_name ?? null,
          oem: (primaryBattery as { oem?: string | null }).oem ?? null,
        }
      : null,
    batteryCount: battery.data?.length ?? 1,
  });
  const teslaFlow = useMemo(
    () => (hideVehicle ? null : deriveTeslaFlow(primaryEv, !!isActivelyCharging, sessionChargerKw)),
    [hideVehicle, primaryEv, isActivelyCharging, sessionChargerKw]
  );

  // Haptic ping on Tesla pill state change
  const lastPillState = useRef<TeslaPillState | null>(null);
  useEffect(() => {
    if (!teslaFlow) return;
    if (lastPillState.current && lastPillState.current !== teslaFlow.state) {
      void haptics.lightTap();
    }
    lastPillState.current = teslaFlow.state;
  }, [teslaFlow, haptics]);

  const handlePillClick = () => {
    void haptics.selection();
    if (evTileRef.current) {
      evTileRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setPingTile(true);
      window.setTimeout(() => setPingTile(false), 1300);
    }
  };

  const latestTelemetry = useMemo(() => {
    const rows = [...solar.data, ...battery.data, ...ev.data];
    if (rows.length === 0) return null;
    return rows.sort((a, b) => new Date(b.cached_at).getTime() - new Date(a.cached_at).getTime())[0];
  }, [solar.data, battery.data, ev.data]);

  /** Provenance for each readout — every number on this card states its age. */
  const asOfFor = (rows: CachedTelemetry[]) => {
    const r = rows[0];
    return { iso: r?.sample_at ?? r?.cached_at ?? null, fresh: !!r?.fresh };
  };
  const solarAsOf = asOfFor(solar.data);
  const batteryAsOf = asOfFor(battery.data);
  const evAsOf = asOfFor(ev.data);
  const chargerAsOf = {
    iso: chargers.data[0]?.last_synced_at ?? null,
    fresh: !chargers.loading && !!chargers.data[0]?.last_synced_at,
  };


  const homeKwRaw = normalizeWattsToKw(pickNumber(primaryBattery?.payload, ['load_power', 'energy_sites.0.load_power']));
  const evKwRaw = pickNumber(primaryEv?.payload, ['charge_rate_kw', 'charger_power', 'vehicles.0.charger_power']) ?? 0;
  const gridKwRaw = normalizeWattsToKw(pickNumber(primaryBattery?.payload, ['grid_power', 'energy_sites.0.grid_power']));
  // Presence rule (display only): a vehicle's onboard meter is subtracted from
  // site load ONLY when an open `home_charging_sessions` row proves it is
  // charging AT THIS SITE — never from the old "AC charge implies home"
  // inference, which mislabels a friend's Level 2 charger as home load. Every
  // qualifying vehicle is summed, so two cars on the driveway both subtract.
  const evHomeKw = useMemo(() => {
    if (hideVehicle || openHomeChargingVins.size === 0) return 0;
    return ev.data.reduce((sum, t) => {
      if (!openHomeChargingVins.has(t.site_id)) return sum;
      const kw =
        pickNumber(t.payload, [
          'charge_rate_kw',
          'charger_power',
          'vehicles.0.charger_power',
          'response.charge_state.charger_power',
        ]) ?? 0;
      return sum + Math.max(0, kw);
    }, 0);
  }, [hideVehicle, ev.data, openHomeChargingVins]);
  // Home load is the meter reading or nothing. `null` hands the decision to
  // reconcileEnergyFlow(), which derives it from the site balance and flags it
  // as derived — an honest computation, not a replayed browser value.
  const effectiveHomeKwRaw = homeKwRaw !== null && homeKwRaw > 0.05 ? homeKwRaw : null;
  /** True when home load is computed from the site balance, not read from a meter. */
  const homeDerivedFlag = effectiveHomeKwRaw === null;

  const reconciledFlow = reconcileEnergyFlow({
    solarKw: solarStats.currentKw ?? 0,
    rawHomeKw: effectiveHomeKwRaw,
    batteryKw: batteryStatsAll.powerKw ?? 0,
    rawGridKw: gridKwRaw,
    evHomeKw,
  });


  const flowData = {
    solarPower: solarStats.currentKw ?? 0,
    homePower: reconciledFlow.homeKw,
    batteryPower: batteryStatsAll.powerKw ?? 0,
    batteryPercent: Math.round(batteryStatsAll.soc ?? 0),
    batteryCapacityKwh: batteryStatsAll.capacityKwh ?? undefined,
    batteryReserveKwh: batteryStatsAll.reserveKwh ?? undefined,
    gridPower: reconciledFlow.gridKw,
    evPower: hideVehicle ? 0 : evKwRaw,
    tesla: teslaFlow
      ? {
          kW: teslaFlow.kW,
          soc: teslaFlow.soc,
          rangeMi: teslaFlow.rangeMi,
          isCharging: teslaFlow.isCharging,
          source: teslaFlow.source,
        }
      : undefined,
  };

  // Render matrix (first match wins).
  // 1. Nothing connected → legacy AnimatedEnergyFlow placeholder. This is the
  //    ONLY remaining caller of the mock house — every other branch shows real
  //    data for the actual device combination.
  if (empty) {
    return (
      <div className="w-full">
        <Suspense fallback={<div className="w-full h-64 bg-card/10 animate-pulse" aria-hidden="true" />}>
          <AnimatedEnergyFlow className="w-full" />
        </Suspense>
        <div className="border-t border-primary/20 bg-card/30 px-4 py-2.5 text-center text-[11px] text-muted-foreground">
          Premium unlocked.{' '}
          <Link to="/clean-energy-center" className="font-semibold text-primary hover:underline">
            Connect solar, a battery, your Tesla, or a charger
          </Link>{' '}
          to see live data here.
        </div>
      </div>
    );
  }

  // 2. Charger only (no solar / battery / Tesla EV) → ChargerOnlyLiveCard.
  if (!hasSolar && !hasRichCockpit && hasCharger) {
    return <ChargerOnlyLiveCard />;
  }

  // 3. Any other real device combo (solar, solar+charger, solar+battery, etc.)
  //    → rich EnergyFlowScene cockpit. The scene is device-aware via the
  //    hasBattery / hasCharger / hasTesla props so it never fabricates a
  //    Powerwall or Tesla for users who don't have one.



  // 4. Otherwise → rich EnergyFlowScene cockpit (existing path).
  const subtitleParts: string[] = [];
  if (hasSolar) subtitleParts.push(`${oemLabel(primarySolar?.oem ?? 'solar')} solar`);
  if (hasBattery) subtitleParts.push('Tesla Powerwall');
  if (hasTesla) subtitleParts.push(primaryEv?.device_name ?? 'ZenX');
  if (hasCharger && !hasTesla) subtitleParts.push(chargers.data[0]?.device_name ?? 'Wallbox');
  const cockpitSubtitle = hideVehicle
    ? `ZenEnergy · ${subtitleParts.join(' + ') || 'Live'}`
    : `Home Energy Cockpit · ${subtitleParts.join(' + ') || 'Live'}`;

  // §2 — ONE badge per card, and it speaks for the OLDEST in-scope signal.
  // Solar / battery / grid CT are always in scope. A vehicle is in scope only
  // when it is claimed into Connected Devices and therefore expected to
  // report; an unclaimed car must not drag the household badge down.
  const cardFreshness = computeCardFreshness([
    ...solar.data.map((r) => ({ iso: r.sample_at ?? r.cached_at })),
    ...battery.data.map((r) => ({ iso: r.sample_at ?? r.cached_at })),
    ...ev.data.map((r) => ({ iso: r.sample_at ?? r.cached_at, inScope: true })),
  ]);
  const cardIso = cardFreshness.iso;

  // Dead: the badge is the only content the card shows. No partial numbers
  // survive underneath a household that has gone dark.
  if (cardFreshness.state === 'dead') {
    return (
      <CardFreshnessContext.Provider value={cardIso}>
        <div className="w-full p-4">
          <LiveCardHeader
            subtitle={cockpitSubtitle}
            ageLabel={cardFreshness.label}
            freshnessClassName={cardFreshness.className}
            onRefresh={handleManualRefresh}
            refreshing={manualRefreshing}
          />
          <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-300/90">
              No reading in over 24 hours
            </p>
            <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
              Live values are withheld rather than replayed. Retry the connection, or reconnect
              the account in{' '}
              <Link to="/clean-energy-center" className="font-semibold text-primary hover:underline">
                Connected Devices
              </Link>
              .
            </p>
          </div>
        </div>
      </CardFreshnessContext.Provider>
    );
  }

  return (
    <CardFreshnessContext.Provider value={cardIso}>
    <div className="w-full p-4">
      <LiveCardHeader
        subtitle={cockpitSubtitle}
        ageLabel={cardFreshness.label}
        freshnessClassName={cardFreshness.className}
        onRefresh={handleManualRefresh}
        refreshing={manualRefreshing}
      />

      {(() => {
        // Surface whichever telemetry lane is unhealthiest so a broken OEM
        // never leaves the tile silently frozen. Prefer paused > retrying.
        // A reading older than 24h renders the "gone dark" state even when
        // every lane reports healthy — a latched pause freezes the counter.
        const states = [solar.syncState, battery.syncState, ev.syncState];
        const worst: 'ok' | 'retrying' | 'paused' =
          states.includes('paused') ? 'paused' : states.includes('retrying') ? 'retrying' : 'ok';
        const latestIso = latestTelemetry?.sample_at ?? latestTelemetry?.cached_at ?? null;
        if (worst === 'ok' && !isDarkReading(latestIso)) return null;
        const onRetry = () => {
          solar.resetFailures();
          battery.resetFailures();
          ev.resetFailures();
        };
        return (
          <div className="mb-3 -mt-1">
            <TelemetrySyncBadge syncState={worst} onRetry={onRetry} latestIso={latestIso} />
          </div>
        );
      })()}


      {/* §3 — the standalone "SITE BALANCE UNRESOLVED" banner is gone. It
          compared the RAW grid CT against a diagram drawn from the RECONCILED
          value, so it manufactured a discrepancy on a site whose meters
          agreed. Provenance is now stated per-tile from the one
          `reconciledFlow` object, and only on the frames it applies to. */}

      {/* v5 — multi-PV site selector (only renders when ≥2 PV systems) */}
      <SolarSiteTabs
        sites={solar.data}
        activeSiteId={activeSolarSiteId ?? solar.data[0]?.site_id ?? null}
        onSelect={setActiveSolarSiteId}
      />





      {(() => {
        // Master live pill — Tesla charging wins, then Powerwall discharging, charging, solar export, solar, grid import, idle.
        const pw = batteryStatsAll.powerKw;
        const solarKw = solarStatsAll.currentKw ?? 0;
        const gridKw = reconciledFlow.gridKw;
        let pillState:
          | 'tesla-charging' | 'discharging' | 'charging' | 'grid-export'
          | 'solar' | 'grid-import' | 'idle' = 'idle';
        if (teslaFlow?.isCharging) pillState = 'tesla-charging';
        else if (pw !== null && pw < -0.05) pillState = 'discharging';
        else if (pw !== null && pw > 0.05) pillState = 'charging';
        else if (gridKw < -0.1) pillState = 'grid-export';
        else if (solarKw > 0.1) pillState = 'solar';
        else if (gridKw > 0.1) pillState = 'grid-import';

        if (teslaFlow) {
          return (
            <div className="mb-3" data-pill-state={pillState}>
              <TeslaStatusPill tesla={teslaFlow} onClick={handlePillClick} />
            </div>
          );
        }

        // Non-Tesla fallback pill — keeps the cockpit always-narrated
        const socPct = Math.round(batteryStatsAll.soc ?? 0);
        const pillCfg: Record<typeof pillState, { dot: string; ring: string; label: string }> = {
          'tesla-charging': { dot: 'bg-emerald-400', ring: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', label: '' },
          'discharging':    { dot: 'bg-amber-400',   ring: 'border-amber-400/40 bg-amber-400/10 text-amber-300',     label: `Powerwall Discharging • ${Math.abs(pw ?? 0).toFixed(1)} kW • ${socPct}% SOC` },
          'charging':       { dot: 'bg-emerald-400', ring: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', label: `Powerwall Charging • ${(pw ?? 0).toFixed(1)} kW • ${socPct}% SOC` },
          'grid-export':    { dot: 'bg-cyan-400',    ring: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300',         label: `Exporting to Grid • ${Math.abs(gridKw).toFixed(1)} kW` },
          'solar':          { dot: 'bg-amber-400',   ring: 'border-amber-400/40 bg-amber-400/10 text-amber-300',     label: `Solar Producing • ${solarKw.toFixed(1)} kW` },
          'grid-import':    { dot: 'bg-violet-400',  ring: 'border-violet-400/40 bg-violet-400/10 text-violet-300',   label: `Grid Import • ${gridKw.toFixed(1)} kW` },
          'idle':           { dot: 'bg-muted-foreground/60', ring: 'border-muted-foreground/20 bg-muted/30 text-muted-foreground', label: 'System Idle' },
        };

        const cfg = pillCfg[pillState];
        if (!cfg.label) return null;
        return (
          <div className="mb-3" data-pill-state={pillState}>
            <span
              className={`inline-flex w-full sm:w-auto items-center gap-2.5 rounded-full border px-4 py-2 text-[13px] font-semibold tracking-wide ${cfg.ring}`}
              style={{ boxShadow: pillState === 'discharging' ? '0 0 24px hsl(38 95% 55% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.06)' : pillState === 'charging' || pillState === 'solar' ? '0 0 20px hsl(142 75% 50% / 0.28), inset 0 1px 0 hsl(0 0% 100% / 0.06)' : 'inset 0 1px 0 hsl(0 0% 100% / 0.04)' }}
            >
              <span aria-hidden="true" className={`relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.dot}`}>
                {(pillState === 'discharging' || pillState === 'charging' || pillState === 'solar') && (
                  <span className={`absolute inset-0 inline-flex h-full w-full animate-ping rounded-full ${cfg.dot} opacity-75`} />
                )}
              </span>
              <span className="truncate">{cfg.label}</span>
            </span>
          </div>
        );
      })()}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div
            key={outage?.active ? 'outage' : 'normal'}
            className="overflow-hidden rounded-xl border border-primary/20 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%),radial-gradient(circle_at_bottom,hsl(220_60%_8%/0.6),transparent_60%)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04),0_8px_30px_-8px_hsl(220_60%_4%/0.6)] animate-in fade-in duration-300"
          >
            <Suspense fallback={<div className="aspect-square w-full animate-pulse bg-card/10" aria-hidden="true" />}>
              <EnergyFlowScene
                className="aspect-square w-full"
                data={flowData}
                hasBattery={hasBattery}
                hasCharger={hasCharger}
                hasTesla={hasTesla}
                isOutage={outage?.active ?? false}
                outageBackupLabel={
                  outage?.active
                    ? estimateBackupTime({
                        socPct: batteryStats.soc ?? 0,
                        usableCapacityKwh: batteryStats.capacityKwh ?? 13.5,
                        currentDischargeKw: Math.max(0, -(batteryStats.powerKw ?? 0)),
                        smoothingKey: 'live-card-outage',
                      }).label
                    : undefined
                }
                outageStartedAt={outage?.active ? outage.startedAt : undefined}
                teslaPayload={
                  !hideVehicle && primaryEv?.oem === 'tesla'
                    ? {
                        ...((primaryEv?.payload as Record<string, unknown>) ?? {}),
                        device_name: primaryEv?.device_name,
                        display_name:
                          (primaryEv?.payload as any)?.display_name ?? primaryEv?.device_name,
                        metadata: {
                          ...(((primaryEv as any)?.metadata as Record<string, unknown>) ?? {}),
                          device_name: primaryEv?.device_name,
                          vin:
                            (primaryEv as any)?.device_id ?? (primaryEv?.payload as any)?.vin,
                        },
                      }
                    : undefined
                }
                batteryPayload={primaryBattery?.payload}
                batteryCount={battery.data?.length ?? 1}
                weatherCode={weatherCodeForScene}
                vehicleModel={null}
                /* §5 — a car is drawn only when a wall connector reported its
                   VIN under load. Fail-closed: the vehicle's own "charging"
                   claim is not co-location proof. */
                presenceProven={
                  !hideVehicle &&
                  !!primaryEv &&
                  displayAtSiteVins.has((primaryEv as { site_id?: string }).site_id ?? '')
                }
                gridSource={reconciledFlow.gridSource}
                gridOverrideReason={reconciledFlow.overrideReason}
                homeDerived={reconciledFlow.homeDerived}
              />
            </Suspense>
            {/* Slim outage footer — load vs capacity progress + history link.
                Lives inside the same card so the experience reads as one
                unified Tesla-style view rather than a stack of panels. */}
            {outage?.active && (
              <OutageFooter
                socPct={batteryStats.soc ?? 0}
                usableCapacityKwh={batteryStats.capacityKwh ?? 13.5}
                dischargeKw={Math.max(0, -(batteryStats.powerKw ?? 0))}
                solarProducingKw={solarStats.currentKw ?? 0}
              />
            )}
          </div>

          {/* §7 — sources over sinks, built from the same reconciledFlow the
              scene and the tiles read. Measured segments render solid,
              derived segments hatched, and a genuine shortfall renders grey
              rather than being absorbed into whichever channel tidies up. */}
          <SourcesSinksStrip flow={reconciledFlow} />

          {/* §11 — provenance legend. Grid states its LIVE state (measured
              most frames, reconciled on the frames the CT disagreed); home is
              derived with no exceptions. */}
          <div className="-mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-primary/70" />
              Measured: solar · battery{reconciledFlow.gridSource === 'raw' ? ' · grid' : ''}
            </span>
            <span
              className="inline-flex items-center gap-1"
              title="Home load has no meter behind it. It is computed from the site balance every frame."
            >
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400/70" />
              Derived: home *
            </span>
            {reconciledFlow.gridSource === 'reconciled' && (
              <span
                className="inline-flex items-center gap-1 text-amber-300/80"
                title={reconciledFlow.overrideReason ?? undefined}
              >
                <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rotate-45 bg-amber-400/80" />
                Grid derived this frame
              </span>
            )}
            {ev.data.length > 0 && provenAtHomeVins.size === 0 && acAtSiteVins.size === 0 && (
              <span
                className="inline-flex items-center gap-1"
                title="The vehicle's own meter, no location claim."
              >
                <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                Vehicle observed, not proven at this site
              </span>
            )}
            {/* §5 — non-Tesla households. A charger that cannot report the
                connected vehicle's VIN can never satisfy the presence gate, so
                the driveway stays empty by design. Say that out loud, or an
                empty driveway reads as the old presence bug. */}
            {ev.data.length === 0 && hasCharger && (
              <span
                className="inline-flex items-center gap-1 text-muted-foreground/60"
                title="This charger does not report the connected vehicle's identity, so co-location at this address cannot be proven. Charging energy is still metered; the car is simply not drawn."
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full border border-dashed border-muted-foreground/60"
                />
                Presence proof not available for this charger — vehicle not drawn
              </span>
            )}

          </div>

          {/* Live Devices group — ZenX pill + EV details, clearly grouped */}
          {!hideVehicle && (teslaFlow || ev.data.length > 0) && (
            <section className="space-y-3 border-t border-border/30 pt-5">
              <SectionLabel>Live Devices</SectionLabel>

              {/* ZenX vehicle pill — clean Tesla-style status under the scene */}
              {teslaFlow && (
                <ZenXPill
                  tesla={teslaFlow}
                  nickname={primaryEv?.device_name ?? 'ZenX'}
                  onClick={handlePillClick}
                />
              )}

              {/* Tesla / EV tile — promoted directly under diagram */}
              {ev.data.length > 0 && (
                <div
                  ref={evTileRef}
                  id="tesla-ev-tile"
                  tabIndex={-1}
                  aria-label="Tesla details"
                  className={`rounded-lg outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary ${pingTile ? 'ring-2 ring-primary/60 shadow-[0_0_24px_hsl(var(--primary)/0.35)]' : ''}`}
                >
                  {ev.data.map((t) => (
                    <EVTile
                      key={`e-${t.oem}-${t.site_id}`}
                      t={t}
                      totals7d={evTotals.totals}
                      liveDot={teslaFlow?.isCharging && t.oem === 'tesla'}
                      sourceLabel={t.oem === 'tesla' ? teslaFlow?.sourceLabel : undefined}
                    />
                  ))}
                </div>
              )}
            </section>
          )}


          <section className="space-y-3 border-t border-border/30 pt-5">
            <SectionLabel>Today’s Clean Energy</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Orange — Solar produced today */}
              <MetricTile
                tone="orange"
                icon={Sun}
                label={solar.data.length > 1 ? `Solar · ${solar.data.length} systems` : 'Solar Produced'}
                value={formatKwh(solarStatsAll.todayKwh)}
                detail={`${formatKw(solarStatsAll.currentKw)} now · today`}
                asOf={solarAsOf}
              />

              {/* Green — Battery kWh exported today */}
              {hasBattery ? (
                <MetricTile
                  tone="green"
                  icon={BatteryCharging}
                  label={battery.data.length > 1 ? `${battery.data.length} Batteries · kWh Exported` : 'Battery kWh Exported'}
                  value={
                    batteryKwhExportedToday !== undefined
                      ? `${batteryKwhExportedToday.toFixed(1)} kWh`
                      : batteryStatsAll.reserveKwh !== null && batteryStatsAll.capacityKwh !== null
                        ? `${batteryStatsAll.reserveKwh.toFixed(1)} kWh`
                        : batteryStatsAll.soc !== null ? `${Math.round(batteryStatsAll.soc)}%` : '—'
                  }
                  detail={(() => {
                    const pct = batteryStatsAll.soc !== null ? `${Math.round(batteryStatsAll.soc)}%` : '—';
                    if (batteryStatsAll.powerKw === null) return `${pct} · ${batteryStatsAll.status}`;
                    if (batteryStatsAll.powerKw > 0.05) return `${pct} · +${batteryStatsAll.powerKw.toFixed(1)} kW charging`;
                    if (batteryStatsAll.powerKw < -0.05) return `${pct} · ${batteryStatsAll.powerKw.toFixed(1)} kW discharging`;
                    const isFull = batteryStatsAll.soc !== null && batteryStatsAll.soc >= 99;
                    return `${pct} · ${isFull ? 'Full' : 'Idle'}`;
                  })()}
                  asOf={batteryAsOf}
                />
              ) : (
                <MetricTile
                  tone="green"
                  icon={Zap}
                  label={chargers.data[0]?.device_name ?? 'Home Charger'}
                  value={
                    chargers.data[0]?.lifetime_kwh !== null && chargers.data[0]?.lifetime_kwh !== undefined
                      ? `${chargers.data[0].lifetime_kwh.toFixed(0)} kWh`
                      : '—'
                  }
                  detail={`Lifetime · ${chargers.data[0]?.total_sessions ?? 0} sessions`}
                  asOf={chargerAsOf}
                />
              )}

              {/* RETIRED — the vehicle hero image and the Home & AC Charging /
                  Tesla Supercharging / EV Mileage tiles used to live here. They
                  duplicated the in-scene vehicle: a flat side-profile cut-out
                  beside the isometric house, plus a second place to answer "is
                  my car charging". Vehicle state now lives in exactly one
                  place — the scene sprite, its charge chip, and the Live
                  Devices pill/tile directly beneath it. Do not re-add tiles
                  here; extend the in-scene chips instead. */}

            </div>
            {lifetime.hasAny && (
              <div className="mt-1 rounded-lg border border-primary/15 bg-background/40 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Lifetime · Since Connected
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">
                    Meter readings · not a balance
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                  {lifetime.solarKwh > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Solar
                        {lifetime.observerSolarKwh > 0 && (
                          <span className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground/60">
                            metered source only
                          </span>
                        )}
                      </span>
                      <span className="font-semibold text-foreground">{(lifetime.solarKwh / 1000).toFixed(2)} MWh</span>
                    </div>
                  )}
                  {lifetime.batteryDischargeKwh > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Battery discharged</span>
                      <span className="font-semibold text-foreground">{lifetime.batteryDischargeKwh.toFixed(0)} kWh</span>
                    </div>
                  )}
                  {/* Odometers are per-vehicle meter readings and are never
                      summed — two cars' odometers do not add to a household
                      distance. Each is listed against its own vehicle. */}
                  {lifetime.vehicles.map((v) => (
                    <div key={v.deviceId} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{v.name} odometer</span>
                      <span className="font-semibold text-foreground">{Math.round(v.odometerMi).toLocaleString()} mi</span>
                    </div>
                  ))}
                  {lifetime.superchargerKwh > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Supercharged</span>
                      <span className="font-semibold text-foreground">{lifetime.superchargerKwh.toFixed(0)} kWh</span>
                    </div>
                  )}
                  {lifetime.homeKwh > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Home charged</span>
                      <span className="font-semibold text-foreground">{lifetime.homeKwh.toFixed(0)} kWh</span>
                    </div>
                  )}
                  {(lifetime.fsdMiles > 0 || lifetime.fsdSource === 'official') && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        FSD miles
                        {lifetime.fsdSource === 'official' && (
                          <span className="ml-1 text-[10px] uppercase tracking-wider text-primary/80">Tesla verified</span>
                        )}
                        {lifetime.fsdSource === 'calculated_hw3' && (
                          <span className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">Estimated</span>
                        )}
                      </span>
                      <span className="font-semibold text-foreground">
                        {lifetime.fsdMiles > 0
                          ? `${Math.round(lifetime.fsdMiles).toLocaleString()} mi`
                          : 'Awaiting first FSD drive'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="px-0.5 text-[10px] leading-snug text-muted-foreground/70">
              ≈ {Math.max(0, solarStatsAll.todayKwh ?? 0).toFixed(1)} $ZSOLAR ready to mint today
            </div>
          </section>



          <div className="flex flex-col gap-2 rounded-lg border border-primary/15 bg-primary/5 p-4">
            <div className="flex items-start gap-2.5">
              <div className="rounded-md bg-primary/15 p-1.5 ring-1 ring-primary/25">
                <Route className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {mintImpact.loading
                    ? 'Calculating today’s mint'
                    : mintImpact.tokens > 0
                      ? `${mintImpact.tokens.toFixed(1)} $ZSOLAR minted today`
                      : solarStats.todayKwh && solarStats.todayKwh > 0
                        ? `${solarStats.todayKwh.toFixed(1)} kWh ready to mint`
                        : 'Awaiting today’s verified energy'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {mintImpact.loading
                    ? 'Verifying receipt impact'
                    : mintImpact.tokens > 0
                      ? 'Verified by Proof-of-Genesis'
                      : 'Proof of Genesis once production posts'}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
    </CardFreshnessContext.Provider>
  );
}
