import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Loader2, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerLightTap } from '@/hooks/useHaptics';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

// Import brand logos
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

export type EnergyProvider = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';

interface EnergyConnectionScreenProps {
  onConnect: (provider: EnergyProvider) => void;
  onSkip: () => void;
  onBack?: () => void;
  onCancelConnecting?: () => void;
  isConnecting?: EnergyProvider | null;
  connectedProviders?: string[];
}

const providers = [
  { 
    id: 'tesla' as EnergyProvider, 
    name: 'Tesla', 
    logo: teslaLogo,
    description: 'Solar, Powerwall & EV charging'
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
  onBack,
  onCancelConnecting,
  isConnecting,
  connectedProviders = []
}: EnergyConnectionScreenProps) {
  const availableProviders = providers.filter(
    p => !connectedProviders.includes(p.id)
  );

  const handleProviderClick = async (provider: EnergyProvider) => {
    await triggerLightTap();
    onConnect(provider);
  };

  const handleSkip = async () => {
    await triggerLightTap();
    onSkip();
  };

  const handleBack = async () => {
    await triggerLightTap();
    onBack?.();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back button */}
      {onBack && !isConnecting && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-6 left-4 z-20"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>
      )}

      {/* Premium gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-primary/12 via-primary/5 to-transparent rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5],
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
        {/* ZenSolar Logo */}
        <motion.img
          src={zenLogo}
          alt="ZenSolar"
          className="h-8 w-auto mx-auto mb-8 dark:drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        />

        {/* Header icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25"
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
          <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
            Connect Your Energy
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Link your solar, battery, or EV charging to start earning <span className="text-primary font-medium">$ZSOLAR</span> rewards
          </p>
        </motion.div>

        {/* Provider buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mb-8"
        >
          {availableProviders.map((provider, index) => (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + index * 0.08 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleProviderClick(provider.id)}
              disabled={!!isConnecting}
              className="w-full p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 hover:border-primary/50 hover:bg-card hover:shadow-md transition-all duration-200 flex items-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-12 h-12 rounded-xl bg-muted/80 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img 
                  src={provider.logo} 
                  alt={provider.name}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-semibold text-foreground">{provider.name}</p>
                <p className="text-xs text-muted-foreground truncate">{provider.description}</p>
              </div>
              {isConnecting === provider.id ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
              ) : (
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Cancel connecting / Skip option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <AnimatePresence mode="wait">
            {isConnecting ? (
              <motion.div
                key="cancel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => onCancelConnecting?.()}
                  className="text-muted-foreground hover:text-foreground gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Waiting for authorization...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="skip"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground gap-2 h-10"
                >
                  I'll do this later
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <p className="text-xs text-muted-foreground/80 mt-2">
                  You can connect energy accounts from your Profile
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
