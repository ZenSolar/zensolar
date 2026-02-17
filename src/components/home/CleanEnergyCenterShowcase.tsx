import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, BatteryFull, Car, Zap, ChevronRight, Wallet } from 'lucide-react';

const kpiItems = [
  {
    icon: Sun,
    label: 'Solar Energy Produced',
    value: '28,742',
    unit: 'kWh',
    name: 'Tesla Solar Roof',
    borderColor: 'border-l-solar',
    iconColor: 'text-solar',
    iconBg: 'bg-solar/10',
  },
  {
    icon: BatteryFull,
    label: 'Battery Storage Exported',
    value: '2,476',
    unit: 'kWh',
    name: 'Powerwall 2',
    borderColor: 'border-l-secondary',
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary/10',
  },
  {
    icon: Car,
    label: 'EV Miles Driven',
    value: '70,103',
    unit: 'mi',
    name: 'Model Y Long Range',
    borderColor: 'border-l-primary',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    icon: Zap,
    label: 'Tesla Supercharging',
    value: '2,580',
    unit: 'kWh',
    name: '',
    borderColor: 'border-l-energy',
    iconColor: 'text-energy',
    iconBg: 'bg-energy/10',
  },
];

export function CleanEnergyCenterShowcase() {
  return (
    <section className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Badge variant="outline" className="px-3 py-1 border-secondary/40 bg-secondary/10 text-secondary font-medium mb-4">
              Clean Energy Center
            </Badge>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          >
            Your Energy Command Center
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Track every kWh produced, every mile driven, and every battery cycle, all in one place. 
            Your lifetime clean energy impact, always up to date.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-primary/20 overflow-hidden shadow-2xl shadow-primary/10 bg-gradient-to-b from-[#0d1520] via-[#111d2e] to-[#0d1520]">
            <CardContent className="p-5 md:p-8">
              {/* Wallet preview */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-[#0d1520]/80 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground block">My Wallet</span>
                    <span className="text-xs text-muted-foreground">314,838 tokens · $0.10</span>
                  </div>
                </div>
                <span className="text-xl md:text-2xl font-bold text-foreground">$31,483</span>
              </div>

              {/* Clean Energy Center header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Clean Energy Center</h3>
                  <span className="text-xs text-muted-foreground">Last updated 11:19 PM</span>
                </div>
              </div>

              {/* KPI cards */}
              <div className="space-y-3">
                {kpiItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-[#1a2535]/60 border-l-4 ${item.borderColor} group hover:bg-[#1a2535]/90 transition-colors`}
                  >
                    <div className={`p-2.5 rounded-xl ${item.iconBg} flex-shrink-0`}>
                      <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground block">{item.name ? `${item.name} ${item.label}` : item.label}</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-bold text-foreground">{item.value}</span>
                        <span className="text-sm text-muted-foreground">{item.unit}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
