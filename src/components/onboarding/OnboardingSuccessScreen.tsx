import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, ArrowRight, Wallet, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfetti } from '@/hooks/useConfetti';
import { triggerSuccess, triggerLightTap } from '@/hooks/useHaptics';

interface OnboardingSuccessScreenProps {
  walletAddress?: string | null;
  walletType: 'zensolar' | 'external' | 'skipped';
  onContinue: () => void;
}

export function OnboardingSuccessScreen({ walletAddress, walletType, onContinue }: OnboardingSuccessScreenProps) {
  const { triggerCelebration } = useConfetti();

  // Trigger confetti and haptic when wallet is connected
  useEffect(() => {
    if (walletType !== 'skipped' && walletAddress) {
      const timer = setTimeout(() => {
        triggerCelebration();
        triggerSuccess();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [walletType, walletAddress, triggerCelebration]);

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
          title: 'ZenSolar Wallet Ready!',
          subtitle: 'Your rewards wallet is secured with biometrics',
        };
      case 'external':
        return {
          icon: <Wallet className="w-6 h-6 text-primary" />,
          title: 'Wallet Connected!',
          subtitle: 'Your external wallet is linked to your account',
        };
      case 'skipped':
        return {
          icon: <Zap className="w-6 h-6 text-muted-foreground" />,
          title: 'Account Created!',
          subtitle: 'You can connect a wallet anytime from Settings',
        };
    }
  };

  const status = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle2 className="w-12 h-12 text-primary-foreground" />
          </motion.div>
        </motion.div>

        {/* Confetti particles */}
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 4 === 0 ? 'hsl(var(--primary))' : i % 4 === 1 ? 'hsl(var(--accent))' : i % 4 === 2 ? 'hsl(var(--secondary))' : 'hsl(var(--muted-foreground))',
              left: '50%',
              top: '15%',
            }}
            initial={{ scale: 0, x: 0, y: 0 }}
            animate={{
              scale: [0, 1, 0],
              x: Math.cos((i * 22.5 * Math.PI) / 180) * (100 + Math.random() * 50),
              y: Math.sin((i * 22.5 * Math.PI) / 180) * (100 + Math.random() * 50),
            }}
            transition={{ duration: 1, delay: 0.4 }}
          />
        ))}

        {/* Status message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            {status.icon}
            <h2 className="text-xl font-bold text-foreground">
              {status.title}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            {status.subtitle}
          </p>
        </motion.div>

        {/* Wallet address card (if connected) */}
        {shortAddress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-4 rounded-xl bg-muted/50 border border-border mb-6"
          >
            <p className="text-xs text-muted-foreground mb-1 text-center">Your Wallet Address</p>
            <p className="font-mono text-sm text-foreground text-center">{shortAddress}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-[8px] text-white font-bold">B</span>
              </div>
              <span className="text-xs text-muted-foreground">Base Network</span>
            </div>
          </motion.div>
        )}

        {/* Continue to energy connection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button 
            size="lg"
            onClick={handleContinue}
            className="w-full gap-2 bg-primary hover:bg-primary/90 h-14 text-base"
          >
            <Zap className="w-5 h-5" />
            Connect Your Energy
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
