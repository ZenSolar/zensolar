import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Battery, Car, BatteryCharging, Zap, TrendingUp, Rocket, ChevronRight } from 'lucide-react';
import { BASE_REWARD_RATES, MINT_DISTRIBUTION, PRICES, formatUSD } from '@/lib/tokenomics';

const USER_SHARE = MINT_DISTRIBUTION.user / 100;

const DEVICES = [
  { id: 'solar',      label: 'Solar',       icon: Sun,            colorClass: 'solar',   rate: BASE_REWARD_RATES.solarProduction, values: { small: 220,  medium: 520,  large: 950  } },
  { id: 'battery',    label: 'Battery',     icon: Battery,        colorClass: 'eco',     rate: BASE_REWARD_RATES.batteryDischarge, values: { small: 120, medium: 260,  large: 420  } },
  { id: 'evMiles',    label: 'EV Miles',    icon: Car,            colorClass: 'primary', rate: BASE_REWARD_RATES.evMiles,          values: { small: 400, medium: 900,  large: 1800 } },
  { id: 'evCharging', label: 'EV Charging', icon: BatteryCharging, colorClass: 'token',  rate: BASE_REWARD_RATES.evCharging,       values: { small: 120, medium: 260,  large: 480  } },
] as const;

type DeviceId = typeof DEVICES[number]['id'];
type SizeKey = 'small' | 'medium' | 'large';

const SIZE_LABELS: Record<SizeKey, string> = { small: 'Small', medium: 'Medium', large: 'Large' };

const SCENARIOS = [
  { label: 'Launch',    price: PRICES.launchFloor, icon: Zap,        accent: 'text-muted-foreground' },
  { label: 'Target',   price: PRICES.target,       icon: TrendingUp, accent: 'text-primary' },
  { label: 'Moonshot', price: 5.00,                icon: Rocket,     accent: 'text-solar', glow: true },
];

const C: Record<string, { bg: string; border: string; icon: string }> = {
  solar:   { bg: 'bg-solar/10',   border: 'border-solar/50',   icon: 'text-solar'   },
  eco:     { bg: 'bg-eco/10',     border: 'border-eco/50',     icon: 'text-eco'     },
  primary: { bg: 'bg-primary/10', border: 'border-primary/50', icon: 'text-primary' },
  token:   { bg: 'bg-token/10',   border: 'border-token/50',   icon: 'text-token'   },
};

function Num({ value }: { value: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={Math.round(value)}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.12 }}
        className="tabular-nums"
      >
        {Math.round(value).toLocaleString()}
      </motion.span>
    </AnimatePresence>
  );
}

export function EarningsCalculatorSection() {
  const [activeDevices, setActiveDevices] = useState<Set<DeviceId>>(new Set(['solar', 'evMiles']));
  const [size, setSize] = useState<SizeKey>('medium');

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
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--solar)/0.07) 0%, hsl(var(--primary)/0.04) 50%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-md mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-primary mb-4 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <Zap className="h-3 w-3" />
            Earnings Estimator
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-2">
            What would <span className="text-primary">you</span> earn?
          </h2>
          <p className="text-muted-foreground text-sm">Pick what you own.</p>
        </motion.div>

        {/* Step 1 — Device toggles */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
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
                onClick={() => toggle(device.id)}
                className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${
                  active ? `${c.bg} ${c.border}` : 'bg-card border-border hover:border-border/80'
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition-all duration-200 ${
                  active ? `${c.bg} border ${c.border}` : 'bg-muted border border-border'
                }`}>
                  <Icon className={`h-4 w-4 transition-colors ${active ? c.icon : 'text-muted-foreground'}`} />
                </div>
                <span className={`font-semibold text-sm transition-colors ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {device.label}
                </span>
                {/* Active dot */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className={`absolute top-3 right-3 h-2 w-2 rounded-full ${c.icon.replace('text-', 'bg-')}`}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Step 2 — Global size */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="flex items-center gap-3 mb-5"
        >
          <span className="text-xs text-muted-foreground font-medium shrink-0">My setup:</span>
          <div className="flex flex-1 bg-muted/50 rounded-xl p-1 gap-1">
            {(Object.keys(SIZE_LABELS) as SizeKey[]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  size === s
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {SIZE_LABELS[s]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {hasAny && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              {/* Total */}
              <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Monthly $ZSOLAR</p>
                  <div className="text-4xl font-black text-foreground"><Num value={totalTokens} /></div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Per Day</p>
                  <div className="text-xl font-bold text-muted-foreground"><Num value={Math.floor(totalTokens / 30)} /></div>
                </div>
              </div>

              {/* Moonshot scenarios */}
              <div className="grid grid-cols-3 divide-x divide-border">
                {SCENARIOS.map((s) => {
                  const usd = totalTokens * s.price;
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`px-3 py-4 ${s.glow ? 'bg-gradient-to-b from-solar/8 to-transparent' : ''}`}>
                      <div className="flex items-center gap-1 mb-2">
                        <Icon className={`h-3 w-3 ${s.accent}`} />
                        <span className="text-[10px] font-semibold text-muted-foreground">{s.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-1">${s.price.toFixed(2)}/token</p>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={Math.round(usd)}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className={`text-base md:text-lg font-black tabular-nums ${s.accent}`}
                        >
                          {formatUSD(usd)}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">75% to your wallet · not financial advice</p>
                <a href="/auth" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
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
              className="text-center py-6 text-muted-foreground text-sm"
            >
              Select a device above to see your estimate.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
