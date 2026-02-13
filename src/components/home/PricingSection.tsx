import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight, Sparkles, Crown, Zap } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'Track your clean energy data across all devices',
    icon: Zap,
    color: 'text-muted-foreground',
    borderColor: 'border-border/60',
    bg: 'from-card to-muted/10',
    cta: 'Get Started',
    ctaVariant: 'outline' as const,
    features: [
      { text: 'Connect Tesla, Enphase, SolarEdge, Wallbox', included: true },
      { text: 'Unified energy dashboard', included: true },
      { text: 'Real-time production tracking', included: true },
      { text: 'Cross-device analytics', included: true },
      { text: 'Mint $ZSOLAR tokens', included: false },
      { text: 'Mint achievement NFTs', included: false },
      { text: 'Daily auto-minting', included: false },
    ],
    earningNote: 'Data tracking only — no token rewards',
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/mo',
    description: 'Start minting tokens for your clean energy',
    icon: Sparkles,
    color: 'text-primary',
    borderColor: 'border-primary/40',
    bg: 'from-primary/5 via-card to-primary/5',
    cta: 'Start Earning',
    ctaVariant: 'default' as const,
    popular: true,
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Mint $ZSOLAR tokens on-demand', included: true },
      { text: 'Mint achievement NFTs', included: true },
      { text: 'On-chain verification proofs', included: true },
      { text: 'Gasless minting (we pay gas)', included: true },
      { text: 'Daily auto-minting (DCA)', included: false },
      { text: 'Priority support', included: false },
    ],
    earningNote: '~$4,000–$9,000/year projected',
  },
  {
    name: 'Elite',
    price: '$19.99',
    period: '/mo',
    description: 'Maximum rewards with daily auto-minting',
    icon: Crown,
    color: 'text-solar',
    borderColor: 'border-solar/40',
    bg: 'from-solar/5 via-card to-solar/5',
    cta: 'Go Elite',
    ctaVariant: 'default' as const,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Daily auto-minting (DCA your energy)', included: true },
      { text: 'Automatic token accumulation', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
      { text: 'Advanced analytics & insights', included: true },
      { text: 'Smooths market volatility', included: true },
    ],
    earningNote: '~$8,000–$19,875/year projected',
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-secondary/40 bg-secondary/10 text-secondary font-medium mb-4">
              Simple Pricing
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Pay a Little, Earn a Lot
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground max-w-xl mx-auto"
          >
            Free to track. Subscribe to mint. Your clean energy is already generating value — we just help you capture it.
          </motion.p>
        </div>

        {/* Earning rates callout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 text-center">
            {[
              { activity: '☀️ Solar', rate: '1 kWh = 1 $ZSOLAR' },
              { activity: '🔋 Battery', rate: '1 kWh = 1 $ZSOLAR' },
              { activity: '⚡ EV Charging', rate: '1 kWh = 1 $ZSOLAR' },
              { activity: '🚗 EV Driving', rate: '1 mile = 1 $ZSOLAR' },
            ].map((item) => (
              <div key={item.activity} className="px-4 py-2.5 rounded-full border border-primary/30 bg-primary/5">
                <span className="text-sm font-semibold text-foreground">{item.activity}</span>
                <span className="text-sm text-primary font-bold ml-2">{item.rate}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Pro & Elite subscribers earn rewards for every kWh and mile tracked.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative"
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/30 px-3">
                    Most Popular
                  </Badge>
                </div>
              )}
              <Card className={`h-full border ${tier.borderColor} bg-gradient-to-br ${tier.bg} ${tier.popular ? 'ring-2 ring-primary/30 shadow-lg shadow-primary/10' : ''} hover:shadow-lg transition-shadow`}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <tier.icon className={`h-5 w-5 ${tier.color}`} />
                    <h3 className={`text-lg font-bold ${tier.color}`}>{tier.name}</h3>
                  </div>

                  <div className="mb-3">
                    <span className="text-4xl font-bold text-foreground tracking-tight">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-5">{tier.description}</p>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {tier.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-2 text-sm">
                        {feature.included ? (
                          <Check className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/60'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Earning projection */}
                  <div className={`p-3 rounded-lg mb-4 text-center text-sm font-medium ${
                    tier.name === 'Free' 
                      ? 'bg-muted/50 text-muted-foreground' 
                      : 'bg-solar/10 text-solar border border-solar/20'
                  }`}>
                    {tier.earningNote}
                  </div>

                  <Link to="/auth" className="mt-auto">
                    <Button 
                      variant={tier.ctaVariant} 
                      className={`w-full ${tier.popular ? 'bg-primary hover:bg-primary/90 shadow-md' : ''} ${tier.name === 'Elite' ? 'bg-gradient-to-r from-solar to-accent text-accent-foreground hover:opacity-90' : ''}`}
                    >
                      {tier.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ROI note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto"
        >
          💡 Even at our Pro tier ($9.99/mo = $120/year), projected annual earnings of $4,000+ represent a <span className="text-primary font-semibold">33x return</span> on your subscription. Your solar system is already generating the energy — we just turn it into money.
        </motion.p>
      </div>
    </section>
  );
}
