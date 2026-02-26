import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, ArrowRight } from 'lucide-react';

export function Slide02Catalyst() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="The Catalyst" number={2} />
      
      <div className="absolute inset-0 flex px-16 pt-24 pb-20">
        <div className="flex flex-col justify-center w-full">
          {/* Headline */}
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="text-[56px] font-bold leading-[1.1] mb-4">
            The Incentive Cliff Is{' '}
            <span className="text-[hsl(0,84%,60%)]">Here</span>
          </motion.h2>
          <p className="text-[22px] text-white/50 mb-14 max-w-[800px]">
            Federal clean energy incentives are being eliminated. 50M+ households face a sudden drop in solar & EV economics.
          </p>

          {/* Two columns */}
          <div className="grid grid-cols-2 gap-12">
            {/* What's disappearing */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <TrendingDown className="w-6 h-6 text-[hsl(0,84%,60%)]" />
                <span className="text-[18px] font-semibold text-[hsl(0,84%,60%)]">What's Disappearing</span>
              </div>
              {[
                { label: '30% Solar ITC', desc: 'Investment Tax Credit eliminated via "One Big Beautiful Bill"' },
                { label: '$7,500 EV Credit', desc: 'Federal EV purchase incentive being removed' },
                { label: 'Net Metering', desc: 'States rolling back utility buyback rates nationwide' },
              ].map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex items-start gap-4 p-5 rounded-xl border border-[hsl(0,84%,60%)]/20 bg-[hsl(0,84%,60%)]/5">
                  <AlertTriangle className="w-5 h-5 text-[hsl(0,84%,60%)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[18px] font-semibold">{item.label}</p>
                    <p className="text-[15px] text-white/50">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ZenSolar fills the gap */}
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-4">
                <ArrowRight className="w-6 h-6 text-[hsl(142,76%,50%)]" />
                <span className="text-[18px] font-semibold text-[hsl(142,76%,50%)]">ZenSolar Fills the Vacuum</span>
              </div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                className="p-6 rounded-xl border border-[hsl(142,76%,36%)]/30 bg-[hsl(142,76%,36%)]/5 space-y-4">
                <p className="text-[20px] font-bold text-[hsl(142,76%,50%)]">Market-Driven Replacement</p>
                <p className="text-[16px] text-white/60 leading-relaxed">
                  ZenSolar creates a <strong className="text-white">permanent, market-driven incentive</strong> that doesn't depend on government policy. Every kWh earns $ZSOLAR tokens backed by real energy production — turning solar panels into autonomous income machines.
                </p>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-[14px] text-white/40 italic">
                    "SolarCity made solar affordable. ZenSolar makes solar profitable — forever."
                  </p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-[15px] text-white/50">The SolarCity playbook, evolved for the tokenization era</p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
