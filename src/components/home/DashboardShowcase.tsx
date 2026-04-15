import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AnimatedEnergyFlow } from '@/components/dashboard/AnimatedEnergyFlow';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import teslaLogo from '@/assets/logos/tesla-logo.png';
import chargepointLogo from '@/assets/logos/chargepoint-logo.png';

function ManufacturerBadges() {
  const manufacturers = [
    {
      name: 'ENPHASE',
      color: '#F59E0B',
      desc: 'Solar Inverters',
      icon: (
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
          <circle cx="10" cy="10" r="5" stroke="#F59E0B" strokeWidth="1.5" />
          <path d="M10 5v10M5 10h10" stroke="#F59E0B" strokeWidth="1" opacity="0.6" />
          <circle cx="10" cy="10" r="2" fill="#F59E0B" opacity="0.4" />
        </svg>
      ),
    },
    {
      name: 'TESLA',
      color: '#22C55E',
      desc: 'Powerwall · Solar Roof',
      icon: (
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
          <path d="M10 3L4 7v2l6-3 6 3V7L10 3z" fill="#22C55E" opacity="0.6" />
          <path d="M10 8v9" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      name: 'CHARGEPOINT',
      color: '#3B82F6',
      desc: 'EV Charging',
      icon: (
        <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
          <polygon points="11 2 5 12 9 12 8 18 15 8 11 8 11 2" fill="#3B82F6" opacity="0.5" stroke="#3B82F6" strokeWidth="0.8" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {manufacturers.map((m, i) => (
        <motion.div
          key={m.name}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.1 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-background/5"
          style={{ borderColor: `${m.color}40` }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${m.color}15` }}
          >
            {m.icon}
          </div>
          <div className="flex flex-col">
            <span
              className="text-[10px] font-bold tracking-wider leading-none"
              style={{ color: m.color }}
            >
              {m.name}
            </span>
            <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
              {m.desc}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function DashboardShowcase() {
  return (
    <section id="dashboard-showcase" className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-primary/40 bg-primary/10 text-primary font-medium mb-4">
              Unified Dashboard
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            One Dashboard for All Your Devices
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto mb-2"
          >
            The first multi-manufacturer clean energy view of its kind.
            See solar, battery, grid, and EV charging data flowing together — 
            regardless of brand.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-xs text-muted-foreground/70 max-w-lg mx-auto"
          >
            No more switching between Tesla, Enphase, and ChargePoint apps.
            ZenSolar unifies everything into one real-time animated view.
          </motion.p>
        </div>

        {/* Manufacturer badges — prominent */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <ManufacturerBadges />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-primary/20 overflow-hidden shadow-2xl shadow-primary/10 bg-transparent">
            <AnimatedEnergyFlow className="w-full" />
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
