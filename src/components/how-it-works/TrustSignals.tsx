import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Eye, Building, Lock, Cpu, Scale } from 'lucide-react';

const signals = [
  {
    icon: Eye,
    title: 'Real Verification',
    description: 'Every reward is tied to actual energy data from your device APIs—no fake numbers or inflated stats.',
  },
  {
    icon: Building,
    title: 'Real Business Model',
    description: 'Rewards come from subscription and marketplace revenue, not from recruiting new users.',
  },
  {
    icon: Lock,
    title: 'No Upfront Investment',
    description: 'Never pay to participate. Your energy is your investment.',
  },
  {
    icon: Scale,
    title: 'No Guaranteed Returns',
    description: 'Rewards are proportional to your energy activity—we never promise fixed payouts.',
  },
  {
    icon: Cpu,
    title: 'Patent Pending Tech',
    description: 'Our verification system is proprietary and legally protected.',
  },
  {
    icon: Shield,
    title: 'Your Data, Your Control',
    description: 'We only access energy production data—never personal info or device controls.',
  },
];

export function TrustSignals() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Built on Trust</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          We know there are a lot of shady reward programs out there. Here's why ZenSolar is different.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Card className="h-full hover:border-emerald-500/30 transition-colors group">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                    <signal.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-foreground">{signal.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {signal.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
