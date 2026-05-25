import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, ChevronRight, Wallet, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerMediumTap } from '@/hooks/useHaptics';
import { SecurityBadge } from '@/components/security/SecurityBadge';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export type WalletChoice = 'zensolar' | 'external' | 'skip';

interface WalletChoiceScreenProps {
  onChoice: (choice: WalletChoice) => void;
  isLoading?: boolean;
}

export function WalletChoiceScreen({ onChoice, isLoading = false }: WalletChoiceScreenProps) {
  const [selectedChoice, setSelectedChoice] = useState<WalletChoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelect = async (choice: WalletChoice) => {
    if (isLoading || isProcessing) return;
    await triggerMediumTap();
    setSelectedChoice(choice);
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 220));
    onChoice(choice);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Single calm glow — no pulse */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-gradient-to-b from-primary/10 via-primary/[0.03] to-transparent rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Header — restrained */}
        <div className="text-center mb-12">
          <img
            src={zenLogo}
            alt="ZenSolar"
            className="h-7 w-auto mx-auto mb-10 opacity-90 dark:drop-shadow-[0_0_18px_rgba(34,197,94,0.25)]"
          />
          <h1 className="text-[28px] leading-tight font-semibold text-foreground mb-3 tracking-tight">
            Your rewards wallet
          </h1>
          <p className="text-muted-foreground text-[15px] max-w-[280px] mx-auto leading-relaxed">
            Where your <span className="text-foreground">rewards</span> live. Pick how you want to hold them.
          </p>
        </div>

        {/* Primary action — one clear hero */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => handleSelect('zensolar')}
          disabled={isLoading || isProcessing}
          className={cn(
            'w-full p-5 rounded-2xl text-left transition-all duration-300 relative group',
            'border bg-gradient-to-b from-card to-card/60 backdrop-blur-sm',
            selectedChoice === 'zensolar'
              ? 'border-primary/70 shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]'
              : 'border-border/70 hover:border-primary/50',
          )}
        >
          {/* Popup heads-up — sets expectation before the Coinbase interstitial */}
          <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] text-primary font-medium tracking-wide">
            Secure popup opens next
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Fingerprint className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[17px] font-semibold text-foreground leading-snug">
                Create ZenSolar Wallet
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Recommended</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            One tap with Face ID. No apps, no seed phrases, no passwords.
          </p>

          <div className="flex items-center gap-4 text-[11px] text-muted-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3 h-3 text-primary" /> Passkey-secured
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3 h-3 text-primary" /> Self-custody
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="w-3 h-3 text-primary" /> Gasless
            </span>
          </div>

          {/* What happens next + popup-blocked help */}
          <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
            <p className="text-[11px] text-muted-foreground/90 leading-relaxed">
              <span className="text-foreground/90 font-medium">What happens:</span>{' '}
              A secure Coinbase popup opens, your device prompts for Face ID / Touch ID,
              then you're back here automatically — usually under 10 seconds.
            </p>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              <span className="text-foreground/80 font-medium">Popup blocked or didn't appear?</span>{' '}
              Tap the address-bar icon and allow popups for{' '}
              <span className="text-foreground/90 font-mono">zen.solar</span>, then tap{' '}
              <span className="text-foreground/90">Create ZenSolar Wallet</span> again.
            </p>
          </div>
        </motion.button>

        {/* Secondary — quieter row */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={() => handleSelect('external')}
          disabled={isLoading || isProcessing}
          className={cn(
            'mt-3 w-full px-5 py-4 rounded-2xl text-left transition-all duration-300 group',
            'border bg-card/40',
            selectedChoice === 'external'
              ? 'border-primary/60'
              : 'border-border/50 hover:border-border hover:bg-card/70',
          )}
        >
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">I already have a wallet</p>
              <p className="text-xs text-muted-foreground mt-0.5">MetaMask, Base, Coinbase, WalletConnect</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </div>
        </motion.button>

        {/* Trust line — tappable, opens full security breakdown */}
        <div className="mt-8 flex justify-center">
          <SecurityBadge variant="inline" label="How we protect your wallet & data" />
        </div>

        {/* Skip — text only, low priority */}
        <div className="mt-6 text-center">
          <button
            onClick={() => handleSelect('skip')}
            disabled={isLoading || isProcessing}
            className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors py-2"
          >
            Set up later
          </button>
        </div>

        {/* Subtle processing overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/85 backdrop-blur-md flex items-center justify-center rounded-3xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
