import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEnergyOAuth, type TeslaExchangeResult } from '@/hooks/useEnergyOAuth';
import { DeviceSelectionDialog } from '@/components/dashboard/DeviceSelectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { BrandSplash } from '@/components/ui/BrandSplash';
import { Button } from '@/components/ui/button';
import { oauthDiag } from '@/lib/oauthDiagnostics';

function isAllowedReturnTo(url: string): string | null {
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const u = new URL(url);
    const allowedHosts = new Set([
      'zensolar.com',
      'www.zensolar.com',
      'beta.zensolar.com',
      'www.beta.zensolar.com',
      'zen.solar',
      'www.zen.solar',
      'beta.zen.solar',
      'www.beta.zen.solar',
    ]);
    if (allowedHosts.has(u.hostname) || u.hostname.endsWith('.lovable.app')) return u.toString();
  } catch {
    return null;
  }
  return null;
}

// Canonical beta host for the reconnect CTA. Prefer the origin the user
// started OAuth from (stored in sessionStorage by startTeslaOAuth); fall back
// to beta.zensolar.com.
function resolveReconnectUrl(): string {
  try {
    const stored = sessionStorage.getItem('oauth_beta_host');
    if (stored) {
      const u = new URL(stored);
      const allowed = new Set([
        'beta.zensolar.com',
        'www.beta.zensolar.com',
        'beta.zen.solar',
        'www.beta.zen.solar',
      ]);
      if (allowed.has(u.hostname)) return `${u.origin}/beta/tesla`;
    }
  } catch { /* ignore */ }
  return 'https://beta.zensolar.com/beta/tesla';
}


