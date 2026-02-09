import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WalletChoiceScreen, WalletChoice } from "@/components/onboarding/WalletChoiceScreen";
import { WalletSetupScreen } from "@/components/onboarding/WalletSetupScreen";
import { ExternalWalletScreen } from "@/components/onboarding/ExternalWalletScreen";
import { OnboardingSuccessScreen } from "@/components/onboarding/OnboardingSuccessScreen";
import { EnergyConnectionScreen, EnergyProvider } from "@/components/onboarding/EnergyConnectionScreen";
import { EnergySuccessScreen } from "@/components/onboarding/EnergySuccessScreen";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingTransition } from "@/components/onboarding/OnboardingTransition";
import { EnphaseCodeDialog } from "@/components/dashboard/EnphaseCodeDialog";
import { SolarEdgeConnectDialog } from "@/components/dashboard/SolarEdgeConnectDialog";
import { WallboxConnectDialog } from "@/components/dashboard/WallboxConnectDialog";
import { DeviceSelectionDialog } from "@/components/dashboard/DeviceSelectionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { dispatchProfileUpdated } from "@/hooks/useProfile";
import { useEnergyOAuth } from "@/hooks/useEnergyOAuth";
import { toast } from "sonner";
import { triggerSuccess } from "@/hooks/useHaptics";
import { 
  trackWalletChoiceViewed,
  trackWalletChoiceSelected, 
  trackWalletConnected, 
  trackWalletSkipped,
  trackOnboardingComplete 
} from "@/lib/onboardingAnalytics";
import { trackEvent } from "@/hooks/useGoogleAnalytics";

type OnboardingStep = 
  | 'wallet-choice' 
  | 'zensolar-setup' 
  | 'external-wallet' 
  | 'wallet-success'
  | 'energy-connect'
  | 'energy-success'
  | 'device-selection';

type WalletType = 'zensolar' | 'external' | 'skipped';

