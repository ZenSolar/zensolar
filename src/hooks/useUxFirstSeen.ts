/**
 * useUxFirstSeen — once-ever tracker for calm L2 first-time UX moments.
 *
 * Backed by the `ux_first_seen` table. For unauthenticated/preview sessions
 * we fall back to localStorage so the calm experience still works.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const LS_PREFIX = 'ux_first_seen:';

export function useUxFirstSeen(eventKey: string) {
  const { user } = useAuth();
  const [seen, setSeen] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // local fallback first (fast path, avoids flicker)
      const lsKey = LS_PREFIX + eventKey;
      const lsHit =
        typeof window !== 'undefined' && window.localStorage?.getItem(lsKey) === '1';
      if (lsHit) {
        if (!cancelled) setSeen(true);
        return;
      }
      if (!user) {
        if (!cancelled) setSeen(false);
        return;
      }
      const { data } = await supabase
        .from('ux_first_seen')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_key', eventKey)
        .maybeSingle();
      if (!cancelled) setSeen(!!data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, eventKey]);

  const markSeen = useCallback(async () => {
    setSeen(true);
    try {
      window.localStorage?.setItem(LS_PREFIX + eventKey, '1');
    } catch {
      /* ignore */
    }
    if (!user) return;
    await supabase
      .from('ux_first_seen')
      .upsert(
        { user_id: user.id, event_key: eventKey },
        { onConflict: 'user_id,event_key' },
      );
  }, [user, eventKey]);

  return { seen, markSeen };
}
