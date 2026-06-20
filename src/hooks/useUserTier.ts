import { useMemo } from 'react';
import { useEnergyInsightsSubscription } from '@/hooks/useEnergyInsightsSubscription';
import { useIsFounder } from '@/hooks/useIsFounder';

/**
 * Tier classifier used by the Tesla Charging Experience v2.
 *
 *   'free'   — no paid subscription, no founder/inner-circle flag.
 *              Requires a one-tap Claim to start a Supercharger mint.
 *   'paid'   — any active energy subscription (standard or pro), or founder.
 *              Supercharger sessions auto-start silently under L1 loudness.
 *
 * The mint-split surface rule (1 kWh = 1 $ZSOLAR, 50% share) is identical for
 * both tiers — only the START behavior differs.
 */
export type UserTier = 'free' | 'paid';

export function useUserTier(): { tier: UserTier; loading: boolean } {
  const { subscription, loading } = useEnergyInsightsSubscription();
  const { isFounder } = useIsFounder();

  const tier: UserTier = useMemo(() => {
    if (isFounder) return 'paid';
    if (subscription?.active) return 'paid';
    return 'free';
  }, [isFounder, subscription?.active]);

  return { tier, loading };
}
