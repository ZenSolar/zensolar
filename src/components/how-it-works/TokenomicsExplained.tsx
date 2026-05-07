import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, Coins, TrendingUp, Lock, Hourglass, Shield } from 'lucide-react';

const blocks = [
  {
    icon: Sun,
    title: 'You earn tokens for clean energy',
    body:
      'Every kilowatt-hour you produce with solar — or use to charge your EV — earns you $ZSOLAR tokens. During beta you earn 1 token per kWh; at mainnet that settles to 0.1 per kWh, so early users earn 10× more.',
    color: 'text-solar',
    bg: 'bg-solar/10',
    border: 'border-solar/20',
  },
  {
    icon: Coins,
    title: 'Pick a plan that fits',
    body:
      'Three simple tiers — Base, Regular, and Power — unlock how much you can earn each month. Choose the one that matches your system and upgrade anytime.',
    color: 'text-token',
    bg: 'bg-token/10',
    border: 'border-token/20',
  },
  {
    icon: TrendingUp,
    title: 'Half of every dollar strengthens the token',
    body:
      '50% of every subscription dollar flows automatically into the token’s liquidity pool. The other 50% funds the team. Think of it like the company buying back its own stock every month — but built right into the protocol.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
  {
    icon: Lock,
    title: 'Your tokens are locked for 12 months',
    body:
      'New tokens you earn vest over 12 months. This stops short-term selling and gives the price room to grow stronger. Want bigger rewards? Lock (stake) your tokens for longer and earn extra on top.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: Hourglass,
    title: 'Genesis Halving — rewards get rarer over time',
    body:
      'Just like Bitcoin, the rate at which $ZSOLAR is minted gets cut in half on a schedule. Early users earn the most, and scarcity grows year after year.',
    color: 'text-energy',
    bg: 'bg-energy/10',
    border: 'border-energy/20',
  },
  {
    icon: Shield,
    title: 'Built-in safety net (Satoshi-Mirror floor)',
    body:
      'A protocol-level floor defends the price from crashes by stepping in to buy when the market dips too far. You never have to think about it — it runs automatically in the background.',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
];

export function TokenomicsExplained() {
  return (
    <section id="tokenomics-explained" className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <Badge variant="outline" className="px-3 py-1 border-primary/40 bg-primary/10 text-primary font-medium mb-4">
            Tokenomics, in plain English
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Why holding $ZSOLAR matters
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            No crypto experience needed. Here’s the whole system in 6 simple ideas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {blocks.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className={`h-full border ${b.border} bg-card/70 backdrop-blur-sm`}>
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${b.bg}`}>
                      <b.icon className={`h-5 w-5 ${b.color}`} />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">{b.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
