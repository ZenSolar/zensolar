import { motion } from 'framer-motion';
import { Sparkles, Droplets, Flame, ShieldCheck, Repeat } from 'lucide-react';

const splitSteps = [
  {
    icon: Sparkles,
    label: '50% You',
    sub: 'What you see is what you mint — 1 kWh = 1 $ZSOLAR.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  {
    icon: Droplets,
    label: '25% LP direct',
    sub: 'Deepens the liquidity pool on every mint.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
  },
  {
    icon: Flame,
    label: '20% Burn',
    sub: 'Permanently removed — continuous deflation, no halving cliff.',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
  },
  {
    icon: ShieldCheck,
    label: '5% Treasury',
    sub: 'Funds operations, protocol defense, and future buyback.',
    color: 'text-energy',
    bg: 'bg-energy/10',
    border: 'border-energy/30',
  },
];

export function DeflationaryFlywheel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-24"
    >
      <div className="container max-w-4xl mx-auto px-4 space-y-10">
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">The v3.1 Mint Split</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            How every mint splits
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every verified kWh mints a clean 1:1 to you. In the background, the protocol matches
            your mint to fund liquidity, burn, and treasury — like a 401(k) match for clean energy.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {splitSteps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`flex items-start gap-4 p-5 rounded-2xl border ${step.border} ${step.bg} backdrop-blur-sm`}
            >
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center`}>
                <step.icon className={`h-6 w-6 ${step.color}`} />
              </div>
              <div>
                <p className="font-bold text-foreground">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Separate transfer-tax callout */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 p-5 rounded-2xl border border-primary/30 bg-primary/5"
        >
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">+ 3% transfer tax → LP</span>
          </div>
          <span className="text-sm text-muted-foreground text-center sm:text-left">
            Separate mechanism. Applied only on transfers and swaps. Recycled back into liquidity.
          </span>
        </motion.div>

        <div className="p-5 rounded-2xl bg-muted/40 border border-border/40 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            Every kWh you verify deepens liquidity, burns supply, and strengthens the floor.
          </p>
          <p className="text-xs text-muted-foreground italic">
            You always see your full 1 kWh = 1 $ZSOLAR share. The match runs automatically in the background.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
