import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Crown, Rocket } from 'lucide-react';

const levels = [
  {
    name: 'Free',
    icon: Zap,
    frequency: 'On demand',
    description: 'Manual minting anytime',
    price: 'Free forever',
    accent: 'border-border/50',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  {
    name: 'Pro',
    icon: Crown,
    frequency: 'Every week',
    description: 'Auto-mint weekly + priority',
    price: '$9.99/mo',
    accent: 'border-primary/40',
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    popular: true,
  },
  {
    name: 'Elite',
    icon: Rocket,
    frequency: 'Every day',
    description: 'Auto-mint daily + max rewards',
    price: '$19.99/mo',
    accent: 'border-accent/40',
    iconBg: 'bg-accent/15',
    iconColor: 'text-accent',
  },
];

export function LevelUpSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-24"
    >
      <div className="container max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Level Up</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            The More You Use It, The More You Earn
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Level up for more passive income with zero extra effort.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {levels.map((level, i) => (
            <motion.div
              key={level.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
            >
              <Card className={`h-full border-2 ${level.accent} relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5`}>
                {level.popular && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                    Popular
                  </div>
                )}
                <CardContent className="p-7 space-y-5 text-center">
                  <div className={`w-14 h-14 rounded-2xl ${level.iconBg} flex items-center justify-center mx-auto`}>
                    <level.icon className={`h-7 w-7 ${level.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{level.name}</h3>
                    <p className="text-2xl font-black text-foreground mt-1">{level.price}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                  <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border/30">
                    <p className="text-xs font-semibold text-accent">Mints {level.frequency}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
