/**
 * VehicleStatusStrip
 * ------------------
 * A compact, always-present status line for every connected vehicle.
 *
 * Rule this component encodes (and the flow diagram does NOT):
 *   The vehicle is ALWAYS visible when one is connected, regardless of where
 *   it is or what it is doing. Whether a conduit is drawn between the house
 *   and the car is a separate question, owned by the flow diagram.
 *
 * Site presence is NEVER inferred from charger type. AC charging does not
 * mean "at home". The only positive evidence of on-site charging accepted
 * here is an active home_charging_session for this user (`atSite`).
 */
import { Car } from 'lucide-react';
import type { CachedTelemetry } from '@/hooks/useDeviceTelemetry';
import { FreshnessNote } from '@/components/dashboard/FreshnessNote';
import { freshnessLabel } from '@/lib/telemetryFreshness';
import { cn } from '@/lib/utils';


function pick(payload: any, keys: string[]): unknown {
  for (const k of keys) {
    const v = k.split('.').reduce<any>((acc, part) => (acc == null ? acc : acc[part]), payload);
    if (v !== undefined && v !== null) return v;
  }
  return null;
}
const num = (p: any, keys: string[]) => {
  const v = pick(p, keys);
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const str = (p: any, keys: string[]) => {
  const v = pick(p, keys);
  return typeof v === 'string' && v.length > 0 ? v : null;
};

export type VehiclePresence = 'charging_here' | 'charging_elsewhere' | 'driving' | 'parked' | 'unknown';

export function deriveVehiclePresence(payload: any, atSite: boolean): VehiclePresence {
  const chargingState = (str(payload, [
    'charging_state', 'vehicles.0.charging_state', 'response.charge_state.charging_state',
  ]) ?? '').toLowerCase();
  const shift = (str(payload, [
    'shift_state', 'drive_state.shift_state', 'response.drive_state.shift_state',
  ]) ?? '').toLowerCase();
  const speed = num(payload, ['speed', 'drive_state.speed', 'response.drive_state.speed']);

  if (chargingState === 'charging') return atSite ? 'charging_here' : 'charging_elsewhere';
  if (shift === 'd' || shift === 'r' || (speed !== null && speed > 0)) return 'driving';
  if (chargingState) return 'parked';
  return 'unknown';
}

const PRESENCE_COPY: Record<VehiclePresence, { label: string; dot: string; tone: string }> = {
  charging_here:      { label: 'Charging at this site', dot: 'bg-emerald-400', tone: 'text-emerald-300' },
  charging_elsewhere: { label: 'Charging elsewhere',    dot: 'bg-sky-400',     tone: 'text-sky-300' },
  driving:            { label: 'Driving',               dot: 'bg-primary',     tone: 'text-primary' },
  parked:             { label: 'Parked',                dot: 'bg-muted-foreground/60', tone: 'text-muted-foreground' },
  unknown:            { label: 'State pending',         dot: 'bg-muted-foreground/40', tone: 'text-muted-foreground' },
};

export function VehicleStatusStrip({
  vehicles,
  atSite,
  className,
  onSelect,
}: {
  vehicles: CachedTelemetry[];
  /** True only when an on-site charging session is actually recorded. */
  atSite: boolean;
  className?: string;
  onSelect?: () => void;
}) {
  const rows = vehicles.filter((v) => v.oem === 'tesla' || !!v.device_name);
  if (rows.length === 0) return null;

  return (
    <div className={cn('space-y-1.5', className)}>
      {rows.map((v) => {
        const p = v.payload as any;
        const soc = num(p, ['battery_level', 'vehicles.0.battery_level', 'usable_battery_level', 'response.charge_state.battery_level']);
        const range = num(p, ['battery_range', 'vehicles.0.battery_range', 'ideal_battery_range', 'est_battery_range', 'response.charge_state.battery_range']);
        const presence = deriveVehiclePresence(p, atSite);
        const copy = PRESENCE_COPY[presence];
        const name = v.device_name ?? str(p, ['display_name', 'vehicles.0.display_name']) ?? 'Vehicle';
        const readAt = v.sample_at ?? v.cached_at ?? null;

        return (
          <button
            key={`vss-${v.oem}-${v.site_id}`}
            type="button"
            onClick={onSelect}
            aria-label={`${name}, ${soc !== null ? `${Math.round(soc)} percent` : 'charge unknown'}${range !== null ? `, ${Math.round(range)} miles range` : ''}, ${copy.label}, ${freshnessLabel(readAt, !!v.fresh)}`}
            className="w-full rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-left transition-colors hover:border-primary/30"
          >
            <span className="flex w-full items-center gap-2.5">
              <Car className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate text-[12px] font-semibold text-foreground">{name}</span>

              <span className="ml-auto flex items-center gap-2 tabular-nums">
                <span className="text-[13px] font-bold text-foreground">
                  {soc !== null ? `${Math.round(soc)}%` : '—'}
                </span>
                {range !== null && (
                  <span className="text-[11px] text-muted-foreground">{Math.round(range)} mi</span>
                )}
              </span>

              <span className={cn('flex shrink-0 items-center gap-1.5 border-l border-border/50 pl-2.5 text-[10px] font-semibold uppercase tracking-wide', copy.tone)}>
                <span aria-hidden="true" className={cn('inline-block h-1.5 w-1.5 rounded-full', copy.dot)} />
                {copy.label}
              </span>
            </span>

            {/* Every readout states its own age. A cached row served after a
                failed live fetch says so rather than posing as current. */}
            <FreshnessNote iso={readAt} fresh={!!v.fresh} className="mt-1 block pl-6" />
          </button>
        );

      })}
    </div>
  );
}
