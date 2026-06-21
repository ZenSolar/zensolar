/**
 * useNewLocationPrompt — surfaces the friendly "Is this your new home?"
 * banner when a vehicle-sourced AC session opens at a location that doesn't
 * match any saved home. Reads the most recent home_charging_session whose
 * `location_kind = away_unverified` and rounds its lat/lon into a stable
 * "fingerprint" so the prompt asks once per location, not once per session.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useViewAsUserId } from '@/hooks/useViewAsUserId';

export interface UnverifiedLocationCandidate {
  sessionId: string;
  lat: number;
  lon: number;
  startedAt: string;
  /** Stable per-location key for dismissal — rounded to ~150 m grid. */
  fingerprint: string;
}

const DISMISS_PREFIX = 'zs:newloc:dismissed:';

export function locationFingerprint(lat: number, lon: number): string {
  // 4 decimal places ≈ 11 m. Good enough to lump "same driveway" together.
  return `${lat.toFixed(4)}_${lon.toFixed(4)}`;
}

export function useNewLocationPrompt() {
  const { user } = useAuth();
  const viewAsUserId = useViewAsUserId();
  const userId = viewAsUserId ?? user?.id ?? null;
  const [dismissTick, setDismissTick] = useState(0);

  const query = useQuery<UnverifiedLocationCandidate | null>({
    queryKey: ['new-location-prompt', userId, dismissTick],
    enabled: !!userId,
    refetchInterval: 60_000,
    queryFn: async () => {
      if (!userId) return null;
      // Look at the last 24h of unverified AC sessions.
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('home_charging_sessions')
        .select('id, latitude, longitude, start_time, location_kind')
        .eq('user_id', userId)
        .eq('location_kind', 'away_unverified')
        .gte('start_time', since)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('start_time', { ascending: false })
        .limit(5);
      if (!data || data.length === 0) return null;

      for (const row of data) {
        const lat = Number(row.latitude);
        const lon = Number(row.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        const fp = locationFingerprint(lat, lon);
        const dismissed = (() => {
          try {
            return localStorage.getItem(DISMISS_PREFIX + fp) === '1';
          } catch {
            return false;
          }
        })();
        if (dismissed) continue;
        return {
          sessionId: row.id as string,
          lat,
          lon,
          startedAt: row.start_time as string,
          fingerprint: fp,
        };
      }
      return null;
    },
  });

  // Permanently dismiss this fingerprint and force re-fetch (which will
  // surface the next un-dismissed candidate, or hide).
  const dismissFingerprint = (fp: string) => {
    try {
      localStorage.setItem(DISMISS_PREFIX + fp, '1');
    } catch {
      /* ignore */
    }
    setDismissTick((t) => t + 1);
  };

  // Refetch when realtime sessions land.
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`new-loc-prompt-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'home_charging_sessions' },
        () => query.refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...query, dismissFingerprint };
}
