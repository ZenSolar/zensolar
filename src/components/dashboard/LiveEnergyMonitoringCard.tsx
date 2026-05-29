import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { BatteryCharging, Sun, Car, Zap, Home, Loader2, Sparkles } from 'lucide-react';
import {
  useBatteryTelemetry,
  useEVChargerTelemetry,
  useSolarTelemetry,
  useEVTotals,
  type CachedTelemetry,
} from '@/hooks/useDeviceTelemetry';

const AnimatedEnergyFlow = lazy(() =>
  import('./AnimatedEnergyFlow').then((m) => ({ default: m.AnimatedEnergyFlow }))
);

function pickNumber(payload: any, keys: string[]): number | null {
  for (const k of keys) {
    const v = payload?.[k] ?? payload?.response?.[k] ?? payload?.data?.[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

function pickString(payload: any, keys: string[]): string | null {
  for (const k of keys) {
    const v = payload?.[k] ?? payload?.response?.[k] ?? payload?.data?.[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return null;
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

function SolarTile({ t }: { t: CachedTelemetry }) {
  // Enphase telemetry returns current_power_w + energy_today_wh.
  // Tesla live_status returns solar_power (W).
  const currentW =
    pickNumber(t.payload, ['current_power_w', 'solar_power']) ??
    (pickNumber(t.payload, ['current_power_kw']) ?? 0) * 1000;
  const todayWh = pickNumber(t.payload, ['energy_today_wh', 'energy_today']);
  const currentKw = currentW ? currentW / 1000 : 0;

  return (
    <div className="rounded-lg border border-primary/20 bg-card/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sun className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Solar · {oemLabel(t.oem)}
            {t.device_name ? ` · ${t.device_name}` : ''}
          </span>
        </div>
        <FreshChip fresh={t.fresh} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">{currentKw.toFixed(2)} kW</span>
        <span className="text-xs text-muted-foreground">now</span>
      </div>
      <div className="text-[10px] text-muted-foreground">
        {todayWh !== null ? `${(todayWh / 1000).toFixed(1)} kWh today` : 'Live PV output'}
      </div>
    </div>
  );
}

function BatteryTile({ t }: { t: CachedTelemetry }) {
  const soc = pickNumber(t.payload, ['percentage_charged', 'battery_soc', 'soc', 'state_of_charge']);
  const power = pickNumber(t.payload, ['battery_power', 'power_kw', 'charge_power']);
  // Tesla returns Watts; normalize to kW if value is large
  const powerKw = power !== null ? (Math.abs(power) > 100 ? power / 1000 : power) : null;
  return (
    <div className="rounded-lg border border-primary/20 bg-card/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BatteryCharging className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Battery · {oemLabel(t.oem)}
            {t.device_name ? ` · ${t.device_name}` : ''}
          </span>
        </div>
        <FreshChip fresh={t.fresh} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">
          {soc !== null ? `${Math.round(soc)}%` : '—'}
        </span>
        {powerKw !== null && (
          <span className="text-xs font-semibold text-primary">
            {powerKw > 0 ? '+' : ''}{powerKw.toFixed(1)} kW
          </span>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {powerKw !== null ? (powerKw > 0.05 ? 'Charging' : powerKw < -0.05 ? 'Discharging' : 'Idle') : 'State of charge'}
      </div>
    </div>
  );
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
  const soc = pickNumber(t.payload, ['battery_level', 'usable_battery_level']);
  const range = pickNumber(t.payload, ['battery_range', 'ideal_battery_range', 'est_battery_range']);
  const chargingState = pickString(t.payload, ['charging_state', 'state', 'charger_status', 'status']);
  const isCharging = (chargingState ?? '').toLowerCase() === 'charging';
  const directKw = pickNumber(t.payload, ['charge_rate_kw', 'charger_power']);
  const ivKw =
    ((pickNumber(t.payload, ['charger_actual_current']) ?? 0) *
      (pickNumber(t.payload, ['charger_voltage']) ?? 0)) /
    1000;
  const chargeRateKw = directKw ?? (ivKw > 0 ? ivKw : null);
  const energyAdded = pickNumber(t.payload, ['charge_energy_added']);
  const timeToFullHrs = pickNumber(t.payload, ['time_to_full_charge']);
  const fastChargerType = pickString(t.payload, ['fast_charger_type', 'charger_type']);
  const phases = pickNumber(t.payload, ['charger_phases']);
  const { icon: KindIcon, label: kindLabel } = chargerKindBadge(fastChargerType, phases);
  const label = t.oem === 'tesla' ? `Vehicle · Tesla${t.device_name ? ' · ' + t.device_name : ''}` : `EV · ${oemLabel(t.oem)}`;

  return (
    <div className="rounded-lg border border-primary/20 bg-card/40 p-3">
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
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {soc !== null ? `${Math.round(soc)}%` : '—'}
            </span>
            {range !== null && <span className="text-xs text-primary">{Math.round(range)} mi</span>}
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

export function LiveEnergyMonitoringCard() {
  const solar = useSolarTelemetry();
  const battery = useBatteryTelemetry();
  const ev = useEVChargerTelemetry();
  const evTotals = useEVTotals(7);

  const loading =
    (solar.loading || battery.loading || ev.loading) &&
    solar.data.length === 0 && battery.data.length === 0 && ev.data.length === 0;
  const empty = !loading && solar.data.length === 0 && battery.data.length === 0 && ev.data.length === 0;

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
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">ZenEnergy Monitoring · Live</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-primary/80">Premium</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {solar.data.map((t) => <SolarTile key={`s-${t.oem}-${t.site_id}`} t={t} />)}
          {battery.data.map((t) => <BatteryTile key={`b-${t.oem}-${t.site_id}`} t={t} />)}
          {ev.data.map((t) => <EVTile key={`e-${t.oem}-${t.site_id}`} t={t} totals7d={evTotals.totals} />)}
        </div>
      )}
    </div>
  );
}
