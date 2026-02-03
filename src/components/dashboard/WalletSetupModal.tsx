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

interface WalletSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletSetupModal({ isOpen, onClose }: WalletSetupModalProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Check if user has dismissed this session
  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('wallet_modal_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('wallet_modal_dismissed', 'true');
    setDismissed(true);
    onClose();
  };

  const goToWalletSetup = (choice: 'zensolar' | 'external') => {
    const params = new URLSearchParams({ step: 'wallet', choice });
    navigate(`/onboarding?${params.toString()}`);
    onClose();
  };

  if (dismissed) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-xl">Set Up Your Wallet</DialogTitle>
          <DialogDescription className="text-base">
            Connect a wallet to receive $ZSOLAR tokens and mint NFTs for your energy contributions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {/* Recommended: ZenSolar Wallet */}
          <Button
            size="lg"
            onClick={() => goToWalletSetup('zensolar')}
            className="w-full justify-between h-14 group"
          >
            <span className="inline-flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Fingerprint className="h-5 w-5" />
              </div>
              <span className="text-left">
                <span className="block text-sm font-semibold">Create ZenSolar Wallet</span>
                <span className="block text-xs opacity-80">Face ID / Touch ID • No apps needed</span>
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/20 px-2 py-1 text-[10px] font-semibold">
                <Zap className="h-3 w-3" />
                Recommended
              </span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Button>

          {/* External Wallet Options */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or connect existing</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-11"
              onClick={() => goToWalletSetup('external')}
            >
              <svg className="h-4 w-4" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726"/>
                <path d="M2.65991 1L15.6851 10.809L13.3515 4.99098L2.65991 1Z" fill="#E27625"/>
                <path d="M28.2295 23.5334L24.7346 28.872L32.2271 30.9323L34.3804 23.6501L28.2295 23.5334Z" fill="#E27625"/>
                <path d="M1.2373 23.6501L3.37338 30.9323L10.8659 28.872L7.38823 23.5334L1.2373 23.6501Z" fill="#E27625"/>
              </svg>
              MetaMask
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-11"
              onClick={() => goToWalletSetup('external')}
            >
              <img src={baseWalletLogo} alt="Base Wallet" className="h-4 w-4 object-contain" />
              Base Wallet
            </Button>
          </div>

          {/* Skip for now */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="w-full text-muted-foreground hover:text-foreground gap-2"
          >
            <Clock className="h-4 w-4" />
            I'll do this later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
