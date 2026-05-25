import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Zap, ArrowRight, Wallet, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfetti } from '@/hooks/useConfetti';
import { triggerSuccess, triggerLightTap } from '@/hooks/useHaptics';
import { MeetYourWalletTour } from './MeetYourWalletTour';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

interface OnboardingSuccessScreenProps {
  walletAddress?: string | null;
  walletType: 'zensolar' | 'external' | 'skipped';
  onContinue: () => void;
}

export function OnboardingSuccessScreen({ walletAddress, walletType, onContinue }: OnboardingSuccessScreenProps) {
  const { triggerCelebration } = useConfetti();
  const [phase, setPhase] = useState<'celebrate' | 'tour'>('celebrate');

  // ZenSolar wallets get the full tour. External/skipped keep the original flow.
  const showTour = walletType === 'zensolar' && !!walletAddress;

  useEffect(() => {
    if (walletType !== 'skipped' && walletAddress) {
      const timer = setTimeout(() => {
        triggerCelebration();
        triggerSuccess();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [walletType, walletAddress, triggerCelebration]);

  // Auto-advance to tour after the celebration lands
  useEffect(() => {
    if (!showTour) return;
    const t = setTimeout(() => setPhase('tour'), 1800);
    return () => clearTimeout(t);
  }, [showTour]);

  const handleContinue = async () => {
    await triggerLightTap();
    onContinue();
  };

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const getStatusMessage = () => {
    switch (walletType) {
      case 'zensolar':
        return {
          icon: <Sparkles className="w-6 h-6 text-primary" />,
          title: 'ZenSolar wallet ready',
          subtitle: 'Secured with Face ID on this device',
        };
      case 'external':
        return {
          icon: <Wallet className="w-6 h-6 text-primary" />,
          title: 'Wallet connected',
          subtitle: 'Your external wallet is linked to your account',
        };
      case 'skipped':
        return {
          icon: <Zap className="w-6 h-6 text-muted-foreground" />,
          title: 'Account created',
          subtitle: 'Connect a wallet anytime from Settings',
        };
    }
  };

  const status = getStatusMessage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Calm gradient — no pulse */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-gradient-to-b from-primary/12 via-primary/[0.04] to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <img
          src={zenLogo}
          alt="ZenSolar"
          className="h-7 w-auto mx-auto mb-10 opacity-90 dark:drop-shadow-[0_0_18px_rgba(34,197,94,0.25)]"
        />

        <AnimatePresence mode="wait">
          {phase === 'celebrate' && (
            <motion.div
              key="celebrate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {/* Success badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-7 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -120 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 220 }}
                >
                  <CheckCircle2 className="w-11 h-11 text-primary-foreground" />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  {status.icon}
                  <h2 className="text-xl font-semibold text-foreground tracking-tight">
                    {status.title}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">{status.subtitle}</p>
              </motion.div>

              {/* Non-tour fallback: legacy address + CTA */}
              {!showTour && (
                <>
                  {shortAddress && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="mt-6 p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60"
                    >
                      <p className="text-xs text-muted-foreground mb-1.5 text-center">Wallet address</p>
                      <p className="font-mono text-sm text-foreground text-center">{shortAddress}</p>
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mt-6"
                  >
                    <Button
                      size="lg"
                      onClick={handleContinue}
                      className="w-full gap-2 bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary/80 shadow-lg shadow-primary/20 h-14 text-base font-semibold"
                    >
                      <Zap className="w-5 h-5" />
                      Connect your energy
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}

          {phase === 'tour' && walletAddress && (
            <motion.div
              key="tour"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <MeetYourWalletTour
                walletAddress={walletAddress}
                onComplete={handleContinue}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
