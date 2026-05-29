import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { BatteryCharging, Plug, Loader2, Sparkles } from 'lucide-react';
import { useBatteryTelemetry, useEVChargerTelemetry, type CachedTelemetry } from '@/hooks/useDeviceTelemetry';

const AnimatedEnergyFlow = lazy(() =>
  import('./AnimatedEnergyFlow').then((m) => ({ default: m.AnimatedEnergyFlow }))
);

/**
 * Live-data variant of the ZenEnergy Monitoring card, shown only to paying
 * Premium Energy Insights subscribers (and founders via override).
 *
 * Non-subscribers see the placeholder `AnimatedEnergyFlow` card instead —
 * see `EnergyFlowGlowCard` in `ZenSolarDashboard.tsx`.
 *
 * If the subscriber has not connected a battery / EV / Tesla vehicle yet,
 * we fall back to the same animated placeholder with a small hint so the
 * card never looks broken.
 */

function pickNumber(payload: any, keys: string[]): number | null {
  for (const k of keys) {
    const v = payload?.[k] ?? payload?.response?.[k] ?? payload?.data?.[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

function FreshChip({ fresh }: { fresh: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
        fresh ? 'bg-primary/20 text-primary' : 'bg-muted/40 text-muted-foreground'
      }`}
    >
      {fresh ? 'Live' : 'Cached'}
    </span>
  );
}

function BatteryTile({ t }: { t: CachedTelemetry }) {
  const soc = pickNumber(t.payload, ['percentage_charged', 'battery_soc', 'soc', 'state_of_charge']);
  const power = pickNumber(t.payload, ['battery_power', 'power_kw', 'charge_power']);
  return (
    <div className="rounded-lg border border-primary/20 bg-card/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BatteryCharging className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Battery · {t.oem}
          </span>
        </div>
        <FreshChip fresh={t.fresh} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">
          {soc !== null ? `${Math.round(soc)}%` : '—'}
        </span>
        {power !== null && (
          <span className="text-xs font-semibold text-primary">
            {power > 0 ? '+' : ''}
            {power.toFixed(1)} kW
          </span>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {power !== null ? (power > 0 ? 'Charging' : power < 0 ? 'Discharging' : 'Idle') : 'State of charge'}
      </div>
    </div>
  );
}

function EVTile({ t }: { t: CachedTelemetry }) {
  const power = pickNumber(t.payload, ['charging_power_kw', 'power_kw', 'current_kw', 'charge_rate_kw']);
  const sessionKwh = pickNumber(t.payload, ['session_kwh', 'energy_kwh', 'charge_energy_added']);
  const statusRaw =
    t.payload?.status ??
    t.payload?.charger_status ??
    t.payload?.charging_state ??
    t.payload?.state ??
    (power && power > 0 ? 'Charging' : 'Idle');
  const label = t.oem === 'tesla' ? 'Vehicle · Tesla' : `EV Charger · ${t.oem}`;
  return (
    <div className="rounded-lg border border-primary/20 bg-card/40 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Plug className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
        </div>
        <FreshChip fresh={t.fresh} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold capitalize text-foreground">
          {String(statusRaw).toLowerCase()}
        </span>
        {power !== null && (
          <span className="text-xs font-semibold text-primary">{power.toFixed(1)} kW</span>
        )}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {sessionKwh !== null ? `${sessionKwh.toFixed(1)} kWh this session` : 'Live charger status'}
      </div>
    </div>
  );
}

export function LiveEnergyMonitoringCard() {
  const battery = useBatteryTelemetry();
  const ev = useEVChargerTelemetry();

  const loading = (battery.loading || ev.loading) && battery.data.length === 0 && ev.data.length === 0;
  const empty = !loading && battery.data.length === 0 && ev.data.length === 0;

  // No devices yet → render the placeholder flow plus a gentle hint, so the
  // card chrome never looks empty for a founder/subscriber with no claims.
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
          {battery.data.map((t) => (
            <BatteryTile key={`b-${t.oem}-${t.site_id}`} t={t} />
          ))}
          {ev.data.map((t) => (
            <EVTile key={`e-${t.oem}-${t.site_id}`} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
