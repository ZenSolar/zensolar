import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Sparkles, Shield, ArrowLeft, AlertCircle, RefreshCw, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoinbaseSmartWallet } from '@/hooks/useCoinbaseSmartWallet';
import { SecurityVisualizer } from './SecurityVisualizer';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import {
  trackWalletSetupViewed,
  trackPasskeyStarted,
  trackPasskeySucceeded,
  trackPasskeyCancelled,
  trackPasskeyFailed,
  trackPasskeyRetried,
  trackPasskeyCompleted,
} from '@/lib/onboardingAnalytics';

interface WalletSetupScreenProps {
  onComplete: (walletAddress: string) => void;
  onBack: () => void;
}

const SUCCESS_HOLD_MS = 1400;

export function WalletSetupScreen({ onComplete, onBack }: WalletSetupScreenProps) {
  const { step, walletAddress, error, isConnecting, createWallet, reset } = useCoinbaseSmartWallet();
  const [hasStarted, setHasStarted] = useState(false);
  const [showCelebrating, setShowCelebrating] = useState(false);
  const completedRef = useRef(false);
  const succeededOnceRef = useRef(false);
  const failedOnceRef = useRef(false);

  const handleStart = useCallback(async () => {
    setHasStarted(true);
    trackPasskeyStarted();
    await createWallet();
  }, [createWallet]);

  const handleRetry = useCallback(async () => {
    trackPasskeyRetried();
    failedOnceRef.current = false;
    reset();
    setHasStarted(true);
    trackPasskeyStarted();
    await createWallet();
  }, [reset, createWallet]);

  // Setup screen viewed + auto-fire passkey (user already confirmed on prior screen)
  useEffect(() => {
    trackWalletSetupViewed();
    if (!hasStarted && step === 'idle') {
      handleStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Success path: emit succeeded → show branded celebration → emit completed → onComplete
  useEffect(() => {
    if (step === 'success' && walletAddress && !succeededOnceRef.current) {
      succeededOnceRef.current = true;
      trackPasskeySucceeded(walletAddress);
      setShowCelebrating(true);
      const t = setTimeout(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        trackPasskeyCompleted(walletAddress);
        onComplete(walletAddress);
      }, SUCCESS_HOLD_MS);
      return () => clearTimeout(t);
    }
  }, [step, walletAddress, onComplete]);

  // Failure / cancellation path: emit once per error
  useEffect(() => {
    if (step === 'error' && error && !failedOnceRef.current) {
      failedOnceRef.current = true;
      const isCancelled = error.toLowerCase().includes('cancel');
      if (isCancelled) {
        trackPasskeyCancelled(error);
      } else {
        trackPasskeyFailed(error);
      }
    }
  }, [step, error]);

  const getDisplayStep = (): 'ready' | 'creating' | 'passkey' | 'success' | 'error' => {
    if (showCelebrating) return 'success';
    if (!hasStarted) return 'ready';
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back / Cancel — always available except during the brief celebration */}
      {!showCelebrating && (
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
            {isConnecting ? 'Cancel' : 'Back'}
          </Button>
        </motion.div>
      )}

      {/* ZenSolar logo watermark — branded continuity across every state */}
      <motion.img
        src={zenLogo}
        alt="ZenSolar"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-6 left-1/2 -translate-x-1/2 h-6 w-auto z-10 dark:drop-shadow-[0_0_18px_rgba(34,197,94,0.25)]"
      />

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
        className="w-full max-w-md relative z-10 pt-12"
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
          {displayStep === 'success' && (
            <SuccessStep key="success" walletAddress={walletAddress} />
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

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <FeatureBadge icon={Fingerprint} label="Passkey Secured" />
          <FeatureBadge icon={Shield} label="Self-Custody" />
          <FeatureBadge icon={Zap} label="Gasless" />
        </div>

        <div className="space-y-3 mb-6">
          <Button
            size="lg"
            onClick={onStart}
            className="w-full bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary/80 shadow-lg shadow-primary/20 gap-2 h-14 text-base font-semibold"
          >
            <Sparkles className="w-5 h-5" />
            Create New Wallet
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/80">
          Secured by Coinbase Smart Wallet on Base.
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <SecurityVisualizer
        activeStep={1}
        title="Opening your ZenSolar vault"
        subtitle="A secure popup will appear in a moment."
      />
    </motion.div>
  );
}

function PasskeyStep() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <SecurityVisualizer
        activeStep={0}
        title="Confirm with Face ID"
        subtitle="A system prompt will ask for your passkey. This proves the wallet is yours — no password required."
      />
      <p className="text-[11px] text-muted-foreground/70 mt-6 text-center">
        Complete the prompt in the popup window.
      </p>
    </motion.div>
  );
}

function SuccessStep({ walletAddress }: { walletAddress: string | null }) {
  const short = walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : '';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 14, delay: 0.05 }}
        className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary/25 via-primary/15 to-primary/5 border border-primary/30 shadow-xl shadow-primary/20 flex items-center justify-center relative"
      >
        <Check className="w-12 h-12 text-primary" strokeWidth={2.5} />
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/40"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>

      <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
        ZenSolar Wallet Secured
      </h2>
      <p className="text-muted-foreground text-sm mb-2 max-w-xs mx-auto">
        Your vault is ready. Let's connect your energy next.
      </p>
      {short && (
        <p className="text-[11px] font-mono text-muted-foreground/70 tracking-wider">
          {short}
        </p>
      )}
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
