import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Activity, Sun, BatteryFull, Car, Zap } from 'lucide-react';

const oems = [
  { name: 'Tesla', tag: 'Solar · Battery · EV', icon: Car, color: 'text-secondary' },
  { name: 'Enphase', tag: 'Microinverters · Battery', icon: Sun, color: 'text-solar' },
  { name: 'SolarEdge', tag: 'Inverters · Battery', icon: Zap, color: 'text-energy' },
  { name: 'Wallbox', tag: 'EV Charging', icon: BatteryFull, color: 'text-primary' },
];

export function MultiOemMoat() {
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary uppercase tracking-wider text-xs">
              First-of-its-kind
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              One cockpit for every{' '}
              <span className="bg-gradient-to-r from-primary via-secondary to-energy bg-clip-text text-transparent">
                clean-energy asset
              </span>{' '}
              you own.
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              Tesla, Enphase, SolarEdge, and Wallbox unified in a single live dashboard.
              Every verified kWh — production, storage, EV miles, charging — feeds the same
              Proof-of-Genesis™ receipt. No other platform does this.
            </p>
            <ul className="space-y-2.5 pt-2">
              {[
                'Live multi-OEM telemetry, one screen',
                'One verified-kWh stream, zero double-count',
                'Hardware-agnostic — bring what you already own',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground/85">
                  <Activity className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-transparent to-energy/10 blur-3xl" />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/10">
              {oems.map((oem) => (
                <motion.div
                  key={oem.name}
                  whileHover={{ y: -3 }}
                  className="relative p-5 rounded-xl bg-gradient-to-br from-muted/40 to-muted/10 border border-border/50 hover:border-primary/40 transition-colors"
                >
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>
                  </div>
                  <oem.icon className={`h-6 w-6 ${oem.color} mb-3`} />
                  <div className="font-bold text-base">{oem.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{oem.tag}</div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 text-center text-xs text-muted-foreground tracking-wide">
              All four streams reconcile to one Proof-of-Genesis™ receipt
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
