import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * ZPPA — Zen Power Purchase Agreement
 *
 * Producer-gated early access to $ZSOLAR LP tranches.
 * See mem://features/zppa and mem://features/producer-gated-lp-rounds for the full doctrine.
 *
 * Eligibility (round 1 defaults — can be tuned per round later):
 *   - Threshold:     25 kWh of verified clean energy in prior 30 days
 *   - Producer-only window: First 24 hours of each round
 *   - Per-wallet cap during producer window:  min($500, mintedKwh × $0.50)
 *   - Public window (after 24h): leftovers only, hard cap $500/wallet
 *
 * The 30-day rolling kWh number is computed from `energy_production.production_wh`
 * (the canonical verified-energy source already used by the dashboard).
 */

export const ZPPA_THRESHOLD_KWH = 25;
export const ZPPA_KWH_TO_USDC = 0.5; // $0.50 of allocation per minted kWh
export const ZPPA_HARD_CAP_USDC = 500;
export const ZPPA_PRODUCER_WINDOW_HOURS = 24;
export const ZPPA_LOOKBACK_DAYS = 30;

export interface ZppaEligibility {
  isLoading: boolean;
  kwh30d: number;
  threshold: number;
  remainingKwhToUnlock: number;
  isEligible: boolean;
  progressPct: number; // 0–100
  ceilingUsdc: number; // your producer-window purchase ceiling
  producerWindowHours: number;
  lookbackDays: number;
  refetch: () => Promise<void>;
}

export function useZppaEligibility(): ZppaEligibility {
  const [isLoading, setIsLoading] = useState(true);
  const [kwh30d, setKwh30d] = useState(0);

  const fetchKwh = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setKwh30d(0);
        return;
      }

      const since = new Date();
      since.setDate(since.getDate() - ZPPA_LOOKBACK_DAYS);

      const { data, error } = await supabase
        .from('energy_production')
        .select('production_wh')
        .eq('user_id', session.user.id)
        .gte('recorded_at', since.toISOString())
        .limit(10000);

      if (error) {
        console.error('ZPPA: failed to fetch energy_production', error);
        setKwh30d(0);
        return;
      }

      const totalWh = (data || []).reduce(
        (sum, r) => sum + (Number(r.production_wh) || 0),
        0,
      );
      setKwh30d(totalWh / 1000);
    } catch (err) {
      console.error('ZPPA: unexpected error', err);
      setKwh30d(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchKwh(); }, [fetchKwh]);

  const isEligible = kwh30d >= ZPPA_THRESHOLD_KWH;
  const remainingKwhToUnlock = Math.max(0, ZPPA_THRESHOLD_KWH - kwh30d);
  const progressPct = Math.min(100, (kwh30d / ZPPA_THRESHOLD_KWH) * 100);
  const ceilingUsdc = isEligible
    ? Math.min(ZPPA_HARD_CAP_USDC, kwh30d * ZPPA_KWH_TO_USDC)
    : 0;

  return {
    isLoading,
    kwh30d,
    threshold: ZPPA_THRESHOLD_KWH,
    remainingKwhToUnlock,
    isEligible,
    progressPct,
    ceilingUsdc,
    producerWindowHours: ZPPA_PRODUCER_WINDOW_HOURS,
    lookbackDays: ZPPA_LOOKBACK_DAYS,
    refetch: fetchKwh,
  };
}
