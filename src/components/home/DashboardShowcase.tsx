import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

/**
 * Animated flowing dots along a path
 */
function FlowDots({ 
  cx, cy, dx, dy, color, count = 3, duration = 2, delay = 0, vertical = false 
}: { 
  cx: number; cy: number; dx: number; dy: number; color: string; 
  count?: number; duration?: number; delay?: number; vertical?: boolean;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.circle
          key={i}
          r={3}
          fill={color}
          opacity={0.8}
          animate={vertical 
            ? { cx: [cx, cx], cy: [cy, cy + dy] }
            : { cx: [cx, cx + dx], cy: [cy, cy + dy] }
          }
          transition={{
            duration,
            delay: delay + i * (duration / count),
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </>
  );
}

function LiveEnergyFlowSVG() {
  return (
    <div className="relative w-full bg-gradient-to-b from-[#0d1520] via-[#111d2e] to-[#0d1520] rounded-xl border border-border/30 overflow-hidden">
      {/* Header */}
      <div className="text-center pt-6 pb-2 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xl">⚡</span>
          <h3 className="text-xl md:text-2xl font-bold text-solar">Live Energy Flow</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          First of its kind — <strong className="text-foreground">multi-manufacturer view</strong>
        </p>
      </div>

      <svg viewBox="0 0 500 420" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* --- SOLAR --- */}
        <text x="250" y="60" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">3.2 kW</text>
        <text x="250" y="76" textAnchor="middle" fill="#d4a843" fontSize="10" fontWeight="600" letterSpacing="2">SOLAR</text>
        {/* Solar icon circle */}
        <circle cx="250" cy="100" r="20" fill="none" stroke="#d4a843" strokeWidth="1.5" opacity="0.5" />
        <text x="250" y="106" textAnchor="middle" fill="#d4a843" fontSize="18">☀</text>
        
        {/* Flow: Solar → House */}
        <line x1="250" y1="122" x2="250" y2="165" stroke="#d4a843" strokeWidth="1" opacity="0.2" />
        <FlowDots cx={250} cy={122} dx={0} dy={43} color="#d4a843" vertical count={2} duration={1.5} />

        {/* --- HOUSE --- */}
        {/* Roof */}
        <polygon points="170,195 250,155 330,195" fill="none" stroke="#3a5068" strokeWidth="1.5" />
        {/* Solar panels on roof */}
        {[
          [230, 172], [245, 172], [260, 172],
          [215, 182], [230, 182], [245, 182], [260, 182], [275, 182],
        ].map(([px, py], i) => (
          <rect key={i} x={px} y={py} width="12" height="8" rx="1" fill="#2a4a6b" stroke="#3a6a8b" strokeWidth="0.5" />
        ))}
        
        {/* House body */}
        <rect x="180" y="195" width="140" height="80" fill="#111d2e" stroke="#3a5068" strokeWidth="1.5" rx="2" />
        {/* Windows */}
        <rect x="195" y="210" width="20" height="18" fill="#1a2a3e" stroke="#2a4a6b" strokeWidth="0.8" rx="1" />
        <rect x="285" y="210" width="20" height="18" fill="#1a2a3e" stroke="#2a4a6b" strokeWidth="0.8" rx="1" />
        
        {/* HOME label */}
        <text x="250" y="252" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">0.7 kW</text>
        <text x="250" y="266" textAnchor="middle" fill="#8899aa" fontSize="10" fontWeight="600" letterSpacing="1.5">HOME</text>

        {/* --- POWERWALL (left) --- */}
        <circle cx="80" cy="235" r="24" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.5" />
        <text x="80" y="240" textAnchor="middle" fill="#22c55e" fontSize="16">🔋</text>
        <text x="80" y="280" textAnchor="middle" fill="#8899aa" fontSize="9" fontWeight="600" letterSpacing="1">POWERWALL</text>
        <text x="80" y="296" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">2.5 kW</text>
        <text x="80" y="310" textAnchor="middle" fill="#22c55e" fontSize="9">73%</text>
        {/* Battery bar */}
        <rect x="55" y="314" width="50" height="4" rx="2" fill="#1a2a3e" />
        <rect x="55" y="314" width="36" height="4" rx="2" fill="#22c55e" />
        
        {/* Flow: Powerwall → House */}
        <line x1="106" y1="235" x2="178" y2="235" stroke="#22c55e" strokeWidth="1" opacity="0.15" />
        <FlowDots cx={106} cy={235} dx={72} dy={0} color="#22c55e" count={3} duration={2} />

        {/* --- GRID (right) --- */}
        <circle cx="420" cy="235" r="24" fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.5" />
        <text x="420" y="241" textAnchor="middle" fill="#a78bfa" fontSize="14">⚡</text>
        <text x="420" y="280" textAnchor="middle" fill="#8899aa" fontSize="9" fontWeight="600" letterSpacing="1">GRID</text>
        <text x="420" y="296" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">0.8 kW</text>
        <text x="420" y="310" textAnchor="middle" fill="#a78bfa" fontSize="9">exporting</text>
        
        {/* Flow: House → Grid */}
        <line x1="322" y1="235" x2="394" y2="235" stroke="#a78bfa" strokeWidth="1" opacity="0.15" />
        <FlowDots cx={322} cy={235} dx={72} dy={0} color="#a78bfa" count={3} duration={2} delay={0.3} />

        {/* --- EV CHARGER (bottom) --- */}
        <line x1="250" y1="277" x2="250" y2="335" stroke="#3b82f6" strokeWidth="1" opacity="0.15" />
        <FlowDots cx={250} cy={277} dx={0} dy={58} color="#3b82f6" vertical count={3} duration={1.8} delay={0.2} />
        
        <circle cx="250" cy="360" r="24" fill="none" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
        <text x="250" y="366" textAnchor="middle" fill="#3b82f6" fontSize="14">⚡</text>
        <text x="250" y="390" textAnchor="middle" fill="#8899aa" fontSize="9" fontWeight="600" letterSpacing="1">EV CHARGER</text>
        <text x="250" y="406" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">11.0 kW</text>
        <text x="250" y="418" textAnchor="middle" fill="#3b82f6" fontSize="9">⚡ CHARGING</text>
      </svg>

      {/* Bottom stats + manufacturer badges */}
      <div className="px-4 pb-5 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        {/* Today's Energy */}
        <div className="border border-border/30 rounded-lg px-4 py-3 bg-[#0d1520]/80">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Today&apos;s Energy</span>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-solar" />
              <span className="text-sm font-bold text-white">13.4</span>
              <span className="text-xs text-muted-foreground">kWh</span>
              <span className="text-[10px] text-muted-foreground ml-1">Solar Generated</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-secondary" />
              <span className="text-sm font-bold text-white">7.3</span>
              <span className="text-xs text-muted-foreground">kWh</span>
              <span className="text-[10px] text-muted-foreground ml-1">Battery Storage Exported</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-energy" />
              <span className="text-sm font-bold text-white">35.2</span>
              <span className="text-xs text-muted-foreground">kWh</span>
              <span className="text-[10px] text-muted-foreground ml-1">EV Charged</span>
            </div>
          </div>
        </div>

        {/* Manufacturer badges */}
        <div className="flex flex-row sm:flex-col gap-1.5">
          {['ENPHASE', 'TESLA', 'CHARGEPOINT'].map((name, i) => {
            const colors = ['border-solar/40 text-solar', 'border-primary/40 text-primary', 'border-energy/40 text-energy'];
            return (
              <span key={name} className={`text-[10px] px-3 py-1 rounded-full border ${colors[i]} bg-transparent font-semibold tracking-wider`}>
                {name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function DashboardShowcase() {
  return (
    <section className="py-[clamp(3rem,8vw,6rem)]">
      <div className="container max-w-4xl mx-auto px-4">
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
          <Card className="border-primary/20 overflow-hidden shadow-2xl shadow-primary/10">
            <LiveEnergyFlowSVG />
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
