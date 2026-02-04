import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Sparkles, Shield, ArrowLeft, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoinbaseSmartWallet } from '@/hooks/useCoinbaseSmartWallet';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

interface WalletSetupScreenProps {
  onComplete: (walletAddress: string) => void;
  onBack: () => void;
}

export function WalletSetupScreen({ onComplete, onBack }: WalletSetupScreenProps) {
  const { step, walletAddress, error, isConnecting, createWallet, reset } = useCoinbaseSmartWallet();
  const [hasStarted, setHasStarted] = useState(false);

  const handleStart = useCallback(async () => {
    setHasStarted(true);
    await createWallet();
  }, [createWallet]);

  const handleRetry = useCallback(async () => {
    reset();
    await createWallet();
  }, [reset, createWallet]);

  const getDisplayStep = (): 'ready' | 'creating' | 'passkey' | 'error' => {
    if (!hasStarted) return 'ready';
    switch (step) {
      case 'idle':
      case 'connecting':
        return 'creating';
      case 'authenticating':
        return 'passkey';
      case 'success':
        return 'creating';
      case 'error':
        return 'error';
      default:
        return 'creating';
    }
  };

  useEffect(() => {
    if (step === 'success' && walletAddress) {
      onComplete(walletAddress);
    }
  }, [step, walletAddress, onComplete]);

  const displayStep = getDisplayStep();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back button */}
      {!isConnecting && (
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

      {/* Premium gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {displayStep === 'ready' && (
            <ReadyStep key="ready" onStart={handleStart} />
          )}
          {displayStep === 'creating' && (
            <CreatingStep key="creating" />
          )}
          {displayStep === 'passkey' && (
            <PasskeyStep key="passkey" />
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

function ReadyStep({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center"
    >
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
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 shadow-xl shadow-primary/10 flex items-center justify-center"
      >
        <Sparkles className="w-12 h-12 text-primary" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
          Create Your ZenSolar Wallet
        </h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          Secured with Face ID or Touch ID. No seed phrases, no apps to download.
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <FeatureBadge icon={Fingerprint} label="Passkey Secured" />
          <FeatureBadge icon={Shield} label="Self-Custody" />
          <FeatureBadge icon={Zap} label="Gasless" />
        </div>

        {/* Two options */}
        <div className="space-y-3 mb-6">
          <Button
            size="lg"
            onClick={onStart}
            className="w-full bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary/80 shadow-lg shadow-primary/20 gap-2 h-14 text-base font-semibold"
          >
            <Sparkles className="w-5 h-5" />
            Create New Wallet
          </Button>

          <div className="relative py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">
                or if you have an existing passkey
              </span>
            </div>
          </div>

          <Button
            size="lg"
            variant="outline"
            onClick={onStart}
            className="w-full gap-2 h-12 border-border/60"
          >
            <Fingerprint className="w-5 h-5" />
            Connect Existing Wallet
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/80">
          Both options use Coinbase Smart Wallet on Base.
          <br />
          <span className="text-muted-foreground/60">
            Existing wallets will be detected automatically.
          </span>
        </p>
      </motion.div>
    </motion.div>
  );
}

function FeatureBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
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
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20"
          animate={{ 
            rotate: [0, 3, -3, 0],
            scale: [1, 1.02, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-14 h-14 rounded-full border-2 border-primary/30 border-t-primary" />
          </motion.div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-2">
        Creating Your Wallet
      </h2>
      <p className="text-muted-foreground text-sm">
        Connecting to Coinbase Smart Wallet...
      </p>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: i * 0.15,
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
        className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center"
        animate={{ 
          boxShadow: [
            '0 0 0 0 rgba(34, 197, 94, 0.3)',
            '0 0 0 16px rgba(34, 197, 94, 0)',
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
      <p className="text-muted-foreground text-sm mb-6">
        Use Face ID, Touch ID, or your device passkey
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
        className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/5 border border-destructive/20 flex items-center justify-center"
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
          className="w-full gap-2 h-12"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onBack}
          className="w-full gap-2 h-12 border-border/60"
        >
          <ArrowLeft className="w-4 h-4" />
          Choose Different Option
        </Button>
      </div>
    </motion.div>
  );
}
