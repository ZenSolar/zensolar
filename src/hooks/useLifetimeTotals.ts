import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import { classifyDevices, type AuthorityDevice } from '@/lib/deviceAuthority';

export interface VehicleLifetime {
  deviceId: string;
  name: string;
  odometerMi: number;
  fsdMiles: number;
}

export interface LifetimeTotals {
  /** Authoritative solar only — observer (CT-clamp) sources are excluded. */
  solarKwh: number;
  /** Solar reported by observer devices, shown for transparency, never summed in. */
  observerSolarKwh: number;
  batteryDischargeKwh: number;
  /** Per-vehicle odometers. Odometers are NOT summable across vehicles. */
  vehicles: VehicleLifetime[];
  superchargerKwh: number;
  homeKwh: number;
  fsdMiles: number;
  fsdSource: 'official' | 'calculated_hw3' | null;
  hasAny: boolean;
}

const EMPTY: LifetimeTotals = {
  solarKwh: 0,
  observerSolarKwh: 0,
  batteryDischargeKwh: 0,
  vehicles: [],
  superchargerKwh: 0,
  homeKwh: 0,
  fsdMiles: 0,
  fsdSource: null,
  hasAny: false,
};

const solarWh = (o: any): number =>
  Number(o?.solar_wh || o?.lifetime_solar_wh || o?.solar_production_wh || o?.total_solar_produced_wh || 0);
const batteryWh = (o: any): number =>
  Number(o?.battery_discharge_wh || o?.total_energy_discharged_wh || o?.lifetime_battery_discharge_wh || 0);

/**
 * Lifetime meter readings for the current (or viewed) user.
 *
 * Solar is routed through the SAME authority filter the mint path uses
 * (`classifyDevices` mirrors `filterIssuableRows`), so a Powerwall's site CT
 * clamps no longer double-count a dedicated inverter's roof on the display
 * side. Odometers are returned PER VEHICLE — two cars' odometers are two
 * independent readings and summing them is meaningless.
 */
export function useLifetimeTotals() {
  const { user } = useAuth();
  const viewAsUserId = useViewAsUserId();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const [totals, setTotals] = useState<LifetimeTotals>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveUserId) {
      setTotals(EMPTY);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [devicesRes, sessionsRes] = await Promise.all([
        supabase
          .from('connected_devices')
          .select('device_id, device_name, device_type, provider, lifetime_totals, last_known_state')
          .eq('user_id', effectiveUserId),
        supabase
          .from('charging_sessions')
          .select('charging_type, energy_kwh')
          .eq('user_id', effectiveUserId),
      ]);
      if (cancelled) return;
      const rows = devicesRes.data ?? [];

      const classes = classifyDevices(
        rows.map((d: any): AuthorityDevice => ({
          device_id: String(d.device_id),
          device_type: String(d.device_type ?? ''),
          provider: String(d.provider ?? ''),
          device_name: d.device_name ?? null,
        })),
      );

      let solar = 0;
      let observerSolar = 0;
      let battery = 0;
      let chargingKwhLifetime = 0;
      let fsdMiles = 0;
      let fsdSource: 'official' | 'calculated_hw3' | null = null;
      const vehicles: VehicleLifetime[] = [];

      for (const d of rows as any[]) {
        const l: any = d.lifetime_totals ?? {};
        const isObserverSolar = classes[String(d.device_id)]?.deviceClass === 'observer';
        if (isObserverSolar) observerSolar += solarWh(l);
        else solar += solarWh(l);
        battery += batteryWh(l);
        if (d.device_type === 'vehicle') {
          const odo = Number(l.odometer || l.last_known_odometer || 0);
          const vFsd = Number(l.lifetime_fsd_miles || 0);
          if (odo > 0 || vFsd > 0) {
            vehicles.push({
              deviceId: String(d.device_id),
              name: d.device_name ?? 'Vehicle',
              odometerMi: odo,
              fsdMiles: vFsd,
            });
          }
          chargingKwhLifetime += Number(l.charging_kwh || 0);
          fsdMiles += vFsd;
          const src = d.last_known_state?.fsd_source;
          if (src === 'official' || fsdSource === null) fsdSource = src ?? fsdSource;
        }
      }

      // Split home vs supercharger using session history
      let sessionSuper = 0;
      let sessionHome = 0;
      for (const s of sessionsRes.data ?? []) {
        const kwh = Number((s as any).energy_kwh || 0);
        if ((s as any).charging_type === 'home') sessionHome += kwh;
        else sessionSuper += kwh;
      }
      const sessionSum = sessionSuper + sessionHome;
      const useSplit = sessionSum > 0 && Math.abs(sessionSum - chargingKwhLifetime) / Math.max(sessionSum, chargingKwhLifetime) < 0.15;
      const superKwh = useSplit ? sessionSuper : chargingKwhLifetime;
      const homeKwh = useSplit ? sessionHome : 0;

      const next: LifetimeTotals = {
        solarKwh: solar / 1000,
        observerSolarKwh: observerSolar / 1000,
        batteryDischargeKwh: battery / 1000,
        vehicles,
        superchargerKwh: superKwh,
        homeKwh,
        fsdMiles,
        fsdSource,
        hasAny:
          solar > 0 || battery > 0 || vehicles.length > 0 || superKwh > 0 || homeKwh > 0 || fsdMiles > 0 || fsdSource !== null,
      };
      setTotals(next);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [effectiveUserId]);

  return { totals, loading };
}
