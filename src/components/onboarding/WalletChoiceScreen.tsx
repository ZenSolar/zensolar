import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Shield, Smartphone, Zap, ArrowRight, Check, Fingerprint, ChevronRight, Clock } from 'lucide-react';
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
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

const cardHoverVariants = {
  rest: { scale: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  hover: { 
    scale: 1.02, 
    boxShadow: '0 8px 40px rgba(34, 197, 94, 0.2)',
    transition: { duration: 0.3 }
  },
  tap: { scale: 0.98 },
};

export function WalletChoiceScreen({ onChoice, isLoading = false }: WalletChoiceScreenProps) {
  const [selectedChoice, setSelectedChoice] = useState<WalletChoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelect = async (choice: WalletChoice) => {
    if (isLoading || isProcessing) return;
    
    // Haptic feedback on selection
    await triggerMediumTap();
    
    setSelectedChoice(choice);
    setIsProcessing(true);
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    onChoice(choice);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        
        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <motion.div 
        className="w-full max-w-lg relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Wallet className="w-8 h-8 text-primary" />
              </motion.div>
            </div>
          </motion.div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Set Up Your Rewards Wallet
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-sm mx-auto">
            Choose how you'd like to receive your $ZSOLAR tokens and NFTs
          </p>
        </motion.div>

        {/* Wallet Options */}
        <div className="space-y-4 mb-6">
          {/* ZenSolar Wallet - Recommended */}
          <motion.div variants={itemVariants}>
            <motion.button
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleSelect('zensolar')}
              disabled={isLoading || isProcessing}
              className={cn(
                "w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden group",
                selectedChoice === 'zensolar'
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card"
              )}
            >
              {/* Recommended badge */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Zap className="w-3 h-3" />
                  Recommended
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20 p-2">
                  <img 
                    src={zenLogo} 
                    alt="ZenSolar" 
                    className="w-full h-full object-contain"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                </div>
                
                <div className="flex-1 min-w-0 pr-8">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Create ZenSolar Wallet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    One-tap setup with Face ID or Touch ID. No apps to download.
                  </p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    <FeatureBadge icon={Fingerprint} label="Passkey Secured" />
                    <FeatureBadge icon={Smartphone} label="No Apps Needed" />
                    <FeatureBadge icon={Shield} label="Self-Custody" />
                  </div>
                </div>
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
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>

          {/* External Wallet */}
          <motion.div variants={itemVariants}>
            <motion.button
              variants={cardHoverVariants}
              initial="rest"
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleSelect('external')}
              disabled={isLoading || isProcessing}
              className={cn(
                "w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden group",
                selectedChoice === 'external'
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-card"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/70 flex items-center justify-center">
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
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <span className="text-sm">🦊</span>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <span className="text-sm">🔵</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-1">+ more</span>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors mt-1" />
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
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
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
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <Clock className="w-4 h-4" />
            Do this later
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
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
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent mx-auto mb-3"
                />
                <p className="text-sm text-muted-foreground">
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
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground">
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}
