import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Hexagon, ShieldCheck, Hash, Clock } from 'lucide-react';

export function MintOneToOneStrip() {
  return (
    <section className="py-16 md:py-24 bg-muted/10">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary uppercase tracking-wider text-xs">
              The Mint
            </Badge>
            <div className="space-y-3">
              <p className="text-base text-muted-foreground">What you see is what you mint:</p>
              <div className="text-[clamp(2.75rem,8vw,5rem)] font-bold leading-none">
                1&nbsp;kWh{' '}
                <span className="text-muted-foreground">=</span>{' '}
                <span className="bg-gradient-to-r from-primary via-secondary to-energy bg-clip-text text-transparent">
                  1&nbsp;$ZSOLAR
                </span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              The protocol matches your mint 1-for-1 in the background — funding liquidity, burn,
              and treasury. Think of it as a <span className="text-foreground font-medium">401(k) match</span> for clean energy: you always
              see your full share, and the network gets stronger with every kWh.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full text-xs bg-muted/50 border border-border/60">50% you</span>
              <span className="px-3 py-1 rounded-full text-xs bg-muted/50 border border-border/60">25% LP direct</span>
              <span className="px-3 py-1 rounded-full text-xs bg-muted/50 border border-border/60">20% burn</span>
              <span className="px-3 py-1 rounded-full text-xs bg-muted/50 border border-border/60">5% treasury</span>
              <span className="px-3 py-1 rounded-full text-xs bg-primary/10 border border-primary/30 text-primary">+ 3% transfer tax → LP</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative rounded-2xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-7 shadow-2xl shadow-primary/10 overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Hexagon className="h-5 w-5 text-primary" />
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Proof-of-Genesis™ Receipt</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-energy/15 text-energy border border-energy/30">Verified</span>
              </div>

              <div className="space-y-1 mb-5">
                <div className="text-xs text-muted-foreground">You minted</div>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  12.4 $ZSOLAR
                </div>
                <div className="text-xs text-muted-foreground">from 12.4 verified kWh · ~8.1 kg CO₂ avoided</div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                  <ShieldCheck className="h-4 w-4 text-primary mx-auto mb-1" />
                  <div className="font-semibold">Tesla</div>
                  <div className="text-muted-foreground">Source</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                  <Hash className="h-4 w-4 text-secondary mx-auto mb-1" />
                  <div className="font-semibold truncate">0xA1b…f7</div>
                  <div className="text-muted-foreground">Anchor</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/40">
                  <Clock className="h-4 w-4 text-energy mx-auto mb-1" />
                  <div className="font-semibold">Base L2</div>
                  <div className="text-muted-foreground">Network</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
