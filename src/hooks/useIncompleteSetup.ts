import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface IncompleteSetup {
  provider: 'tesla' | 'enphase';
  hasTokens: boolean;
  hasDevices: boolean;
}

export function useIncompleteSetup() {
  const [incompleteSetups, setIncompleteSetups] = useState<IncompleteSetup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkIncompleteSetups = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIncompleteSetups([]);
        setIsLoading(false);
        return;
      }

      // Check for Tesla and Enphase tokens and devices in parallel
      const [tokensResult, devicesResult] = await Promise.all([
        supabase
          .from('energy_tokens')
          .select('provider')
          .eq('user_id', user.id)
          .in('provider', ['tesla', 'enphase']),
        supabase
          .from('connected_devices')
          .select('provider')
          .eq('user_id', user.id)
          .in('provider', ['tesla', 'enphase'])
      ]);

      const tokenProviders = new Set(tokensResult.data?.map(t => t.provider) || []);
      const deviceProviders = new Set(devicesResult.data?.map(d => d.provider) || []);

      const incomplete: IncompleteSetup[] = [];

      // Check Tesla
      if (tokenProviders.has('tesla') && !deviceProviders.has('tesla')) {
        incomplete.push({
          provider: 'tesla',
          hasTokens: true,
          hasDevices: false
        });
      }

      // Check Enphase
      if (tokenProviders.has('enphase') && !deviceProviders.has('enphase')) {
        incomplete.push({
          provider: 'enphase',
          hasTokens: true,
          hasDevices: false
        });
      }

      console.log('[useIncompleteSetup] Found incomplete setups:', incomplete);
      setIncompleteSetups(incomplete);
    } catch (error) {
      console.error('[useIncompleteSetup] Error checking setups:', error);
      setIncompleteSetups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkIncompleteSetups();
  }, [checkIncompleteSetups]);

  const refreshIncompleteSetups = useCallback(() => {
    setIsLoading(true);
    checkIncompleteSetups();
  }, [checkIncompleteSetups]);

  return {
    incompleteSetups,
    isLoading,
    refreshIncompleteSetups,
    hasIncompleteSetup: incompleteSetups.length > 0
  };
}
