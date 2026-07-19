/**
 * ZenDrive · Live — vehicle-only companion card.
 *
 * Mirrors the Tesla Vehicle app's split from their Energy app:
 *   - Hero EV status (battery %, range, charging state, last seen)
 *   - One subtle line connecting back to the Energy card when the vehicle
 *     is actively charging from the home Powerwall / solar.
 *
 * Intentionally does NOT render the house, weather, grid, Powerwall, or
 * any solar flow lines — that's the ZenEnergy card's job.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, Car, Home, Zap } from 'lucide-react';
import { LiveCardHeader } from './LiveCardHeader';

import {
  MetricTile,
  deriveTeslaFlow,
} from './LiveEnergyMonitoringCard';
import { ChargingHero } from './ChargingHero';
import {
  useEVChargerTelemetry,
  useBatteryTelemetry,
  useSolarTelemetry,
  useEVTotals,
} from '@/hooks/useDeviceTelemetry';
import { useActiveChargingSession } from '@/hooks/useActiveChargingSession';
import { resolveVehicleAsset } from './EnergyFlowScene.scenes';
import { useState, useEffect, useRef, useMemo } from 'react';

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

/* Charging source narration lives inside ChargingHero now. */

export interface ZenDriveLiveCardProps {
  /** Render even when no Tesla is connected (shows an empty/connect state). */
  alwaysRender?: boolean;
}

