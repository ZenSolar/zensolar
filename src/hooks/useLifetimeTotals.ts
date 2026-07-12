import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

export interface LifetimeTotals {
  solarKwh: number;
  batteryDischargeKwh: number;
  evMiles: number;
  superchargerKwh: number;
  homeKwh: number;
  fsdMiles: number;
  hasAny: boolean;
}

const EMPTY: LifetimeTotals = {
  solarKwh: 0,
  batteryDischargeKwh: 0,
  evMiles: 0,
  superchargerKwh: 0,
  homeKwh: 0,
  fsdMiles: 0,
  hasAny: false,
};

const solarWh = (o: any): number =>
  Number(o?.solar_wh || o?.lifetime_solar_wh || o?.solar_production_wh || o?.total_solar_produced_wh || 0);
const batteryWh = (o: any): number =>
  Number(o?.battery_discharge_wh || o?.total_energy_discharged_wh || o?.lifetime_battery_discharge_wh || 0);

/**
 * Sums lifetime_totals across every connected device for the current (or viewed) user.
 * Also splits home vs supercharger from charging_sessions history.
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
          .select('device_type, lifetime_totals')
          .eq('user_id', effectiveUserId),
        supabase
          .from('charging_sessions')
          .select('charging_type, energy_kwh')
          .eq('user_id', effectiveUserId),
      ]);
      if (cancelled) return;
      const rows = devicesRes.data ?? [];
      let solar = 0;
      let battery = 0;
      let miles = 0;
      let chargingKwhLifetime = 0;
      let fsdMiles = 0;
      for (const d of rows) {
        const l: any = d.lifetime_totals ?? {};
        solar += solarWh(l);
        battery += batteryWh(l);
        if (d.device_type === 'vehicle') {
          miles += Number(l.odometer || 0);
          chargingKwhLifetime += Number(l.charging_kwh || 0);
          fsdMiles += Number(l.lifetime_fsd_miles || 0);
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
      // If session sum roughly matches lifetime, trust the split; otherwise
      // fall back to putting everything under supercharger.
      const sessionSum = sessionSuper + sessionHome;
      const useSplit = sessionSum > 0 && Math.abs(sessionSum - chargingKwhLifetime) / Math.max(sessionSum, chargingKwhLifetime) < 0.15;
      const superKwh = useSplit ? sessionSuper : chargingKwhLifetime;
      const homeKwh = useSplit ? sessionHome : 0;

      const next: LifetimeTotals = {
        solarKwh: solar / 1000,
        batteryDischargeKwh: battery / 1000,
        evMiles: miles,
        superchargerKwh: superKwh,
        homeKwh,
        fsdMiles,
        hasAny: solar > 0 || battery > 0 || miles > 0 || superKwh > 0 || homeKwh > 0 || fsdMiles > 0,
      };
      setTotals(next);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [effectiveUserId]);

  return { totals, loading };
}
