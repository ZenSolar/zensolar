import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Info, Plug, Sun, BatteryCharging } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LiveCardHeader } from './LiveCardHeader';
import { useChargerDevices, type ChargerDevice } from '@/hooks/useChargerDevices';
import { useEVTotals } from '@/hooks/useDeviceTelemetry';

function oemLabel(oem: string) {
  return oem.charAt(0).toUpperCase() + oem.slice(1);
}

function formatAge(iso: string | null) {
  if (!iso) return 'Sync pending';
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `Updated ${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `Updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Updated ${hrs}h ago`;
  return `Updated ${Math.floor(hrs / 24)}d ago`;
}

function freshnessClass(iso: string | null) {
  if (!iso) return 'bg-muted/40 text-muted-foreground ring-muted/50';
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 60) return 'bg-primary/20 text-primary ring-primary/30';
  if (mins < 24 * 60) return 'bg-primary/10 text-primary/80 ring-primary/20';
  return 'bg-muted/40 text-muted-foreground ring-muted/50';
}

export function ChargerTile({
  charger,
  todayKwh,
}: {
  charger: ChargerDevice;
  todayKwh: number | null;
}) {
  const lifetime = charger.lifetime_kwh;
  const sessions = charger.total_sessions;
  return (
    <div className="rounded-lg border border-primary/20 bg-background/45 p-3 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Plug className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {oemLabel(charger.provider)}
            {charger.device_name ? ` · ${charger.device_name}` : ''}
          </span>
        </div>
        <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Idle
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-2xl font-bold tabular-nums text-foreground">
            {todayKwh !== null ? `${todayKwh.toFixed(1)} kWh` : '—'}
          </div>
          <div className="text-[10px] text-muted-foreground">charged today</div>
        </div>
        {sessions !== null && (
          <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
            {sessions.toLocaleString()} sessions
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 border-t border-primary/10 pt-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <BatteryCharging className="h-3 w-3 text-primary" />
          Lifetime:{' '}
          <span className="font-semibold text-foreground">
            {lifetime !== null ? `${lifetime.toFixed(0)} kWh` : '—'}
          </span>
        </span>
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[10px] leading-snug text-muted-foreground/80">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Why no live kW?"
                className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground/70 hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
              >
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-[11px] leading-snug">
              {charger.provider === 'wallbox'
                ? 'Live charging power is not yet available for Wallbox. Showing today\u2019s totals instead — session details refresh after each charge completes.'
                : `Live charging power isn\u2019t available for ${oemLabel(charger.provider)} yet. Totals refresh after each session completes.`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span>
          {charger.provider === 'wallbox'
            ? 'Live kW not yet available for Wallbox \u2014 showing today\u2019s totals.'
            : `Live kW not yet available for ${oemLabel(charger.provider)} \u2014 showing today\u2019s totals.`}
        </span>
      </div>
    </div>
  );
}

/**
 * Shown when a beta user has a home charger connected but no solar, battery,
 * or Tesla EV. Surfaces real session totals from the device row and from
 * `home_charging_sessions`, without ever pretending to render mock live kW.
 */
export function ChargerOnlyLiveCard() {
  const { data: chargers, loading } = useChargerDevices();
  const evTotals = useEVTotals(1);
  const [refreshing, setRefreshing] = useState(false);

  const latestSync = chargers.reduce<string | null>((acc, c) => {
    if (!c.last_synced_at) return acc;
    if (!acc) return c.last_synced_at;
    return new Date(c.last_synced_at) > new Date(acc) ? c.last_synced_at : acc;
  }, null);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <div className="w-full p-4">
      <LiveCardHeader
        subtitle="Home charger telemetry · upgrade for full cockpit"
        ageLabel={formatAge(latestSync)}
        freshnessClassName={freshnessClass(latestSync)}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {loading ? (
        <div
          className="h-32 animate-pulse rounded-lg bg-card/10"
          aria-hidden="true"
        />
      ) : chargers.length === 0 ? (
        <div className="rounded-lg border border-primary/15 bg-background/40 p-4 text-center text-xs text-muted-foreground">
          Charger row missing — try refreshing in a moment.
        </div>
      ) : (
        <div className="space-y-2">
          {chargers.map((c) => (
            <ChargerTile
              key={c.device_id}
              charger={c}
              todayKwh={evTotals.totals.home_kwh}
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-primary/15 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <div className="rounded-md bg-primary/15 p-1.5 ring-1 ring-primary/25">
            <Sun className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              Unlock the full live cockpit
            </div>
            <div className="text-xs text-muted-foreground">
              Add solar, a Powerwall, or your Tesla to see real-time energy flow.
            </div>
          </div>
        </div>
        <Link
          to="/clean-energy-center"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
        >
          Connect a device
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
