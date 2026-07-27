import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { DeviceSelectionDialog } from '@/components/dashboard/DeviceSelectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { BrandSplash } from '@/components/ui/BrandSplash';
import { Button } from '@/components/ui/button';
import { oauthDiag } from '@/lib/oauthDiagnostics';

const TESLA_OAUTH_RETURN_TO_KEY = 'tesla_oauth_return_to';

function consumeSafeReturnPath(): string | null {
  const saved = localStorage.getItem(TESLA_OAUTH_RETURN_TO_KEY);
  localStorage.removeItem(TESLA_OAUTH_RETURN_TO_KEY);
  if (!saved) return null;
  if (saved.startsWith('/') && !saved.startsWith('//')) return saved;
  try {
    const url = new URL(saved);
    const allowedHosts = new Set([
      'zensolar.com',
      'www.zensolar.com',
      'beta.zensolar.com',
      'www.beta.zensolar.com',
      'zen.solar',
      'www.zen.solar',
      'beta.zen.solar',
    ]);
    if (allowedHosts.has(url.hostname) || url.hostname.endsWith('.lovable.app')) return url.toString();
  } catch {
    return null;
  }
  return null;
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
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'device-selection'>('processing');
  const [deviceProvider, setDeviceProvider] = useState<'tesla' | 'enphase'>('tesla');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [canRetry, setCanRetry] = useState(false);
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
      setStatus('error');
      setTimeout(() => { window.location.href = '/'; }, 3000);
      return;
    }

    if (!code) {
      oauthDiag('OAuthCallback', 'callback:no-code');
      setErrorMessage('No authorization code received');
      setStatus('error');
      setTimeout(() => { window.location.href = '/'; }, 2000);
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

    // Wait for session to be restored (important after mobile redirect).
    oauthDiag('OAuthCallback', 'session:restore:start');
    let retries = 0;
    const maxRetries = 30; // 15 seconds total
    let session = null;
    
    while (retries < maxRetries) {
      const { data } = await supabase.auth.getSession();
      session = data.session;
      
      if (session) {
        console.log('[OAuthCallback] Session restored after', retries, 'retries');
        break;
      }
      
      if (retries > 0 && retries % 5 === 0) {
        console.log('[OAuthCallback] Attempting explicit session refresh');
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (refreshData.session) {
          session = refreshData.session;
          console.log('[OAuthCallback] Session restored via explicit refresh');
          break;
        }
      }
      
      console.log('[OAuthCallback] Waiting for session restoration, attempt', retries + 1);
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }

    if (!session && !isTesla) {
      console.error('[OAuthCallback] Failed to restore session after', maxRetries, 'attempts');
      setErrorMessage('Session expired. Please log in and try again.');
      setStatus('error');
      setCanRetry(true);
      setTimeout(() => { window.location.href = '/auth'; }, 5000);
      return;
    }

    if (isTesla) {
      console.log('[OAuthCallback] Processing Tesla callback');
      
      // Clear OAuth state
      localStorage.removeItem('tesla_oauth_state');
      localStorage.removeItem('tesla_oauth_pending');
      
      // Fire the exchange request immediately. On mobile Safari the response can
      // occasionally be dropped after an external OAuth redirect, so we use the
      // direct exchange result when available and keep DB polling as fallback.
      console.log('[OAuthCallback] Firing Tesla code exchange...');
      const exchangePromise = exchangeTeslaCode(code, state).then(
        (result) => {
          console.log('[OAuthCallback] Tesla exchange resolved:', result);
          return result;
        },
        (err) => {
          console.warn('[OAuthCallback] Tesla exchange rejected (expected on some mobile redirects):', err);
          return false;
        }
      );

      // Give exchange-code time to complete on the server before polling
      console.log('[OAuthCallback] Waiting 3s for exchange to complete before polling...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Poll for tokens using multiple strategies (edge function + direct DB fallback)
      const maxPollAttempts = 30; // 30 seconds total (1s per attempt)
      let pollAttempt = 0;
      let tokensFound = await withTimeout(exchangePromise, 12000, 'Tesla code exchange').catch(() => false);

      if (tokensFound) {
        console.log('[OAuthCallback] ✅ Tesla tokens confirmed via exchange response');
      }

      while (!tokensFound && pollAttempt < maxPollAttempts) {
        pollAttempt++;
        console.log('[OAuthCallback] Poll attempt', pollAttempt);
        
        // Strategy 1: Edge function (bypasses RLS, uses service role key)
        try {
          const checkResult = await withTimeout(
            supabase.functions.invoke('tesla-auth', {
              body: { action: 'check-tokens' },
            }).then(({ data, error }) => {
              if (error) {
                console.warn('[OAuthCallback] Edge fn check error:', error);
                return null;
              }
              return data;
            }),
            3000,
            'check-tokens edge fn'
          ).catch(() => null);
          
          if (checkResult?.exists) {
            console.log('[OAuthCallback] ✅ Tesla tokens confirmed via edge function on attempt', pollAttempt);
            tokensFound = true;
            break;
          }
        } catch (e) {
          console.warn('[OAuthCallback] Edge fn poll failed:', e);
        }

        // Strategy 2: RPC fallback (works when session is strong)
        try {
          const directResult = await withTimeout(
            Promise.resolve(
              supabase.rpc('get_connected_providers', { _user_id: session.user.id })
            ).then(({ data }) => data?.find((r: { provider: string }) => r.provider === 'tesla') ?? null),
            2000,
            'check-tokens RPC'
          ).catch(() => null);
          
          if (directResult) {
            console.log('[OAuthCallback] ✅ Tesla tokens confirmed via direct DB on attempt', pollAttempt);
            tokensFound = true;
            break;
          }
        } catch (e) {
          console.warn('[OAuthCallback] Direct DB poll failed:', e);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (tokensFound) {
        const safeReturnPath = consumeSafeReturnPath();
        if (safeReturnPath) {
          const sep = safeReturnPath.includes('?') ? '&' : '?';
          window.location.replace(`${safeReturnPath}${sep}oauth_success=true&provider=tesla&device_selection=true`);
          return;
        }

        const isBetaFlow = localStorage.getItem('beta_energy_flow') === 'true';
        const isOnboardingFlow = localStorage.getItem('onboarding_energy_flow') === 'true';
        localStorage.removeItem('onboarding_energy_flow');
        if (isBetaFlow) {
          localStorage.removeItem('beta_energy_flow');
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'oauth_success', provider: 'tesla' }, window.location.origin);
            window.close();
            return;
          }
          window.location.href = '/beta/tesla';
          return;
        }
        if (isOnboardingFlow) {
          if (window.opener && !window.opener.closed) {
            console.log('[OAuthCallback] Signaling opener window for Tesla onboarding success');
            window.opener.postMessage({ type: 'oauth_success', provider: 'tesla' }, window.location.origin);
            window.close();
            return;
          }
          // CRITICAL: Use hard redirect, not react-router navigate — SPA routing breaks on PWA after OAuth redirects
          console.log('[OAuthCallback] Hard redirect to onboarding with Tesla success');
          window.location.href = '/onboarding?oauth_success=true&provider=tesla';
        } else {
          setDeviceProvider('tesla');
          setStatus('device-selection');
        }
      } else {
        console.error('[OAuthCallback] Tesla tokens not found after polling');
        setErrorMessage('Connection timed out. Please try again.');
        setStatus('error');
        setCanRetry(true);
        setTimeout(() => { window.location.href = '/'; }, 5000);
      }
      return;
    }

    if (enphaseOAuthPending) {
      console.log('[OAuthCallback] Processing Enphase callback');
      sessionStorage.removeItem('enphase_oauth_pending');
      
      try {
        const success = await withTimeout(
          exchangeEnphaseCode(code),
          20000,
          'Enphase code exchange'
        );
        console.log('[OAuthCallback] Enphase exchange result:', success);
        
        if (success) {
          const isBetaFlow = localStorage.getItem('beta_energy_flow') === 'true';
          const isOnboardingFlow = localStorage.getItem('onboarding_energy_flow') === 'true';
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
        console.error('[OAuthCallback] Enphase exchange error:', err);
        setErrorMessage('Connection timed out. Please try again.');
        setStatus('error');
        setCanRetry(true);
        setTimeout(() => { window.location.href = '/'; }, 5000);
      }
      return;
    }

    // Unknown callback
    console.error('[OAuthCallback] Unknown callback - no matching OAuth state found');
    setErrorMessage('Authorization session expired. Please try again.');
    setStatus('error');
    setCanRetry(true);
    setTimeout(() => { window.location.href = '/'; }, 3000);
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
    return <BrandSplash label="Connecting your account..." />;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        {status === 'success' && (
          <p className="text-primary font-medium">Account connected! Redirecting...</p>
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