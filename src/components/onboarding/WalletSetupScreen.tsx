import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Check, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

type SetupStep = 'creating' | 'passkey' | 'success';

interface WalletSetupScreenProps {
  onComplete: (walletAddress: string) => void;
  onBack: () => void;
}

export function WalletSetupScreen({ onComplete, onBack }: WalletSetupScreenProps) {
  const [step, setStep] = useState<SetupStep>('creating');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Simulate wallet creation process
    const createWallet = async () => {
      // Step 1: Creating (1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 2: Passkey prompt
      setStep('passkey');
      
      // Simulate passkey authentication (2s)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a demo wallet address
      const address = '0x' + Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      
      setWalletAddress(address);
      setStep('success');
    };

    createWallet();
  }, []);

  const handleContinue = () => {
    if (walletAddress) {
      onComplete(walletAddress);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex items-center justify-center p-4 relative overflow-hidden">
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
          {step === 'creating' && (
            <CreatingStep key="creating" />
          )}
          
          {step === 'passkey' && (
            <PasskeyStep key="passkey" />
          )}
          
          {step === 'success' && walletAddress && (
            <SuccessStep 
              key="success" 
              walletAddress={walletAddress} 
              onContinue={handleContinue}
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
        Setting up secure, self-custody storage for your rewards...
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
        Secure Your Wallet
      </h2>
      <p className="text-muted-foreground text-sm mb-4">
        Use Face ID or Touch ID to protect your rewards
      </p>

      {/* Simulated Face ID prompt */}
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
            <p className="text-sm font-medium">Passkey Setup</p>
            <p className="text-xs text-muted-foreground">Authenticating...</p>
          </div>
        </div>
      </motion.div>
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
            <span className="text-xs text-muted-foreground">Base Network</span>
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
