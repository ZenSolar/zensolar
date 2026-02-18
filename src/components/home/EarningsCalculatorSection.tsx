import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Sun, Car, Zap, Battery, BatteryCharging, TrendingUp, Rocket } from 'lucide-react';
import {
  BASE_REWARD_RATES,
  MINT_DISTRIBUTION,
  PRICES,
  formatUSD,
} from '@/lib/tokenomics';

const USER_SHARE = MINT_DISTRIBUTION.user / 100;

// Realistic defaults & ranges grounded in real-world device specs
const SLIDERS = [
  {
    key: 'solar' as const,
    label: 'Solar Production',
    unit: 'kWh/mo',
    icon: Sun,
    color: 'solar',
    rate: BASE_REWARD_RATES.solarProduction,
    min: 0,
    max: 1500,
    step: 10,
    default: 450,
    benchmarks: [
      { value: 200, label: 'Small (2kW)' },
      { value: 500, label: 'Typical (6kW)' },
      { value: 1000, label: 'Large (12kW)' },
    ],
    context: (v: number) =>
      v === 0 ? 'No solar yet — add panels to earn'
      : v < 300 ? 'Small rooftop system'
      : v < 700 ? 'Typical US home system'
      : v < 1100 ? 'Large residential system'
      : 'Commercial-scale production',
  },
  {
    key: 'battery' as const,
    label: 'Battery Export',
    unit: 'kWh/mo',
    icon: Battery,
    color: 'eco',
    rate: BASE_REWARD_RATES.batteryDischarge,
    min: 0,
    max: 600,
    step: 5,
    default: 120,
    benchmarks: [
      { value: 0, label: 'None' },
      { value: 120, label: 'Powerwall 2' },
      { value: 300, label: '2× Powerwalls' },
    ],
    context: (v: number) =>
      v === 0 ? 'No battery — storage adds bonus rewards'
      : v < 150 ? 'Tesla Powerwall 2 (~13.5 kWh/cycle)'
      : v < 350 ? 'Multi-battery setup'
      : 'Large storage system',
  },
  {
    key: 'evMiles' as const,
    label: 'EV Miles Driven',
    unit: 'mi/mo',
    icon: Car,
    color: 'primary',
    rate: BASE_REWARD_RATES.evMiles,
    min: 0,
    max: 3000,
    step: 25,
    default: 800,
    benchmarks: [
      { value: 400, label: 'Low driver' },
      { value: 1000, label: 'US avg' },
      { value: 2000, label: 'Road warrior' },
    ],
    context: (v: number) =>
      v === 0 ? 'No EV yet — every mile earns'
      : v < 500 ? 'Light commuter'
      : v < 1200 ? 'Average US driver'
      : v < 2000 ? 'High-mileage driver'
      : 'Road warrior',
  },
  {
    key: 'evCharging' as const,
    label: 'EV Charging Sessions',
    unit: 'kWh/mo',
    icon: BatteryCharging,
    color: 'token',
    rate: BASE_REWARD_RATES.evCharging,
    min: 0,
    max: 800,
    step: 10,
    default: 200,
    benchmarks: [
      { value: 100, label: 'Light use' },
      { value: 250, label: 'Model 3 avg' },
      { value: 500, label: 'Model S/X' },
    ],
    context: (v: number) =>
      v === 0 ? 'No charging data yet'
      : v < 150 ? 'Light EV use'
      : v < 300 ? 'Model 3 typical month'
      : v < 550 ? 'Model S/X or heavy use'
      : 'Multi-EV household',
  },
] as const;

type SliderKey = typeof SLIDERS[number]['key'];

const COLOR_MAP: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  solar:   { text: 'text-solar',   bg: 'bg-solar/10',   border: 'border-solar/30',   glow: 'shadow-solar/20' },
  eco:     { text: 'text-eco',     bg: 'bg-eco/10',     border: 'border-eco/30',     glow: 'shadow-eco/20' },
  primary: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', glow: 'shadow-primary/20' },
  token:   { text: 'text-token',   bg: 'bg-token/10',   border: 'border-token/30',   glow: 'shadow-token/20' },
};

const PRICE_SCENARIOS = [
  { label: 'Launch Floor', price: 0.10, icon: Zap,        tier: 'base',     description: 'Day-1 price' },
  { label: 'Target',       price: 1.00, icon: TrendingUp, tier: 'target',   description: '10× from floor' },
  { label: 'Moonshot',     price: 5.00, icon: Rocket,     tier: 'moonshot', description: '50× from floor' },
];

function AnimatedNumber({ value, prefix = '', decimals = 0 }: { value: number; prefix?: string; decimals?: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value.toFixed(decimals)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="inline-block tabular-nums"
      >
        {prefix}{decimals > 0
          ? value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
          : value.toLocaleString()}
      </motion.span>
    </AnimatePresence>
  );
}

