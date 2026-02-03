import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const REDIRECT_URI = `${window.location.origin}/oauth/callback`;

// Detect if running on mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export function useEnergyOAuth() {
  const startTeslaOAuth = useCallback(async () => {
    try {
      // Clear any stale OAuth state first
      localStorage.removeItem('tesla_oauth_state');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return;
      }

      const state = crypto.randomUUID();
      localStorage.setItem('tesla_oauth_state', state);

      const response = await supabase.functions.invoke('tesla-auth', {
        body: { redirectUri: REDIRECT_URI, state, action: 'get-auth-url' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to get auth URL');
      }

      const { authUrl } = response.data;
      
      // On mobile, popups are often blocked - redirect in same tab instead
      // On desktop, use popup for better UX
      if (isMobile()) {
        // Store that we're in OAuth flow - use localStorage since sessionStorage clears on navigation
        localStorage.setItem('tesla_oauth_pending', 'true');
        window.location.href = authUrl;
      } else {
        window.open(authUrl, 'tesla_auth', 'width=600,height=700,noopener');
        toast.info('Complete Tesla login in the popup window');
      }
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
      // Use noopener,noreferrer for security but still allow window to open
      const popup = window.open(authUrl, 'enphase_auth', 'width=600,height=700,noopener');
      
      // If popup was blocked, try opening in a new tab
      if (!popup) {
        window.open(authUrl, '_blank');
        toast.info('Enphase authorization opened in a new tab');
      }
      
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

  const connectSolarEdge = useCallback(async (apiKey: string, siteId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return false;
      }

      const response = await supabase.functions.invoke('solaredge-auth', {
        body: { 
          action: 'validate-and-store',
          apiKey,
          siteId,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        const errorMessage = response.error.message || 'Failed to connect SolarEdge';
        toast.error(errorMessage);
        return false;
      }

      if (response.data?.error) {
        toast.error(response.data.error);
        return false;
      }

      toast.success(`SolarEdge connected: ${response.data?.site?.name || 'Your solar site'}`);
      return true;
    } catch (error) {
      console.error('SolarEdge connection error:', error);
      toast.error('Failed to connect SolarEdge account');
      return false;
    }
  }, []);

  const connectWallbox = useCallback(async (email: string, password: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return false;
      }

      const response = await supabase.functions.invoke('wallbox-auth', {
        body: { 
          action: 'authenticate',
          email,
          password,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) {
        const errorMessage = response.error.message || 'Failed to connect Wallbox';
        toast.error(errorMessage);
        return false;
      }

      if (response.data?.error) {
        toast.error(response.data.error);
        return false;
      }

      toast.success('Wallbox account connected successfully!');
      return true;
    } catch (error) {
      console.error('Wallbox connection error:', error);
      toast.error('Failed to connect Wallbox account');
      return false;
    }
  }, []);

  return {
    startTeslaOAuth,
    startEnphaseOAuth,
    exchangeTeslaCode,
    exchangeEnphaseCode,
    connectSolarEdge,
    connectWallbox,
  };
}
