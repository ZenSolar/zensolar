import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Sun, Car, Zap, DollarSign } from 'lucide-react';
import {
  BASE_REWARD_RATES,
  MINT_DISTRIBUTION,
  PRICES,
  formatUSD,
} from '@/lib/tokenomics';

// At mainnet rates: 1 $ZSOLAR per kWh solar, 1 $ZSOLAR per EV mile
// After 75% user distribution from minting
const USER_SHARE = MINT_DISTRIBUTION.user / 100; // 0.75

const SOLAR_MIN = 0;
const SOLAR_MAX = 1500;
const SOLAR_DEFAULT = 400;

const EV_MIN = 0;
const EV_MAX = 3000;
const EV_DEFAULT = 500;

export function EarningsCalculatorSection() {
  const [solarKwh, setSolarKwh] = useState(SOLAR_DEFAULT);
  const [evMiles, setEvMiles] = useState(EV_DEFAULT);

  const solarTokens = solarKwh * BASE_REWARD_RATES.solarProduction * USER_SHARE;
  const evTokens = evMiles * BASE_REWARD_RATES.evMiles * USER_SHARE;
  const totalTokens = Math.floor(solarTokens + evTokens);
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
            Move the sliders to match your setup. See your estimated monthly $ZSOLAR rewards.
          </p>
        </motion.div>

        {/* Calculator card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-8"
        >
          {/* Solar slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-solar/15">
                  <Sun className="h-4 w-4 text-solar" />
                </div>
                <span className="font-medium text-foreground text-sm">Solar Production</span>
              </div>
              <span className="tabular-nums font-semibold text-foreground text-sm">
                {solarKwh.toLocaleString()} kWh/mo
              </span>
            </div>
            <Slider
              min={SOLAR_MIN}
              max={SOLAR_MAX}
              step={10}
              value={[solarKwh]}
              onValueChange={([v]) => setSolarKwh(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 kWh</span>
              <span>1,500 kWh</span>
            </div>
            {/* Solar sub-result */}
            <div className="flex items-center justify-between rounded-lg bg-solar/8 px-3 py-2">
              <span className="text-xs text-muted-foreground">Solar rewards</span>
              <span className="text-xs font-semibold text-solar">
                +{Math.floor(solarTokens).toLocaleString()} $ZSOLAR/mo
              </span>
            </div>
          </div>

          {/* EV slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                  <Car className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-foreground text-sm">EV Miles Driven</span>
              </div>
              <span className="tabular-nums font-semibold text-foreground text-sm">
                {evMiles.toLocaleString()} mi/mo
              </span>
            </div>
            <Slider
              min={EV_MIN}
              max={EV_MAX}
              step={25}
              value={[evMiles]}
              onValueChange={([v]) => setEvMiles(v)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 mi</span>
              <span>3,000 mi</span>
            </div>
            {/* EV sub-result */}
            <div className="flex items-center justify-between rounded-lg bg-primary/8 px-3 py-2">
              <span className="text-xs text-muted-foreground">EV rewards</span>
              <span className="text-xs font-semibold text-primary">
                +{Math.floor(evTokens).toLocaleString()} $ZSOLAR/mo
              </span>
            </div>
          </div>

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
            Estimates based on mainnet rates: 1 $ZSOLAR per kWh produced and per EV mile. 75% of minted tokens go to your wallet. USD value at $0.10 launch floor price.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
