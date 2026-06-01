import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Coins, Database } from 'lucide-react';

const engines = [
  {
    icon: CreditCard,
    eyebrow: 'Engine 01',
    title: 'Subscription + Deason AI',
    body: 'Three tiers — $9.99 / $19.99 / $49.99 per month — plus the optional $4.99 Deason AI add-on that automates household energy optimization.',
    accent: 'from-primary/20 to-secondary/10 border-primary/30',
    iconColor: 'text-primary',
  },
  {
    icon: Coins,
    eyebrow: 'Engine 02',
    title: 'Token Economics',
    body: '1T hard cap. Every mint splits 50% you · 25% LP · 20% burn · 5% treasury. A separate 3% transfer tax recycles to liquidity on every swap. Launch at $0.10 via LP-seeded rounds on Base.',
    accent: 'from-energy/20 to-solar/10 border-energy/30',
    iconColor: 'text-energy',
  },
  {
    icon: Database,
    eyebrow: 'Engine 03',
    title: 'Aggregated Energy Data',
    body: 'Anonymized, verified-kWh telemetry sold to utilities, REC markets, and researchers — the only dataset that spans Tesla, Enphase, SolarEdge, and Wallbox in one feed.',
    accent: 'from-secondary/20 to-primary/10 border-secondary/30',
    iconColor: 'text-secondary',
  },
];

export function ThreeEnginesLanding() {
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14 space-y-4">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary uppercase tracking-wider text-xs">
            Three Revenue Engines
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            One protocol. Three reinforcing engines.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {engines.map((engine, i) => (
            <motion.div
              key={engine.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Card className={`h-full bg-gradient-to-br ${engine.accent} backdrop-blur-sm border shadow-xl shadow-primary/5 hover:shadow-primary/20 transition-shadow`}>
                <CardContent className="p-6 md:p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-background/40 ring-1 ring-border/60">
                      <engine.icon className={`h-5 w-5 ${engine.iconColor}`} />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{engine.eyebrow}</span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight">{engine.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{engine.body}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
