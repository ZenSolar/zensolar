import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, CreditCard, Zap, Battery, Shirt } from 'lucide-react';

const redemptionItems = [
  {
    icon: Zap,
    title: 'Tesla Gift Cards & Gear',
    description: 'Redeem for Tesla gift cards, Mobile Connectors, Wall Connectors, and Supercharging credits.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Battery,
    title: 'Portable Power Stations',
    description: 'Shop Anker, EcoFlow, and Bluetti portable power stations and solar generators.',
    color: 'text-solar',
    bg: 'bg-solar/10',
  },
  {
    icon: Shirt,
    title: 'ZenSolar Merch',
    description: 'Rep the movement — exclusive ZenSolar apparel, accessories, and limited drops.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: CreditCard,
    title: 'Cash Out Anytime',
    description: 'Your tokens, your choice. Cash out your $ZSOLAR balance whenever you\'re ready.',
    color: 'text-token',
    bg: 'bg-token/10',
  },
];

export function StoreRedemptionSection() {
  return (
    <section className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-solar/40 bg-solar/10 text-solar font-medium mb-4">
              $ZSOLAR Store
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Spend Your Rewards on Real Products
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Your $ZSOLAR tokens aren't just numbers on a screen — redeem them for Tesla gift cards, 
            Anker & EcoFlow power stations, ZenSolar merch, and much more.
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {redemptionItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border border-border/60 bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-shadow">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className={`p-3 rounded-xl ${item.bg} w-fit`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