// Timeout wrapper to prevent hanging promises
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      console.error(`[OAuthCallback] ${label} timed out after ${ms}ms`);
      reject(new Error(`${label} timed out`));
    }, ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { exchangeTeslaCode, exchangeEnphaseCode } = useEnergyOAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'device-selection' | 'link-expired'>('processing');
  const [deviceProvider, setDeviceProvider] = useState<'tesla' | 'enphase'>('tesla');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canRetry, setCanRetry] = useState(false);
  const [splashLabel, setSplashLabel] = useState<string>('Connecting your account...');
  const hasProcessed = useRef(false);

  const processCallback = async () => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    oauthDiag('OAuthCallback', 'callback:received', {
      hasCode: !!code,
      hasState: !!state,
      error,
      errorDescription,
      href: window.location.href,
      origin: window.location.origin,
      userAgent: navigator.userAgent.slice(0, 120),
      isStandalonePWA:
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true,
    });

    // Handle OAuth provider errors
    if (error) {
      oauthDiag('OAuthCallback', 'provider:error', { error, errorDescription });
      setErrorMessage(errorDescription || error);
      // Never bounce Tesla failures to the apex root — the apex "/" route is
      // /demo-gated and swallows the reconnect UI. Show the expired-link
      // screen with a Reconnect CTA instead.
      setStatus('link-expired');
      return;
    }

    if (!code) {
      oauthDiag('OAuthCallback', 'callback:no-code');
      setErrorMessage('No authorization code received');
      setStatus('link-expired');
      return;
    }


    const savedState = localStorage.getItem('tesla_oauth_state');
    const teslaMobilePending = localStorage.getItem('tesla_oauth_pending');
    const enphaseOAuthPending = sessionStorage.getItem('enphase_oauth_pending');
    const isTesla = (state && savedState === state) || teslaMobilePending || (state && !enphaseOAuthPending);

    oauthDiag('OAuthCallback', 'callback:classified', {
      isTesla: !!isTesla,
      stateMatchesLocal: !!(state && savedState === state),
      teslaMobilePending: !!teslaMobilePending,
      enphaseOAuthPending: !!enphaseOAuthPending,
    });

    // Domain hop: Tesla only accepts zensolar.com as redirect URI, but the
    // Supabase session (and beta subdomain UI) live on beta.zensolar.com.
    // If we landed on the apex and the state was minted with a beta return_to,
    // bounce the callback params over BEFORE touching the token exchange.
    if (isTesla && state && !searchParams.get('hopped')) {
      try {
        const host = window.location.hostname;
        const isApex = host === 'zensolar.com' || host === 'www.zensolar.com' || host === 'zen.solar' || host === 'www.zen.solar';
        if (isApex) {
          const lookup = await supabase.functions.invoke('tesla-auth', {
            body: { action: 'lookup-return-to', state },
          });
          const returnTo: string | null = lookup.data?.returnTo ?? null;
          let targetHost: string | null = null;
          if (returnTo) {
            try { targetHost = new URL(returnTo).hostname; } catch { targetHost = null; }
          }
          if (targetHost && (targetHost.startsWith('beta.') || targetHost.startsWith('www.beta.'))) {
            const params = new URLSearchParams(window.location.search);
            params.set('hopped', '1');
            const hopUrl = `https://${targetHost.replace(/^www\./, '')}/oauth/callback?${params.toString()}`;
            oauthDiag('OAuthCallback', 'callback:hop', { from: host, to: targetHost, hopUrl });
            window.location.replace(hopUrl);
            return;
          }
        }
      } catch (err) {
        oauthDiag('OAuthCallback', 'callback:hop:error', {
          message: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Wait for session to be restored (important after mobile redirect).
    oauthDiag('OAuthCallback', 'session:restore:start');
    let retries = 0;
    const maxRetries = 30; // 15 seconds total
    let session = null;
    
    while (retries < maxRetries) {
      const { data } = await supabase.auth.getSession();
      session = data.session;

      if (session) {
        oauthDiag('OAuthCallback', 'session:restored', { retries, userId: session.user.id });
        break;
      }

      if (retries > 0 && retries % 5 === 0) {
        oauthDiag('OAuthCallback', 'session:refresh:attempt', { retries });
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData.session) {
          session = refreshData.session;
          oauthDiag('OAuthCallback', 'session:refresh:success', { retries, userId: session.user.id });
          break;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!session && !isTesla) {
      oauthDiag('OAuthCallback', 'session:restore:failed', { maxRetries });
      setErrorMessage('Session expired. Please log in and try again.');
      setStatus('error');
      setCanRetry(true);
      setTimeout(() => { window.location.href = '/auth'; }, 5000);
      return;
    }

    if (isTesla) {
      setSplashLabel('Connecting your Tesla...');
      oauthDiag('OAuthCallback', 'tesla:start', {
        hasSession: !!session,
        userId: session?.user.id ?? null,
      });

      localStorage.removeItem('tesla_oauth_state');
      localStorage.removeItem('tesla_oauth_pending');

      oauthDiag('OAuthCallback', 'tesla:exchange:fire');
      let exchangeResult: TeslaExchangeResult | null = null;
      try {
        exchangeResult = await withTimeout(
          exchangeTeslaCode(code, state) as Promise<TeslaExchangeResult>,
          15000,
          'Tesla code exchange',
        );
      } catch (err) {
        oauthDiag('OAuthCallback', 'tesla:exchange:rejected', {
          message: err instanceof Error ? err.message : String(err),
        });
      }
      oauthDiag('OAuthCallback', 'tesla:exchange:resolved', {
        ok: exchangeResult?.ok ?? null,
        errorCode:
          exchangeResult && exchangeResult.ok === false ? exchangeResult.errorCode : null,
      });

      // Standardized link-lifecycle failures → explicit "reconnect" screen.
      if (exchangeResult && exchangeResult.ok === false) {
        const ec = exchangeResult.errorCode;
        if (ec === 'state_expired' || ec === 'state_consumed' || ec === 'state_missing') {
          oauthDiag('OAuthCallback', 'tesla:link-expired', { errorCode: ec });
          setErrorMessage(exchangeResult.message);
          setStatus('link-expired');
          return;
        }
      }

      const serverReturnTo =
        exchangeResult && exchangeResult.ok === true ? exchangeResult.returnTo : null;
      let tokensFound = !!(exchangeResult && exchangeResult.ok === true);

      // If the exchange call itself failed (network / timeout), fall back to
      // polling check-tokens — the server-side upsert may have completed even
      // though our HTTP response never came back cleanly (mobile Safari).
      const maxPollAttempts = tokensFound ? 0 : 30;
      let pollAttempt = 0;
      let tokensSource: 'exchange' | 'edge-fn' | 'rpc' | null = tokensFound ? 'exchange' : null;

      while (!tokensFound && pollAttempt < maxPollAttempts) {
        pollAttempt++;
        oauthDiag('OAuthCallback', 'tesla:poll:attempt', { pollAttempt });

        try {
          const checkResult = await withTimeout(
            supabase.functions.invoke('tesla-auth', {
              body: { action: 'check-tokens' },
            }).then(({ data, error }) => {
              if (error) {
                oauthDiag('OAuthCallback', 'tesla:poll:edge-fn:error', { message: error.message });
                return null;
              }
              return data;
            }),
            3000,
            'check-tokens edge fn',
          ).catch(() => null);

          if (checkResult?.exists) {
            oauthDiag('OAuthCallback', 'tesla:tokens:found', { source: 'edge-fn', pollAttempt });
            tokensFound = true;
            tokensSource = 'edge-fn';
            break;
          }
        } catch (e) {
          oauthDiag('OAuthCallback', 'tesla:poll:edge-fn:throw', {
            message: e instanceof Error ? e.message : String(e),
          });
        }

        if (session) {
          try {
            const directResult = await withTimeout(
              Promise.resolve(
                supabase.rpc('get_connected_providers', { _user_id: session.user.id }),
              ).then(({ data }) => data?.find((r: { provider: string }) => r.provider === 'tesla') ?? null),
              2000,
              'check-tokens RPC',
            ).catch(() => null);

            if (directResult) {
              oauthDiag('OAuthCallback', 'tesla:tokens:found', { source: 'rpc', pollAttempt });
              tokensFound = true;
              tokensSource = 'rpc';
              break;
            }
          } catch (e) {
            oauthDiag('OAuthCallback', 'tesla:poll:rpc:throw', {
              message: e instanceof Error ? e.message : String(e),
            });
          }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (tokensFound) {
        const safeReturnPath = serverReturnTo ? isAllowedReturnTo(serverReturnTo) : null;
        const isBetaFlow = localStorage.getItem('beta_energy_flow') === 'true';
        const isOnboardingFlow = localStorage.getItem('onboarding_energy_flow') === 'true';

        oauthDiag('OAuthCallback', 'tesla:route:decide', {
          tokensSource,
          hasSafeReturnPath: !!safeReturnPath,
          safeReturnPath,
          isBetaFlow,
          isOnboardingFlow,
          hasOpener: !!(window.opener && !window.opener.closed),
        });

        if (safeReturnPath) {
          const sep = safeReturnPath.includes('?') ? '&' : '?';
          const url = `${safeReturnPath}${sep}oauth_success=true&provider=tesla&device_selection=true`;
          oauthDiag('OAuthCallback', 'tesla:route:return-path', { url });
          window.location.replace(url);
          return;
        }

        localStorage.removeItem('onboarding_energy_flow');
        if (isBetaFlow) {
          localStorage.removeItem('beta_energy_flow');
          if (window.opener && !window.opener.closed) {
            oauthDiag('OAuthCallback', 'tesla:route:beta:postmessage');
            window.opener.postMessage({ type: 'oauth_success', provider: 'tesla' }, window.location.origin);
            window.close();
            return;
          }
          oauthDiag('OAuthCallback', 'tesla:route:beta:redirect', { url: '/beta/tesla' });
          window.location.href = '/beta/tesla?oauth_success=true&device_selection=true';
          return;
        }
        if (isOnboardingFlow) {
          if (window.opener && !window.opener.closed) {
            oauthDiag('OAuthCallback', 'tesla:route:onboarding:postmessage');
            window.opener.postMessage({ type: 'oauth_success', provider: 'tesla' }, window.location.origin);
            window.close();
            return;
          }
          oauthDiag('OAuthCallback', 'tesla:route:onboarding:redirect', {
            url: '/onboarding?oauth_success=true&provider=tesla',
          });
          window.location.href = '/onboarding?oauth_success=true&provider=tesla';
        } else {
          oauthDiag('OAuthCallback', 'tesla:route:inline-device-selection');
          setDeviceProvider('tesla');
          setStatus('device-selection');
        }
      } else {
        oauthDiag('OAuthCallback', 'tesla:tokens:not-found', { pollAttempts: pollAttempt });
        setErrorMessage('Connection timed out. Please try again — your Tesla link may have expired.');
        setStatus('link-expired');
      }
      return;
    }


    if (enphaseOAuthPending) {
      oauthDiag('OAuthCallback', 'enphase:start');
      sessionStorage.removeItem('enphase_oauth_pending');

      try {
        const success = await withTimeout(
          exchangeEnphaseCode(code),
          20000,
          'Enphase code exchange'
        );
        oauthDiag('OAuthCallback', 'enphase:exchange:result', { success });

        if (success) {
          const isBetaFlow = localStorage.getItem('beta_energy_flow') === 'true';
          const isOnboardingFlow = localStorage.getItem('onboarding_energy_flow') === 'true';
          oauthDiag('OAuthCallback', 'enphase:route:decide', {
            isBetaFlow,
            isOnboardingFlow,
            hasOpener: !!(window.opener && !window.opener.closed),
          });
          localStorage.removeItem('onboarding_energy_flow');
          if (isBetaFlow) {
            localStorage.removeItem('beta_energy_flow');
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'oauth_success', provider: 'enphase' }, window.location.origin);
              window.close();
              return;
            }
            window.location.href = '/beta/solar';
            return;
          }
          if (isOnboardingFlow) {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ type: 'oauth_success', provider: 'enphase' }, window.location.origin);
              window.close();
              return;
            }
            window.location.href = '/onboarding?oauth_success=true&provider=enphase';
          } else {
            setDeviceProvider('enphase');
            setStatus('device-selection');
          }
        } else {
          setErrorMessage('Failed to connect Enphase account');
          setStatus('error');
          setCanRetry(true);
          setTimeout(() => { window.location.href = '/'; }, 5000);
        }
      } catch (err) {
        oauthDiag('OAuthCallback', 'enphase:exchange:throw', {
          message: err instanceof Error ? err.message : String(err),
        });
        setErrorMessage('Connection timed out. Please try again.');
        setStatus('error');
        setCanRetry(true);
        setTimeout(() => { window.location.href = '/'; }, 5000);
      }
      return;
    }

    oauthDiag('OAuthCallback', 'callback:unknown', { savedState, state });
    setErrorMessage('Authorization session expired. Please try again.');
    setStatus('link-expired');
  };


  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate processing inside this mounted instance only.
      // Do not use a module-level processed-code guard here: iOS/PWA + React
      // remounts can leave the second mounted instance on the splash forever
      // while the first unmounted instance owns the async state updates.
      if (hasProcessed.current) {
        console.log('[OAuthCallback] Already processed this code, skipping');
        return;
      }
      hasProcessed.current = true;

      await processCallback();
    };

    handleCallback();
  }, [searchParams, exchangeTeslaCode, exchangeEnphaseCode]);

  const handleDeviceSelectionComplete = () => {
    window.location.href = '/';
  };

  const handleDeviceSelectionClose = (open: boolean) => {
    if (!open) {
      window.location.href = '/';
    }
  };

  const handleRetry = () => {
    // Reset flags and hard-redirect to trigger a fresh attempt
    hasProcessed.current = false;
    window.location.href = '/onboarding';
  };

  // While processing, render the brand splash as a true full-screen layout so
  // the logo lands optically centered (no wrapping flex-with-text-below shifting it down).
  if (status === 'processing') {
    return <BrandSplash label={splashLabel} />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        {status === 'success' && (
          <p className="text-primary font-medium">Account connected! Redirecting...</p>
        )}
        {status === 'link-expired' && (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold text-foreground">This link expired</h1>
            <p className="text-sm text-muted-foreground">
              {errorMessage || "Let's reconnect your Tesla — it only takes a moment."}
            </p>
            <Button
              onClick={() => {
                hasProcessed.current = false;
                // Always land on the canonical beta host so startTeslaOAuth
                // mints a fresh state row (and the /demo gate on apex never
                // swallows the reconnect flow).
                window.location.href = resolveReconnectUrl();
              }}
              className="mt-2"
            >
              Reconnect Tesla
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <p className="text-destructive font-medium">Connection failed</p>
            {errorMessage && (
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            )}
            {canRetry ? (
              <Button variant="outline" onClick={handleRetry} className="mt-2">
                Try Again
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Redirecting...</p>
            )}
          </div>
        )}
        {status === 'device-selection' && (
          <>
            <p className="text-muted-foreground mb-4">Authorization successful! Now select your devices...</p>
            <DeviceSelectionDialog
              open={true}
              onOpenChange={handleDeviceSelectionClose}
              provider={deviceProvider}
              onComplete={handleDeviceSelectionComplete}
            />
          </>
        )}
      </div>
    </div>
  );
}