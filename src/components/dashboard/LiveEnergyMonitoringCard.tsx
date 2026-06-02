import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BatteryCharging, Car, Clock3, Gauge, Home, Loader2, RefreshCw, Route, Sparkles, Sun, Zap, type LucideIcon } from 'lucide-react';
import { useActiveChargingSession } from '@/hooks/useActiveChargingSession';
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
import { supabase } from '@/integrations/supabase/client';

const EnergyFlowScene = lazy(() =>
  import('./EnergyFlowScene').then((m) => ({ default: m.EnergyFlowScene }))
);
const AnimatedEnergyFlow = lazy(() =>
  import('./AnimatedEnergyFlow').then((m) => ({ default: m.AnimatedEnergyFlow }))
);
import { ZenXPill } from './ZenXPill';
import { LiveCardHeader } from './LiveCardHeader';
import { SolarPlusCard } from './SolarPlusCard';
import { ChargerOnlyLiveCard } from './ChargerOnlyLiveCard';
import { useChargerDevices } from '@/hooks/useChargerDevices';

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

function reconcileEnergyFlow(input: {
  solarKw: number;
  rawHomeKw: number | null;
  batteryKw: number;
  rawGridKw: number | null;
  evHomeKw: number;
}) {
  const solar = Math.max(0, input.solarKw);
  const battery = input.batteryKw;
  const evHome = Math.max(0, input.evHomeKw);
  const batteryLoad = Math.max(0, battery);
  const batterySource = Math.max(0, -battery);

  const derivedGrid = evHome + batteryLoad + Math.max(0, input.rawHomeKw ?? 0) - solar - batterySource;
  const hasUsableHome = input.rawHomeKw !== null && input.rawHomeKw > 0.05;
  const homeFromBalance = input.rawGridKw !== null
    ? solar + batterySource + Math.max(0, input.rawGridKw) - batteryLoad - Math.max(0, -input.rawGridKw) - evHome
    : null;
  const homeKw = hasUsableHome
    ? input.rawHomeKw!
    : Math.max(0, homeFromBalance ?? input.rawHomeKw ?? 0);
  const balancedGrid = evHome + batteryLoad + homeKw - solar - batterySource;
  const rawMismatch = input.rawGridKw !== null && Math.abs(input.rawGridKw - balancedGrid) > Math.max(0.7, solar * 0.35);
  const gridKw = input.rawGridKw === null || rawMismatch ? balancedGrid : input.rawGridKw;

  return {
    homeKw,
    gridKw,
    gridCorrected: rawMismatch,
    derivedGrid,
  };
}

const LIVE_HOME_LAST_KNOWN_KEY = 'zen:live:lastKnownHomeKw';

function readLastKnownHomeKw(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(LIVE_HOME_LAST_KNOWN_KEY);
  const n = raw === null ? NaN : Number(raw);
  return Number.isFinite(n) && n > 0.05 ? n : null;
}

function rememberLastKnownHomeKw(v: number | null) {
  if (typeof window === 'undefined' || v === null || v <= 0.05) return;
  window.localStorage.setItem(LIVE_HOME_LAST_KNOWN_KEY, String(Math.min(20, v)));
}

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

