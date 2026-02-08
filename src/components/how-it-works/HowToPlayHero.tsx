import { motion } from 'framer-motion';
import { Link2, Zap, Sparkles, Wallet } from 'lucide-react';

const cycleSteps = [
  { icon: Link2, label: 'Connect' },
  { icon: Zap, label: 'Generate' },
  { icon: Sparkles, label: 'Mint' },
  { icon: Wallet, label: 'Cash Out' },
];

export function HowToPlayHero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-accent/5 to-background" />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 left-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-20 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container max-w-4xl mx-auto px-4 text-center space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-5"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground">
            How to{' '}
            <span className="bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
              Play
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Your clean energy is worth real money. Here's how the game works.
          </p>
        </motion.div>

        {/* Animated cycle loop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center gap-3 md:gap-5 flex-wrap"
        >
          {cycleSteps.map((step, i) => (
            <motion.div key={step.label} className="flex items-center gap-3 md:gap-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.12, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm">
                  <step.icon className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {step.label}
                </span>
              </motion.div>
              {i < cycleSteps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6 + i * 0.12, duration: 0.3 }}
                  className="hidden md:block w-10 h-0.5 bg-gradient-to-r from-primary/40 to-accent/40 rounded-full mb-6 origin-left"
                />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
