import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Coins, CreditCard, Database, ArrowRight, Sparkles } from 'lucide-react';

/**
 * Revenue Model — engine order locked Jun 2026 (corrections pass):
 *   01) Monthly Subscription + Deason AI
 *   02) Token Economics (core product, long-term primary revenue driver)
 *   03) Aggregated Energy Data (secondary)
 */
export function Slide09Revenue() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Revenue Model" number={11} />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[48px] font-bold mb-10">
          Three Revenue Engines, <span className="text-[hsl(45,93%,47%)]">One Flywheel</span>
        </motion.h2>

        <div className="grid grid-cols-3 gap-5 mb-10">
          {[
            {
              num: '01',
              icon: CreditCard,
              auxIcon: Sparkles,
              title: 'Monthly Subscription + Deason AI',
              stat: '$9.99 / $19.99 / $49.99 + $4.99 AI',
              desc: 'Base sub required to be a ZenSolar user and mint tokens. Deason AI is the $4.99/mo premium add-on: Monthly Clean Energy Report, bill analysis, rate-plan optimization, device-aware advice. 50% of every sub dollar → LP · 50% → treasury.',
              color: 'hsl(142,76%,50%)',
            },
            {
              num: '02',
              icon: Coins,
              title: 'Token Economics',
              stat: '1T cap · 50 user · 25 LP · 20 burn · 5 treasury',
              desc: 'Core product and primary long-term revenue driver. 1T hard cap. Every verified kWh shows 1:1 in the user\'s wallet, and the protocol matches it 1-for-1 in the background — 25% LP, 20% burn, 5% treasury. Separate 3% transfer tax recycles to LP on sales. Every mint deepens liquidity and tightens supply in the same transaction.',
              color: 'hsl(45,93%,47%)',
              emphasized: true,
            },
            {
              num: '03',
              icon: Database,
              title: 'Aggregated Energy Data',
              stat: '$2B+ TAM',
              desc: 'Anonymized, multi-OEM verified telemetry sold to utilities, ISOs, and REC registries. Only possible because we built the first unified multi-OEM monitoring layer.',
              color: 'hsl(207,90%,54%)',
            },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              className={`p-5 rounded-xl border text-left ${item.emphasized ? 'border-[hsl(45,93%,47%)]/40 bg-[hsl(45,93%,47%)]/[0.06]' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono tracking-[0.22em] uppercase font-semibold" style={{ color: item.color }}>
                  Engine {item.num}
                </span>
                <div className="flex items-center gap-1.5">
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  {item.auxIcon && <item.auxIcon className="w-6 h-6 opacity-70" style={{ color: item.color }} />}
                </div>
              </div>
              <p className="text-[18px] font-bold text-white/95">{item.title}</p>
              <p className="text-[18px] font-black mt-1" style={{ color: item.color }}>{item.stat}</p>
              <p className="text-[13px] text-white/60 mt-3 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-start gap-3 px-4 py-3 rounded-3xl bg-card/30 border border-border/50 text-sm shadow-sm">
            <span className="text-amber-500 text-xl leading-none">⚡</span>
            <div className="flex flex-wrap items-baseline gap-x-1.5 text-left">
              <span className="uppercase tracking-[0.5px] text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                PHASE 2 UNLOCK
              </span>
              <span className="font-medium text-foreground">
                VPP tokenization — tech already built. Real-time $ZSOLAR minting + monthly cash settlement for grid dispatch events.
              </span>
            </div>
          </div>
        </div>

        {/* Flywheel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="p-6 rounded-2xl border border-[hsl(207,90%,54%)]/20 bg-[hsl(207,90%,54%)]/5">
          <p className="text-[14px] font-mono tracking-[0.2em] uppercase text-white/30 mb-4">THE FLYWHEEL · Verified kWh → Data → AI → $ZSOLAR</p>
          <div className="flex items-center justify-between px-8">
            {['Paid Sub', 'Verified kWh', 'Data + AI', 'Token Demand', 'Paid Sub'].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className={`text-[16px] font-semibold ${i === 4 ? 'text-[hsl(142,76%,50%)]' : 'text-white/70'}`}>{step}</span>
                {i < 4 && <ArrowRight className="w-5 h-5 text-[hsl(207,90%,54%)]/50" />}
              </div>
            ))}
          </div>
          <p className="text-center mt-4 text-[14px] text-white/30">
            At <strong className="text-white/60">25,000 subscribers</strong>, monthly LP injections match seed capital. Self-sustaining.
          </p>
          <p className="text-center mt-2 text-[13px] text-[hsl(45,93%,47%)]/80">
            <strong>Continuous 20% burn</strong> on every mint · perpetual deflation, no scheduled cliff.
          </p>
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
