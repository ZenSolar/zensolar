import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EnergyInsightsSubscription {
  active: boolean;
  tier: 'standard' | 'pro';
  current_period_end: string | null;
}

export function useEnergyInsightsSubscription() {
  const { user } = useAuth();
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

  return { subscription: sub, loading, refresh };
}
