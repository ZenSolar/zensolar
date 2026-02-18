import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Battery, Car, BatteryCharging, Check, Zap, TrendingUp, Rocket, ChevronRight } from 'lucide-react';
import { BASE_REWARD_RATES, MINT_DISTRIBUTION, PRICES, formatUSD } from '@/lib/tokenomics';

const USER_SHARE = MINT_DISTRIBUTION.user / 100;

// ─── Device definitions ────────────────────────────────────────────────────
const DEVICES = [
  {
    id: 'solar',
    label: 'Solar Panels',
    icon: Sun,
    colorClass: 'solar',
    tagline: 'Earn on every kWh your roof produces',
    rate: BASE_REWARD_RATES.solarProduction,
    unit: 'kWh/mo',
    sizes: [
      { key: 'small',  label: 'Small',  sublabel: '~2–4 kW system',  value: 220,  badge: '220 kWh' },
      { key: 'medium', label: 'Medium', sublabel: '~6–8 kW system',  value: 520,  badge: '520 kWh' },
      { key: 'large',  label: 'Large',  sublabel: '10–14 kW system', value: 950,  badge: '950 kWh' },
    ],
  },
  {
    id: 'battery',
    label: 'Battery Storage',
    icon: Battery,
    colorClass: 'eco',
    tagline: 'Export rewards for every kWh discharged',
    rate: BASE_REWARD_RATES.batteryDischarge,
    unit: 'kWh/mo',
    sizes: [
      { key: 'small',  label: 'Powerwall 2', sublabel: '13.5 kWh · 1 unit', value: 120,  badge: '120 kWh' },
      { key: 'medium', label: '2× Powerwalls', sublabel: '27 kWh total',     value: 260,  badge: '260 kWh' },
      { key: 'large',  label: 'Large System',  sublabel: '40 kWh+ storage',  value: 420,  badge: '420 kWh' },
    ],
  },
  {
    id: 'evMiles',
    label: 'Electric Vehicle',
    icon: Car,
    colorClass: 'primary',
    tagline: '1 $ZSOLAR for every mile you drive',
    rate: BASE_REWARD_RATES.evMiles,
    unit: 'mi/mo',
    sizes: [
      { key: 'small',  label: 'Light Driver',  sublabel: '~400 mi/mo',       value: 400,  badge: '400 mi' },
      { key: 'medium', label: 'Average Driver', sublabel: '~900 mi/mo',       value: 900,  badge: '900 mi' },
      { key: 'large',  label: 'Road Warrior',  sublabel: '1,800+ mi/mo',     value: 1800, badge: '1,800 mi' },
    ],
  },
  {
    id: 'evCharging',
    label: 'EV Charging',
    icon: BatteryCharging,
    colorClass: 'token',
    tagline: 'Home + DC fast charging both count',
    rate: BASE_REWARD_RATES.evCharging,
    unit: 'kWh/mo',
    sizes: [
      { key: 'small',  label: 'Light Use',    sublabel: 'Model 3 short range', value: 120,  badge: '120 kWh' },
      { key: 'medium', label: 'Model 3/Y',    sublabel: 'Typical month',       value: 260,  badge: '260 kWh' },
      { key: 'large',  label: 'Model S/X',    sublabel: 'High performance',    value: 480,  badge: '480 kWh' },
    ],
  },
] as const;

type DeviceId = typeof DEVICES[number]['id'];
type SizeKey = 'small' | 'medium' | 'large';

const PRICE_SCENARIOS = [
  { label: 'Launch',    price: PRICES.launchFloor, icon: Zap,        glow: false, accent: 'text-muted-foreground' },
  { label: 'Target',   price: PRICES.target,       icon: TrendingUp, glow: false, accent: 'text-primary' },
  { label: 'Moonshot', price: 5.00,                icon: Rocket,     glow: true,  accent: 'text-solar' },
];

// Color tokens per device
const COLORS: Record<string, {
  activeBg: string; activeBorder: string; activeIcon: string;
  pill: string; pillText: string; checkBg: string;
}> = {
  solar:   { activeBg: 'bg-solar/10',   activeBorder: 'border-solar/50',   activeIcon: 'text-solar',   pill: 'bg-solar/15 border-solar/30',   pillText: 'text-solar',   checkBg: 'bg-solar text-solar-foreground' },
  eco:     { activeBg: 'bg-eco/10',     activeBorder: 'border-eco/50',     activeIcon: 'text-eco',     pill: 'bg-eco/15 border-eco/30',       pillText: 'text-eco',     checkBg: 'bg-eco text-eco-foreground' },
  primary: { activeBg: 'bg-primary/10', activeBorder: 'border-primary/50', activeIcon: 'text-primary', pill: 'bg-primary/15 border-primary/30', pillText: 'text-primary', checkBg: 'bg-primary text-primary-foreground' },
  token:   { activeBg: 'bg-token/10',   activeBorder: 'border-token/50',   activeIcon: 'text-token',   pill: 'bg-token/15 border-token/30',   pillText: 'text-token',   checkBg: 'bg-token text-token-foreground' },
};

