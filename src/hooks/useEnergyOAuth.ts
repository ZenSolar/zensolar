import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  openDeasonWithError,
  maybeAutoOpenDeason,
  scheduleDeasonNudge,
  consumeRecentDeasonSeed,
  type Provider,
  type OAuthStage,
} from '@/lib/deasonHandoff';
import { trackEvent } from '@/hooks/useGoogleAnalytics';

/** Fire a success event, attributing the connect to Deason if the user
 *  saw a seeded playbook (auto-open or nudge) in the last 5 min. */
function trackConnectSuccess(provider: Provider) {
  const deasonAssisted = consumeRecentDeasonSeed(provider);
  trackEvent('energy_account_connected', { provider, deason_assisted: deasonAssisted });
  if (deasonAssisted) {
    trackEvent('deason_seeded_connection_success', { provider });
  }
}


const REDIRECT_URI = `${window.location.origin}/oauth/callback`;

const PROVIDER_LABEL: Record<string, string> = {
  tesla: 'Tesla',
  enphase: 'Enphase',
  solaredge: 'SolarEdge',
  wallbox: 'Wallbox',
};

// Detect if running on mobile device
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Translate raw error payloads into a short, friendly headline + actionable
 * description. Falls back gracefully so we never show "[object Object]" or
 * a Supabase function 500 to the user.
 */
function describeError(
  provider: keyof typeof PROVIDER_LABEL,
  rawMessage: string | undefined,
  stage: 'start' | 'exchange' | 'sites' | 'validate' | 'login',
): { title: string; description: string } {
  const brand = PROVIDER_LABEL[provider] ?? provider;
  const msg = (rawMessage ?? '').toLowerCase();

  // Network / connectivity
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('timeout')) {
    return {
      title: `Can't reach ${brand} right now`,
      description: 'Looks like a network hiccup. Check your connection and try again.',
    };
  }

  // Auth / credentials
  if (
    msg.includes('unauthorized') ||
    msg.includes('invalid_grant') ||
    msg.includes('invalid credentials') ||
    msg.includes('401') ||
    msg.includes('403')
  ) {
    if (stage === 'login' || stage === 'validate') {
      return {
        title: `${brand} didn't accept those credentials`,
        description:
          provider === 'solaredge'
            ? 'Double-check your API key and Site ID, then try again.'
            : provider === 'wallbox'
              ? "Your Wallbox email or password didn't match. Try again."
              : `Your ${brand} session may have expired. Sign in again to reconnect.`,
      };
    }
    return {
      title: `${brand} declined the request`,
      description: 'Authorization was rejected. Start the connection over and try again.',
    };
  }

  // Rate limit
  if (msg.includes('rate') || msg.includes('429') || msg.includes('too many')) {
    return {
      title: `${brand} is rate-limiting us`,
      description: 'Give it a minute, then try again.',
    };
  }

  // Provider outage
  if (msg.includes('500') || msg.includes('502') || msg.includes('503') || msg.includes('unavailable')) {
    return {
      title: `${brand} is temporarily unavailable`,
      description: 'Their service responded with an error. Try again in a moment.',
    };
  }

  // Not found / no sites
  if (msg.includes('not found') || msg.includes('no sites') || msg.includes('404')) {
    return {
      title: `No ${brand} sites found`,
      description: 'We couldn\'t find any sites on that account. Double-check it and try again.',
    };
  }

  // Stage-specific generic fallbacks
  const fallback: Record<string, { title: string; description: string }> = {
    start: {
      title: `Couldn't start ${brand} connection`,
      description: 'Something went wrong before we could open the login. Try again.',
    },
    exchange: {
      title: `${brand} connection didn't finish`,
      description: 'We received the response but couldn\'t complete the handshake. Try again.',
    },
    sites: {
      title: `Couldn't load your ${brand} sites`,
      description: 'We couldn\'t look up your sites. Try again.',
    },
    validate: {
      title: `Couldn't connect ${brand}`,
      description: 'We couldn\'t verify those details. Try again.',
    },
    login: {
      title: `Couldn't sign in to ${brand}`,
      description: 'We couldn\'t log in with those details. Try again.',
    },
  };

  return fallback[stage];
}

