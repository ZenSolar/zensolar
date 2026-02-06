import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, Shield, TrendingUp, ArrowRight } from 'lucide-react';

const benefits = [
  {
    icon: Coins,
    title: '$400-$1,000/Month',
    description: 'Transform your clean energy into meaningful passive income',
  },
  {
    icon: Shield,
    title: 'Hardware Agnostic',
    description: 'Works with Tesla, Enphase, SolarEdge, Wallbox & more',
  },
  {
    icon: TrendingUp,
    title: '10x Growth Potential',
    description: '$0.10 launch floor with clear path to $1.00+',
  },
];

export function BenefitsSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
          >
            <div>
              <Badge variant="outline" className="mb-4 border-secondary/40 bg-secondary/10 text-secondary">
                Why ZenSolar?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                Beyond Tax Credits—
                <br />
                <span className="text-primary">Perpetual Rewards</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Federal incentives are one-time and bureaucratic. $ZSOLAR rewards are ongoing,
                automatic, and grow as the token appreciates.
              </p>
            </div>

            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: index * 0.08, duration: 0.4 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-muted/40 border border-border/40 hover:border-primary/30 hover:bg-muted/60 transition-all duration-200"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right column - Earnings card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
          >
            <Card className="relative bg-gradient-to-br from-card via-card to-muted/60 border-border/50 shadow-2xl dark:shadow-primary/10 dark:border-primary/20 overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25">
                    <Coins className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Average Monthly Earnings</p>
                    <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-secondary to-energy bg-clip-text text-transparent">
                      $800
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">at $1.00 token price</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/60">
                    <div>
                      <p className="text-2xl font-bold text-primary">10x</p>
                      <p className="text-xs text-muted-foreground">Growth potential</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary">$0.10</p>
                      <p className="text-xs text-muted-foreground">Launch price</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function CTASection() {
  return (
    <section className="py-16 md:py-20 bg-muted/30 dark:bg-muted/10">
      <div className="container max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Monetize Your{' '}
            <span className="text-primary">Clean Energy?</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Join the ZenSolar community and start earning blockchain rewards for the sustainable
            lifestyle you're already living.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:scale-[1.02]">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/white-paper">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                Read White Paper
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
