import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsFounder } from '@/hooks/useIsFounder';

/**
 * Gate for proactive Deason outage assistance.
 *
 * Production target: any user with an active `$4.99/month Deason` subscription.
 * Until that paywall exists, the gate falls back to:
 *   • Founders / admins (always-on preview)
 *   • Beta users (≥1 connected_devices row — same heuristic used by
 *     `useEnergyInsightsSubscription`)
 *   • Active `energy_subscriptions` row (the closest existing analog)
 *
 * TODO(paywall): swap the subscription check for a dedicated
 * `deason_subscriptions` table once the $4.99 SKU ships.
 */
export type DeasonOutageAccessReason = 'founder' | 'beta' | 'subscription' | 'none';

export interface DeasonOutageAccess {
  hasAccess: boolean;
  reason: DeasonOutageAccessReason;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useDeasonOutageAccess(): DeasonOutageAccess {
  const { user } = useAuth();
  const { isFounder } = useIsFounder();
  const [loading, setLoading] = useState(true);
  const [hasConnectedDevice, setHasConnectedDevice] = useState(false);
  const [hasActiveSub, setHasActiveSub] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setHasConnectedDevice(false);
      setHasActiveSub(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [subRes, devRes] = await Promise.all([
        supabase
          .from('energy_subscriptions')
          .select('active, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('connected_devices')
          .select('device_id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);
      setHasConnectedDevice((devRes.count ?? 0) > 0);
      const sub = subRes.data;
      const stillValid = sub
        ? !sub.current_period_end || new Date(sub.current_period_end) > new Date()
        : false;
      setHasActiveSub(!!sub?.active && stillValid);
    } catch (err) {
      console.warn('[useDeasonOutageAccess] refresh failed', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (isFounder) {
    return { hasAccess: true, reason: 'founder', loading: false, refresh };
  }
  if (hasActiveSub) {
    return { hasAccess: true, reason: 'subscription', loading, refresh };
  }
  if (hasConnectedDevice) {
    return { hasAccess: true, reason: 'beta', loading, refresh };
  }
  return { hasAccess: false, reason: 'none', loading, refresh };
}
