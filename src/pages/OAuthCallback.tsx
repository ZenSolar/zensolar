import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { DeviceSelectionDialog } from '@/components/dashboard/DeviceSelectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Module-level flag to survive component remounts during the same page session
// Track which code was processed to allow retries with new codes
let moduleProcessedCode: string | null = null;

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

    console.log('[OAuthCallback] Processing callback:', { 
      hasCode: !!code, 
      hasState: !!state, 
      error,
      errorDescription 
    });

    // Handle OAuth provider errors
    if (error) {
      console.error('[OAuthCallback] OAuth error from provider:', error, errorDescription);
      setErrorMessage(errorDescription || error);
      setStatus('error');
      setTimeout(() => { window.location.href = '/'; }, 3000);
      return;
    }

    if (!code) {
      console.error('[OAuthCallback] No authorization code received');
      setErrorMessage('No authorization code received');
      setStatus('error');
      setTimeout(() => { window.location.href = '/'; }, 2000);
      return;
    }

    // Wait for session to be restored (important after mobile redirect)
    console.log('[OAuthCallback] Starting session restoration...');
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

    if (!session) {
      console.error('[OAuthCallback] Failed to restore session after', maxRetries, 'attempts');
      setErrorMessage('Session expired. Please log in and try again.');
      setStatus('error');
      setCanRetry(true);
      setTimeout(() => { window.location.href = '/auth'; }, 5000);
      return;
    }

    // --- Determine which provider this callback is for ---
    const savedState = localStorage.getItem('tesla_oauth_state');
    const teslaMobilePending = localStorage.getItem('tesla_oauth_pending');
    const isTesla = (state && savedState === state) || teslaMobilePending || (state && !sessionStorage.getItem('enphase_oauth_pending'));
    
    const enphaseOAuthPending = sessionStorage.getItem('enphase_oauth_pending');

    if (isTesla) {
      console.log('[OAuthCallback] Processing Tesla callback');
      
      // Clear OAuth state
      localStorage.removeItem('tesla_oauth_state');
      localStorage.removeItem('tesla_oauth_pending');
      
      // Fire the exchange request but DON'T wait for the response.
      // Mobile Safari often drops fetch responses after redirects.
      // Instead, we fire-and-forget, then poll the DB for success.
      console.log('[OAuthCallback] Firing Tesla code exchange (fire-and-forget)...');
      exchangeTeslaCode(code).then(
        (result) => console.log('[OAuthCallback] Tesla exchange resolved:', result),
        (err) => console.warn('[OAuthCallback] Tesla exchange rejected (expected on mobile):', err)
      );

      // Give exchange-code time to complete on the server before polling
      console.log('[OAuthCallback] Waiting 3s for exchange to complete before polling...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Poll for tokens using multiple strategies (edge function + direct DB fallback)
      const maxPollAttempts = 30; // 30 seconds total (1s per attempt)
      let pollAttempt = 0;
      let tokensFound = false;

      while (pollAttempt < maxPollAttempts) {
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

        // Strategy 2: Direct DB query fallback (works when session is strong)
        try {
          const directResult = await withTimeout(
            Promise.resolve(
              supabase
                .from('energy_tokens')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('provider', 'tesla')
                .maybeSingle()
            ).then(({ data }) => data),
            2000,
            'check-tokens direct DB'
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
        const isOnboardingFlow = localStorage.getItem('onboarding_energy_flow') === 'true';
        localStorage.removeItem('onboarding_energy_flow');
        
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
          const isOnboardingFlow = localStorage.getItem('onboarding_energy_flow') === 'true';
          localStorage.removeItem('onboarding_energy_flow');
          
          if (isOnboardingFlow) {
            if (window.opener && !window.opener.closed) {
              console.log('[OAuthCallback] Signaling opener window for Enphase onboarding success');
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
    const currentCode = searchParams.get('code');
    
    const handleCallback = async () => {
      // Prevent double-processing across both re-renders AND remounts
      // But allow processing if a NEW code arrives (e.g. retry with fresh OAuth)
      if (hasProcessed.current || (moduleProcessedCode && moduleProcessedCode === currentCode)) {
        console.log('[OAuthCallback] Already processed this code, skipping');
        return;
      }
      hasProcessed.current = true;
      moduleProcessedCode = currentCode;

      await processCallback();
    };

    handleCallback();

    // Reset module flag when component fully unmounts (navigated away)
    return () => {
      setTimeout(() => { moduleProcessedCode = null; }, 2000);
    };
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
    moduleProcessedCode = null;
    window.location.href = '/onboarding';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        {status === 'processing' && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Connecting your account...</p>
          </>
        )}
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