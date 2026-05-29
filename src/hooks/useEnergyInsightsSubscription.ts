import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsFounder } from '@/hooks/useIsFounder';

export interface EnergyInsightsSubscription {
  active: boolean;
  tier: 'standard' | 'pro';
  current_period_end: string | null;
}

export function useEnergyInsightsSubscription() {
  const { user } = useAuth();
  const { isFounder } = useIsFounder();
  const [sub, setSub] = useState<EnergyInsightsSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setSub(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('energy_subscriptions')
      .select('active, tier, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      const stillValid = !data.current_period_end || new Date(data.current_period_end) > new Date();
      setSub({
        active: !!data.active && stillValid,
        tier: (data.tier as 'standard' | 'pro') ?? 'standard',
        current_period_end: data.current_period_end,
      });
    } else {
      setSub({ active: false, tier: 'standard', current_period_end: null });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Founder override: founders (joe@zen.solar, Michael Tschida) and admins
  // always see the Premium Energy Insights experience as if subscribed, so
  // they can preview the paid live-data view without a real Stripe sub.
  if (isFounder && (!sub || !sub.active)) {
    return {
      subscription: { active: true, tier: 'pro', current_period_end: null } as EnergyInsightsSubscription,
      loading: false,
      refresh,
    };
  }

  return { subscription: sub, loading, refresh };
}
