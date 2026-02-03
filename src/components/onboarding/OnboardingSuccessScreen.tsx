import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Zap, ArrowRight, Wallet, Sparkles, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/hooks/useGoogleAnalytics';

interface OnboardingSuccessScreenProps {
  walletAddress?: string | null;
  walletType: 'zensolar' | 'external' | 'skipped';
}

export function OnboardingSuccessScreen({ walletAddress, walletType }: OnboardingSuccessScreenProps) {
  const navigate = useNavigate();

  const handleConnectEnergy = () => {
    trackEvent('onboarding_success_connect_energy_clicked', { walletType });
    navigate('/?showConnect=true');
  };

  const handleGoToDashboard = () => {
    trackEvent('onboarding_success_dashboard_clicked', { walletType });
    navigate('/');
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

        {/* Next Step Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Sun className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Next: Connect Your Energy</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Link your Tesla, Enphase, or other energy systems to start earning rewards.
                </p>
                <Button 
                  size="sm"
                  onClick={handleConnectEnergy}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <Zap className="w-4 h-4" />
                  Connect Energy Account
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skip to dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Button
            variant="ghost"
            onClick={handleGoToDashboard}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            Skip to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
