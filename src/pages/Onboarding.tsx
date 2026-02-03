import { useState, useEffect } from "react";
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

// Helper to get current step number for progress indicator
function getStepNumber(step: OnboardingStep): number {
  switch (step) {
    case 'wallet-choice':
    case 'zensolar-setup':
    case 'external-wallet':
    case 'wallet-success':
      return 1;
    case 'energy-connect':
    case 'energy-success':
    case 'device-selection':
      return 2;
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

  const handleWalletComplete = async (address: string) => {
    setWalletAddress(address);
    
    // Trigger haptic feedback
    await triggerSuccess();
    
    // Track successful connection
    trackWalletConnected({ 
      walletType: walletType as 'zensolar' | 'external', 
      walletAddress: address 
    });
    
    // Save wallet address to profile
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ wallet_address: address })
          .eq('user_id', user.id);

        if (error) {
          console.error('Failed to save wallet:', error);
          toast.error('Failed to save wallet. You can add it later from Settings.');
        } else {
          // Dispatch event so Dashboard/Wallet pages refetch profile data
          dispatchProfileUpdated();
        }
      } catch (err) {
        console.error('Error saving wallet:', err);
      }
    }
    
    // Show wallet success screen briefly, then move to energy connection
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

  const handleAddAnotherEnergy = () => {
    setStep('energy-connect');
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  const handleBack = () => {
    setStep('wallet-choice');
  };

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
          totalSteps={2}
          stepLabels={['Wallet Setup', 'Connect Energy']}
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
