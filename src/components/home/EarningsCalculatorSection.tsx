import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Sun, Car, Zap, DollarSign, Battery, BatteryCharging } from 'lucide-react';
import {
  BASE_REWARD_RATES,
  MINT_DISTRIBUTION,
  PRICES,
  formatUSD,
} from '@/lib/tokenomics';

const USER_SHARE = MINT_DISTRIBUTION.user / 100; // 0.75

const SLIDERS = [
  {
    key: 'solar',
    label: 'Solar Production',
    unit: 'kWh/mo',
    icon: Sun,
    iconBg: 'bg-solar/15',
    iconColor: 'text-solar',
    resultBg: 'bg-solar/8',
    resultColor: 'text-solar',
    rate: BASE_REWARD_RATES.solarProduction,
    min: 0,
    max: 1500,
    step: 10,
    default: 400,
    hint: 'Avg. US solar home: 300–900 kWh/mo',
  },
  {
    key: 'battery',
    label: 'Battery Export',
    unit: 'kWh/mo',
    icon: Battery,
    iconBg: 'bg-eco/15',
    iconColor: 'text-eco',
    resultBg: 'bg-eco/8',
    resultColor: 'text-eco',
    rate: BASE_REWARD_RATES.batteryDischarge,
    min: 0,
    max: 600,
    step: 5,
    default: 100,
    hint: 'Powerwall: ~13.5 kWh per cycle',
  },
  {
    key: 'evMiles',
    label: 'EV Miles Driven',
    unit: 'mi/mo',
    icon: Car,
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    resultBg: 'bg-primary/8',
    resultColor: 'text-primary',
    rate: BASE_REWARD_RATES.evMiles,
    min: 0,
    max: 3000,
    step: 25,
    default: 500,
    hint: 'US avg: ~1,200 mi/mo',
  },
  {
    key: 'evCharging',
    label: 'EV Charging (Home + DC Fast)',
    unit: 'kWh/mo',
    icon: BatteryCharging,
    iconBg: 'bg-token/15',
    iconColor: 'text-token',
    resultBg: 'bg-token/8',
    resultColor: 'text-token',
    rate: BASE_REWARD_RATES.evCharging,
    min: 0,
    max: 800,
    step: 10,
    default: 150,
    hint: 'Model 3: ~250 Wh/mi × your miles',
  },
] as const;

type SliderKey = typeof SLIDERS[number]['key'];

export function EarningsCalculatorSection() {
  const [values, setValues] = useState<Record<SliderKey, number>>(
    Object.fromEntries(SLIDERS.map((s) => [s.key, s.default])) as Record<SliderKey, number>
  );

  const perActivity = SLIDERS.map((s) => ({
    ...s,
    tokens: Math.floor(values[s.key] * s.rate * USER_SHARE),
  }));

  const totalTokens = perActivity.reduce((sum, s) => sum + s.tokens, 0);
  const totalUsd = totalTokens * PRICES.launchFloor;

  return (
    <section id="calculator" className="py-20 md:py-28 px-4 bg-background scroll-mt-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Earnings Estimator
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            What would <span className="text-primary">YOU</span> earn?
          </h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Dial in your setup. Every activity earns $ZSOLAR.
          </p>
        </motion.div>

        {/* Calculator card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-7"
        >
          {SLIDERS.map((slider, i) => {
            const activity = perActivity[i];
            const Icon = slider.icon;
            return (
              <div key={slider.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${slider.iconBg}`}>
                      <Icon className={`h-4 w-4 ${slider.iconColor}`} />
                    </div>
                    <span className="font-medium text-foreground text-sm">{slider.label}</span>
                  </div>
                  <span className="tabular-nums font-semibold text-foreground text-sm">
                    {values[slider.key].toLocaleString()} {slider.unit}
                  </span>
                </div>
                <Slider
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={[values[slider.key]]}
                  onValueChange={([v]) => setValues((prev) => ({ ...prev, [slider.key]: v }))}
                  className="w-full"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{slider.hint}</span>
                  <span className={`text-xs font-semibold ${slider.resultColor}`}>
                    +{activity.tokens.toLocaleString()} $ZSOLAR/mo
                  </span>
                </div>
              </div>
            );
          })}

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Total output */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Zap className="h-3.5 w-3.5 text-solar" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly $ZSOLAR</span>
              </div>
              <motion.p
                key={totalTokens}
                initial={{ scale: 0.92, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-2xl md:text-3xl font-bold text-foreground tabular-nums"
              >
                {totalTokens.toLocaleString()}
              </motion.p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Est. USD Value</span>
              </div>
              <motion.p
                key={totalUsd}
                initial={{ scale: 0.92, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-2xl md:text-3xl font-bold text-primary tabular-nums"
              >
                {formatUSD(totalUsd)}
              </motion.p>
            </div>
          </div>

          {/* Footnote */}
          <p className="text-center text-xs text-muted-foreground">
            Mainnet rates: 1 $ZSOLAR per kWh or mile. 75% of minted tokens go to your wallet. USD value at $0.10 launch floor price.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
