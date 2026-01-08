import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEnergyOAuth } from '@/hooks/useEnergyOAuth';
import { DeviceSelectionDialog } from '@/components/dashboard/DeviceSelectionDialog';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeTeslaCode, exchangeEnphaseCode } = useEnergyOAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'device-selection'>('processing');
  const [deviceProvider, setDeviceProvider] = useState<'tesla' | 'enphase'>('tesla');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      if (!code) {
        setStatus('error');
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      // Check if this is a Tesla callback (has state parameter)
      const savedState = sessionStorage.getItem('tesla_oauth_state');
      if (state && savedState === state) {
        sessionStorage.removeItem('tesla_oauth_state');
        const success = await exchangeTeslaCode(code);
        if (success) {
          // Show device selection after successful auth
          setDeviceProvider('tesla');
          setStatus('device-selection');
        } else {
          setStatus('error');
          setTimeout(() => navigate('/'), 1500);
        }
        return;
      }

      // Check if this is an Enphase callback
      const enphaseOAuthPending = sessionStorage.getItem('enphase_oauth_pending');
      if (enphaseOAuthPending) {
        sessionStorage.removeItem('enphase_oauth_pending');
        const success = await exchangeEnphaseCode(code);
        if (success) {
          // Show device selection after successful auth
          setDeviceProvider('enphase');
          setStatus('device-selection');
        } else {
          setStatus('error');
          setTimeout(() => navigate('/'), 1500);
        }
        return;
      }

      // Unknown callback
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
      <div className="text-center space-y-4">
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
          <p className="text-destructive font-medium">Connection failed. Redirecting...</p>
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
