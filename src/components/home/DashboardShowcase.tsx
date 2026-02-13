import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sun, Battery, Zap, ArrowDown, ArrowUp, Home, Plug } from 'lucide-react';

function MiniEnergyFlow() {
  return (
    <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-background via-card to-muted/30 rounded-xl border border-border/60 overflow-hidden p-4 md:p-8">
      {/* Grid background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }} />

      {/* Live indicator */}
      <div className="absolute top-3 left-3 md:top-5 md:left-5 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
        <span className="text-xs font-medium text-primary">LIVE</span>
      </div>

      {/* Manufacturer badges */}
      <div className="absolute top-3 right-3 md:top-5 md:right-5 flex gap-1.5">
        {['Tesla', 'Enphase', 'ChargePoint'].map((name) => (
          <span key={name} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground border border-border/40 font-medium">
            {name}
          </span>
        ))}
      </div>

      {/* Energy flow visualization */}
      <div className="relative flex items-center justify-center h-full gap-4 md:gap-8 pt-4">
        {/* Solar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-2"
        >
          <div className="p-3 md:p-4 rounded-2xl bg-solar/10 border border-solar/20">
            <Sun className="h-6 w-6 md:h-8 md:w-8 text-solar" />
          </div>
          <span className="text-xs font-semibold text-foreground">Solar</span>
          <span className="text-[10px] text-solar font-bold">8.4 kW</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ArrowDown className="h-4 w-4 text-solar/60" />
          </motion.div>
        </motion.div>

        {/* Home hub */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="p-4 md:p-6 rounded-2xl bg-primary/10 border-2 border-primary/30 relative">
            <Home className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <motion.div
              className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <span className="text-sm font-bold text-foreground">HOME</span>
          <span className="text-[10px] text-muted-foreground">2.1 kW usage</span>
        </motion.div>

        {/* Battery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="p-3 md:p-4 rounded-2xl bg-secondary/10 border border-secondary/20">
            <Battery className="h-6 w-6 md:h-8 md:w-8 text-secondary" />
          </div>
          <span className="text-xs font-semibold text-foreground">Battery</span>
          <span className="text-[10px] text-secondary font-bold">92%</span>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
          >
            <ArrowUp className="h-4 w-4 text-secondary/60" />
          </motion.div>
        </motion.div>

        {/* EV */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="p-3 md:p-4 rounded-2xl bg-energy/10 border border-energy/20">
            <Plug className="h-6 w-6 md:h-8 md:w-8 text-energy" />
          </div>
          <span className="text-xs font-semibold text-foreground">EV</span>
          <span className="text-[10px] text-energy font-bold">7.6 kW</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
          >
            <ArrowDown className="h-4 w-4 text-energy/60" />
          </motion.div>
        </motion.div>

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="p-3 md:p-4 rounded-2xl bg-muted border border-border/40">
            <Zap className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
          </div>
          <span className="text-xs font-semibold text-foreground">Grid</span>
          <span className="text-[10px] text-primary font-bold">Exporting</span>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.7 }}
          >
            <ArrowUp className="h-4 w-4 text-primary/60" />
          </motion.div>
        </motion.div>
      </div>

      {/* Today's stats bar */}
      <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5">
        <div className="flex items-center justify-center gap-4 md:gap-8 px-4 py-2 rounded-lg bg-card/80 backdrop-blur border border-border/40">
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground block">Solar Today</span>
            <span className="text-xs md:text-sm font-bold text-solar">42.3 kWh</span>
          </div>
          <div className="w-px h-6 bg-border/40" />
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground block">Battery</span>
            <span className="text-xs md:text-sm font-bold text-secondary">8.1 kWh</span>
          </div>
          <div className="w-px h-6 bg-border/40" />
          <div className="text-center">
            <span className="text-[10px] text-muted-foreground block">EV Charged</span>
            <span className="text-xs md:text-sm font-bold text-energy">22.5 kWh</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardShowcase() {
  return (
    <section className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
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
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            See your Tesla, Enphase, and ChargePoint data flowing together in real-time — 
            the first multi-manufacturer clean energy view of its kind.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-primary/20 overflow-hidden shadow-xl shadow-primary/5">
            <MiniEnergyFlow />
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