function showOAuthError(opts: {
  provider: Provider;
  stage: Exclude<OAuthStage, 'status'>;
  rawMessage?: string;
  retry?: () => void;
}) {
  const { title, description } = describeError(opts.provider, opts.rawMessage, opts.stage);

  // 1. Try auto-opening Deason for critical failures (popup blocked, bad
  //    creds, wrong account, outage). If we did, skip the soft nudge — the
  //    chat is already open with the fix.
  const autoOpened = maybeAutoOpenDeason({
    provider: opts.provider,
    stage: opts.stage,
    rawMessage: opts.rawMessage,
  });

  // 2. For non-critical errors (or as a safety net), schedule a 30s nudge:
  //    if the user hasn't tapped Retry / Ask Deason in 30s, pulse the bubble.
  const cancelNudge = autoOpened
    ? () => {}
    : scheduleDeasonNudge({
        provider: opts.provider,
        stage: opts.stage,
        rawMessage: opts.rawMessage,
      });

  toast.error(title, {
    description,
    duration: 12_000,
    onDismiss: cancelNudge,
    onAutoClose: cancelNudge,
    action: opts.retry
      ? {
          label: 'Try again',
          onClick: () => {
            cancelNudge();
            opts.retry?.();
          },
        }
      : undefined,
    // Secondary button — opens Deason with a seeded diagnosis + fix script.
    cancel: {
      label: 'Ask Deason',
      onClick: () => {
        cancelNudge();
        openDeasonWithError({
          provider: opts.provider,
          stage: opts.stage,
          rawMessage: opts.rawMessage,
        });
      },
    },
  });
}

function extractError(response: { error?: { message?: string }; data?: { error?: string } }) {
  return response.error?.message || response.data?.error || undefined;
}

