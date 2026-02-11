import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

const integrations = [
  { name: 'Tesla', icon: '⚡', desc: 'Solar, Powerwall & EV' },
  { name: 'Enphase', icon: '☀️', desc: 'Solar Monitoring' },
  { name: 'SolarEdge', icon: '🔆', desc: 'Solar Inverters' },
  { name: 'Wallbox', icon: '🔌', desc: 'EV Charging' },
  { name: 'Base', icon: '🔵', desc: 'L2 Blockchain' },
  { name: 'Coinbase', icon: '💰', desc: 'Smart Wallet' },
];

export function IntegrationLogos() {
  return (
    <section id="integrations" className="py-[clamp(3rem,8vw,5rem)]">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-secondary/40 bg-secondary/10 text-secondary font-medium mb-4">
              Ecosystem
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Powered By Industry Leaders
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground max-w-lg mx-auto"
          >
            We integrate with the platforms you already use — no new hardware needed.
          </motion.p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {integrations.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center gap-2 p-5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:shadow-md hover:border-primary/30 transition-all cursor-default"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-sm font-semibold text-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground text-center">{item.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