function FreshChip({ fresh }: { fresh: boolean }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
      fresh ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground'
    }`}>
      {fresh ? 'Live' : 'Cached'}
    </span>
  );
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

function EVTile({ t, totals7d, liveDot, sourceLabel: sourceLabelOverride }: { t: CachedTelemetry; totals7d: { home_kwh: number; supercharger_kwh: number }; liveDot?: boolean; sourceLabel?: string }) {
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
        <FreshChip fresh={t.fresh} />
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

function MetricTile({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-primary/15 bg-background/45 p-3 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{detail}</div>
    </div>
  );
}

export type TeslaPillState = 'charging' | 'idle' | 'unplugged';

export interface TeslaFlow {
  kW: number;
  soc: number;
  rangeMi: number;
  isCharging: boolean;
  source: 'home' | 'supercharger' | 'public' | 'none';
  state: TeslaPillState;
  sourceLabel: string;
  rawChargingState: string | null;
  fastChargerType: string | null;
  phases: number | null;
  timeToFullHrs: number | null;
  energyAdded: number | null;
}


export function deriveTeslaFlow(t: CachedTelemetry | undefined, sessionActive: boolean): TeslaFlow | null {
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
  const kW = directKw ?? (ivKw > 0 ? ivKw : 0);
  const energyAdded = pickNumber(p, ['charge_energy_added', 'vehicles.0.charge_energy_added', 'response.charge_state.charge_energy_added']);
  const timeToFullHrs = pickNumber(p, ['time_to_full_charge', 'response.charge_state.time_to_full_charge']);
  const fastChargerType = pickString(p, ['fast_charger_type', 'charger_type', 'response.charge_state.fast_charger_type']);
  const phases = pickNumber(p, ['charger_phases', 'response.charge_state.charger_phases']);

  const stateStr = (rawChargingState ?? '').toLowerCase();
  const apiCharging = stateStr === 'charging';
  const isCharging = apiCharging || sessionActive;

  // Source detection — mirror tesla-charge-monitor backend heuristic:
  // unknown AC charging defaults to HOME (not Public L2). Only label
  // 'supercharger' when we have positive DC-fast evidence.
  const fc = (fastChargerType ?? '').toLowerCase();
  const isDcFast = fc.includes('supercharger') || fc.includes('combo') || fc.includes('chademo') || fc === 'tesla';
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


export function LiveEnergyMonitoringCard() {
  const solar = useSolarTelemetry();
  const battery = useBatteryTelemetry();
  const ev = useEVChargerTelemetry();
  const chargers = useChargerDevices();
  const evTotals = useEVTotals(7);
  const mintImpact = useTodayMintImpact();
  const { data: isActivelyCharging } = useActiveChargingSession();
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const lastChargingRef = useRef<boolean | undefined>(undefined);
  const evTileRef = useRef<HTMLDivElement | null>(null);
  const [pingTile, setPingTile] = useState(false);
  const haptics = useHaptics();

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
  const hasTesla = ev.data.some((t) => t.oem === 'tesla');
  const hasCharger = chargers.data.length > 0;
  const hasRichCockpit = hasBattery || hasTesla; // EnergyFlowScene needs ≥1 of these
  const empty =
    !loading && !hasSolar && !hasBattery && !hasTesla && !hasCharger;

  const primarySolar = solar.data[0];
  const primaryBattery = battery.data[0];
  const primaryEv = ev.data[0];
  const solarStats = solarSnapshot(primarySolar);
  const batteryStats = batterySnapshot(primaryBattery);
  const teslaFlow = useMemo(
    () => deriveTeslaFlow(primaryEv, !!isActivelyCharging),
    [primaryEv, isActivelyCharging]
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

  const homeKwRaw = normalizeWattsToKw(pickNumber(primaryBattery?.payload, ['load_power', 'energy_sites.0.load_power']));
  const evKwRaw = pickNumber(primaryEv?.payload, ['charge_rate_kw', 'charger_power', 'vehicles.0.charger_power']) ?? 0;
  const gridKwRaw = normalizeWattsToKw(pickNumber(primaryBattery?.payload, ['grid_power', 'energy_sites.0.grid_power']));
  const evHomeKw = teslaFlow?.isCharging && teslaFlow.source === 'home' ? teslaFlow.kW : 0;
  const effectiveHomeKwRaw = homeKwRaw !== null && homeKwRaw > 0.05 ? homeKwRaw : readLastKnownHomeKw();
  const reconciledFlow = reconcileEnergyFlow({
    solarKw: solarStats.currentKw ?? 0,
    rawHomeKw: effectiveHomeKwRaw,
    batteryKw: batteryStats.powerKw ?? 0,
    rawGridKw: gridKwRaw,
    evHomeKw,
  });
  useEffect(() => {
    rememberLastKnownHomeKw(reconciledFlow.homeKw);
  }, [reconciledFlow.homeKw]);

  const flowData = {
    solarPower: solarStats.currentKw ?? 0,
    homePower: reconciledFlow.homeKw,
    batteryPower: batteryStats.powerKw ?? 0,
    batteryPercent: Math.round(batteryStats.soc ?? 0),
    batteryCapacityKwh: batteryStats.capacityKwh ?? undefined,
    batteryReserveKwh: batteryStats.reserveKwh ?? undefined,
    gridPower: reconciledFlow.gridKw,
    evPower: evKwRaw,
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
  const cockpitSubtitle = `Home Energy Cockpit · ${subtitleParts.join(' + ') || 'Live'}`;

  return (
    <div className="w-full p-4">
      <LiveCardHeader
        subtitle={cockpitSubtitle}
        ageLabel={formatAge(latestTelemetry?.sample_at ?? latestTelemetry?.cached_at ?? null)}
        freshnessClassName={freshnessClass(
          latestTelemetry?.sample_at ?? latestTelemetry?.cached_at ?? null,
          !!latestTelemetry?.fresh,
        )}
        onRefresh={handleManualRefresh}
        refreshing={manualRefreshing}
      />



      {(() => {
        // Master live pill — Tesla charging wins, then Powerwall discharging, charging, solar, grid import, idle.
        const pw = batteryStats.powerKw;
        const solarKw = solarStats.currentKw ?? 0;
        const gridKw = reconciledFlow.gridKw;
        let pillState: 'tesla-charging' | 'discharging' | 'charging' | 'solar' | 'grid-import' | 'idle' = 'idle';
        if (teslaFlow?.isCharging) pillState = 'tesla-charging';
        else if (pw !== null && pw < -0.05) pillState = 'discharging';
        else if (pw !== null && pw > 0.05) pillState = 'charging';
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
        const pillCfg: Record<typeof pillState, { dot: string; ring: string; label: string }> = {
          'tesla-charging': { dot: 'bg-emerald-400', ring: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', label: '' },
          'discharging':    { dot: 'bg-amber-400',   ring: 'border-amber-400/40 bg-amber-400/10 text-amber-300',     label: `Powerwall Discharging • ${Math.abs(pw ?? 0).toFixed(1)} kW • ${Math.round(batteryStats.soc ?? 0)}% SOC` },
          'charging':       { dot: 'bg-emerald-400', ring: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300', label: `Powerwall Charging • ${(pw ?? 0).toFixed(1)} kW • ${Math.round(batteryStats.soc ?? 0)}% SOC` },
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
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-primary/20 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%),radial-gradient(circle_at_bottom,hsl(220_60%_8%/0.6),transparent_60%)] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04),0_8px_30px_-8px_hsl(220_60%_4%/0.6)]">
            <Suspense fallback={<div className="aspect-square w-full animate-pulse bg-card/10" aria-hidden="true" />}>
              <EnergyFlowScene
                className="aspect-square w-full"
                data={flowData}
                teslaPayload={
                  primaryEv?.oem === 'tesla'
                    ? {
                        ...((primaryEv?.payload as Record<string, unknown>) ?? {}),
                        // Surface device-level identity so the resolver can infer
                        // model/color even if vehicle_config isn't in the cached payload yet.
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
                vehicleModel={null}

              />

            </Suspense>
          </div>

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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MetricTile
              icon={Sun}
              label="Today"
              value={formatKwh(solarStats.todayKwh)}
              detail={`${formatKw(solarStats.currentKw)} now · ${solarStats.label}`}
            />
            <MetricTile
              icon={BatteryCharging}
              label="Powerwall"
              value={
                batteryStats.reserveKwh !== null && batteryStats.capacityKwh !== null
                  ? `${batteryStats.reserveKwh.toFixed(1)} / ${batteryStats.capacityKwh.toFixed(1)} kWh`
                  : batteryStats.soc !== null ? `${Math.round(batteryStats.soc)}%` : '—'
              }
              detail={(() => {
                const pct = batteryStats.soc !== null ? `${Math.round(batteryStats.soc)}%` : '—';
                if (batteryStats.powerKw === null) return `${pct} · ${batteryStats.status}`;
                if (batteryStats.powerKw > 0.05) return `${pct} · +${batteryStats.powerKw.toFixed(1)} kW charging`;
                if (batteryStats.powerKw < -0.05) return `${pct} · ${batteryStats.powerKw.toFixed(1)} kW discharging`;
                const isFull = batteryStats.soc !== null && batteryStats.soc >= 99;
                return `${pct} · ${isFull ? 'Full' : 'Idle'}`;
              })()}
            />

            <MetricTile
              icon={Gauge}
              label="This Week"
              value={formatKwh(evTotals.totals.home_kwh + evTotals.totals.supercharger_kwh)}
              detail={`Super ${evTotals.totals.supercharger_kwh.toFixed(1)} · Home ${evTotals.totals.home_kwh.toFixed(1)} kWh`}
            />
          </div>


          <div className="flex flex-col gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
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
                      : 'Proof of Genesis™ once production posts'}
                </div>
              </div>
            </div>
            <Link to="/energy-insights" className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/20 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10">
              Open Insights
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
