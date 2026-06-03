import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingDown, RefreshCcw, ArrowRight, DollarSign, ShieldOff, Repeat } from 'lucide-react';

export function WhyZenSolarSection() {
  return (
    <section id="why-zensolar" className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-5xl mx-auto px-5">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-secondary/90 mb-4">The Problem</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-semibold tracking-tight leading-[1.1] mb-3"
          >
            $40 Billion in Clean Energy Incentives:{' '}
            <span className="text-destructive">Gone.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground max-w-2xl mx-auto text-lg"
          >
            The 30% Solar ITC and $7,500 EV tax credits are being repealed. Millions of homeowners and EV drivers are losing the financial motivation to go green, or stay green.
          </motion.p>
        </div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-12">
          {[
            { icon: ShieldOff, title: 'Tax Credits Disappearing', desc: 'Federal incentives that drove solar and EV adoption are being eliminated, removing the #1 financial motivation for clean energy.' },
            { icon: TrendingDown, title: 'Adoption Slowing', desc: 'Without financial incentives, new solar installations and EV purchases are projected to decline significantly.' },
            { icon: AlertTriangle, title: 'Existing Users Ignored', desc: 'Government credits were one-time. After install, your solar system sits there generating value — but nobody rewards you for it.' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-destructive/20 bg-gradient-to-br from-destructive/5 to-card">
                <CardContent className="p-5 flex gap-4">
                  <item.icon className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* The solution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-secondary/5 overflow-hidden">
            <CardContent className="p-8 md:p-10">
              <div className="text-center mb-8">
                <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-secondary/90 mb-4">The Solution</span>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                  ZenSolar Replaces Government Incentives with{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Permanent, Market-Backed Rewards
                  </span>
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Unlike one-time tax credits, ZenSolar continuously rewards you for every kWh you produce, store, and consume. Automatically, every single day.
                </p>
              </div>

              {/* Comparison */}
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div className="p-5 rounded-xl border border-destructive/20 bg-destructive/5">
                  <h4 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                    <ShieldOff className="h-5 w-5" />
                    Government Credits
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✗</span> One-time payment at installation</li>
                    <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✗</span> Subject to political changes</li>
                    <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✗</span> No ongoing motivation to maximize usage</li>
                    <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✗</span> Being repealed in 2025-2026</li>
                  </ul>
                </div>
                <div className="p-5 rounded-xl border border-primary/30 bg-primary/5">
                  <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <Repeat className="h-5 w-5" />
                    ZenSolar Rewards
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Continuous daily rewards, every kWh</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Backed by market economics, not politics</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Compounds — the more you use, the more you earn</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> Verified by patent-pending decentralized tech</li>
                  </ul>
                </div>
              </div>

              {/* Earning projection */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-8 p-6 rounded-xl border border-solar/30 bg-gradient-to-r from-solar/10 via-transparent to-solar/10 text-center"
              >
                <DollarSign className="h-8 w-8 text-solar mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-1">Projected annual earnings for a typical Solar + Battery + EV household</p>
                <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                  $8,000 – $19,875
                  <span className="text-lg text-muted-foreground font-normal">/year</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on average US solar production, battery cycling, and EV usage at a projected $1.00 token target price
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
