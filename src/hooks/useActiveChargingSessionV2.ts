import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';
import { useAuth } from '@/hooks/useAuth';

/**
 * Unified active charging session (Phase 1 of Tesla Charging Experience v2).
 *
 * Returns the single most recent live charging session for the effective user,
 * normalised across the home and supercharger tables. Used by the calm
 * SuperchargerLiveCard (Phase 2), the silent home status line (Phase 3), and
 * the loudness banner (Phase 3).
 *
 * Source-of-truth rules:
 *   - home_charging_sessions.status === 'charging'  → source: 'home' | 'wallbox'
 *   - charging_sessions (no end yet, today's date)  → source: 'supercharger' | 'third_party_dc'
 *
 * We DO NOT collapse providers here — Phase 1 only classifies. The mint split
 * remains v3.1; UI continues to show 1 kWh = 1 $ZSOLAR (50% share).
 */

export type ChargingSource = 'home' | 'wallbox' | 'supercharger' | 'third_party_dc';
export type CleanClaim = 'self_produced' | 'tesla_rec' | 'unknown';

export interface ActiveChargingSession {
  id: string;
  source: ChargingSource;
  clean_claim: CleanClaim;
  /** kWh delivered so far in this session. */
  kwh_so_far: number;
  /** Charger nameplate, when known. */
  charger_power_kw: number | null;
  /** Supercharger site id (FK), when known. */
  site_id: string | null;
  /** ISO timestamp the session started. */
  started_at: string;
  /** Underlying table — useful for re-querying detail. */
  origin_table: 'home_charging_sessions' | 'charging_sessions';
}

export function useActiveChargingSessionV2() {
  const viewAsUserId = useViewAsUserId();
  const { user } = useAuth();
  const effectiveUserId = viewAsUserId ?? user?.id ?? null;
  const queryClient = useQueryClient();
  const queryKey = ['active-charging-session-v2', effectiveUserId];

  useEffect(() => {
    if (!effectiveUserId) return;
    const channel = supabase
      .channel(`active-charging-v2-${effectiveUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'home_charging_sessions' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'charging_sessions' }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  return useQuery({
    queryKey,
    enabled: !!effectiveUserId,
    queryFn: async (): Promise<ActiveChargingSession | null> => {
      if (!effectiveUserId) return null;

      // 1) Home / Wallbox: live status === 'charging'
      const { data: home } = await supabase
        .from('home_charging_sessions')
        .select('id, source, clean_claim, total_session_kwh, charger_power_kw, start_time, status')
        .eq('user_id', effectiveUserId)
        .eq('status', 'charging')
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (home) {
        return {
          id: home.id as string,
          source: ((home as any).source ?? 'home') as ChargingSource,
          clean_claim: ((home as any).clean_claim ?? 'self_produced') as CleanClaim,
          kwh_so_far: Number(home.total_session_kwh ?? 0),
          charger_power_kw: home.charger_power_kw == null ? null : Number(home.charger_power_kw),
          site_id: null,
          started_at: home.start_time as string,
          origin_table: 'home_charging_sessions',
        };
      }

      // 2) Supercharger / DC fast: today's row, no end timestamp on metadata
      const today = new Date().toISOString().slice(0, 10);
      const { data: sc } = await supabase
        .from('charging_sessions')
        .select('id, source, clean_claim, energy_kwh, session_date, site_id, created_at, session_metadata')
        .eq('user_id', effectiveUserId)
        .eq('session_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sc) {
        const meta = (sc.session_metadata ?? {}) as Record<string, unknown>;
        const ended = !!(meta.ended_at || meta.completed_at);
        if (!ended) {
          return {
            id: sc.id as string,
            source: ((sc as any).source ?? 'supercharger') as ChargingSource,
            clean_claim: ((sc as any).clean_claim ?? 'tesla_rec') as CleanClaim,
            kwh_so_far: Number(sc.energy_kwh ?? 0),
            charger_power_kw: (meta.charger_power_kw as number) ?? null,
            site_id: ((sc as any).site_id ?? null) as string | null,
            started_at: (sc.created_at as string) ?? `${today}T00:00:00Z`,
            origin_table: 'charging_sessions',
          };
        }
      }

      return null;
    },
    refetchInterval: 30_000,
  });
}
