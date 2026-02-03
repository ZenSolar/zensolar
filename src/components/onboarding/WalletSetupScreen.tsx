import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Check, Sparkles, Shield, ArrowRight, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoinbaseSmartWallet, SmartWalletStep } from '@/hooks/useCoinbaseSmartWallet';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

interface WalletSetupScreenProps {
  onComplete: (walletAddress: string) => void;
  onBack: () => void;
}

export function WalletSetupScreen({ onComplete, onBack }: WalletSetupScreenProps) {
  const { step, walletAddress, error, isConnecting, createWallet, reset } = useCoinbaseSmartWallet();
  const [hasStarted, setHasStarted] = useState(false);

  // Auto-start wallet creation on mount
  useEffect(() => {
    if (!hasStarted) {
      setHasStarted(true);
      createWallet();
    }
  }, [hasStarted, createWallet]);

  const handleContinue = useCallback(() => {
    if (walletAddress) {
      onComplete(walletAddress);
    }
  }, [walletAddress, onComplete]);

  const handleRetry = useCallback(() => {
    reset();
    createWallet();
  }, [reset, createWallet]);

  // Map SDK step to UI display
  const getDisplayStep = (): 'creating' | 'passkey' | 'success' | 'error' => {
    switch (step) {
      case 'idle':
      case 'connecting':
        return 'creating';
      case 'authenticating':
        return 'passkey';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'creating';
    }
  };

  const displayStep = getDisplayStep();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back button - only show when not in the middle of connecting */}
      {!isConnecting && displayStep !== 'success' && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-6 left-4 z-20"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      )}

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {displayStep === 'creating' && (
            <CreatingStep key="creating" />
          )}
          
          {displayStep === 'passkey' && (
            <PasskeyStep key="passkey" />
          )}
          
          {displayStep === 'success' && walletAddress && (
            <SuccessStep 
              key="success" 
              walletAddress={walletAddress} 
              onContinue={handleContinue}
            />
          )}

          {displayStep === 'error' && (
            <ErrorStep 
              key="error"
              error={error}
              onRetry={handleRetry}
              onBack={onBack}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function CreatingStep() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center"
    >
      {/* Animated wallet icon */}
      <div className="relative w-24 h-24 mx-auto mb-8">
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary" />
          </motion.div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={zenLogo} alt="" className="w-10 h-10 object-contain" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        Creating Your ZenSolar Wallet
      </h2>
      <p className="text-muted-foreground text-sm">
        Setting up your Coinbase Smart Wallet on Base...
      </p>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function PasskeyStep() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center"
    >
      {/* Fingerprint animation */}
      <motion.div 
        className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center"
        animate={{ 
          boxShadow: [
            '0 0 0 0 rgba(34, 197, 94, 0.4)',
            '0 0 0 20px rgba(34, 197, 94, 0)',
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Fingerprint className="w-12 h-12 text-primary" />
        </motion.div>
      </motion.div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        Authenticate with Passkey
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        Use Face ID, Touch ID, or your device passkey to secure your wallet
      </p>

      {/* Passkey prompt indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-muted/50 border border-border max-w-xs mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">Coinbase Smart Wallet</p>
            <p className="text-xs text-muted-foreground">Complete authentication in popup...</p>
          </div>
        </div>
      </motion.div>

      <p className="text-xs text-muted-foreground mt-4">
        A popup window will appear. Please complete the passkey setup there.
      </p>
    </motion.div>
  );
}

function SuccessStep({ 
  walletAddress, 
  onContinue 
}: { 
  walletAddress: string; 
  onContinue: () => void;
}) {
  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center"
    >
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <Check className="w-12 h-12 text-primary-foreground" />
        </motion.div>
      </motion.div>

      {/* Confetti particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: i % 3 === 0 ? 'hsl(var(--primary))' : i % 3 === 1 ? 'hsl(var(--accent))' : 'hsl(var(--secondary))',
            left: '50%',
            top: '35%',
          }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * 30 * Math.PI) / 180) * (80 + Math.random() * 40),
            y: Math.sin((i * 30 * Math.PI) / 180) * (80 + Math.random() * 40),
          }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Your Wallet is Ready!
          </h2>
        </div>
        
        <p className="text-muted-foreground text-sm mb-6">
          Start earning $ZSOLAR tokens and NFTs
        </p>

        {/* Wallet address card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-xl bg-muted/50 border border-border mb-8"
        >
          <p className="text-xs text-muted-foreground mb-1">Your Wallet Address</p>
          <p className="font-mono text-sm text-foreground">{shortAddress}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">B</span>
            </div>
            <span className="text-xs text-muted-foreground">Base Network • Coinbase Smart Wallet</span>
          </div>
        </motion.div>

        <Button
          size="lg"
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 gap-2"
        >
          Continue to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

function ErrorStep({
  error,
  onRetry,
  onBack,
}: {
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
}) {
  const isCancelled = error?.toLowerCase().includes('cancel');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center"
    >
      {/* Error icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20 flex items-center justify-center"
      >
        <AlertCircle className="w-12 h-12 text-destructive" />
      </motion.div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        {isCancelled ? 'Setup Cancelled' : 'Something Went Wrong'}
      </h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
        {isCancelled 
          ? 'You cancelled the wallet setup. You can try again or choose a different option.'
          : error || 'Failed to create your wallet. Please try again.'}
      </p>

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          onClick={onRetry}
          className="w-full gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onBack}
          className="w-full gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Choose Different Option
        </Button>
      </div>
    </motion.div>
  );
}
