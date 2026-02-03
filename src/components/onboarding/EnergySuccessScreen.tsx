import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Plus, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfetti } from '@/hooks/useConfetti';
import { triggerSuccess, triggerLightTap } from '@/hooks/useHaptics';
import { trackEvent } from '@/hooks/useGoogleAnalytics';

// Import brand logos
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

const providerLogos: Record<string, string> = {
  tesla: teslaLogo,
  enphase: enphaseLogo,
  solaredge: solaredgeLogo,
  wallbox: wallboxLogo,
};

const providerNames: Record<string, string> = {
  tesla: 'Tesla',
  enphase: 'Enphase',
  solaredge: 'SolarEdge',
  wallbox: 'Wallbox',
};

interface EnergySuccessScreenProps {
  provider: string;
  connectedProviders: string[];
  onAddAnother: () => void;
  onContinue: () => void;
}

export function EnergySuccessScreen({ 
  provider, 
  connectedProviders,
  onAddAnother, 
  onContinue 
}: EnergySuccessScreenProps) {
  const { triggerCelebration } = useConfetti();

  // Trigger confetti and haptic on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerCelebration();
      triggerSuccess();
    }, 300);
    return () => clearTimeout(timer);
  }, [triggerCelebration]);

  const handleAddAnother = async () => {
    await triggerLightTap();
    trackEvent('onboarding_add_another_energy_clicked', { currentProvider: provider });
    onAddAnother();
  };

  const handleContinue = async () => {
    await triggerLightTap();
    trackEvent('onboarding_energy_continue_to_dashboard', { 
      provider, 
      totalConnected: connectedProviders.length 
    });
    onContinue();
  };

  const logo = providerLogos[provider];
  const name = providerNames[provider] || provider;

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
        {/* Success animation with provider logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="relative w-24 h-24 mx-auto mb-8"
        >
          {/* Background circle */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30" />
          
          {/* Provider logo */}
          {logo && (
            <div className="absolute inset-2 rounded-xl bg-white/95 flex items-center justify-center">
              <img src={logo} alt={name} className="w-10 h-10 object-contain" />
            </div>
          )}

          {/* Checkmark badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
          >
            <CheckCircle2 className="w-6 h-6 text-white" />
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

        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {name} Connected! 🎉
          </h2>
          <p className="text-muted-foreground text-sm">
            Your energy data is now linked and earning rewards
          </p>
        </motion.div>

        {/* Connected providers summary */}
        {connectedProviders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-4 rounded-xl bg-muted/50 border border-border mb-6"
          >
            <p className="text-xs text-muted-foreground mb-3 text-center">Connected Energy Accounts</p>
            <div className="flex justify-center gap-3">
              {connectedProviders.map((p) => (
                <div key={p} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border">
                  <img 
                    src={providerLogos[p]} 
                    alt={providerNames[p]} 
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-xs font-medium text-foreground">{providerNames[p]}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          {/* Go to Dashboard - Primary action */}
          <Button 
            size="lg"
            onClick={handleContinue}
            className="w-full gap-2 bg-primary hover:bg-primary/90 h-14 text-base"
          >
            <Zap className="w-5 h-5" />
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Button>

          {/* Add another energy account */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleAddAnother}
            className="w-full gap-2 h-12"
          >
            <Plus className="w-4 h-4" />
            Add Another Energy Account
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
