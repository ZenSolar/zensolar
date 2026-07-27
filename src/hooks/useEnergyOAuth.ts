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
import { oauthDiag } from '@/lib/oauthDiagnostics';

/** Fire a success event, attributing the connect to Deason if the user
 *  saw a seeded playbook (auto-open or nudge) in the last 5 min. */
function trackConnectSuccess(provider: Provider) {
  const deasonAssisted = consumeRecentDeasonSeed(provider);
  trackEvent('energy_account_connected', { provider, deason_assisted: deasonAssisted });
  if (deasonAssisted) {
    trackEvent('deason_seeded_connection_success', { provider });
  }
}


// Tesla only whitelists specific redirect URIs registered on the client_id.
// Only `https://zensolar.com/oauth/callback` is registered. Every other host
// (beta.zensolar.com, beta.zen.solar, *.lovableproject.com, PWAs) MUST route
// through zensolar.com or Tesla rejects with "redirect_uri not registered".
// The callback route on zensolar.com hands the session back via the stored
// return-to path.
function resolveOAuthOrigin(): string {
  return 'https://zensolar.com';
}
const REDIRECT_URI = `${resolveOAuthOrigin()}/oauth/callback`;

const TESLA_OAUTH_RETURN_TO_KEY = 'tesla_oauth_return_to';

type TeslaOAuthOptions = {
  returnTo?: string;
};

