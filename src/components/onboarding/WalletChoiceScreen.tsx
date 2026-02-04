import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Shield, Smartphone, Zap, Check, Fingerprint, ChevronRight, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerLightTap, triggerMediumTap } from '@/hooks/useHaptics';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export type WalletChoice = 'zensolar' | 'external' | 'skip';

interface WalletChoiceScreenProps {
  onChoice: (choice: WalletChoice) => void;
  isLoading?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

export function WalletChoiceScreen({ onChoice, isLoading = false }: WalletChoiceScreenProps) {
  const [selectedChoice, setSelectedChoice] = useState<WalletChoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelect = async (choice: WalletChoice) => {
    if (isLoading || isProcessing) return;
    
    await triggerMediumTap();
    
    setSelectedChoice(choice);
    setIsProcessing(true);
    
    await new Promise(resolve => setTimeout(resolve, 250));
    onChoice(choice);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary glow */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Secondary accent */}
        <motion.div 
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl"
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }}
        />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with ZenSolar branding */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <motion.img
            src={zenLogo}
            alt="ZenSolar"
            className="h-8 w-auto mx-auto mb-8 dark:drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 shadow-lg shadow-primary/10">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              >
                <Wallet className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
          </motion.div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Set Up Your Rewards Wallet
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xs mx-auto leading-relaxed">
            Choose how you'd like to receive your <span className="text-primary font-medium">$ZSOLAR</span> tokens and NFTs
          </p>
        </motion.div>

        {/* Wallet Options */}
        <div className="space-y-4 mb-8">
          {/* ZenSolar Wallet - Recommended */}
          <motion.div variants={itemVariants}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelect('zensolar')}
              disabled={isLoading || isProcessing}
              className={cn(
                "w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden group",
                selectedChoice === 'zensolar'
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/50 hover:bg-card hover:shadow-md"
              )}
            >
              {/* Recommended badge - positioned to not overlap content */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Create ZenSolar Wallet
                    </h3>
                  </div>
                </div>
                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold border border-primary/25">
                  <Zap className="w-3 h-3 fill-current" />
                  Recommended
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4 pl-0">
                One-tap setup with Face ID or Touch ID. No apps to download, no seed phrases.
              </p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-2">
                <FeatureBadge icon={Fingerprint} label="Passkey Secured" />
                <FeatureBadge icon={Smartphone} label="No Apps Needed" />
                <FeatureBadge icon={Shield} label="Self-Custody" />
              </div>

              {/* Selection indicator */}
              <AnimatePresence>
                {selectedChoice === 'zensolar' && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute bottom-4 right-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
            </motion.button>
          </motion.div>

          {/* External Wallet */}
          <motion.div variants={itemVariants}>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelect('external')}
              disabled={isLoading || isProcessing}
              className={cn(
                "w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden group",
                selectedChoice === 'external'
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/50 hover:bg-card hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/70 border border-border flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Connect Existing Wallet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use MetaMask, Base Wallet, or any Web3 wallet you already have.
                  </p>
                  
                  {/* Wallet logos */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
                      <span className="text-sm">🦊</span>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-sm">🔵</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-1">+ more</span>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
              </div>

              {/* Selection indicator */}
              <AnimatePresence>
                {selectedChoice === 'external' && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute bottom-4 right-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>

        {/* Skip option */}
        <motion.div variants={itemVariants} className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelect('skip')}
            disabled={isLoading || isProcessing}
            className="text-muted-foreground hover:text-foreground gap-2 h-10"
          >
            <Clock className="w-4 h-4" />
            Do this later
          </Button>
          <p className="text-xs text-muted-foreground/80 mt-2">
            You can set up your wallet anytime from the Dashboard
          </p>
        </motion.div>

        {/* Processing overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center rounded-3xl"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent mx-auto mb-3"
                />
                <p className="text-sm text-muted-foreground font-medium">
                  {selectedChoice === 'zensolar' ? 'Setting up your wallet...' : 'Preparing...'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function FeatureBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/60 border border-border/50 text-xs text-muted-foreground">
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}
