import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BatteryCharging, Car, Clock3, Gauge, Home, Loader2, Route, Sparkles, Sun, Zap } from 'lucide-react';
import {
  useBatteryTelemetry,
  useEVChargerTelemetry,
  useSolarTelemetry,
  useEVTotals,
  type CachedTelemetry,
} from '@/hooks/useDeviceTelemetry';
import { useAuth } from '@/hooks/useAuth';
import { computeCo2 } from '@/lib/co2Math';
import { supabase } from '@/integrations/supabase/client';

const AnimatedEnergyFlow = lazy(() =>
  import('./AnimatedEnergyFlow').then((m) => ({ default: m.AnimatedEnergyFlow }))
);

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
  const [impact, setImpact] = useState({ tokens: 0, co2Kg: 0, loading: true });

  useEffect(() => {
    if (!user) {
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
        .eq('user_id', user.id)
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
  }, [user]);

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

function batterySnapshot(t: CachedTelemetry | undefined) {
  const p = t?.payload;
  const rawPower = pickNumber(p, ['battery_power', 'energy_sites.0.battery_power', 'power_kw', 'charge_power']);
  const powerKw = rawPower !== null ? (Math.abs(rawPower) > 100 ? rawPower / 1000 : rawPower) : null;
  const soc = pickNumber(p, ['percentage_charged', 'energy_sites.0.percentage_charged', 'battery_soc', 'soc', 'state_of_charge']);
  const energyLeft = pickNumber(p, ['energy_left', 'energy_sites.0.energy_left']);
  return {
    soc,
    powerKw,
    energyLeft,
    status: powerKw === null ? 'State pending' : powerKw > 0.05 ? 'Charging' : powerKw < -0.05 ? 'Discharging' : 'Idle',
    label: t ? `${oemLabel(t.oem)}${t.device_name ? ` · ${t.device_name}` : ''}` : 'Battery',
  };
}

function chargerKindBadge(fastChargerType: string | null, chargerPhases: number | null): { icon: typeof Zap; label: string } {
  const t = (fastChargerType ?? '').toLowerCase();
  if (t.includes('supercharger') || t.includes('combo') || t.includes('chademo')) {
    return { icon: Zap, label: 'Supercharger' };
  }
  if (t.includes('wall') || t === 'mc' || t === 'gb_ac') return { icon: Home, label: 'Wall Connector' };
  if (chargerPhases && chargerPhases >= 1) return { icon: Zap, label: 'Public L2' };
  return { icon: Car, label: 'Plug' };
}

function EVTile({ t, totals7d }: { t: CachedTelemetry; totals7d: { home_kwh: number; supercharger_kwh: number } }) {
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
  const { icon: KindIcon, label: kindLabel } = chargerKindBadge(fastChargerType, phases);
  const label = t.oem === 'tesla' ? `Vehicle · Tesla${t.device_name ? ' · ' + t.device_name : ''}` : `EV · ${oemLabel(t.oem)}`;

  return (
    <div className="rounded-lg border border-primary/20 bg-background/45 p-3 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)] transition-colors hover:border-primary/35">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Car className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        </div>
        <FreshChip fresh={t.fresh} />
      </div>

      {/* Row A: live charge session */}
      {isCharging && (
        <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <KindIcon className="h-3 w-3" />
            <span>{kindLabel}</span>
            <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px]">Live</span>
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

function MetricTile({ icon: Icon, label, value, detail }: { icon: typeof Sun; label: string; value: string; detail: string }) {
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

export function LiveEnergyMonitoringCard() {
  const solar = useSolarTelemetry();
  const battery = useBatteryTelemetry();
  const ev = useEVChargerTelemetry();
  const evTotals = useEVTotals(7);
  const mintImpact = useTodayMintImpact();

  const loading =
    (solar.loading || battery.loading || ev.loading) &&
    solar.data.length === 0 && battery.data.length === 0 && ev.data.length === 0;
  const empty = !loading && solar.data.length === 0 && battery.data.length === 0 && ev.data.length === 0;

  const primarySolar = solar.data[0];
  const primaryBattery = battery.data[0];
  const primaryEv = ev.data[0];
  const solarStats = solarSnapshot(primarySolar);
  const batteryStats = batterySnapshot(primaryBattery);
  const latestTelemetry = useMemo(() => {
    const rows = [...solar.data, ...battery.data, ...ev.data];
    if (rows.length === 0) return null;
    return rows.sort((a, b) => new Date(b.cached_at).getTime() - new Date(a.cached_at).getTime())[0];
  }, [solar.data, battery.data, ev.data]);
  const flowData = {
    solarPower: solarStats.currentKw ?? 0,
    homePower: (() => {
      const loadW = pickNumber(primaryBattery?.payload, ['load_power', 'energy_sites.0.load_power']);
      return loadW !== null ? loadW / 1000 : 0;
    })(),
    batteryPower: batteryStats.powerKw ?? 0,
    batteryPercent: Math.round(batteryStats.soc ?? 0),
    gridPower: (() => {
      const gridW = pickNumber(primaryBattery?.payload, ['grid_power', 'energy_sites.0.grid_power']);
      return gridW !== null ? gridW / 1000 : 0;
    })(),
    evPower: pickNumber(primaryEv?.payload, ['charge_rate_kw', 'charger_power', 'vehicles.0.charger_power']) ?? 0,
  };

  if (empty) {
    return (
      <div className="w-full">
        <Suspense fallback={<div className="w-full h-64 bg-card/10 animate-pulse" aria-hidden="true" />}>
          <AnimatedEnergyFlow className="w-full" />
        </Suspense>
        <div className="border-t border-primary/20 bg-card/30 px-4 py-2.5 text-center text-[11px] text-muted-foreground">
          Premium unlocked.{' '}
          <Link to="/clean-energy-center" className="font-semibold text-primary hover:underline">
            Connect a battery, EV, or Tesla
          </Link>{' '}
          to see live data here.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">ZenEnergy Monitoring · Live</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Home Energy Cockpit · Enphase solar + Tesla Powerwall + ZenX</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ring-1 ${freshnessClass(latestTelemetry?.cached_at ?? null, !!latestTelemetry?.fresh)}`}>
          <Clock3 className="h-3 w-3" />
          {formatAge(latestTelemetry?.cached_at ?? null)}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-primary/15 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.10),transparent_58%)]">
            <Suspense fallback={<div className="h-[250px] w-full animate-pulse bg-card/10" aria-hidden="true" />}>
              <AnimatedEnergyFlow className="h-[250px] w-full sm:h-[300px]" data={flowData} showHeader={false} />
            </Suspense>
          </div>

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
              value={batteryStats.soc !== null ? `${Math.round(batteryStats.soc)}%` : '—'}
              detail={`${batteryStats.status}${batteryStats.powerKw !== null ? ` · ${batteryStats.powerKw > 0 ? '+' : ''}${batteryStats.powerKw.toFixed(1)} kW` : ''}`}
            />
            <MetricTile
              icon={Gauge}
              label="This Week"
              value={formatKwh(evTotals.totals.home_kwh + evTotals.totals.supercharger_kwh)}
              detail={`Super ${evTotals.totals.supercharger_kwh.toFixed(1)} · Home ${evTotals.totals.home_kwh.toFixed(1)} kWh`}
            />
          </div>

          {ev.data.map((t) => <EVTile key={`e-${t.oem}-${t.site_id}`} t={t} totals7d={evTotals.totals} />)}

          <div className="flex flex-col gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <div className="rounded-md bg-primary/15 p-1.5 ring-1 ring-primary/25">
                <Route className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {mintImpact.loading ? 'Calculating today’s mint' : `${mintImpact.tokens.toFixed(1)} $ZSOLAR today`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {mintImpact.loading ? 'Verifying receipt impact' : `${mintImpact.co2Kg.toFixed(1)} kg CO₂ avoided from verified energy`}
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
