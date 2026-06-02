import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BatteryCharging, Car, Home, Plug, Sun } from 'lucide-react';
import { LiveCardHeader } from './LiveCardHeader';
import { ChargerTile } from './ChargerOnlyLiveCard';
import { useChargerDevices } from '@/hooks/useChargerDevices';
import {
  useSolarTelemetry,
  useEVTotals,
  type CachedTelemetry,
} from '@/hooks/useDeviceTelemetry';

function oemLabel(oem: string) {
  return oem.charAt(0).toUpperCase() + oem.slice(1);
}

/**
 * Honest, lightweight live flow diagram for users without a Powerwall.
 * Solar → Home always; adds Solar → Charger → EV node when a charger is connected.
 * Dimmed/"Idle" state when solar kW is ~0 — never fabricates numbers.
 */
function SolarChargerFlowScene({
  solarKw,
  hasCharger,
  chargerName,
}: {
  solarKw: number | null;
  hasCharger: boolean;
  chargerName?: string | null;
}) {
  const producing = (solarKw ?? 0) > 0.1;
  const lineClass = producing
    ? 'stroke-emerald-400'
    : 'stroke-muted-foreground/40';
  const dashAnim = producing ? 'animate-[spc-dash_1.4s_linear_infinite]' : '';

  return (
    <div className="mb-3 rounded-lg border border-primary/15 bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live energy flow
        </span>
        <span
          className={`text-[10px] font-semibold ${
            producing ? 'text-emerald-400' : 'text-muted-foreground'
          }`}
        >
          {producing
            ? `${(solarKw ?? 0).toFixed(2)} kW flowing`
            : 'Idle · no production'}
        </span>
      </div>

      <div
        className={`grid items-center gap-2 ${
          hasCharger
            ? 'grid-cols-[1fr_auto_1fr_auto_1fr]'
            : 'grid-cols-[1fr_auto_1fr]'
        }`}
      >
        <FlowNode icon={<Sun className="h-5 w-5" />} label="Solar" active={producing} />
        <FlowArrow className={lineClass} dashAnim={dashAnim} />
        <FlowNode icon={<Home className="h-5 w-5" />} label="Home" active={producing} />
        {hasCharger && (
          <>
            <FlowArrow className={lineClass} dashAnim={dashAnim} />
            <FlowNode
              icon={<Plug className="h-5 w-5" />}
              label={chargerName ?? 'Charger'}
              sub={<Car className="mt-1 h-3.5 w-3.5 text-muted-foreground/70" />}
              active={producing}
            />
          </>
        )}
      </div>

      <style>{`@keyframes spc-dash { to { stroke-dashoffset: -16; } }`}</style>
    </div>
  );
}

function FlowNode({
  icon,
  label,
  sub,
  active,
}: {
  icon: ReactNode;
  label: string;
  sub?: ReactNode;
  active: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`rounded-full p-2 ring-1 ${
          active
            ? 'bg-primary/20 text-primary ring-primary/40'
            : 'bg-muted/30 text-muted-foreground ring-muted/40'
        }`}
      >
        {icon}
      </div>
      <span className="max-w-[80px] truncate text-center text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {sub}
    </div>
  );
}

