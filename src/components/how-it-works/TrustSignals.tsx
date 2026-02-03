import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Eye, Building, Lock, Cpu, Scale } from 'lucide-react';

const signals = [
  {
    icon: Eye,
    title: 'Real Verification',
    description: 'Every reward ties to actual energy data from your device APIs—no fake numbers.',
  },
  {
    icon: Building,
    title: 'Real Business Model',
    description: 'Rewards come from subscription and marketplace revenue, not recruiting users.',
  },
  {
    icon: Lock,
    title: 'No Upfront Investment',
    description: 'Never pay to participate. Your energy is your investment.',
  },
  {
    icon: Scale,
    title: 'No Guaranteed Returns',
    description: 'Rewards match your energy activity—we never promise fixed payouts.',
  },
  {
    icon: Cpu,
    title: 'Patent Pending Tech',
    description: 'Our verification system is proprietary and legally protected.',
  },
  {
    icon: Shield,
    title: 'Your Data, Your Control',
    description: 'We only access energy data—never personal info or device controls.',
  },
];

export function TrustSignals() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Section Header */}
      <div className="text-center space-y-3">
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-foreground"
        >
          Built on Trust
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base"
        >
          We know there are shady reward programs out there. Here's why ZenSolar is different.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.08 }}
          >
            <Card className="h-full hover:border-secondary/40 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 group">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="p-2.5 rounded-xl bg-secondary/10 group-hover:bg-secondary/15 transition-colors"
                  >
                    <signal.icon className="h-5 w-5 text-secondary" />
                  </motion.div>
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
    </motion.section>
  );
}
