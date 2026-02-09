import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { DeviceSelectionDialog } from '@/components/dashboard/DeviceSelectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Module-level flag to survive component remounts during the same page session
let moduleProcessed = false;

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeTeslaCode, exchangeEnphaseCode } = useEnergyOAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'device-selection'>('processing');
  const [deviceProvider, setDeviceProvider] = useState<'tesla' | 'enphase'>('tesla');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent double-processing across both re-renders AND remounts
      if (hasProcessed.current || moduleProcessed) {
        console.log('[OAuthCallback] Already processed, skipping');
        return;
      }
      hasProcessed.current = true;
      moduleProcessed = true;

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
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code) {
        console.error('[OAuthCallback] No authorization code received');
        setErrorMessage('No authorization code received');
        setStatus('error');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      // Wait for session to be restored (important after mobile redirect)
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
        setTimeout(() => navigate('/auth'), 3000);
        return;
      }

      // --- Determine which provider this callback is for ---
      // Tesla detection: check localStorage markers OR presence of state param
      // (Only Tesla uses a state parameter in our OAuth flow)
      const savedState = localStorage.getItem('tesla_oauth_state');
      const teslaMobilePending = localStorage.getItem('tesla_oauth_pending');
      const isTesla = (state && savedState === state) || teslaMobilePending || (state && !sessionStorage.getItem('enphase_oauth_pending'));
      
      // Enphase detection
      const enphaseOAuthPending = sessionStorage.getItem('enphase_oauth_pending');

      if (isTesla) {
        console.log('[OAuthCallback] Processing Tesla callback (state match:', !!(state && savedState === state), ', mobile pending:', !!teslaMobilePending, ', fallback:', !(state && savedState === state) && !teslaMobilePending, ')');
        
        // Clear OAuth state
        localStorage.removeItem('tesla_oauth_state');
        localStorage.removeItem('tesla_oauth_pending');
        
        try {
          const success = await exchangeTeslaCode(code);
          console.log('[OAuthCallback] Tesla exchange result:', success);
          
          if (success) {
            // Check if we're in onboarding flow
            const isOnboardingFlow = localStorage.getItem('onboarding_energy_flow') === 'true';
            localStorage.removeItem('onboarding_energy_flow');
            
            if (isOnboardingFlow) {
              // If we're in a popup, signal the opener window and close
              if (window.opener && !window.opener.closed) {
                console.log('[OAuthCallback] Signaling opener window for Tesla onboarding success');
                window.opener.postMessage({ type: 'oauth_success', provider: 'tesla' }, window.location.origin);
                window.close();
                return;
              }
              // Mobile same-tab redirect: navigate back to onboarding
              console.log('[OAuthCallback] Mobile redirect: navigating to onboarding with Tesla success');
              navigate('/onboarding?oauth_success=true&provider=tesla', { replace: true });
            } else {
              setDeviceProvider('tesla');
              setStatus('device-selection');
            }
          } else {
            console.error('[OAuthCallback] Tesla exchange returned false');
            setErrorMessage('Failed to exchange authorization code');
            setStatus('error');
            setTimeout(() => navigate('/'), 2000);
          }
        } catch (err) {
          console.error('[OAuthCallback] Tesla exchange error:', err);
          setErrorMessage('Connection error. Please try again.');
          setStatus('error');
          setTimeout(() => navigate('/'), 2000);
        }
        return;
      }

      if (enphaseOAuthPending) {
        console.log('[OAuthCallback] Processing Enphase callback');
        sessionStorage.removeItem('enphase_oauth_pending');
        
        try {
          const success = await exchangeEnphaseCode(code);
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
              navigate('/onboarding?oauth_success=true&provider=enphase', { replace: true });
            } else {
              setDeviceProvider('enphase');
              setStatus('device-selection');
            }
          } else {
            setErrorMessage('Failed to connect Enphase account');
            setStatus('error');
            setTimeout(() => navigate('/'), 2000);
          }
        } catch (err) {
          console.error('[OAuthCallback] Enphase exchange error:', err);
          setErrorMessage('Connection error. Please try again.');
          setStatus('error');
          setTimeout(() => navigate('/'), 2000);
        }
        return;
      }

      // Unknown callback - no matching OAuth state
      console.error('[OAuthCallback] Unknown callback - no matching OAuth state found');
      setErrorMessage('Authorization session expired. Please try again.');
      setStatus('error');
      setTimeout(() => navigate('/'), 2000);
    };

    handleCallback();

    // Reset module flag when component fully unmounts (navigated away)
    return () => {
      // Small delay to allow navigate to complete before resetting
      setTimeout(() => { moduleProcessed = false; }, 2000);
    };
  }, [searchParams, navigate, exchangeTeslaCode, exchangeEnphaseCode]);

  const handleDeviceSelectionComplete = () => {
    navigate('/');
  };

  const handleDeviceSelectionClose = (open: boolean) => {
    if (!open) {
      navigate('/');
    }
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
          <div className="space-y-2">
            <p className="text-destructive font-medium">Connection failed</p>
            {errorMessage && (
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            )}
            <p className="text-xs text-muted-foreground">Redirecting...</p>
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
