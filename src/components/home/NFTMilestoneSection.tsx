import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Sun, Battery, Zap, Car, Star } from 'lucide-react';

const categories = [
  {
    icon: Sun,
    name: 'Solar Production',
    example: '500 kWh → "Sunspark" NFT',
    tiers: '8 milestone NFTs',
    color: 'text-solar',
    bg: 'bg-solar/10',
  },
  {
    icon: Battery,
    name: 'Battery Discharge',
    example: '500 kWh → "First Reserve" NFT',
    tiers: '7 milestone NFTs',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: Zap,
    name: 'EV Charging',
    example: '100 kWh → "First Charge" NFT',
    tiers: '8 milestone NFTs',
    color: 'text-energy',
    bg: 'bg-energy/10',
  },
  {
    icon: Car,
    name: 'EV Miles Driven',
    example: '100 miles → "First Mile" NFT',
    tiers: '10 milestone NFTs',
    color: 'text-token',
    bg: 'bg-token/10',
  },
];

export function NFTMilestoneSection() {
  return (
    <section className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-token/40 bg-token/10 text-token font-medium mb-4">
              Achievement NFTs
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Earn NFTs as You Hit Milestones
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Every kWh you produce, every mile you drive, and every battery cycle counts toward unlocking unique achievement NFTs. 
            A 42-piece collection that grows with your clean energy journey.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border border-border/60 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className={`p-3 rounded-xl ${cat.bg} w-fit`}>
                    <cat.icon className={`h-6 w-6 ${cat.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.example}</p>
                  <span className={`text-xs font-medium ${cat.color}`}>{cat.tiers}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card className="border-token/20 bg-gradient-to-r from-token/5 via-card to-primary/5">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 rounded-xl bg-token/10">
                <Star className="h-8 w-8 text-token" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold text-foreground mb-1">Combo Achievements</h3>
                <p className="text-sm text-muted-foreground">
                  Earn NFTs across multiple categories to unlock special Combo achievements like <strong className="text-foreground">Duality</strong>, <strong className="text-foreground">Trifecta</strong>, and <strong className="text-foreground">ZenMaster</strong> — 
                  proving you're a true multi-device sustainability champion.
                </p>
              </div>
              <Trophy className="h-10 w-10 text-token/50 hidden sm:block flex-shrink-0" />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
