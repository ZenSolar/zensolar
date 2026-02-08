import { motion } from 'framer-motion';
import { Flame, ArrowRight, Droplets, ShieldCheck, Repeat } from 'lucide-react';

const steps = [
  {
    icon: Flame,
    label: '20% Mint Burn',
    sub: 'Tokens destroyed at creation',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
  },
  {
    icon: ArrowRight,
    label: '7% Transfer Tax',
    sub: '3% burn · 2% LP · 2% treasury',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: Droplets,
    label: 'LP Injection',
    sub: '50% of subscriptions → liquidity',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  {
    icon: ShieldCheck,
    label: 'Price Floor Rises',
    sub: 'Fiat-backed, crypto-winter-proof',
    color: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/20',
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
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-destructive">Deflationary by Design</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Every Transaction Makes It Scarcer
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Built-in burn mechanics and subscription-backed liquidity create a rising price floor — even in bear markets.
          </p>
        </div>

        {/* Napkin sketch style flow */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-border/40 -translate-x-1/2 z-0" />

          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-1 md:gap-6 relative z-10">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className={`flex items-center gap-4 p-5 rounded-2xl border ${step.border} ${step.bg} backdrop-blur-sm md:max-w-md ${i % 2 === 0 ? 'md:mr-auto' : 'md:ml-auto'}`}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center`}>
                  <step.icon className={`h-6 w-6 ${step.color}`} />
                </div>
                <div>
                  <p className={`font-bold text-foreground`}>{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Loop arrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="flex justify-center mt-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Repeat className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Flywheel accelerates with every user</span>
            </div>
          </motion.div>
        </div>

        {/* Napkin-style summary */}
        <div className="p-5 rounded-2xl bg-muted/50 border border-border/30 text-center space-y-2">
          <p className="text-sm font-medium text-foreground">
            More selling → more tokens burned → scarcer supply → higher floor
          </p>
          <p className="text-xs text-muted-foreground italic">
            The deflationary mechanics turn sell pressure into price support.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