export function EarningsCalculatorSection() {
  const [values, setValues] = useState<Record<SliderKey, number>>(
    Object.fromEntries(SLIDERS.map((s) => [s.key, s.default])) as Record<SliderKey, number>
  );

  const perActivity = SLIDERS.map((s) => ({
    ...s,
    tokens: Math.floor(values[s.key] * s.rate * USER_SHARE),
  }));

  const totalTokens = perActivity.reduce((sum, s) => sum + s.tokens, 0);

  return (
    <section id="calculator" className="py-20 md:py-32 px-4 scroll-mt-20 bg-background">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-primary mb-4 bg-primary/10 px-3 py-1.5 rounded-full">
            <Zap className="h-3 w-3" />
            Earnings Estimator
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            What would{' '}
            <span className="relative inline-block">
              <span className="text-primary">YOU</span>
            </span>{' '}
            earn?
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-sm mx-auto">
            Dial in your setup. Every kWh and every mile earns $ZSOLAR.
          </p>
        </motion.div>

        {/* Sliders card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-8 mb-4"
        >
          {SLIDERS.map((slider) => {
            const activity = perActivity.find((a) => a.key === slider.key)!;
            const colors = COLOR_MAP[slider.color];
            const Icon = slider.icon;
            const v = values[slider.key];

            return (
              <div key={slider.key} className="space-y-3">
                {/* Row header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${colors.bg} border ${colors.border}`}>
                      <Icon className={`h-4.5 w-4.5 ${colors.text}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-tight">{slider.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{slider.context(v)}</p>
                    </div>
                  </div>
                  {/* Live token count pill */}
                  <motion.div
                    key={activity.tokens}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${colors.bg} ${colors.text} border ${colors.border}`}
                  >
                    <AnimatedNumber value={activity.tokens} />
                    <span className="opacity-70 font-normal">$ZSOLAR</span>
                  </motion.div>
                </div>

                {/* Slider */}
                <Slider
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={[v]}
                  onValueChange={([val]) => setValues((prev) => ({ ...prev, [slider.key]: val }))}
                  className="w-full"
                />

                {/* Benchmark markers */}
                <div className="flex justify-between">
                  {slider.benchmarks.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => setValues((prev) => ({ ...prev, [slider.key]: b.value }))}
                      className={`text-xs transition-colors ${
                        v === b.value
                          ? `${colors.text} font-semibold`
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Total + Price Scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          {/* Total tokens banner */}
          <div className="px-6 md:px-8 py-5 border-b border-border bg-muted/30 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-0.5">Monthly $ZSOLAR Earned</p>
              <div className="text-3xl md:text-4xl font-black text-foreground tabular-nums">
                <AnimatedNumber value={totalTokens} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-0.5">Per Day</p>
              <div className="text-xl font-bold text-muted-foreground tabular-nums">
                <AnimatedNumber value={Math.floor(totalTokens / 30)} />
              </div>
            </div>
          </div>

          {/* Price scenario grid */}
          <div className="grid grid-cols-3 divide-x divide-border">
            {PRICE_SCENARIOS.map((scenario) => {
              const usd = totalTokens * scenario.price;
              const ScenarioIcon = scenario.icon;
              const isMoonshot = scenario.tier === 'moonshot';
              const isTarget = scenario.tier === 'target';

              return (
                <div
                  key={scenario.tier}
                  className={`px-3 md:px-5 py-5 flex flex-col gap-1 relative ${
                    isMoonshot ? 'bg-gradient-to-b from-solar/10 to-token/5' : ''
                  }`}
                >
                  {isMoonshot && (
                    <div className="absolute inset-0 bg-gradient-to-b from-solar/5 via-transparent to-transparent pointer-events-none" />
                  )}
                  <div className="flex items-center gap-1.5 mb-1">
                    <ScenarioIcon className={`h-3.5 w-3.5 ${
                      isMoonshot ? 'text-solar' : isTarget ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <span className="text-xs font-semibold text-muted-foreground">{scenario.label}</span>
                  </div>
                  <div className={`text-sm font-medium text-muted-foreground mb-1`}>
                    @ ${scenario.price.toFixed(2)}/token
                  </div>
                  <div className={`text-xl md:text-2xl font-black tabular-nums ${
                    isMoonshot ? 'text-solar' : isTarget ? 'text-primary' : 'text-foreground'
                  }`}>
                    <AnimatedNumber value={usd} prefix="$" decimals={2} />
                  </div>
                  <div className="text-xs text-muted-foreground">{scenario.description}</div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground text-center">
              Mainnet rates · 75% distribution to wallet · Estimates only. Token prices are not guaranteed.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
