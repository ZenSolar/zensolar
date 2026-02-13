import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Tracks user activity:
 * - Updates last_seen_at on a periodic heartbeat
 * - Records last_login_at and increments login_count on sign-in
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const trackedLoginRef = useRef<string | null>(null);

  // Record login event (once per session)
  useEffect(() => {
    if (!user?.id || trackedLoginRef.current === user.id) return;
    trackedLoginRef.current = user.id;

    supabase
      .from('profiles')
      .update({
        last_login_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .then(() => {
        // Increment login_count separately since Supabase JS doesn't support column increment natively
        // We'll do a raw rpc or just set last_login_at; login_count via a simple select+update
        supabase
          .from('profiles')
          .select('login_count')
          .eq('user_id', user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from('profiles')
                .update({ login_count: (data.login_count ?? 0) + 1 })
                .eq('user_id', user.id)
                .then(() => {});
            }
          });
      });
  }, [user?.id]);

  // Heartbeat: update last_seen_at periodically
  useEffect(() => {
    if (!user?.id) return;

    const updateLastSeen = () => {
      supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .then(() => {});
    };

    // Initial update
    updateLastSeen();

    const interval = setInterval(updateLastSeen, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user?.id]);
}
