import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandedSpinner } from '@/components/ui/branded-spinner';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useAppKitInitialized } from '@/components/providers/Web3Provider';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

interface ExternalWalletScreenProps {
  onComplete: (walletAddress: string) => void;
  onBack: () => void;
}

export function ExternalWalletScreen({ onComplete, onBack }: ExternalWalletScreenProps) {
  const { isInitialized, hasProjectId } = useAppKitInitialized();
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isInitialized && hasProjectId && !hasOpened && !isConnected) {
      setHasOpened(true);
      open({ view: 'Connect' });
    }
  }, [isInitialized, hasProjectId, hasOpened, isConnected, open]);

  useEffect(() => {
    if (isConnected && address) {
      const timer = setTimeout(() => {
        onComplete(address);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, address, onComplete]);

  const handleOpenModal = useCallback(() => {
    open({ view: 'Connect' });
  }, [open]);

  // Loading state
  if (!isInitialized || !hasProjectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <BrandedSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing wallet connection...</p>
        </motion.div>
      </div>
    );
  }

  // Connected state
  if (isConnected && address) {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md relative z-10"
        >
          <motion.img
            src={zenLogo}
            alt="ZenSolar"
            className="h-8 w-auto mx-auto mb-8 dark:drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30"
          >
            <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Wallet Connected!
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-4">
            {shortAddress}
          </p>
          <p className="text-xs text-muted-foreground">
            Redirecting to next step...
          </p>
        </motion.div>
      </div>
    );
  }

  // Waiting for connection
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10 text-center"
      >
        {/* Header */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="absolute top-0 left-0 text-muted-foreground hover:text-foreground gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="pt-12">
          {/* ZenSolar Logo */}
          <motion.img
            src={zenLogo}
            alt="ZenSolar"
            className="h-8 w-auto mx-auto mb-8 dark:drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          />

          {/* Icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center"
            animate={{ 
              boxShadow: [
                '0 0 0 0 rgba(255,255,255,0.1)',
                '0 0 0 10px rgba(255,255,255,0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Wallet className="w-10 h-10 text-foreground" />
          </motion.div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Choose your preferred wallet from the modal
          </p>

          {/* Wallet options preview */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <WalletPreview emoji="🦊" name="MetaMask" />
            <WalletPreview emoji="🔵" name="Base Wallet" />
            <WalletPreview emoji="🔗" name="WalletConnect" />
            <WalletPreview emoji="💼" name="More..." />
          </div>

          <Button
            size="lg"
            onClick={handleOpenModal}
            className="w-full gap-2 h-12"
          >
            <ExternalLink className="w-4 h-4" />
            Open Wallet Selector
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function WalletPreview({ emoji, name }: { emoji: string; name: string }) {
  return (
    <div className="p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 text-center">
      <span className="text-2xl mb-1 block">{emoji}</span>
      <span className="text-xs text-muted-foreground">{name}</span>
    </div>
  );
}
