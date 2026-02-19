import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Battery, Car, BatteryCharging, Zap, TrendingUp, Rocket, ChevronRight, Check } from 'lucide-react';
import { BASE_REWARD_RATES, MINT_DISTRIBUTION, PRICES, formatUSD } from '@/lib/tokenomics';

const USER_SHARE = MINT_DISTRIBUTION.user / 100;

const DEVICES = [
  { id: 'solar',      label: 'Solar Panels',   icon: Sun,             colorClass: 'solar',   rate: BASE_REWARD_RATES.solarProduction, values: { starter: 220,  average: 520,  power: 950  } },
  { id: 'battery',    label: 'Battery',         icon: Battery,         colorClass: 'eco',     rate: BASE_REWARD_RATES.batteryDischarge, values: { starter: 120, average: 260,  power: 420  } },
  { id: 'evMiles',    label: 'EV Miles',        icon: Car,             colorClass: 'primary', rate: BASE_REWARD_RATES.evMiles,          values: { starter: 400, average: 900,  power: 1800 } },
  { id: 'evCharging', label: 'EV Charging',     icon: BatteryCharging, colorClass: 'token',   rate: BASE_REWARD_RATES.evCharging,       values: { starter: 120, average: 260,  power: 480  } },
] as const;

type DeviceId = typeof DEVICES[number]['id'];
type SizeKey = 'starter' | 'average' | 'power';

const SIZE_LABELS: Record<SizeKey, { label: string; sub: string }> = {
  starter: { label: 'Starter',      sub: 'Small setup'    },
  average: { label: 'Average Home', sub: 'Typical setup'  },
  power:   { label: 'Power User',   sub: 'Full setup'     },
};

const SCENARIOS = [
  { label: 'Launch',    price: PRICES.launchFloor, icon: Zap,        accent: 'text-muted-foreground', bg: 'bg-muted/60' },
  { label: 'Target',   price: PRICES.target,       icon: TrendingUp, accent: 'text-primary',          bg: 'bg-primary/10' },
  { label: 'Moonshot', price: 5.00,                icon: Rocket,     accent: 'text-solar',            bg: 'bg-solar/10' },
];

const C: Record<string, { bg: string; border: string; icon: string; activeBg: string }> = {
  solar:   { bg: 'bg-solar/10',   border: 'border-solar/40',   icon: 'text-solar',   activeBg: 'bg-solar/15'   },
  eco:     { bg: 'bg-eco/10',     border: 'border-eco/40',     icon: 'text-eco',     activeBg: 'bg-eco/15'     },
  primary: { bg: 'bg-primary/10', border: 'border-primary/40', icon: 'text-primary', activeBg: 'bg-primary/15' },
  token:   { bg: 'bg-token/10',   border: 'border-token/40',   icon: 'text-token',   activeBg: 'bg-token/15'   },
};

function AnimNum({ value }: { value: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={Math.round(value)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
        className="tabular-nums"
      >
        {Math.round(value).toLocaleString()}
      </motion.span>
    </AnimatePresence>
  );
}

export function EarningsCalculatorSection() {
  const [activeDevices, setActiveDevices] = useState<Set<DeviceId>>(new Set(['solar', 'evMiles']));
  const [size, setSize] = useState<SizeKey>('average');

  function toggle(id: DeviceId) {
    setActiveDevices((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalTokens = DEVICES.reduce((sum, d) => {
    if (!activeDevices.has(d.id)) return sum;
    return sum + Math.floor(d.values[size] * d.rate * USER_SHARE);
  }, 0);

  const hasAny = activeDevices.size > 0;

  return (
    <section id="calculator" className="relative py-20 md:py-32 px-4 scroll-mt-20 overflow-hidden">

      {/* Background shimmer */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--solar)/0.06) 0%, hsl(var(--primary)/0.03) 50%, transparent 70%)' }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-sm mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-primary mb-4 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <Zap className="h-3 w-3" />
            Earnings Estimator
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-2">
            What would <span className="text-primary">you</span> earn?
          </h2>
          <p className="text-muted-foreground text-sm">Select what you own.</p>
        </motion.div>

        {/* Device cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {DEVICES.map((device, i) => {
            const active = activeDevices.has(device.id);
            const c = C[device.colorClass];
            const Icon = device.icon;
            return (
              <motion.button
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggle(device.id)}
                className={`relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all duration-200 cursor-pointer select-none ${
                  active
                    ? `${c.activeBg} ${c.border} shadow-sm`
                    : 'bg-card/60 border-border/60 hover:border-border'
                }`}
              >
                {/* Icon circle */}
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                  active ? `${c.bg} border ${c.border}` : 'bg-muted/60 border border-border/40'
                }`}>
                  <Icon className={`h-5 w-5 transition-colors ${active ? c.icon : 'text-muted-foreground'}`} />
                  {/* Checkmark badge */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className={`absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center ${c.icon.replace('text-', 'bg-')}`}
                      >
                        <Check className="h-3 w-3 text-background" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <span className={`font-semibold text-sm leading-tight transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {device.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Size selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="flex bg-muted/40 rounded-2xl p-1 gap-1 mb-6 border border-border/40"
        >
          {(Object.entries(SIZE_LABELS) as [SizeKey, { label: string; sub: string }][]).map(([s, meta]) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl text-center transition-all duration-200 ${
                size === s
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-xs font-bold leading-tight">{meta.label}</span>
              <span className={`text-[10px] leading-tight mt-0.5 ${size === s ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                {meta.sub}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {hasAny && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              {/* Hero number */}
              <div className="px-6 pt-7 pb-5 text-center border-b border-border">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">Monthly $ZSOLAR</p>
                <div className="text-6xl font-black text-foreground leading-none mb-1">
                  <AnimNum value={totalTokens} />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  ≈ <AnimNum value={Math.floor(totalTokens / 30)} /> tokens/day · 75% to your wallet
                </p>
              </div>

              {/* Scenario chips */}
              <div className="grid grid-cols-3 gap-2 p-4">
                {SCENARIOS.map((s) => {
                  const usd = totalTokens * s.price;
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`rounded-xl ${s.bg} px-3 py-3 text-center`}>
                      <div className="flex items-center justify-center gap-1 mb-1.5">
                        <Icon className={`h-3 w-3 ${s.accent}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${s.accent}`}>{s.label}</span>
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={Math.round(usd)}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className={`text-sm font-black tabular-nums ${s.accent}`}
                        >
                          {formatUSD(usd)}
                        </motion.div>
                      </AnimatePresence>
                      <p className="text-[9px] text-muted-foreground mt-0.5">${s.price.toFixed(2)}/token</p>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="px-5 pb-4 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground italic">Not financial advice</p>
                <a href="/auth" className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                  Start free <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!hasAny && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 text-muted-foreground text-sm"
            >
              Select a device above to see your estimate.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
