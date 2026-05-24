import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, X, ArrowLeft, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerLightTap } from '@/hooks/useHaptics';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

// Brand logos — official square favicons served from each OEM's domain
// via Google's S2 favicon service. Guaranteed authentic + uniform 1:1 aspect.
const brandIcon = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
const teslaLogo = brandIcon('tesla.com');
const enphaseLogo = brandIcon('enphase.com');
const solaredgeLogo = brandIcon('solaredge.com');
const wallboxLogo = brandIcon('wallbox.com');

export type EnergyProvider = 'tesla' | 'enphase' | 'solaredge' | 'wallbox';

type Capability = 'Solar' | 'Battery' | 'EV';

interface EnergyConnectionScreenProps {
  onConnect: (provider: EnergyProvider) => void;
  onSkip: () => void;
  onBack?: () => void;
  onCancelConnecting?: () => void;
  onAskDeason?: () => void;
  isConnecting?: EnergyProvider | null;
  connectedProviders?: string[];
}

const capabilityStyles: Record<Capability, string> = {
  Solar: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  Battery: 'bg-purple-500/10 text-purple-300 border-purple-500/25',
  EV: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
};

const providers: Array<{
  id: EnergyProvider;
  name: string;
  logo: string;
  description: string;
  capabilities: Capability[];
}> = [
  {
    id: 'tesla',
    name: 'Tesla',
    logo: teslaLogo,
    description: 'Powerwall, Solar & Vehicles',
    capabilities: ['Solar', 'Battery', 'EV'],
  },
  {
    id: 'enphase',
    name: 'Enphase',
    logo: enphaseLogo,
    description: 'Microinverters & IQ Battery',
    capabilities: ['Solar', 'Battery'],
  },
  {
    id: 'solaredge',
    name: 'SolarEdge',
    logo: solaredgeLogo,
    description: 'PV Inverters, Battery & EV Charger',
    capabilities: ['Solar', 'Battery', 'EV'],
  },
  {
    id: 'wallbox',
    name: 'Wallbox',
    logo: wallboxLogo,
    description: 'Smart EV charging solutions',
    capabilities: ['EV'],
  },
];

export function EnergyConnectionScreen({
  onConnect,
  onSkip,
  onBack,
  onCancelConnecting,
  onAskDeason,
  isConnecting,
  connectedProviders = [],
}: EnergyConnectionScreenProps) {
  const availableProviders = providers.filter((p) => !connectedProviders.includes(p.id));

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

  const handleAskDeason = async () => {
    await triggerLightTap();
    onAskDeason?.();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/15 blur-[110px]"
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-[130px]"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Header — back + step indicator */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        {onBack && !isConnecting ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1 -ml-2 text-muted-foreground hover:text-foreground h-9"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        ) : (
          <div className="w-16" />
        )}
        <img
          src={zenLogo}
          alt="ZenSolar"
          className="h-6 w-auto opacity-90 dark:drop-shadow-[0_0_18px_rgba(34,197,94,0.25)]"
        />
        <div className="w-16" />
      </header>

      {/* Hero node */}
      <section className="relative z-10 flex flex-col items-center pt-6 pb-2 px-6">
        <div className="relative">
          {/* Concentric energy rings */}
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] pointer-events-none"
            viewBox="0 0 300 300"
            fill="none"
          >
            <motion.circle
              cx="150"
              cy="150"
              r="80"
              stroke="hsl(var(--primary) / 0.18)"
              strokeWidth="1"
              animate={{ r: [78, 82, 78], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle
              cx="150"
              cy="150"
              r="110"
              stroke="rgba(16,185,129,0.12)"
              strokeWidth="1"
              animate={{ r: [108, 114, 108], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
            <motion.circle
              cx="150"
              cy="150"
              r="140"
              stroke="hsl(var(--primary) / 0.08)"
              strokeWidth="1"
              animate={{ r: [138, 144, 138], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
          </svg>

          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.4),inset_0_0_18px_hsl(var(--primary)/0.25)]"
          >
            <Zap className="w-12 h-12 text-primary-foreground drop-shadow" strokeWidth={1.75} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8 text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
            Connect Your Energy
          </h1>
          <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
            Link your solar, battery, or EV charging to start earning{' '}
            <span className="text-primary font-semibold">$ZSOLAR</span> rewards.
          </p>
        </motion.div>
      </section>

      {/* Provider tiles */}
      <section className="relative z-10 flex-1 px-5 pt-6 pb-44 space-y-3 overflow-y-auto">
        {availableProviders.map((provider, index) => {
          const isLoading = isConnecting === provider.id;
          return (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.07 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleProviderClick(provider.id)}
              disabled={!!isConnecting}
              className="group w-full p-4 rounded-3xl flex items-center gap-4 text-left transition-all duration-200 border border-white/5 hover:border-primary/40 hover:shadow-[0_0_25px_hsl(var(--primary)/0.15)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  'linear-gradient(135deg, hsl(var(--card) / 0.7) 0%, hsl(var(--background) / 0.85) 100%)',
              }}
            >
              <div className="w-14 h-14 rounded-2xl shrink-0 overflow-hidden shadow-md ring-1 ring-white/10 bg-white/5">
                <img
                  src={provider.logo}
                  alt={provider.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base text-foreground truncate">
                    {provider.name}
                  </h3>
                  <div className="flex gap-1 flex-wrap">
                    {provider.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-tight ${capabilityStyles[cap]}`}
                      >
                        {cap === 'Battery' ? 'Bat' : cap}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {provider.description}
                </p>
              </div>
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
              ) : (
                <ArrowRight className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              )}
            </motion.button>
          );
        })}

        {availableProviders.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            All supported providers are connected.
          </p>
        )}
      </section>

      {/* Bottom tier — Deason assist + skip */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-5 pb-6 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent">
        <AnimatePresence mode="wait">
          {isConnecting ? (
            <motion.div
              key="cancel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              <Button
                variant="ghost"
                onClick={() => onCancelConnecting?.()}
                className="text-muted-foreground hover:text-foreground gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Waiting for authorization…</p>
            </motion.div>
          ) : (
            <motion.div
              key="assist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Deason AI assist */}
              {onAskDeason && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAskDeason}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/15 backdrop-blur-md hover:bg-primary/10 hover:border-primary/25 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                      <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="text-left">
                      <p className="text-[12px] font-semibold text-foreground tracking-wide">
                        Need help? Ask Deason
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        AI-powered setup assistant
                      </p>
                    </div>
                  </div>
                  <span className="h-8 px-3 inline-flex items-center bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] font-bold rounded-lg shadow-lg shadow-primary/25 tracking-wider">
                    ASK
                  </span>
                </motion.button>
              )}

              {/* Skip */}
              <div className="mt-3 flex justify-center">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground gap-2 h-9 text-xs"
                >
                  I'll do this later
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
