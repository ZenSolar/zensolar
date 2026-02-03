import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WalletChoiceScreen, WalletChoice } from "@/components/onboarding/WalletChoiceScreen";
import { WalletSetupScreen } from "@/components/onboarding/WalletSetupScreen";
import { ExternalWalletScreen } from "@/components/onboarding/ExternalWalletScreen";
import { OnboardingSuccessScreen } from "@/components/onboarding/OnboardingSuccessScreen";
import { EnergyConnectionScreen, EnergyProvider } from "@/components/onboarding/EnergyConnectionScreen";
import { EnergySuccessScreen } from "@/components/onboarding/EnergySuccessScreen";
import { EnphaseCodeDialog } from "@/components/dashboard/EnphaseCodeDialog";
import { SolarEdgeConnectDialog } from "@/components/dashboard/SolarEdgeConnectDialog";
import { WallboxConnectDialog } from "@/components/dashboard/WallboxConnectDialog";
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
  | 'energy-success';

type WalletType = 'zensolar' | 'external' | 'skipped';

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('wallet-choice');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>('skipped');
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [lastConnectedProvider, setLastConnectedProvider] = useState<string>('');
  const [connectingProvider, setConnectingProvider] = useState<EnergyProvider | null>(null);
  
  // Dialog states for credential-based providers
  const [showEnphaseDialog, setShowEnphaseDialog] = useState(false);
  const [showSolarEdgeDialog, setShowSolarEdgeDialog] = useState(false);
  const [showWallboxDialog, setShowWallboxDialog] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { startTeslaOAuth, startEnphaseOAuth, connectSolarEdge, connectWallbox, exchangeEnphaseCode } = useEnergyOAuth();

  // Track initial view
  useEffect(() => {
    trackWalletChoiceViewed();
  }, []);

  // Check if we should skip to a specific step
  useEffect(() => {
    const skipTo = searchParams.get('step');
    const choice = searchParams.get('choice');
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
    // Track completion and proceed to energy connection
    trackOnboardingComplete({ 
      walletType: walletType as 'zensolar' | 'external', 
      hasWallet: true 
    });
    setStep('energy-connect');
  };

  const handleEnergyConnect = async (provider: EnergyProvider) => {
    setConnectingProvider(provider);
    trackEvent('onboarding_energy_connect_clicked', { provider });
    
    try {
      switch (provider) {
        case 'tesla':
          await startTeslaOAuth();
          // Tesla uses redirect, so we'll handle success via OAuth callback
          // For mobile, the page redirects; for desktop, a popup opens
          // We'll detect success when user returns
          break;
          
        case 'enphase':
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
      if (provider !== 'tesla') {
        setConnectingProvider(null);
      }
    }
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

  return (
    <>
      {step === 'wallet-choice' && (
        <WalletChoiceScreen onChoice={handleWalletChoice} />
      )}
      
      {step === 'zensolar-setup' && (
        <WalletSetupScreen 
          onComplete={handleWalletComplete}
          onBack={handleBack}
        />
      )}
      
      {step === 'external-wallet' && (
        <ExternalWalletScreen
          onComplete={handleWalletComplete}
          onBack={handleBack}
        />
      )}
      
      {step === 'wallet-success' && (
        <OnboardingSuccessScreen 
          walletAddress={walletAddress}
          walletType={walletType}
          onContinue={handleWalletSuccessContinue}
        />
      )}

      {step === 'energy-connect' && (
        <EnergyConnectionScreen
          onConnect={handleEnergyConnect}
          onSkip={handleEnergySkip}
          isConnecting={connectingProvider}
          connectedProviders={connectedProviders}
        />
      )}

      {step === 'energy-success' && (
        <EnergySuccessScreen
          provider={lastConnectedProvider}
          connectedProviders={connectedProviders}
          onAddAnother={handleAddAnotherEnergy}
          onContinue={handleGoToDashboard}
        />
      )}

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
