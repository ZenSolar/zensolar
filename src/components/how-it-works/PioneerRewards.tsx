import { motion } from 'framer-motion';
import { Award, Star, Gift } from 'lucide-react';

const tiers = [
  { name: 'Bronze', color: 'from-amber-700 to-amber-500', glow: 'shadow-amber-500/20' },
  { name: 'Silver', color: 'from-slate-400 to-slate-200', glow: 'shadow-slate-300/20' },
  { name: 'Gold', color: 'from-yellow-500 to-amber-300', glow: 'shadow-yellow-400/30' },
  { name: 'Platinum', color: 'from-cyan-300 to-white', glow: 'shadow-cyan-300/30' },
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
      <div className="container max-w-4xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Early Access</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Early Players Get Bonus Rewards
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Join during beta and earn Pioneer status — exclusive NFT badges, bonus tokens, and lifetime perks that reward you for being first.
          </p>
        </div>

        {/* Pioneer Badge Tiers */}
        <div className="flex items-center justify-center gap-6 md:gap-10">
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
                className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${tier.color} shadow-xl ${tier.glow} flex items-center justify-center`}
              >
                <Award className="h-8 w-8 md:h-10 md:w-10 text-background/80" />
              </motion.div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {tier.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Perks */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-accent" />
            <span>Exclusive NFT badges</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-accent" />
            <span>Bonus token rewards</span>
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