function sanitizeReturnPath(path?: string): string | null {
  if (!path) return null;
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

function safeCurrentOrigin(): string {
  const { origin, hostname } = window.location;
  const allowedHosts = new Set([
    'zensolar.com',
    'www.zensolar.com',
    'beta.zensolar.com',
    'www.beta.zensolar.com',
    'zen.solar',
    'www.zen.solar',
    'beta.zen.solar',
  ]);
  if (
    allowedHosts.has(hostname) ||
    hostname.endsWith('.lovable.app') ||
    hostname.endsWith('.lovableproject.com') ||
    hostname === 'localhost'
  ) {
    return origin;
  }
  return 'https://beta.zen.solar';
}

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
  const startTeslaOAuth = useCallback(async (options?: TeslaOAuthOptions): Promise<void> => {
    try {
      oauthDiag('useEnergyOAuth', 'tesla:start:begin', {
        returnTo: options?.returnTo,
        origin: window.location.origin,
        redirectUri: REDIRECT_URI,
        isMobile: isMobile(),
      });
      localStorage.removeItem('tesla_oauth_state');
      const returnTo = sanitizeReturnPath(options?.returnTo);
      if (returnTo) {
        localStorage.setItem(TESLA_OAUTH_RETURN_TO_KEY, returnTo);
      } else {
        localStorage.removeItem(TESLA_OAUTH_RETURN_TO_KEY);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        oauthDiag('useEnergyOAuth', 'tesla:start:no-session');
        toast.error('Please log in first');
        return;
      }

      const state = crypto.randomUUID();
      localStorage.setItem('tesla_oauth_state', state);
      oauthDiag('useEnergyOAuth', 'tesla:start:state-generated', { state });

      const response = await supabase.functions.invoke('tesla-auth', {
        body: { redirectUri: REDIRECT_URI, state, action: 'get-auth-url', returnTo, returnOrigin: safeCurrentOrigin() },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const errMsg = extractError(response);
      if (errMsg || !response.data?.authUrl) {
        oauthDiag('useEnergyOAuth', 'tesla:start:get-auth-url:failed', { errMsg });
        throw new Error(errMsg || 'Failed to get auth URL');
      }

      const { authUrl } = response.data;
      oauthDiag('useEnergyOAuth', 'tesla:start:redirect', {
        authHost: (() => { try { return new URL(authUrl).host; } catch { return null; } })(),
        isMobile: isMobile(),
      });

      if (isMobile()) {
        localStorage.setItem('tesla_oauth_pending', 'true');
        window.location.href = authUrl;
      } else {
        const popup = window.open(authUrl, 'tesla_auth', 'width=600,height=700,noopener');
        if (!popup) {
          oauthDiag('useEnergyOAuth', 'tesla:start:popup-blocked');
          showOAuthError({
            provider: 'tesla',
            stage: 'start',
            rawMessage: 'Popup blocked',
            retry: () => void startTeslaOAuth(options),
          });
          return;
        }
        toast.info('Complete Tesla login in the popup window');
      }
    } catch (error) {
      oauthDiag('useEnergyOAuth', 'tesla:start:throw', {
        message: error instanceof Error ? error.message : String(error),
      });
      showOAuthError({
        provider: 'tesla',
        stage: 'start',
        rawMessage: error instanceof Error ? error.message : undefined,
        retry: () => void startTeslaOAuth(options),
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

  const exchangeTeslaCode = useCallback(async (code: string, state?: string | null): Promise<boolean> => {
    try {
      oauthDiag('useEnergyOAuth', 'tesla:exchange:begin', {
        hasCode: !!code,
        hasState: !!state,
      });
      const { data: { session } } = await supabase.auth.getSession();

      const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined;
      oauthDiag('useEnergyOAuth', 'tesla:exchange:invoke', {
        hasSessionHeader: !!headers,
        userId: session?.user.id ?? null,
      });
      const response = await supabase.functions.invoke('tesla-auth', {
        body: { code, redirectUri: REDIRECT_URI, state, action: 'exchange-code' },
        headers,
      });

      const errMsg = extractError(response);
      if (errMsg) {
        oauthDiag('useEnergyOAuth', 'tesla:exchange:error', { errMsg });
        throw new Error(errMsg);
      }

      const returnTo = response.data?.returnTo;
      oauthDiag('useEnergyOAuth', 'tesla:exchange:success', {
        needsDeviceSelection: response.data?.needsDeviceSelection,
        returnTo,
      });
      if (typeof returnTo === 'string') {
        localStorage.setItem(TESLA_OAUTH_RETURN_TO_KEY, returnTo);
      }

      trackConnectSuccess('tesla');
      toast.success('Tesla account connected!');
      return true;
    } catch (error) {
      oauthDiag('useEnergyOAuth', 'tesla:exchange:throw', {
        message: error instanceof Error ? error.message : String(error),
      });
      showOAuthError({
        provider: 'tesla',
        stage: 'exchange',
        rawMessage: error instanceof Error ? error.message : undefined,
        retry: () => void exchangeTeslaCode(code, state),
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

  const rollbackWallboxConnection = useCallback(async (userId: string) => {
    try {
      await supabase.from('energy_tokens').delete().eq('user_id', userId).eq('provider', 'wallbox');
      await supabase.from('connected_devices').delete().eq('user_id', userId).eq('provider', 'wallbox');
      await supabase.from('profiles').update({ wallbox_connected: false }).eq('user_id', userId);
    } catch (e) {
      console.error('Wallbox rollback failed:', e);
    }
  }, []);

  const connectWallbox = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in first');
        return false;
      }
      const userId = session.user.id;

      // Step 1: authenticate with Wallbox and persist token
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

      // Step 2: first-proof — verify at least one charger reports a status/reading
      let chargerCount = 0;
      try {
        const probe = await supabase.functions.invoke('wallbox-data', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const chargers = (probe?.data as any)?.chargers ?? (probe?.data as any)?.data ?? [];
        chargerCount = Array.isArray(chargers) ? chargers.length : 0;
      } catch (probeErr) {
        console.error('Wallbox first-reading probe failed:', probeErr);
      }

      if (chargerCount === 0) {
        // Roll back: don't leave the profile marked connected with no chargers
        await rollbackWallboxConnection(userId);
        showOAuthError({
          provider: 'wallbox',
          stage: 'login',
          rawMessage: "Connected to Wallbox, but no chargers were found on this account. Check that your charger is registered in the Wallbox app, then try again.",
          retry: () => void connectWallbox(email, password),
        });
        return false;
      }

      trackConnectSuccess('wallbox');
      toast.success(`Wallbox connected — ${chargerCount} charger${chargerCount === 1 ? '' : 's'} detected.`);
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
  }, [rollbackWallboxConnection]);

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
