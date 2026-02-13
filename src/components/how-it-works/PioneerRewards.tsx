import { motion } from 'framer-motion';
import { Award, Sun, BatteryFull, Car, Zap, Crown, Sparkles, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const nftCategories = [
  {
    icon: Sun,
    name: 'Solar Production',
    count: 8,
    range: '500 – 100,000 kWh',
    examples: ['Sunspark (500 kWh)', 'Helios (10K kWh)', 'Starforge (100K kWh)'],
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    icon: BatteryFull,
    name: 'Battery Storage Exported',
    count: 7,
    range: '500 – 50,000 kWh',
    examples: ['Voltbank (500 kWh)', 'Dynamax (10K kWh)', 'Gigavolt (50K kWh)'],
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    icon: Zap,
    name: 'EV Charging',
    count: 8,
    range: '100 – 25,000 kWh',
    examples: ['Ignite (100 kWh)', 'Chargeon (2.5K kWh)', 'Teracharge (25K kWh)'],
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  {
    icon: Car,
    name: 'EV Miles Driven',
    count: 10,
    range: '100 – 200,000 miles',
    examples: ['Ignitor (100 mi)', 'Electra (10K mi)', 'Odyssey (200K mi)'],
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
];

const comboHighlights = [
  { name: 'Duality', desc: 'Earn NFTs in 2 categories' },
  { name: 'Trifecta', desc: 'Earn NFTs in 3 categories' },
  { name: 'ZenMaster', desc: 'Max out any category' },
  { name: 'Total Eclipse', desc: 'Max out all 4 categories' },
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
        {/* Header */}
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">NFT Collection</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            42 NFTs. Real Milestones. Your Proof.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every NFT is tied to a real energy milestone — kWh generated, miles driven, batteries discharged. 
            Each milestone represents a permanent, irreversible claim on verified clean energy activity. Once you 
            hit the threshold, that achievement is yours forever — cryptographically proven and minted on-chain. 
            We cover all gas fees.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {nftCategories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card className={`h-full border ${cat.border} hover:shadow-lg transition-shadow`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center`}>
                        <cat.icon className={`h-5 w-5 ${cat.color}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{cat.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{cat.range}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-bold">
                      {cat.count} NFTs
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.examples.map((ex) => (
                      <span key={ex} className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/30">
                        {ex}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Combo NFTs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4"
        >
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent mb-2">Bonus</p>
            <h3 className="text-xl font-bold text-foreground">Combo NFTs</h3>
            <p className="text-sm text-muted-foreground mt-1">
              8 special NFTs awarded for cross-category achievements
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {comboHighlights.map((combo, i) => (
              <motion.div
                key={combo.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="text-center p-3 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/15"
              >
                <p className="text-sm font-bold text-foreground">{combo.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{combo.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Welcome NFT + Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Welcome NFT on signup</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <span>ERC-1155 on Base L2</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-secondary" />
            <span>Gas fees covered by ZenSolar</span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
