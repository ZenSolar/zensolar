import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PlugZap, ShieldCheck, Coins, Wallet, Sun, BatteryFull, Car, Zap } from 'lucide-react';

const steps = [
  {
    icon: PlugZap,
    step: '01',
    title: 'Connect Your Devices',
    description: 'Link your Tesla, Enphase, SolarEdge, or Wallbox account in seconds. We pull your real energy data securely via official APIs. No extra hardware needed.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: ShieldCheck,
    step: '02',
    title: 'We Verify Every kWh On-Chain',
    description: 'Our patent-pending Proof-of-Delta™ engine verifies every kWh produced, stored, or consumed and creates an immutable cryptographic proof on Base blockchain.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
  {
    icon: Coins,
    step: '03',
    title: 'Earn $ZSOLAR Automatically',
    description: 'Tokens and achievement NFTs are minted directly to your wallet. No manual claiming, no gas fees, no friction. Pro and Elite subscribers earn real rewards every day.',
    color: 'text-solar',
    bg: 'bg-solar/10',
    border: 'border-solar/20',
  },
  {
    icon: Wallet,
    step: '04',
    title: 'Your Built-In ZenSolar Wallet',
    description: 'Your $ZSOLAR tokens and NFTs are held securely in your embedded ZenSolar wallet. No external wallets or browser extensions needed. Cash out whenever you\'re ready.',
    color: 'text-token',
    bg: 'bg-token/10',
    border: 'border-token/20',
  },
];

const earningRates = [
  { icon: Sun, activity: 'Solar Production', rate: '1 kWh = 1 $ZSOLAR', color: 'text-solar' },
  { icon: BatteryFull, activity: 'Battery Storage Exported', rate: '1 kWh = 1 $ZSOLAR', color: 'text-secondary' },
  { icon: Zap, activity: 'EV Charging', rate: '1 kWh = 1 $ZSOLAR', color: 'text-energy' },
  { icon: Car, activity: 'EV Miles Driven', rate: '1 mile = 1 $ZSOLAR', color: 'text-token' },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-primary/40 bg-primary/10 text-primary font-medium mb-4">
              Simple & Automated
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            How ZenSolar Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-xl mx-auto"
          >
            Four steps to start earning rewards for your clean energy usage.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className={`h-full border ${step.border} bg-gradient-to-br from-card to-muted/20 hover:shadow-lg transition-shadow`}>
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${step.bg}`}>
                      <step.icon className={`h-6 w-6 ${step.color}`} />
                    </div>
                    <span className={`text-sm font-bold ${step.color} tracking-wider`}>{step.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Earning rates */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-solar/30 bg-solar/10 mb-3">
                <Coins className="h-3.5 w-3.5 text-solar" />
                <span className="text-xs font-semibold text-solar tracking-wide">REWARD RATES</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Your Energy, Your{' '}
                <span className="bg-gradient-to-r from-secondary via-primary to-solar bg-clip-text text-transparent">
                  Earnings
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {earningRates.map((rate, i) => (
                <motion.div
                  key={rate.activity}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                >
                  <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-center hover:border-primary/30 transition-colors">
                    <div className={`mx-auto w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                      i === 0 ? 'bg-solar/15' : i === 1 ? 'bg-secondary/15' : i === 2 ? 'bg-energy/15' : 'bg-primary/15'
                    }`}>
                      <rate.icon className={`h-5 w-5 ${i === 3 ? 'text-primary' : rate.color}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1 font-medium">{rate.activity}</p>
                    <p className="text-base md:text-lg font-bold text-foreground">
                      {rate.rate}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground/70 mt-4">
              Pro & Elite subscribers earn these rates · Free tier tracks data only
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
