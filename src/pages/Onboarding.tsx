import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WalletChoiceScreen, WalletChoice } from "@/components/onboarding/WalletChoiceScreen";
import { WalletSetupScreen } from "@/components/onboarding/WalletSetupScreen";
import { ExternalWalletScreen } from "@/components/onboarding/ExternalWalletScreen";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type OnboardingStep = 'wallet-choice' | 'zensolar-setup' | 'external-wallet';

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>('wallet-choice');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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
    switch (choice) {
      case 'zensolar':
        setStep('zensolar-setup');
        break;
      case 'external':
        setStep('external-wallet');
        break;
      case 'skip':
        navigate('/');
        break;
    }
  };

  const handleWalletComplete = async (walletAddress: string) => {
    // Save wallet address to profile
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ wallet_address: walletAddress })
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
    
    // Navigate to dashboard
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
    </>
  );
}
