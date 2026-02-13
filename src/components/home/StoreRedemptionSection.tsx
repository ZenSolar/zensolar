import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Gift, Zap, Battery, Shirt, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const featuredItems = [
  {
    icon: Zap,
    title: 'Tesla',
    items: ['Gift Cards', 'Wall Connectors', 'Mobile Connectors', 'Supercharging Credits'],
    accent: 'from-red-500/20 to-red-900/10',
    iconColor: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
  {
    icon: Battery,
    title: 'Power Stations',
    items: ['Anker SOLIX', 'EcoFlow DELTA', 'Bluetti AC200', 'Solar Generators'],
    accent: 'from-emerald-500/20 to-emerald-900/10',
    iconColor: 'text-primary',
    borderColor: 'border-primary/30',
  },
  {
    icon: Shirt,
    title: 'ZenSolar Merch',
    items: ['Exclusive Apparel', 'Accessories', 'Limited Drops', 'Collector Items'],
    accent: 'from-violet-500/20 to-violet-900/10',
    iconColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
  },
];

export function StoreRedemptionSection() {
  return (
    <section className="py-[clamp(3rem,8vw,6rem)] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-solar/40 bg-solar/10 text-solar font-medium mb-4">
              <ShoppingBag className="h-3 w-3 mr-1.5" />
              $ZSOLAR Store
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Spend Your Tokens on{' '}
            <span className="bg-gradient-to-r from-primary via-solar to-primary bg-clip-text text-transparent">
              Real Products
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto text-base"
          >
            Your $ZSOLAR tokens aren't just numbers on a screen — redeem them for Tesla gear, 
            portable power stations, exclusive merch, or cash out anytime.
          </motion.p>
        </div>

        {/* Featured product categories */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {featuredItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className={`group relative rounded-2xl border ${item.borderColor} bg-gradient-to-br ${item.accent} backdrop-blur-sm p-6 hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-background/60 border border-border/40">
                  <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
              </div>
              <ul className="space-y-2.5">
                {item.items.map((product) => (
                  <li key={product} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`h-1 w-1 rounded-full ${item.iconColor} bg-current shrink-0`} />
                    {product}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Cash out CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-solar/20 bg-gradient-to-r from-solar/10 via-solar/5 to-transparent p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-solar/15">
              <Gift className="h-5 w-5 text-solar" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Or Cash Out Anytime</p>
              <p className="text-sm text-muted-foreground">Your tokens, your choice — withdraw your $ZSOLAR balance whenever you're ready.</p>
            </div>
          </div>
          <Button variant="outline" className="border-solar/30 text-solar hover:bg-solar/10 shrink-0 group">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Learn More
            <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