export function useEnergyOAuth() {
  const startTeslaOAuth = useCallback(async (): Promise<void> => {
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

      const errMsg = extractError(response);
      if (errMsg || !response.data?.authUrl) {
        throw new Error(errMsg || 'Failed to get auth URL');
      }

      const { authUrl } = response.data;

      if (isMobile()) {
        localStorage.setItem('tesla_oauth_pending', 'true');
        window.location.href = authUrl;
      } else {
        const popup = window.open(authUrl, 'tesla_auth', 'width=600,height=700,noopener');
        if (!popup) {
          // Popup blocked — surface a clear, retry-able message
          showOAuthError({
            provider: 'tesla',
            stage: 'start',
            rawMessage: 'Popup blocked',
            retry: () => void startTeslaOAuth(),
          });
          return;
        }
        toast.info('Complete Tesla login in the popup window');
      }
    } catch (error) {
      console.error('Tesla OAuth error:', error);
      showOAuthError({
        provider: 'tesla',
        stage: 'start',
        rawMessage: error instanceof Error ? error.message : undefined,
        retry: () => void startTeslaOAuth(),
      });
    }
  }, []);

  const startEnphaseOAuth = useCallback(async (): Promise<
    { useManualCode: true; authUrl: string } | null
  > => {
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

      const errMsg = extractError(response);
      if (errMsg || !response.data?.authUrl) {
        throw new Error(errMsg || 'Failed to get auth URL');
      }

      return { useManualCode: true, authUrl: response.data.authUrl };
    } catch (error) {
      console.error('Enphase OAuth error:', error);
      showOAuthError({
        provider: 'enphase',
        stage: 'start',
        rawMessage: error instanceof Error ? error.message : undefined,
        retry: () => void startEnphaseOAuth(),
      });
      return null;
    }
  }, []);

  const exchangeTeslaCode = useCallback(async (code: string): Promise<boolean> => {
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

      const errMsg = extractError(response);
      if (errMsg) throw new Error(errMsg);

      trackConnectSuccess('tesla');
      toast.success('Tesla account connected!');
      return true;
    } catch (error) {
      console.error('Tesla token exchange error:', error);
      showOAuthError({
        provider: 'tesla',
        stage: 'exchange',
        rawMessage: error instanceof Error ? error.message : undefined,
        retry: () => void exchangeTeslaCode(code),
      });
      return false;
    }
  }, []);

  const exchangeEnphaseCode = useCallback(async (code: string): Promise<boolean> => {
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

      const errMsg = extractError(response);
      if (errMsg) throw new Error(errMsg);

      trackConnectSuccess('enphase');
      toast.success('Enphase account connected!');
      return true;
    } catch (error) {
      console.error('Enphase token exchange error:', error);
      showOAuthError({
        provider: 'enphase',
        stage: 'exchange',
        rawMessage: error instanceof Error ? error.message : undefined,
        retry: () => void exchangeEnphaseCode(code),
      });
      return false;
    }
  }, []);

  const listSolarEdgeSites = useCallback(async (apiKey: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return null;
      }
      const response = await supabase.functions.invoke('solaredge-auth', {
        body: { action: 'list-sites', apiKey },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const errMsg = extractError(response);
      if (errMsg) {
        showOAuthError({
          provider: 'solaredge',
          stage: 'sites',
          rawMessage: errMsg,
          retry: () => void listSolarEdgeSites(apiKey),
        });
        return null;
      }
      return (response.data?.sites ?? []) as Array<{
        id: string;
        name: string;
        status?: string;
        peakPower?: number;
      }>;
    } catch (error) {
      console.error('SolarEdge list-sites error:', error);
      showOAuthError({
        provider: 'solaredge',
        stage: 'sites',
        rawMessage: error instanceof Error ? error.message : undefined,
        retry: () => void listSolarEdgeSites(apiKey),
      });
      return null;
    }
  }, []);

  const connectSolarEdge = useCallback(async (apiKey: string, siteId: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return false;
      }

      const response = await supabase.functions.invoke('solaredge-auth', {
        body: { action: 'validate-and-store', apiKey, siteId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const errMsg = extractError(response);
      if (errMsg) {
        showOAuthError({
          provider: 'solaredge',
          stage: 'validate',
          rawMessage: errMsg,
          retry: () => void connectSolarEdge(apiKey, siteId),
        });
        return false;
      }

      trackConnectSuccess('solaredge');
      toast.success(`SolarEdge connected: ${response.data?.site?.name || 'Your solar site'}`);
      return true;
    } catch (error) {
      console.error('SolarEdge connection error:', error);
      showOAuthError({
        provider: 'solaredge',
        stage: 'validate',
        rawMessage: error instanceof Error ? error.message : undefined,
        retry: () => void connectSolarEdge(apiKey, siteId),
      });
      return false;
    }
  }, []);

  const connectWallbox = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return false;
      }

      const response = await supabase.functions.invoke('wallbox-auth', {
        body: { action: 'authenticate', email, password },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const errMsg = extractError(response);
      if (errMsg) {
        showOAuthError({
          provider: 'wallbox',
          stage: 'login',
          rawMessage: errMsg,
          retry: () => void connectWallbox(email, password),
        });
        return false;
      }

      toast.success('Wallbox account connected successfully!');
      return true;
    } catch (error) {
      console.error('Wallbox connection error:', error);
      showOAuthError({
        provider: 'wallbox',
        stage: 'login',
        rawMessage: error instanceof Error ? error.message : undefined,
        retry: () => void connectWallbox(email, password),
      });
      return false;
    }
  }, []);

  return {
    startTeslaOAuth,
    startEnphaseOAuth,
    exchangeTeslaCode,
    exchangeEnphaseCode,
    connectSolarEdge,
    listSolarEdgeSites,
    connectWallbox,
  };
}