export function ZenDriveLiveCard({ alwaysRender = false }: ZenDriveLiveCardProps = {}) {
  const ev = useEVChargerTelemetry();
  const battery = useBatteryTelemetry();
  const solar = useSolarTelemetry();
  const evTotals = useEVTotals(1);
  const { data: isActivelyCharging } = useActiveChargingSession();
  const [refreshing, setRefreshing] = useState(false);
  const tileRef = useRef<HTMLDivElement | null>(null);
  const [ping, setPing] = useState(false);

  const primaryEv = ev.data[0];
  const teslaFlow = useMemo(
    () => deriveTeslaFlow(primaryEv, !!isActivelyCharging),
    [primaryEv, isActivelyCharging]
  );

  // Pull exact model + color from Tesla vehicle_config so the image mirrors
  // the user's actual car (matches the Tesla app trim/color).
  const vehicleAsset = useMemo(
    () => resolveVehicleAsset(primaryEv?.payload ?? primaryEv, undefined, {
      fallbackWhenConnected: ev.data.length > 0,
    }),
    [primaryEv, ev.data.length],
  );

  // Force-refresh EV telemetry when a charging session toggles.
  const lastCharging = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (lastCharging.current === undefined) {
      lastCharging.current = !!isActivelyCharging;
      return;
    }
    if (lastCharging.current !== !!isActivelyCharging) {
      lastCharging.current = !!isActivelyCharging;
      void ev.refresh({ force: true });
    }
  }, [isActivelyCharging, ev]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await ev.refresh({ force: true });
    } finally {
      setRefreshing(false);
    }
  };

  const handlePillClick = () => {
    if (!tileRef.current) return;
    tileRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setPing(true);
    window.setTimeout(() => setPing(false), 1200);
  };

  const hasEv = ev.data.length > 0;
  if (!hasEv && !alwaysRender) return null;

  if (!hasEv) {
    return (
      <div className="w-full p-4">
        <LiveCardHeader
          subtitle="ZenDrive · No vehicle connected"
          ageLabel="—"
          freshnessClassName="bg-muted/40 text-muted-foreground ring-muted/50"
          onRefresh={async () => {}}
          refreshing={false}
        />
        <div className="flex flex-col gap-3 rounded-lg border border-primary/15 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <div className="rounded-md bg-primary/15 p-1.5 ring-1 ring-primary/25">
              <Car className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Connect your EV</div>
              <div className="text-xs text-muted-foreground">
                Link your Tesla or other EV to see live battery, range, and home charging.
              </div>
            </div>
          </div>
          <Link
            to="/clean-energy-center"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/25 bg-background/40 px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            Connect vehicle
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Derive solar / battery power for the "charging from" line.
  const solarKw = (() => {
    const p = solar.data[0]?.payload as any;
    const w =
      p?.current_power_w ??
      p?.per_system?.[0]?.current_power_w ??
      p?.solar_power ??
      0;
    return typeof w === 'number' ? w / 1000 : 0;
  })();
  const batteryKw = (() => {
    const p = battery.data[0]?.payload as any;
    const w = p?.battery_power ?? p?.energy_sites?.[0]?.battery_power ?? 0;
    // Tesla convention: positive = discharging. Flip to charging+/discharging−.
    return typeof w === 'number' ? -(w / 1000) : 0;
  })();

  return (
    <div className="w-full p-4">
      <LiveCardHeader
        subtitle={`ZenDrive · ${primaryEv?.device_name ?? 'ZenX'}`}
        ageLabel={formatAge(primaryEv?.sample_at ?? primaryEv?.cached_at ?? null)}
        freshnessClassName={freshnessClass(
          primaryEv?.sample_at ?? primaryEv?.cached_at ?? null,
          !!primaryEv?.fresh,
        )}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Tesla-app–grade charging hero: name, SOC%, ETA, animated cable,
          car image, dense data row, and slim SOC→limit progress bar. */}
      <div
        ref={tileRef}
        id="zendrive-ev-tile"
        tabIndex={-1}
        aria-label="Vehicle details"
        className={`rounded-2xl outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary ${
          ping ? 'ring-2 ring-primary/60 shadow-[0_0_24px_hsl(var(--primary)/0.35)]' : ''
        }`}
      >
        <ChargingHero
          vehicleName={primaryEv?.device_name ?? 'ZenX'}
          vehicleAsset={vehicleAsset}
          payload={primaryEv?.payload}
          tesla={teslaFlow}
          sourceKw={teslaFlow?.kW ?? 0}
          solarKw={solarKw}
          batteryKw={batteryKw}
        />
      </div>

      {/* Charging split — Home & AC vs Tesla Supercharging (today + live session delta) */}
      {(() => {
        const liveAdd = teslaFlow?.isCharging ? Math.max(0, teslaFlow?.energyAdded ?? 0) : 0;
        const liveHomeAdd = teslaFlow?.source === 'home' ? liveAdd : 0;
        const liveScAdd = teslaFlow?.source === 'supercharger' ? liveAdd : 0;
        const homeToday = (evTotals.totals.home_kwh ?? 0) + liveHomeAdd;
        const scToday = (evTotals.totals.supercharger_kwh ?? 0) + liveScAdd;
        const kwLabel = teslaFlow?.kW ? teslaFlow.kW.toFixed(1) : '0';
        return (
          <div className="grid grid-cols-2 gap-2">
            <MetricTile
              tone="blue"
              icon={Home}
              label="Home & AC"
              value={`${homeToday.toFixed(1)} kWh`}
              detail={liveHomeAdd > 0 ? `+${liveHomeAdd.toFixed(1)} kWh live · ${kwLabel} kW` : 'Today'}
              sublabel={
                liveHomeAdd > 0 ? (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    +{liveHomeAdd.toFixed(1)} $ZSOLAR this session
                  </span>
                ) : undefined
              }
            />
            <MetricTile
              tone="orange"
              icon={Zap}
              label="Supercharging"
              value={`${scToday.toFixed(1)} kWh`}
              detail={liveScAdd > 0 ? `+${liveScAdd.toFixed(1)} kWh live · ${kwLabel} kW` : 'Today'}
              sublabel={
                liveScAdd > 0 ? (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    +{liveScAdd.toFixed(1)} $ZSOLAR this session
                  </span>
                ) : undefined
              }
            />
          </div>
        );
      })()}
    </div>
  );
}
