import { motion } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerLightTap } from '@/hooks/useHaptics';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import teslaLogo from '@/assets/logos/tesla-t-icon.png';

/**
 * SolarInstallerScreen — asks the single deterministic question that resolves
 * the Solar source-of-truth ambiguity: "Did Tesla install your PV system?"
 *
 * Why: If Tesla installed the array, the customer monitors solar production in
 * the Tesla app (even when the underlying inverters are SolarEdge or Enphase).
 * If anyone else installed, the customer logs into Enphase or SolarEdge.
 *
 * Rendered whenever the user selected Tesla — even alone — so we can tell
 * Tesla-installed PV apart from a Tesla customer who only has a Powerwall.

 *
 * Persists `onboarding_solar_installer` = 'tesla' | 'other' to localStorage so
 * DevicePairingScreen can auto-route Solar capability without showing the
 * conflict resolver.
 */

export type SolarInstaller = 'tesla' | 'other';

interface SolarInstallerScreenProps {
  onSelect: (installer: SolarInstaller) => void;
  onBack?: () => void;
}

export function SolarInstallerScreen({ onSelect, onBack }: SolarInstallerScreenProps) {
  const pick = async (choice: SolarInstaller) => {
    await triggerLightTap();
    try {
      localStorage.setItem('onboarding_solar_installer', choice);
    } catch {
      /* ignore */
    }
    onSelect(choice);
  };

  const handleBack = async () => {
    await triggerLightTap();
    onBack?.();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-500/10 blur-[110px]"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        {onBack ? (
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

      <section className="relative z-10 flex flex-col items-center pt-4 pb-1 px-6">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.45)] ring-2 ring-amber-300/40"
        >
          <Sparkles className="w-7 h-7 text-black" strokeWidth={2.25} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-5 text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
            Deason · solar source
          </p>
          <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-tight bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
            Did Tesla install your<br />PV solar system?
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground max-w-[320px] mx-auto">
            One quick question so we pull your solar production from the right
            app — and never double-count a kWh.
          </p>
        </motion.div>
      </section>

      <section className="relative z-10 flex-1 px-5 pt-8 pb-44 space-y-3">
        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          onClick={() => pick('tesla')}
          className="w-full p-5 rounded-3xl border border-white/8 hover:border-primary/60 hover:shadow-[0_0_24px_hsl(var(--primary)/0.18)] transition-all text-left group"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--card) / 0.7) 0%, hsl(var(--background) / 0.85) 100%)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl shrink-0 shadow-md ring-1 ring-white/10 bg-[#1a1a1a] flex items-center justify-center p-2">
              <img src={teslaLogo} alt="Tesla" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-foreground">Yes, Tesla installed it</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                We'll pull solar production via the Tesla API
              </p>
            </div>
            <div className="w-7 h-7 rounded-full border-2 border-white/20 group-hover:border-primary group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-all">
              <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => pick('other')}
          className="w-full p-5 rounded-3xl border border-white/8 hover:border-primary/60 hover:shadow-[0_0_24px_hsl(var(--primary)/0.18)] transition-all text-left group"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--card) / 0.7) 0%, hsl(var(--background) / 0.85) 100%)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl shrink-0 shadow-md ring-1 ring-white/10 bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-amber-300" strokeWidth={2.25} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-foreground">A local installer did</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                We'll pull solar from your Enphase or SolarEdge app
              </p>
            </div>
            <div className="w-7 h-7 rounded-full border-2 border-white/20 group-hover:border-primary group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-all">
              <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
            </div>
          </div>
        </motion.button>

        <p className="text-center text-[11px] text-muted-foreground/70 pt-4 max-w-[300px] mx-auto leading-relaxed">
          Not sure? Pick whichever app you actually open to check today's
          production. You can add your installer's contact info later in Profile.
        </p>
      </section>
    </div>
  );
}