// Helper to get current step number for progress indicator (1-4 sequential)
function getStepNumber(step: OnboardingStep): number {
  switch (step) {
    case 'wallet-choice':
      return 1;
    case 'zensolar-setup':
    case 'external-wallet':
      return 2;
    case 'wallet-success':
      return 2; // Still step 2 (completing wallet)
    case 'energy-connect':
      return 3;
    case 'device-selection':
      return 3;
    case 'energy-success':
      return 4;
    default:
      return 1;
  }
}

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('wallet-choice');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>('skipped');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [lastConnectedProvider, setLastConnectedProvider] = useState<string>('');
  const [connectingProvider, setConnectingProvider] = useState<EnergyProvider | null>(null);
  const [showDeviceSelection, setShowDeviceSelection] = useState(false);
  const [deviceSelectionProvider, setDeviceSelectionProvider] = useState<'tesla' | 'enphase'>('tesla');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Dialog states for credential-based providers
  const [showEnphaseDialog, setShowEnphaseDialog] = useState(false);
  const [showSolarEdgeDialog, setShowSolarEdgeDialog] = useState(false);
  const [showWallboxDialog, setShowWallboxDialog] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { startTeslaOAuth, startEnphaseOAuth, connectSolarEdge, connectWallbox, exchangeEnphaseCode } = useEnergyOAuth();

  // Ensure we don't spam wallet saves/toasts if the wallet SDK calls onComplete multiple times.
  const walletSaveInFlightRef = useRef(false);
  const latestWalletAddressRef = useRef<string | null>(null);
  const profileEnsuredRef = useRef(false);

  // New-user race fix: ensure a profiles row exists ASAP (before wallet or energy updates).
  useEffect(() => {
    const ensureProfileExists = async () => {
      if (!user?.id || profileEnsuredRef.current) return;
      profileEnsuredRef.current = true;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[Onboarding] ensureProfileExists: select error', error);
        }

        if (!data) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ user_id: user.id });

          if (insertError) {
            // If another flow created it concurrently, ignore.
            console.warn('[Onboarding] ensureProfileExists: insert error', insertError);
          } else {
            console.log('[Onboarding] ✅ Created minimal profile row');
          }
        }
      } catch (err) {
        console.warn('[Onboarding] ensureProfileExists: unexpected error', err);
      }
    };

    ensureProfileExists();
  }, [user?.id]);

  // Animated step transition helper
  const transitionToStep = (newStep: OnboardingStep) => {
    // Only show transition for major step changes
    const currentMajorStep = getStepNumber(step);
    const newMajorStep = getStepNumber(newStep);
    
    if (currentMajorStep !== newMajorStep) {
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(newStep);
        setTimeout(() => setIsTransitioning(false), 300);
      }, 400);
    } else {
      setStep(newStep);
    }
  };

  // Track initial view
  useEffect(() => {
    trackWalletChoiceViewed();
  }, []);

  // Handle window focus to detect if user returned from OAuth popup without completing
  // This prevents the "frozen" state when user closes the OAuth popup
  useEffect(() => {
    const handleWindowFocus = () => {
      // If we were in the middle of an OAuth flow but came back, clear the connecting state after a delay
      // The delay allows successful OAuth redirects to complete first
      if (connectingProvider === 'tesla' || connectingProvider === 'enphase') {
        const timeoutId = setTimeout(() => {
          // Check if we're still on energy-connect step (not redirected to success)
          // and no dialog is open (meaning OAuth failed/was cancelled)
          if (!showEnphaseDialog && !showDeviceSelection) {
            setConnectingProvider(null);
          }
        }, 2000); // Give OAuth redirect time to complete
        
        return () => clearTimeout(timeoutId);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [connectingProvider, showEnphaseDialog, showDeviceSelection]);

  // Check if we should skip to a specific step or handle OAuth callback
  useEffect(() => {
    const skipTo = searchParams.get('step');
    const choice = searchParams.get('choice');
    const oauthSuccess = searchParams.get('oauth_success');
    const provider = searchParams.get('provider');
    
    if (skipTo === 'wallet') {
      setStep('wallet-choice');
    }

    // Optional deep-links into a specific wallet path (used by Dashboard/Profile CTAs)
    if (choice === 'zensolar') {
      setStep('zensolar-setup');
    }
    if (choice === 'external') {
      setStep('external-wallet');
    }
    
    // Handle return from OAuth callback - show device selection then success
    if (oauthSuccess === 'true' && provider) {
      if (provider === 'tesla' || provider === 'enphase') {
        setDeviceSelectionProvider(provider);
        setShowDeviceSelection(true);
        setStep('device-selection');
      }
    }
  }, [searchParams]);

  const handleWalletChoice = async (choice: WalletChoice) => {
    trackWalletChoiceSelected(choice);
    
    switch (choice) {
      case 'zensolar':
        setWalletType('zensolar');
        setStep('zensolar-setup');
        break;
      case 'external':
        setWalletType('external');
        setStep('external-wallet');
        break;
      case 'skip':
        setWalletType('skipped');
        trackWalletSkipped();
        // Skip directly to energy connection
        setStep('energy-connect');
        break;
    }
  };

  // Helper function to save wallet with retry logic
  const saveWalletToProfile = async (
    userId: string, 
    walletAddress: string, 
    attempt: number = 1
  ): Promise<boolean> => {
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 500;
    
    console.log(`[Onboarding] saveWalletToProfile attempt ${attempt}/${MAX_ATTEMPTS} for address:`, walletAddress);
    
    try {
      const nowIso = new Date().toISOString();

      // Try update first (NOTE: update can succeed with 0 rows when the profile row doesn't exist)
      const { data: updatedRows, error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_address: walletAddress, updated_at: nowIso })
        .eq('user_id', userId)
        .select('user_id');

      if (updateError) {
        console.error(`[Onboarding] Update failed on attempt ${attempt}:`, updateError);
        throw new Error(`Update failed: ${updateError.message}`);
      }

      // If no profile row existed yet, insert it (or recover from concurrent insert).
      if (!updatedRows || updatedRows.length === 0) {
        console.warn(`[Onboarding] No profile row updated on attempt ${attempt}; inserting profile row...`);

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ user_id: userId, wallet_address: walletAddress, updated_at: nowIso });

        if (insertError) {
          console.warn(`[Onboarding] Insert attempt ${attempt} failed (possible concurrent create). Retrying update...`, insertError);

          const { data: retryUpdatedRows, error: retryUpdateError } = await supabase
            .from('profiles')
            .update({ wallet_address: walletAddress, updated_at: nowIso })
            .eq('user_id', userId)
            .select('user_id');

          if (retryUpdateError || !retryUpdatedRows || retryUpdatedRows.length === 0) {
            throw new Error(`Insert failed and retry update failed: ${retryUpdateError?.message || insertError.message}`);
          }
        }
      }
      
      // Verify the save
      const { data: verifyRows, error: verifyError } = await supabase
        .from('profiles')
        .select('wallet_address, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (verifyError) {
        throw new Error(`Verification query failed: ${verifyError.message}`);
      }

      const verifiedAddress = verifyRows?.[0]?.wallet_address ?? null;
      
      if (verifiedAddress === walletAddress) {
        console.log(`[Onboarding] ✅ Verified on attempt ${attempt}: wallet_address matches`);
        return true;
      } else {
        console.warn(`[Onboarding] ⚠️ Verification mismatch on attempt ${attempt}! Expected:`, walletAddress, 'Got:', verifiedAddress);
        
        // Retry if we have attempts left
        if (attempt < MAX_ATTEMPTS) {
          console.log(`[Onboarding] Retrying in ${RETRY_DELAY_MS}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          return saveWalletToProfile(userId, walletAddress, attempt + 1);
        }
        
        // Final attempt: force overwrite
        console.log('[Onboarding] Final attempt: forcing wallet overwrite...');
        const { data: forcedRows, error: forceError } = await supabase
          .from('profiles')
          .update({ wallet_address: walletAddress, updated_at: nowIso })
          .eq('user_id', userId)
          .select('user_id');
        
        if (!forceError && forcedRows && forcedRows.length > 0) {
          // One more verification
          const { data: finalRows } = await supabase
            .from('profiles')
            .select('wallet_address, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1);
          
          if (finalRows?.[0]?.wallet_address === walletAddress) {
            console.log('[Onboarding] ✅ Force overwrite succeeded');
            return true;
          }
        }
        
        return false;
      }
    } catch (err) {
      console.error(`[Onboarding] Error on attempt ${attempt}:`, err);
      
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        return saveWalletToProfile(userId, walletAddress, attempt + 1);
      }
      
      return false;
    }
  };

  const handleWalletComplete = async (address: string) => {
    // Always keep the latest address requested to be persisted.
    latestWalletAddressRef.current = address;

    // CRITICAL: Store the exact wallet address being saved
    console.log('[Onboarding] handleWalletComplete called with address:', address);
    setWalletAddress(address);
    
    // Trigger haptic feedback
    await triggerSuccess();
    
    // Track successful connection
    trackWalletConnected({ 
      walletType: walletType as 'zensolar' | 'external', 
      walletAddress: address 
    });
    
    // Save wallet address to profile with retry mechanism.
    // Important: guard against duplicate onComplete callbacks, and always persist the newest address.
    if (!walletSaveInFlightRef.current) {
      walletSaveInFlightRef.current = true;
      try {
        while (latestWalletAddressRef.current) {
          const nextAddress = latestWalletAddressRef.current;
          latestWalletAddressRef.current = null;

          try {
            // Refresh session first to get a fresh token
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('[Onboarding] Session refresh error:', refreshError);
            }

            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

            if (userError || !currentUser) {
              console.error('[Onboarding] Error getting current user:', userError);
              toast.error('Failed to save wallet. You can add it later from Settings.', { id: 'wallet-save-failed' });
              break;
            }

            const walletSaved = await saveWalletToProfile(currentUser.id, nextAddress);

            if (walletSaved) {
              console.log('[Onboarding] ✅ Wallet saved and verified:', nextAddress);
              dispatchProfileUpdated();
            } else {
              console.error('[Onboarding] ❌ Failed to save wallet after all retries');
              toast.error('Failed to save wallet. You can add it later from Settings.', { id: 'wallet-save-failed' });
            }
          } catch (err) {
            console.error('[Onboarding] Error saving wallet:', err);
            toast.error('Failed to save wallet. You can add it later from Settings.', { id: 'wallet-save-failed' });
          }
        }
      } finally {
        walletSaveInFlightRef.current = false;
      }
    }
    
    // Show wallet success screen with confetti, then proceed to energy connection
    setStep('wallet-success');
  };

  const handleWalletSuccessContinue = () => {
    // Track completion and proceed to energy connection with animation
    trackOnboardingComplete({ 
      walletType: walletType as 'zensolar' | 'external', 
      hasWallet: true 
    });
    transitionToStep('energy-connect');
  };

  const handleEnergyConnect = async (provider: EnergyProvider) => {
    setConnectingProvider(provider);
    trackEvent('onboarding_energy_connect_clicked', { provider });
    
    try {
      switch (provider) {
        case 'tesla':
          // Mark that we're in onboarding flow so OAuth callback knows where to redirect
          localStorage.setItem('onboarding_energy_flow', 'true');
          await startTeslaOAuth();
          // Tesla uses redirect, so we'll handle success via OAuth callback
          break;
          
        case 'enphase':
          localStorage.setItem('onboarding_energy_flow', 'true');
          const result = await startEnphaseOAuth();
          if (result?.useManualCode) {
            setShowEnphaseDialog(true);
          }
          break;
          
        case 'solaredge':
          setShowSolarEdgeDialog(true);
          break;
          
        case 'wallbox':
          setShowWallboxDialog(true);
          break;
      }
    } catch (error) {
      console.error('Energy connection error:', error);
      toast.error('Failed to connect. Please try again.');
    } finally {
      // Don't clear connecting state for OAuth flows - they handle it differently
      if (provider !== 'tesla' && provider !== 'enphase') {
        setConnectingProvider(null);
      }
    }
  };

  const handleDeviceSelectionComplete = (provider: string) => {
    setShowDeviceSelection(false);
    handleEnergyConnectionSuccess(provider);
  };

  const handleEnergyConnectionSuccess = (provider: string) => {
    setConnectedProviders(prev => [...prev, provider]);
    setLastConnectedProvider(provider);
    setConnectingProvider(null);
    
    // Close any open dialogs
    setShowEnphaseDialog(false);
    setShowSolarEdgeDialog(false);
    setShowWallboxDialog(false);
    
    // Dispatch profile update
    dispatchProfileUpdated();

    // Persist provider connection to the profile so the dashboard will load immediately,
    // even if the user skipped wallet setup.
    (async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        const nowIso = new Date().toISOString();
        const patch: Record<string, any> = { updated_at: nowIso };
        if (provider === 'tesla') patch.tesla_connected = true;
        if (provider === 'enphase') patch.enphase_connected = true;
        if (provider === 'solaredge') patch.solaredge_connected = true;
        if (provider === 'wallbox') patch.wallbox_connected = true;

        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update(patch)
          .eq('user_id', currentUser.id)
          .select('user_id');

        if (updateError) {
          console.warn('[Onboarding] Failed to update provider connection flag:', updateError);
        }

        if (!updated || updated.length === 0) {
          // Profile row missing; create then update.
          await supabase.from('profiles').insert({ user_id: currentUser.id });
          await supabase.from('profiles').update(patch).eq('user_id', currentUser.id);
        }

        dispatchProfileUpdated();
      } catch (err) {
        console.warn('[Onboarding] Failed to persist provider connection flag:', err);
      }
    })();
    
    // Move to energy success screen
    setStep('energy-success');
  };

  const handleEnphaseCodeSubmit = async (code: string) => {
    const success = await exchangeEnphaseCode(code);
    if (success) {
      handleEnergyConnectionSuccess('enphase');
    }
  };

  const handleSolarEdgeConnect = async (apiKey: string, siteId: string) => {
    const success = await connectSolarEdge(apiKey, siteId);
    if (success) {
      handleEnergyConnectionSuccess('solaredge');
    }
  };

  const handleWallboxConnect = async (email: string, password: string) => {
    const success = await connectWallbox(email, password);
    if (success) {
      handleEnergyConnectionSuccess('wallbox');
    }
  };

  const handleEnergySkip = () => {
    trackEvent('onboarding_energy_skipped', { connectedProviders });
    navigate('/');
  };

  const handleEnergyBack = () => {
    // Go back to wallet choice screen
    setStep('wallet-choice');
  };

  const handleAddAnotherEnergy = () => {
    setStep('energy-connect');
  };

  const handleGoToDashboard = async () => {
    // Dispatch profile update one more time before navigating to ensure dashboard picks up changes
    dispatchProfileUpdated();
    
    // Trigger immediate data sync for connected providers to populate Clean Energy Center
    // This prevents lag when landing on dashboard after onboarding
    if (connectedProviders.length > 0) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          // Fire off data sync requests in parallel for all connected providers
          const syncPromises = connectedProviders.map(async (provider) => {
            if (provider === 'tesla') {
              return supabase.functions.invoke('tesla-data', {
                headers: { Authorization: `Bearer ${session.access_token}` }
              });
            } else if (provider === 'enphase') {
              return supabase.functions.invoke('enphase-data', {
                headers: { Authorization: `Bearer ${session.access_token}` }
              });
            } else if (provider === 'solaredge') {
              return supabase.functions.invoke('solaredge-data', {
                headers: { Authorization: `Bearer ${session.access_token}` }
              });
            } else if (provider === 'wallbox') {
              return supabase.functions.invoke('wallbox-data', {
                headers: { Authorization: `Bearer ${session.access_token}` }
              });
            }
          });
          
          // Don't await - let syncs run in background while navigating
          Promise.all(syncPromises).catch(err => {
            console.error('[Onboarding] Background sync error:', err);
          });
        }
      } catch (err) {
        console.error('[Onboarding] Failed to trigger sync:', err);
      }
    }
    
    // Navigate immediately (sync runs in background)
    navigate('/');
  };

  const handleBack = () => {
    setStep('wallet-choice');
  };

  // Cancel the current OAuth connecting state
  const handleCancelConnecting = useCallback(() => {
    setConnectingProvider(null);
    localStorage.removeItem('tesla_oauth_state');
    localStorage.removeItem('tesla_oauth_pending');
    localStorage.removeItem('onboarding_energy_flow');
  }, []);

  // Determine if we should show progress indicator (not on wallet-choice)
  const showProgress = step !== 'wallet-choice';
  const currentStepNumber = getStepNumber(step);

  return (
    <>
      {/* Step transition animation */}
      <OnboardingTransition isTransitioning={isTransitioning} />

      {/* Progress indicator */}
      {showProgress && !isTransitioning && (
        <OnboardingProgress 
          currentStep={currentStepNumber} 
          totalSteps={4}
          stepLabels={['Choose Wallet', 'Create Wallet', 'Connect Energy', 'Done']}
        />
      )}

      {step === 'wallet-choice' && (
        <WalletChoiceScreen onChoice={handleWalletChoice} />
      )}
      
      {step === 'zensolar-setup' && (
        <div className="pt-16">
          <WalletSetupScreen 
            onComplete={handleWalletComplete}
            onBack={handleBack}
          />
        </div>
      )}
      
      {step === 'external-wallet' && (
        <div className="pt-16">
          <ExternalWalletScreen
            onComplete={handleWalletComplete}
            onBack={handleBack}
          />
        </div>
      )}
      
      {step === 'wallet-success' && (
        <div className="pt-16">
          <OnboardingSuccessScreen 
            walletAddress={walletAddress}
            walletType={walletType}
            onContinue={handleWalletSuccessContinue}
          />
        </div>
      )}

      {(step === 'energy-connect' || step === 'device-selection') && (
        <div className="pt-16">
          <EnergyConnectionScreen
            onConnect={handleEnergyConnect}
            onSkip={handleEnergySkip}
            onBack={handleEnergyBack}
            onCancelConnecting={handleCancelConnecting}
            isConnecting={connectingProvider}
            connectedProviders={connectedProviders}
          />
        </div>
      )}

      {step === 'energy-success' && (
        <div className="pt-16">
          <EnergySuccessScreen
            provider={lastConnectedProvider}
            connectedProviders={connectedProviders}
            onAddAnother={handleAddAnotherEnergy}
            onContinue={handleGoToDashboard}
          />
        </div>
      )}

      {/* Device selection dialog for Tesla/Enphase OAuth */}
      <DeviceSelectionDialog
        open={showDeviceSelection}
        onOpenChange={(open) => {
          if (!open && showDeviceSelection) {
            // User closed without completing - still mark as success
            handleDeviceSelectionComplete(deviceSelectionProvider);
          }
          setShowDeviceSelection(open);
        }}
        provider={deviceSelectionProvider}
        onComplete={() => handleDeviceSelectionComplete(deviceSelectionProvider)}
      />

      {/* Enphase code dialog */}
      <EnphaseCodeDialog
        open={showEnphaseDialog}
        onOpenChange={(open) => {
          setShowEnphaseDialog(open);
          if (!open) setConnectingProvider(null);
        }}
        onSubmit={async (code: string) => {
          const success = await exchangeEnphaseCode(code);
          if (success) {
            handleEnergyConnectionSuccess('enphase');
          }
          return success;
        }}
      />

      {/* SolarEdge connect dialog */}
      <SolarEdgeConnectDialog
        open={showSolarEdgeDialog}
        onOpenChange={(open) => {
          setShowSolarEdgeDialog(open);
          if (!open) setConnectingProvider(null);
        }}
        onSubmit={async (apiKey: string, siteId: string) => {
          const success = await connectSolarEdge(apiKey, siteId);
          if (success) {
            handleEnergyConnectionSuccess('solaredge');
          }
          return success;
        }}
      />

      {/* Wallbox connect dialog */}
      <WallboxConnectDialog
        open={showWallboxDialog}
        onOpenChange={(open) => {
          setShowWallboxDialog(open);
          if (!open) setConnectingProvider(null);
        }}
        onSubmit={async (email: string, password: string) => {
          const success = await connectWallbox(email, password);
          if (success) {
            handleEnergyConnectionSuccess('wallbox');
          }
          return success;
        }}
      />
    </>
  );
}
