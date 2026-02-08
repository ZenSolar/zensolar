import { motion } from 'framer-motion';
import { Award, Star, Gift, Trophy, Zap, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const tiers = [
  { name: 'Bronze', threshold: '100 kWh', color: 'from-amber-700 to-amber-500', glow: 'shadow-amber-500/20' },
  { name: 'Silver', threshold: '500 kWh', color: 'from-slate-400 to-slate-200', glow: 'shadow-slate-300/20' },
  { name: 'Gold', threshold: '2,500 kWh', color: 'from-yellow-500 to-amber-300', glow: 'shadow-yellow-400/30' },
  { name: 'Platinum', threshold: '10,000 kWh', color: 'from-cyan-300 to-white', glow: 'shadow-cyan-300/30' },
];

const milestones = [
  { icon: Zap, title: 'First Mint', description: 'Mint your first batch of $ZSOLAR tokens', reward: 'Starter NFT Badge' },
  { icon: Target, title: '30-Day Streak', description: 'Generate energy for 30 consecutive days', reward: 'Consistency NFT + 50 bonus $ZSOLAR' },
  { icon: Trophy, title: '1,000 kWh Club', description: 'Reach 1,000 kWh total verified production', reward: 'Silver Pioneer NFT' },
];

export function PioneerRewards() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-24"
    >
      <div className="container max-w-5xl mx-auto px-4 space-y-14">
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Collect & Earn</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            NFT Milestones & Pioneer Rewards
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Hit energy milestones to unlock exclusive NFT badges. Each badge is a permanent, tradeable proof of your clean energy impact — plus bonus token rewards.
          </p>
        </div>

        {/* Pioneer Badge Tiers */}
        <div>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">Pioneer Badge Tiers</p>
          <div className="flex items-center justify-center gap-5 md:gap-8">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-14 h-14 md:w-18 md:h-18 rounded-2xl bg-gradient-to-br ${tier.color} shadow-xl ${tier.glow} flex items-center justify-center`}
                >
                  <Award className="h-7 w-7 md:h-9 md:w-9 text-background/80" />
                </motion.div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {tier.name}
                </span>
                <span className="text-[10px] text-muted-foreground">{tier.threshold}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* NFT Milestone Examples */}
        <div>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-6">Milestone NFTs</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {milestones.map((m, i) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="h-full border border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 space-y-3 text-center">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                      <m.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{m.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
                    <div className="px-2 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                      <p className="text-[10px] font-semibold text-accent">{m.reward}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Perks summary */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            <span>Tradeable on-chain NFTs</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-accent" />
            <span>Bonus token rewards at each tier</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-accent" />
            <span>Lifetime pioneer perks</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
