import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PlugZap, ShieldCheck, Coins, Wallet, Sun, BatteryFull, Car, Zap } from 'lucide-react';

const steps = [
  {
    icon: PlugZap,
    step: '01',
    title: 'Connect Your Devices',
    description: 'Link your Tesla, Enphase, SolarEdge, or Wallbox account in seconds. We pull your real energy data securely via official APIs — no extra hardware needed.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: ShieldCheck,
    step: '02',
    title: 'We Verify Every kWh On-Chain',
    description: 'Our patent-pending Proof-of-Delta™ engine verifies every kWh produced, stored, or consumed — then creates an immutable cryptographic proof on Base blockchain.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
  {
    icon: Coins,
    step: '03',
    title: 'Earn $ZSOLAR Automatically',
    description: 'Tokens and achievement NFTs are minted directly to your wallet — no manual claiming, no gas fees, no friction. Pro and Elite subscribers earn real rewards every day.',
    color: 'text-solar',
    bg: 'bg-solar/10',
    border: 'border-solar/20',
  },
  {
    icon: Wallet,
    step: '04',
    title: 'Your Built-In ZenSolar Wallet',
    description: 'Your $ZSOLAR tokens and NFTs are held securely in your embedded ZenSolar wallet — no external wallets or browser extensions needed. Cash out whenever you\'re ready.',
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

        {/* Earning rates — Web3 style */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 relative"
        >
          {/* Outer glow container */}
          <div className="relative rounded-3xl border border-primary/20 overflow-hidden">
            {/* Animated ambient border glow */}
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-primary/20 via-solar/20 to-token/20 opacity-60 blur-sm pointer-events-none" />
            
            <div className="relative rounded-3xl bg-gradient-to-br from-background/95 via-card/90 to-background/95 p-6 md:p-8">
              {/* Ambient glow spots */}
              <div className="absolute top-0 left-1/4 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-token/10 rounded-full blur-[80px] pointer-events-none" />
              
              {/* Shimmer sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-12 pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
              />

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-token/30 bg-token/10 mb-4"
                  >
                    <Coins className="h-3.5 w-3.5 text-token" />
                    <span className="text-xs font-semibold text-token tracking-wide">REWARD RATES</span>
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                    Your Energy, Your{' '}
                    <span className="bg-gradient-to-r from-primary via-solar to-token bg-clip-text text-transparent">
                      Earnings
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {earningRates.map((rate, i) => (
                    <motion.div
                      key={rate.activity}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.35 + i * 0.08 }}
                      className="group relative"
                    >
                      <div className="relative rounded-2xl border border-border/30 bg-background/60 backdrop-blur-sm p-5 text-center hover:border-primary/40 transition-all duration-500 hover:shadow-lg hover:shadow-primary/10 overflow-hidden">
                        {/* Hover glow */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b ${
                          i === 0 ? 'from-solar/10' : i === 1 ? 'from-secondary/10' : i === 2 ? 'from-energy/10' : 'from-token/10'
                        } to-transparent pointer-events-none`} />
                        
                        <div className="relative z-10">
                          <motion.div
                            className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                              i === 0 ? 'bg-solar/15' : i === 1 ? 'bg-secondary/15' : i === 2 ? 'bg-energy/15' : 'bg-token/15'
                            }`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                          >
                            <rate.icon className={`h-6 w-6 ${rate.color}`} />
                          </motion.div>
                          <p className="text-xs text-muted-foreground mb-2 font-medium">{rate.activity}</p>
                          <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-solar bg-clip-text text-transparent">
                            {rate.rate}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="text-center text-xs text-muted-foreground/70 mt-5"
                >
                  Pro & Elite subscribers earn these rates · Free tier tracks data only
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
