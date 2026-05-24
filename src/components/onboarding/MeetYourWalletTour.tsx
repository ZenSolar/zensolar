import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Fingerprint, LayoutDashboard, Copy, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerLightTap } from '@/hooks/useHaptics';

interface MeetYourWalletTourProps {
  walletAddress: string;
  onComplete: () => void;
}

type Step = {
  icon: typeof Shield;
  eyebrow: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    icon: Fingerprint,
    eyebrow: 'Yours alone',
    title: 'Self-custody, secured by Face ID',
    body: 'Your passkey lives in your device\'s secure enclave. No one at ZenSolar — not even us — can access, freeze, or move your funds.',
  },
  {
    icon: LayoutDashboard,
    eyebrow: 'Always one tap away',
    title: 'Find it in your dashboard',
    body: 'Your balance, rewards, and address live on the home screen. Ready when you are.',
  },
];

export function MeetYourWalletTour({ walletAddress, onComplete }: MeetYourWalletTourProps) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const shortAddress = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  const handleNext = async () => {
    await triggerLightTap();
    if (isLast) onComplete();
    else setStep((s) => s + 1);
  };

  const handleCopy = async () => {
    await triggerLightTap();
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard may be blocked */
    }
  };

  return (
    <div className="w-full">
      {/* Address chip — always visible, anchors the tour */}
      <motion.button
        type="button"
        onClick={handleCopy}
        whileTap={{ scale: 0.98 }}
        className="mx-auto mb-8 flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-3 py-1.5 text-xs"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span className="font-mono text-foreground">{shortAddress}</span>
        <span className="text-muted-foreground">·</span>
        {copied ? (
          <span className="inline-flex items-center gap-1 text-primary">
            <Check className="w-3 h-3" /> Copied
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Copy className="w-3 h-3" /> Copy
          </span>
        )}
      </motion.button>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="text-center"
        >
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent flex items-center justify-center">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary/80 mb-2 font-medium">
            {current.eyebrow}
          </p>
          <h2 className="text-2xl font-semibold text-foreground mb-3 tracking-tight">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {current.body}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="mt-8 mb-6 flex items-center justify-center gap-2">
        {STEPS.map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            aria-label={`Go to step ${i + 1}`}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground/40',
            )}
          />
        ))}
      </div>

      <Button
        size="lg"
        onClick={handleNext}
        className="w-full h-14 text-base font-semibold gap-2 bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary/80 shadow-lg shadow-primary/20"
      >
        {isLast ? 'Connect Your Energy' : 'Next'}
        <ArrowRight className="w-5 h-5" />
      </Button>

      {!isLast && (
        <button
          onClick={onComplete}
          className="w-full mt-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tour
        </button>
      )}
    </div>
  );
}
