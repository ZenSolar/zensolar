import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Battery, Car, BatteryCharging, Zap, TrendingUp, Rocket, ChevronRight } from 'lucide-react';
import { BASE_REWARD_RATES, MINT_DISTRIBUTION, PRICES, formatUSD } from '@/lib/tokenomics';

const USER_SHARE = MINT_DISTRIBUTION.user / 100;

const DEVICES = [
  {
    id: 'solar',
    label: 'Solar',
    icon: Sun,
    colorClass: 'solar',
    rate: BASE_REWARD_RATES.solarProduction,
    sizes: [
      { key: 'small',  label: '2 kW',  value: 220 },
      { key: 'medium', label: '6 kW',  value: 520 },
      { key: 'large',  label: '12 kW', value: 950 },
    ],
  },
  {
    id: 'battery',
    label: 'Battery',
    icon: Battery,
    colorClass: 'eco',
    rate: BASE_REWARD_RATES.batteryDischarge,
    sizes: [
      { key: 'small',  label: '1× PW',  value: 120 },
      { key: 'medium', label: '2× PW',  value: 260 },
      { key: 'large',  label: '40 kWh', value: 420 },
    ],
  },
  {
    id: 'evMiles',
    label: 'EV Miles',
    icon: Car,
    colorClass: 'primary',
    rate: BASE_REWARD_RATES.evMiles,
    sizes: [
      { key: 'small',  label: '400 mi',   value: 400  },
      { key: 'medium', label: '900 mi',   value: 900  },
      { key: 'large',  label: '1,800 mi', value: 1800 },
    ],
  },
  {
    id: 'evCharging',
    label: 'EV Charging',
    icon: BatteryCharging,
    colorClass: 'token',
    rate: BASE_REWARD_RATES.evCharging,
    sizes: [
      { key: 'small',  label: '120 kWh', value: 120 },
      { key: 'medium', label: '260 kWh', value: 260 },
      { key: 'large',  label: '480 kWh', value: 480 },
    ],
  },
] as const;

type DeviceId = typeof DEVICES[number]['id'];
type SizeKey = 'small' | 'medium' | 'large';

const SCENARIOS = [
  { label: 'Launch',    price: PRICES.launchFloor, icon: Zap,        accent: 'text-muted-foreground' },
  { label: 'Target',   price: PRICES.target,       icon: TrendingUp, accent: 'text-primary' },
  { label: 'Moonshot', price: 5.00,                icon: Rocket,     accent: 'text-solar', glow: true },
];

const C: Record<string, { bg: string; border: string; icon: string; pill: string; pillText: string }> = {
  solar:   { bg: 'bg-solar/10',   border: 'border-solar/40',   icon: 'text-solar',   pill: 'bg-solar/15',   pillText: 'text-solar'   },
  eco:     { bg: 'bg-eco/10',     border: 'border-eco/40',     icon: 'text-eco',     pill: 'bg-eco/15',     pillText: 'text-eco'     },
  primary: { bg: 'bg-primary/10', border: 'border-primary/40', icon: 'text-primary', pill: 'bg-primary/15', pillText: 'text-primary' },
  token:   { bg: 'bg-token/10',   border: 'border-token/40',   icon: 'text-token',   pill: 'bg-token/15',   pillText: 'text-token'   },
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
  const [selected, setSelected] = useState<Partial<Record<DeviceId, SizeKey>>>({
    solar: 'medium',
    evMiles: 'medium',
  });

  function toggle(id: DeviceId) {
    setSelected((prev) => {
      if (prev[id]) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: 'medium' };
    });
  }

  function setSize(id: DeviceId, size: SizeKey) {
    setSelected((prev) => ({ ...prev, [id]: size }));
  }

  const breakdown = DEVICES.map((d) => {
    const sk = selected[d.id];
    if (!sk) return { id: d.id, tokens: 0, colorClass: d.colorClass };
    const sz = d.sizes.find((s) => s.key === sk)!;
    return { id: d.id, tokens: Math.floor(sz.value * d.rate * USER_SHARE), colorClass: d.colorClass };
  });

  const totalTokens = breakdown.reduce((s, b) => s + b.tokens, 0);
  const hasAny = Object.keys(selected).length > 0;

  return (
    <section id="calculator" className="relative py-20 md:py-32 px-4 scroll-mt-20 overflow-hidden">

      {/* Background pulse */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, hsl(var(--solar)/0.07) 0%, hsl(var(--primary)/0.04) 50%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-xl mx-auto">

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
          <p className="text-muted-foreground text-sm md:text-base">
            Pick your devices. See your monthly $ZSOLAR.
          </p>
        </motion.div>

        {/* Device cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {DEVICES.map((device, i) => {
            const isActive = !!selected[device.id];
            const currentSize = selected[device.id];
            const c = C[device.colorClass];
            const Icon = device.icon;
            const tokens = breakdown.find((b) => b.id === device.id)!.tokens;

            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className={`rounded-2xl border transition-all duration-250 overflow-hidden ${
                  isActive ? `${c.bg} ${c.border}` : 'bg-card border-border'
                }`}
              >
                {/* Toggle button */}
                <button
                  onClick={() => toggle(device.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition-all duration-250 ${
                    isActive ? `${c.bg} border ${c.border}` : 'bg-muted border border-border'
                  }`}>
                    <Icon className={`h-4 w-4 ${isActive ? c.icon : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {device.label}
                    </p>
                    <AnimatePresence>
                      {isActive && tokens > 0 && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`text-xs font-bold ${c.pillText}`}
                        >
                          +<Num value={tokens} /> $Z
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 shrink-0 transition-all duration-250 ${
                    isActive ? `${c.icon.replace('text-', 'bg-')} border-transparent` : 'border-border bg-background'
                  }`} />
                </button>

                {/* Size picker */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 grid grid-cols-3 gap-1.5">
                        {device.sizes.map((size) => {
                          const picked = currentSize === size.key;
                          return (
                            <button
                              key={size.key}
                              onClick={() => setSize(device.id, size.key)}
                              className={`rounded-lg py-1.5 px-2 text-center text-xs font-semibold transition-all duration-150 border ${
                                picked
                                  ? `${c.bg} ${c.border} ${c.icon}`
                                  : 'border-border/50 bg-background/60 text-muted-foreground hover:border-border'
                              }`}
                            >
                              {size.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

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
              {/* Monthly total */}
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

              {/* Price scenarios */}
              <div className="grid grid-cols-3 divide-x divide-border">
                {SCENARIOS.map((s) => {
                  const usd = totalTokens * s.price;
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`px-4 py-4 ${s.glow ? 'bg-gradient-to-b from-solar/8 to-transparent' : ''}`}>
                      <div className="flex items-center gap-1 mb-2">
                        <Icon className={`h-3 w-3 ${s.accent}`} />
                        <span className="text-[11px] font-semibold text-muted-foreground">{s.label}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1">${s.price.toFixed(2)}</p>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={Math.round(usd)}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className={`text-lg md:text-xl font-black tabular-nums ${s.accent}`}
                        >
                          {formatUSD(usd)}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="px-6 py-3 border-t border-border bg-muted/10 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">75% goes to your wallet · not financial advice</p>
                <a href="/auth" className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0">
                  Start free <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
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
