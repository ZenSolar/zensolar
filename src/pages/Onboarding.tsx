import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WalletChoiceScreen, WalletChoice } from "@/components/onboarding/WalletChoiceScreen";
import { WalletSetupScreen } from "@/components/onboarding/WalletSetupScreen";
import { ExternalWalletScreen } from "@/components/onboarding/ExternalWalletScreen";
import { OnboardingSuccessScreen } from "@/components/onboarding/OnboardingSuccessScreen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  trackWalletChoiceViewed,
  trackWalletChoiceSelected, 
  trackWalletConnected, 
  trackWalletSkipped,
  trackOnboardingComplete 
} from "@/lib/onboardingAnalytics";

type OnboardingStep = 'wallet-choice' | 'zensolar-setup' | 'external-wallet' | 'success';
type WalletType = 'zensolar' | 'external' | 'skipped';

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('wallet-choice');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>('skipped');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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
    // Track the choice
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
        trackOnboardingComplete({ walletType: 'skip', hasWallet: false });
        setStep('success');
        break;
    }
  };

  const handleWalletComplete = async (address: string) => {
    setWalletAddress(address);
    
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
          toast.error('Failed to save wallet. You can add it later from the Dashboard.');
        } else {
          toast.success('Wallet connected successfully!');
        }
      } catch (err) {
        console.error('Error saving wallet:', err);
      }
    }
    
    // Track completion and go to success screen
    trackOnboardingComplete({ 
      walletType: walletType as 'zensolar' | 'external', 
      hasWallet: true 
    });
    setStep('success');
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
      
      {step === 'success' && (
        <OnboardingSuccessScreen 
          walletAddress={walletAddress}
          walletType={walletType}
        />
      )}
    </>
  );
}
