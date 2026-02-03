import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Fingerprint, Wallet, ArrowRight, Zap, Clock } from 'lucide-react';
import baseWalletLogo from '@/assets/wallets/base-wallet.png';

const FIRST_LOGIN_KEY = 'zensolar_first_login_completed';
const MODAL_DISMISSED_KEY = 'wallet_modal_dismissed_at';
const COOLDOWN_HOURS = 24;

interface WalletSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSetupModal({ isOpen, onClose }: WalletSetupModalProps) {
  const navigate = useNavigate();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if this is the user's first login ever
    const isFirstLogin = !localStorage.getItem(FIRST_LOGIN_KEY);
    
    if (isFirstLogin) {
      // Mark first login as completed - modal won't show until next login
      localStorage.setItem(FIRST_LOGIN_KEY, 'true');
      setShouldShow(false);
      return;
    }

    // Check if modal was dismissed within the last 24 hours
    const dismissedAt = localStorage.getItem(MODAL_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < COOLDOWN_HOURS) {
        setShouldShow(false);
        return;
      }
    }

    // User is on second+ login and cooldown has passed
    setShouldShow(true);
  }, []);

  const handleDismiss = () => {
    // Store the timestamp when user dismissed the modal
    localStorage.setItem(MODAL_DISMISSED_KEY, Date.now().toString());
    setShouldShow(false);
    onClose();
  };

  const goToWalletSetup = (choice: 'zensolar' | 'external') => {
    const params = new URLSearchParams({ step: 'wallet', choice });
    navigate(`/onboarding?${params.toString()}`);
    onClose();
  };

  // Don't render if we shouldn't show (first login or within cooldown)
  if (!shouldShow) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300">
        <DialogHeader className="text-center space-y-2 sm:space-y-3">
          <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 animate-in zoom-in-50 duration-500 delay-100">
            <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <DialogTitle className="text-lg sm:text-xl">Set Up Your Wallet</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Connect a wallet to receive $ZSOLAR tokens and mint NFTs for your energy contributions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4">
          {/* Recommended: ZenSolar Wallet */}
          <Button
            size="lg"
            onClick={() => goToWalletSetup('zensolar')}
            className="w-full justify-between h-auto min-h-[3.5rem] py-2.5 px-3 group animate-in slide-in-from-left-2 duration-300 delay-150"
          >
            <span className="inline-flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                <Fingerprint className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="text-left min-w-0">
                <span className="block text-xs sm:text-sm font-semibold truncate">Create ZenSolar Wallet</span>
                <span className="block text-[10px] sm:text-xs opacity-80 truncate">Face ID / Touch ID • No apps needed</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
              <span className="hidden xs:inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold">
                <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Recommended</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Button>

          {/* External Wallet Options */}
          <div className="relative animate-in fade-in duration-300 delay-200">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground text-[10px] sm:text-xs">or connect existing</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-right-2 duration-300 delay-250">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 sm:gap-2 h-10 sm:h-11 text-xs sm:text-sm"
              onClick={() => goToWalletSetup('external')}
            >
              <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726"/>
                <path d="M2.65991 1L15.6851 10.809L13.3515 4.99098L2.65991 1Z" fill="#E27625"/>
                <path d="M28.2295 23.5334L24.7346 28.872L32.2271 30.9323L34.3804 23.6501L28.2295 23.5334Z" fill="#E27625"/>
                <path d="M1.2373 23.6501L3.37338 30.9323L10.8659 28.872L7.38823 23.5334L1.2373 23.6501Z" fill="#E27625"/>
              </svg>
              <span className="truncate">MetaMask</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 sm:gap-2 h-10 sm:h-11 text-xs sm:text-sm"
              onClick={() => goToWalletSetup('external')}
            >
              <img src={baseWalletLogo} alt="Base Wallet" className="h-3.5 w-3.5 sm:h-4 sm:w-4 object-contain flex-shrink-0" />
              <span className="truncate">Base Wallet</span>
            </Button>
          </div>

          {/* Skip for now */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="w-full text-muted-foreground hover:text-foreground gap-1.5 sm:gap-2 text-xs sm:text-sm animate-in fade-in duration-300 delay-300"
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            I'll do this later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
