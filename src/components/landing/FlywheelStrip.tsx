import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Zap, Database, Brain, Coins, ArrowRight } from 'lucide-react';

const nodes = [
  { icon: Zap, label: 'Verified kWh', proof: 'OEM-signed telemetry', color: 'text-solar', ring: 'ring-solar/30 bg-solar/10' },
  { icon: Database, label: 'Data', proof: 'Anonymized energy feed', color: 'text-energy', ring: 'ring-energy/30 bg-energy/10' },
  { icon: Brain, label: 'AI', proof: 'Deason optimizer', color: 'text-secondary', ring: 'ring-secondary/30 bg-secondary/10' },
  { icon: Coins, label: '$ZSOLAR', proof: 'Tap-to-Mint™', color: 'text-primary', ring: 'ring-primary/30 bg-primary/10' },
];

export function FlywheelStrip() {
  return (
    <section className="py-16 md:py-24 bg-muted/10">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14 space-y-4">
          <Badge variant="outline" className="border-energy/40 bg-energy/10 text-energy uppercase tracking-wider text-xs">
            The Flywheel
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Verified kWh becomes value — automatically.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Every loop deepens liquidity and lowers $/kWh for the next user.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-2">
          {nodes.map((node, i) => (
            <div key={node.label} className="flex md:flex-1 flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-2">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex-1 w-full md:w-auto p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-sm text-center hover:border-primary/40 transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ring-1 ${node.ring} mb-3`}>
                  <node.icon className={`h-6 w-6 ${node.color}`} />
                </div>
                <div className="font-bold text-base md:text-lg">{node.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{node.proof}</div>
              </motion.div>
              {i < nodes.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
                  className="flex items-center justify-center"
                  aria-hidden
                >
                  <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 md:rotate-0" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
