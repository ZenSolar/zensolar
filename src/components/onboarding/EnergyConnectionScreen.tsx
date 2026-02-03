import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerLightTap } from '@/hooks/useHaptics';

// Import brand logos
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

export type EnergyProvider = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';

interface EnergyConnectionScreenProps {
  onConnect: (provider: EnergyProvider) => void;
  onSkip: () => void;
  isConnecting?: EnergyProvider | null;
}

const providers = [
  { 
    id: 'tesla' as EnergyProvider, 
    name: 'Tesla', 
    logo: teslaLogo,
    description: 'Solar, Powerwall, EV charging'
  },
  { 
    id: 'enphase' as EnergyProvider, 
    name: 'Enphase', 
    logo: enphaseLogo,
    description: 'Microinverters & batteries'
  },
  { 
    id: 'solaredge' as EnergyProvider, 
    name: 'SolarEdge', 
    logo: solaredgeLogo,
    description: 'Solar inverters & monitoring'
  },
  { 
    id: 'wallbox' as EnergyProvider, 
    name: 'Wallbox', 
    logo: wallboxLogo,
    description: 'EV charging solutions'
  },
];

export function EnergyConnectionScreen({ 
  onConnect, 
  onSkip, 
  isConnecting 
}: EnergyConnectionScreenProps) {
  const handleProviderClick = async (provider: EnergyProvider) => {
    await triggerLightTap();
    onConnect(provider);
  };

  const handleSkip = async () => {
    await triggerLightTap();
    onSkip();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30"
        >
          <Zap className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Connect Your Energy
          </h2>
          <p className="text-muted-foreground text-sm">
            Link your solar, battery, or EV charging to start earning rewards
          </p>
        </motion.div>

        {/* Provider buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mb-6"
        >
          {providers.map((provider, index) => (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => handleProviderClick(provider.id)}
              disabled={!!isConnecting}
              className="w-full p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                <img 
                  src={provider.logo} 
                  alt={provider.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">{provider.name}</p>
                <p className="text-xs text-muted-foreground">{provider.description}</p>
              </div>
              {isConnecting === provider.id ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Skip option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={!!isConnecting}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            I'll do this later
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
