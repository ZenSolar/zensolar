import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { DeviceSelectionDialog } from '@/components/dashboard/DeviceSelectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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
      // Prevent double-processing (React Strict Mode can cause double-mount)
      if (hasProcessed.current) {
        console.log('[OAuthCallback] Already processed, skipping');
        return;
      }
      hasProcessed.current = true;

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
      const maxRetries = 10;
      let session = null;
      
      while (retries < maxRetries) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
        
        if (session) {
          console.log('[OAuthCallback] Session restored after', retries, 'retries');
          break;
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

      // Check if this is a Tesla callback
      const savedState = localStorage.getItem('tesla_oauth_state');
      const teslaMobilePending = localStorage.getItem('tesla_oauth_pending');
      
      if ((state && savedState === state) || teslaMobilePending) {
        console.log('[OAuthCallback] Processing Tesla callback');
        
        // Clear OAuth state immediately to prevent reprocessing
        localStorage.removeItem('tesla_oauth_state');
        localStorage.removeItem('tesla_oauth_pending');
        
        try {
          const success = await exchangeTeslaCode(code);
          console.log('[OAuthCallback] Tesla exchange result:', success);
          
          if (success) {
            // Verify tokens were actually saved
            const { data: tokens } = await supabase
              .from('energy_tokens')
              .select('id')
              .eq('user_id', session.user.id)
              .eq('provider', 'tesla')
              .maybeSingle();
            
            if (tokens) {
              console.log('[OAuthCallback] Tesla tokens verified in database');
              setDeviceProvider('tesla');
              setStatus('device-selection');
            } else {
              console.error('[OAuthCallback] Tesla tokens not found after exchange');
              setErrorMessage('Token storage failed. Please try again.');
              setStatus('error');
              setTimeout(() => navigate('/'), 2000);
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

      // Check if this is an Enphase callback
      const enphaseOAuthPending = sessionStorage.getItem('enphase_oauth_pending');
      if (enphaseOAuthPending) {
        console.log('[OAuthCallback] Processing Enphase callback');
        sessionStorage.removeItem('enphase_oauth_pending');
        
        try {
          const success = await exchangeEnphaseCode(code);
          console.log('[OAuthCallback] Enphase exchange result:', success);
          
          if (success) {
            setDeviceProvider('enphase');
            setStatus('device-selection');
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
          <p className="text-green-500 font-medium">Account connected! Redirecting...</p>
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
