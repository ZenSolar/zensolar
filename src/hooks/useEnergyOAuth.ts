import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const REDIRECT_URI = `${window.location.origin}/oauth/callback`;

export function useEnergyOAuth() {
  const startTeslaOAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return;
      }

      const state = crypto.randomUUID();
      sessionStorage.setItem('tesla_oauth_state', state);

      const response = await supabase.functions.invoke('tesla-auth', {
        body: { redirectUri: REDIRECT_URI, state, action: 'get-auth-url' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get auth URL');
      }

      const { authUrl } = response.data;
      window.location.href = authUrl;
    } catch (error) {
      console.error('Tesla OAuth error:', error);
      toast.error('Failed to start Tesla authorization');
    }
  }, []);

  const startEnphaseOAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return null;
      }

      const response = await supabase.functions.invoke('enphase-auth', {
        body: { action: 'get-auth-url' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get auth URL');
      }

      const { authUrl, useManualCode } = response.data;
      
      // Open Enphase auth in new window - user will copy code manually
      window.open(authUrl, '_blank', 'width=600,height=700');
      
      return { useManualCode: true };
    } catch (error) {
      console.error('Enphase OAuth error:', error);
      toast.error('Failed to start Enphase authorization');
      return null;
    }
  }, []);

  const exchangeTeslaCode = useCallback(async (code: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return false;
      }

      const response = await supabase.functions.invoke('tesla-auth', {
        body: { code, redirectUri: REDIRECT_URI, action: 'exchange-code' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Token exchange failed');
      }

      toast.success('Tesla account connected!');
      return true;
    } catch (error) {
      console.error('Tesla token exchange error:', error);
      toast.error('Failed to connect Tesla account');
      return false;
    }
  }, []);

  const exchangeEnphaseCode = useCallback(async (code: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return false;
      }

      const response = await supabase.functions.invoke('enphase-auth', {
        body: { code, action: 'exchange-code' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Token exchange failed');
      }

      toast.success('Enphase account connected!');
      return true;
    } catch (error) {
      console.error('Enphase token exchange error:', error);
      toast.error('Failed to connect Enphase account');
      return false;
    }
  }, []);

  return {
    startTeslaOAuth,
    startEnphaseOAuth,
    exchangeTeslaCode,
    exchangeEnphaseCode,
  };
}
