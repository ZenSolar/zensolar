import { motion } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerLightTap } from '@/hooks/useHaptics';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

/**
 * InverterBrandScreen — shown only when the user picked "someone else installed
 * my solar" on SolarInstallerScreen. Resolves which inverter brand owns the
 * solar production reading so we never query two OEMs for the same kWh.
 *
 * Persists `profiles.solar_inverter_brand`. The SSOT resolver in
 * `src/lib/dataSourcePriority.ts` keys off this field.
 */
export type InverterBrand = 'enphase' | 'solaredge' | 'tesla' | 'other';

interface InverterBrandScreenProps {
  onSelect: (brand: InverterBrand) => void;
  onBack?: () => void;
}

const OPTIONS: { id: InverterBrand; label: string; hint: string }[] = [
  { id: 'enphase', label: 'Enphase', hint: 'Microinverters on each panel — most common modern install' },
  { id: 'solaredge', label: 'SolarEdge', hint: 'Power optimizers + central inverter' },
  { id: 'tesla', label: 'Tesla inverter', hint: 'Tesla string inverter (not Powerwall)' },
  { id: 'other', label: 'Other / not sure', hint: "We'll use whichever app you've connected" },
];

export function InverterBrandScreen({ onSelect, onBack }: InverterBrandScreenProps) {
  const pick = async (choice: InverterBrand) => {
    await triggerLightTap();
    onSelect(choice);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[110px]"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        {onBack ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await triggerLightTap(); onBack(); }}
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
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.45)] ring-2 ring-primary/40"
        >
          <Sparkles className="w-7 h-7 text-primary-foreground" strokeWidth={2.25} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mt-5 text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary/80">
            Deason AI · inverter brand
          </p>
          <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-tight bg-gradient-to-b from-foreground to-foreground/55 bg-clip-text text-transparent">
            What brand are your<br />solar inverters?
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground max-w-[320px] mx-auto">
            We only ever read solar production from one source — never two.
            Pick the brand of your inverters or microinverters.
          </p>
        </motion.div>
      </section>

      <section className="relative z-10 flex-1 px-5 pt-6 pb-32 space-y-2.5">
        {OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 + i * 0.05 }}
            onClick={() => pick(opt.id)}
            className="w-full p-4 rounded-2xl border border-white/8 hover:border-primary/60 hover:shadow-[0_0_24px_hsl(var(--primary)/0.18)] transition-all text-left group"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--card) / 0.7) 0%, hsl(var(--background) / 0.85) 100%)',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl shrink-0 ring-1 ring-white/10 bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-foreground">{opt.label}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{opt.hint}</p>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-white/20 group-hover:border-primary group-hover:bg-primary/20 flex items-center justify-center shrink-0 transition-all">
                <Check className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={3} />
              </div>
            </div>
          </motion.button>
        ))}

        <p className="text-center text-[11px] text-muted-foreground/70 pt-4 max-w-[300px] mx-auto leading-relaxed">
          You can change this anytime from Profile → Solar Installer.
        </p>
      </section>
    </div>
  );
}