function AnimatedValue({ value, prefix = '' }: { value: number; prefix?: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={Math.round(value)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.15 }}
        className="tabular-nums"
      >
        {prefix}{Math.round(value).toLocaleString()}
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
      if (prev[id]) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 'medium' };
    });
  }

  function setSize(id: DeviceId, size: SizeKey) {
    setSelected((prev) => ({ ...prev, [id]: size }));
  }

  // Calculate totals
  const breakdown = DEVICES.map((d) => {
    const sizeKey = selected[d.id];
    if (!sizeKey) return { id: d.id, kwh: 0, tokens: 0, colorClass: d.colorClass };
    const sizeData = d.sizes.find((s) => s.key === sizeKey)!;
    const tokens = Math.floor(sizeData.value * d.rate * USER_SHARE);
    return { id: d.id, kwh: sizeData.value, tokens, colorClass: d.colorClass };
  });

  const totalTokens = breakdown.reduce((s, b) => s + b.tokens, 0);
  const hasAny = Object.keys(selected).length > 0;

  return (
    <section id="calculator" className="relative py-20 md:py-32 px-4 scroll-mt-20 overflow-hidden">

      {/* ── Animated background ──────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {/* Slow-breathing radial — solar warm */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--solar)/0.08) 0%, hsl(var(--primary)/0.05) 45%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Offset secondary pulse — primary blue */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary)/0.06) 0%, transparent 65%)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto">

        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-primary mb-4 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <Zap className="h-3 w-3" />
            Earnings Estimator
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-3 leading-tight">
            What would <span className="text-primary">YOU</span> earn?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-sm mx-auto">
            Select the clean energy devices you own. We'll calculate your monthly $ZSOLAR.
          </p>
        </motion.div>

        {/* ── Device cards ─────────────────────────────────────── */}
        <div className="space-y-3 mb-4">
          {DEVICES.map((device, i) => {
            const isActive = !!selected[device.id];
            const currentSize = selected[device.id];
            const c = COLORS[device.colorClass];
            const Icon = device.icon;
            const deviceBreakdown = breakdown.find((b) => b.id === device.id)!;

            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isActive
                    ? `${c.activeBg} ${c.activeBorder}`
                    : 'bg-card border-border'
                }`}
              >
                {/* Card header — tap to toggle */}
                <button
                  onClick={() => toggle(device.id)}
                  className="w-full flex items-center gap-4 p-4 text-left"
                >
                  {/* Icon */}
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 transition-all duration-300 ${
                    isActive ? `${c.activeBg} border ${c.activeBorder}` : 'bg-muted border border-border'
                  }`}>
                    <Icon className={`h-5 w-5 transition-colors duration-300 ${isActive ? c.activeIcon : 'text-muted-foreground'}`} />
                  </div>

                  {/* Label + tagline */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm leading-tight transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {device.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{device.tagline}</p>
                  </div>

                  {/* Token badge OR chevron */}
                  <div className="shrink-0 flex items-center gap-2">
                    <AnimatePresence>
                      {isActive && deviceBreakdown.tokens > 0 && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${c.pill} ${c.pillText}`}
                        >
                          +<AnimatedValue value={deviceBreakdown.tokens} /> $Z
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {/* Toggle circle */}
                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isActive ? `${c.checkBg} border-transparent` : 'border-border bg-background'
                    }`}>
                      {isActive && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </button>

                {/* Size selector — slides in when active */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <div className="grid grid-cols-3 gap-2">
                          {device.sizes.map((size) => {
                            const isPicked = currentSize === size.key;
                            return (
                              <button
                                key={size.key}
                                onClick={() => setSize(device.id, size.key)}
                                className={`rounded-xl border p-3 text-left transition-all duration-200 ${
                                  isPicked
                                    ? `${c.activeBorder} ${c.activeBg} shadow-sm`
                                    : 'border-border/60 bg-background/60 hover:border-border'
                                }`}
                              >
                                <p className={`text-xs font-semibold leading-tight ${isPicked ? c.activeIcon : 'text-foreground'}`}>
                                  {size.label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{size.sublabel}</p>
                                <p className={`text-xs font-bold mt-1.5 ${isPicked ? c.pillText : 'text-muted-foreground'}`}>
                                  {size.badge}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* ── Results panel ────────────────────────────────────── */}
        <AnimatePresence>
          {hasAny && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              {/* Total banner */}
              <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Monthly $ZSOLAR</p>
                  <div className="text-4xl font-black text-foreground">
                    <AnimatedValue value={totalTokens} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-1">Per Day</p>
                  <div className="text-xl font-bold text-muted-foreground">
                    <AnimatedValue value={Math.floor(totalTokens / 30)} />
                  </div>
                </div>
              </div>

              {/* Price scenarios */}
              <div className="grid grid-cols-3 divide-x divide-border">
                {PRICE_SCENARIOS.map((s) => {
                  const usd = totalTokens * s.price;
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.label}
                      className={`px-3 md:px-5 py-5 flex flex-col gap-1 ${s.glow ? 'bg-gradient-to-b from-solar/8 to-transparent' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`h-3.5 w-3.5 ${s.accent}`} />
                        <span className="text-xs font-semibold text-muted-foreground">{s.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">${s.price.toFixed(2)}/token</p>
                      <div className={`text-xl md:text-2xl font-black tabular-nums ${s.accent}`}>
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={Math.round(usd)}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="inline-block"
                          >
                            {formatUSD(usd)}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA nudge */}
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Mainnet rates · 75% to your wallet · Not financial advice
                </p>
                <a
                  href="/auth"
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
                >
                  Start earning free <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state nudge */}
        <AnimatePresence>
          {!hasAny && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 text-muted-foreground text-sm"
            >
              Select at least one device above to see your estimate.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
