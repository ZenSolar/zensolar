import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PlugZap, ShieldCheck, Coins } from 'lucide-react';

const steps = [
  {
    icon: PlugZap,
    step: '01',
    title: 'Connect Your Devices',
    description: 'Link your Tesla, Enphase, SolarEdge, or Wallbox account in seconds. We pull your real energy data securely via official APIs.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: ShieldCheck,
    step: '02',
    title: 'We Verify On-Chain',
    description: 'Our patent-pending Proof-of-Delta engine verifies every kWh produced, stored, or consumed — then creates an immutable proof on Base blockchain.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
  {
    icon: Coins,
    step: '03',
    title: 'Earn Rewards Automatically',
    description: '$ZSOLAR tokens and achievement NFTs are minted directly to your wallet. No claiming, no gas fees, no friction — just rewards for your clean energy lifestyle.',
    color: 'text-solar',
    bg: 'bg-solar/10',
    border: 'border-solar/20',
  },
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
            Three steps to start earning rewards for your clean energy usage.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
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
      </div>
    </section>
  );
}
