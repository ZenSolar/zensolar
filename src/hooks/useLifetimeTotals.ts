import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

export interface LifetimeTotals {
  solarKwh: number;
  batteryDischargeKwh: number;
  evMiles: number;
  superchargerKwh: number;
  hasAny: boolean;
}

const EMPTY: LifetimeTotals = {
  solarKwh: 0,
  batteryDischargeKwh: 0,
  evMiles: 0,
  superchargerKwh: 0,
  hasAny: false,
};

const solarWh = (o: any): number =>
  Number(o?.solar_wh || o?.lifetime_solar_wh || o?.solar_production_wh || o?.total_solar_produced_wh || 0);
const batteryWh = (o: any): number =>
  Number(o?.battery_discharge_wh || o?.total_energy_discharged_wh || o?.lifetime_battery_discharge_wh || 0);

/**
 * Sums lifetime_totals across every connected device for the current (or viewed) user.
 * Zero-cost fast path: reads only the connected_devices row.
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
      const { data } = await supabase
        .from('connected_devices')
        .select('device_type, lifetime_totals')
        .eq('user_id', effectiveUserId);
      if (cancelled) return;
      const rows = data ?? [];
      let solar = 0;
      let battery = 0;
      let miles = 0;
      let supercharger = 0;
      for (const d of rows) {
        const l: any = d.lifetime_totals ?? {};
        solar += solarWh(l);
        battery += batteryWh(l);
        if (d.device_type === 'vehicle') {
          miles += Number(l.odometer || 0);
          supercharger += Number(l.charging_kwh || 0);
        }
      }
      const next: LifetimeTotals = {
        solarKwh: solar / 1000,
        batteryDischargeKwh: battery / 1000,
        evMiles: miles,
        superchargerKwh: supercharger,
        hasAny: solar > 0 || battery > 0 || miles > 0 || supercharger > 0,
      };
      setTotals(next);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [effectiveUserId]);

  return { totals, loading };
}