function FlowArrow({ className, dashAnim }: { className: string; dashAnim: string }) {
  return (
    <svg viewBox="0 0 40 8" className="h-2 w-full" preserveAspectRatio="none">
      <line
        x1="0"
        y1="4"
        x2="40"
        y2="4"
        strokeWidth="2"
        strokeDasharray="4 4"
        strokeLinecap="round"
        className={`${className} ${dashAnim}`}
      />
    </svg>
  );
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

function pickNumber(payload: any, keys: string[]): number | null {
  for (const k of keys) {
    const parts = k.split('.');
    let v: any = payload;
    for (const p of parts) {
      if (v == null) {
        v = undefined;
        break;
      }
      v = /^\d+$/.test(p) ? (Array.isArray(v) ? v[Number(p)] : undefined) : v?.[p];
    }
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

function solarSnapshot(t: CachedTelemetry | undefined) {
  const p = t?.payload;
  const currentW = pickNumber(p, [
    'current_power_w',
    'per_system.0.current_power_w',
    'solar_power',
    'energy_sites.0.solar_power',
  ]);
  const todayWh = pickNumber(p, [
    'energy_today_wh',
    'energy_today',
    'totals.energy_today_wh',
    'per_system.0.energy_today_wh',
  ]);
  const lifetimeWh = pickNumber(p, [
    'energy_lifetime_wh',
    'totals.lifetime_solar_wh',
    'per_system.0.lifetime_wh',
  ]);
  return {
    currentKw: currentW !== null ? currentW / 1000 : null,
    todayKwh: todayWh !== null ? todayWh / 1000 : null,
    lifetimeMwh: lifetimeWh !== null ? lifetimeWh / 1_000_000 : null,
    label: t ? `${oemLabel(t.oem)}${t.device_name ? ` · ${t.device_name}` : ''}` : 'Solar',
  };
}

/**
 * Rendered when a beta user has solar but no Powerwall and no Tesla EV.
 * Surfaces real solar telemetry and, if present, a compact charger sub-tile.
 * Always honest — no mock numbers, no fake Powerwall, no fake EV.
 */
export function SolarPlusCard() {
  const solar = useSolarTelemetry();
  const { data: chargers } = useChargerDevices();
  const evTotals = useEVTotals(1);
  const [refreshing, setRefreshing] = useState(false);

  const primarySolar = solar.data[0];
  const stats = solarSnapshot(primarySolar);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await solar.refresh({ force: true });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="w-full p-4">
      <LiveCardHeader
        subtitle="Solar telemetry · upgrade for full cockpit"
        ageLabel={formatAge(primarySolar?.sample_at ?? primarySolar?.cached_at ?? null)}
        freshnessClassName={freshnessClass(
          primarySolar?.sample_at ?? primarySolar?.cached_at ?? null,
          !!primarySolar?.fresh,
        )}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <SolarChargerFlowScene
        solarKw={stats.currentKw}
        hasCharger={chargers.length > 0}
        chargerName={chargers[0]?.device_name ?? (chargers[0] ? oemLabel(chargers[0].provider) : null)}
      />

      <div className="space-y-2">
        <div className="rounded-lg border border-primary/20 bg-background/45 p-3 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {stats.label}
              </span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                (stats.currentKw ?? 0) > 0.1
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-muted/40 text-muted-foreground'
              }`}
            >
              {(stats.currentKw ?? 0) > 0.1 ? 'Producing' : 'Idle'}
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {stats.currentKw !== null
                  ? `${stats.currentKw.toFixed(2)} kW`
                  : '—'}
              </div>
              <div className="text-[10px] text-muted-foreground">producing now</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-foreground">
                {stats.todayKwh !== null ? `${stats.todayKwh.toFixed(1)} kWh` : '—'}
              </div>
              <div className="text-[10px] text-muted-foreground">today</div>
            </div>
          </div>
          {stats.lifetimeMwh !== null && (
            <div className="mt-2 flex items-center gap-3 border-t border-primary/10 pt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <BatteryCharging className="h-3 w-3 text-primary" />
                Lifetime:{' '}
                <span className="font-semibold text-foreground">
                  {stats.lifetimeMwh.toFixed(2)} MWh
                </span>
              </span>
            </div>
          )}
        </div>

        {chargers.length > 0 &&
          chargers.map((c) => (
            <ChargerTile
              key={c.device_id}
              charger={c}
              todayKwh={evTotals.totals.home_kwh}
            />
          ))}
      </div>

      {(() => {
        // Soft nudge only — never imply the live flow above is gated.
        // Suggests adding a battery to unlock charging/discharging arrows.
        return (
          <div className="mt-3 flex flex-col gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <div className="rounded-md bg-primary/15 p-1.5 ring-1 ring-primary/25">
                <BatteryCharging className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  Add a battery for full cockpit view
                </div>
                <div className="text-xs text-muted-foreground">
                  Connect a home battery to see live charging and discharging flows alongside your solar and charger.
                </div>
              </div>
            </div>
            <Link
              to="/clean-energy-center"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
            >
              Connect more devices
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        );
      })()}
    </div>
  );
}
