import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, Flame, TrendingUp, Shield, PieChart, Wallet } from 'lucide-react';

const tokenFeatures = [
  {
    icon: Coins,
    title: '10B Total Supply',
    description: 'Fixed supply creates scarcity as adoption grows. No inflation, no surprise mints.',
    color: 'text-token',
  },
  {
    icon: Flame,
    title: '20% Mint Burn',
    description: 'Every mint automatically burns 20%, creating deflationary pressure from day one.',
    color: 'text-destructive',
  },
  {
    icon: TrendingUp,
    title: 'Price Floor Mechanism',
    description: 'Liquidity pool design ensures a minimum token value backed by real energy data.',
    color: 'text-secondary',
  },
  {
    icon: Shield,
    title: 'Patent-Pending Proof',
    description: 'Proof-of-Delta ensures every token is backed by verified, real-world energy production.',
    color: 'text-primary',
  },
  {
    icon: PieChart,
    title: '20% Treasury',
    description: '2B tokens reserved for ecosystem growth, partnerships, and market stabilization.',
    color: 'text-solar',
  },
  {
    icon: Wallet,
    title: 'Gasless Minting',
    description: 'Users never pay gas fees. We cover transaction costs so you keep 100% of your rewards.',
    color: 'text-energy',
  },
];

export function TokenomicsOverview() {
  return (
    <section id="tokenomics" className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-token/40 bg-token/10 text-token font-medium mb-4">
              $ZSOLAR Tokenomics
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Built for Long-Term Value
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-xl mx-auto"
          >
            A deflationary token economy backed by real-world clean energy production.
          </motion.p>
        </div>

        {/* Live Beta Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8"
        >
          <Card className="border-solar/30 bg-gradient-to-r from-solar/5 via-transparent to-primary/5">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="p-3 rounded-xl bg-solar/10 shrink-0">
                <Flame className="h-8 w-8 text-solar" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Live Beta: 10x Reward Multiplier</h3>
                <p className="text-sm text-muted-foreground">
                  Early beta users earn <span className="text-primary font-semibold">1 $ZSOLAR per kWh</span> — 10x the projected mainnet rate of 0.1 $ZSOLAR/kWh. Join now to maximize your rewards before mainnet launch.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tokenFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-border/60 hover:border-primary/30 hover:shadow-md transition-all">
                <CardContent className="p-5 flex gap-4">
                  <feature.icon className={`h-6 w-6 ${feature.color} shrink-0 mt-0.5`} />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
