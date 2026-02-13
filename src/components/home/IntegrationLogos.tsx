import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.svg';
import wallboxLogo from '@/assets/logos/wallbox-icon.svg';
import baseLogo from '@/assets/logos/base-logo.svg';
import coinbaseLogo from '@/assets/logos/coinbase-logo.svg';

const integrations = [
  { name: 'Tesla', logo: teslaLogo, desc: 'Solar, Powerwall & EV', invert: true },
  { name: 'Enphase', logo: enphaseLogo, desc: 'Solar Monitoring', invert: false },
  { name: 'SolarEdge', logo: solaredgeLogo, desc: 'Solar Inverters', invert: true },
  { name: 'Wallbox', logo: wallboxLogo, desc: 'EV Charging', invert: true },
  { name: 'Base', logo: baseLogo, desc: 'L2 Blockchain', invert: true },
  { name: 'Coinbase', logo: coinbaseLogo, desc: 'Smart Wallet', invert: true },
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
            Who We're Connected With
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
              className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:shadow-md hover:border-primary/30 transition-all cursor-default min-h-[120px]"
            >
              <img
                src={item.logo}
                alt={`${item.name} logo`}
                className={`h-10 w-auto max-w-[100px] object-contain ${item.invert ? 'dark:invert dark:brightness-200' : ''}`}
                loading="lazy"
              />
              <div className="text-center">
                <span className="text-sm font-semibold text-foreground block">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
