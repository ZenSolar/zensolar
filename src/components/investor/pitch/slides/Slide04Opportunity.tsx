import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Building2, Zap, Wrench } from 'lucide-react';

export function Slide04Opportunity() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="The Opportunity" number={4} />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        {/* TAM section */}
        <div className="grid grid-cols-2 gap-16 mb-12">
          <div>
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-[52px] font-bold leading-tight mb-4">
              A <span className="text-[hsl(45,93%,47%)]">$240B</span> Market<br />Nobody's Tokenized
            </motion.h2>
            <p className="text-[18px] text-white/50 leading-relaxed">
              1.5 billion solar-capable homes globally. 4M+ US solar + EV households today. 
              Zero platforms tokenize verified energy production as a real-world asset.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-5">
            {[
              { label: 'TAM', value: '1.5B', desc: 'Global solar-capable homes', color: 'hsl(207,90%,54%)' },
              { label: 'SAM', value: '33M', desc: 'US + EU solar households', color: 'hsl(142,76%,50%)' },
              { label: 'SOM', value: '4.2M', desc: 'US solar + EV owners (Year 1 target)', color: 'hsl(45,93%,47%)' },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-5 p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="w-16 text-center">
                  <p className="text-[13px] font-mono text-white/40 uppercase">{item.label}</p>
                </div>
                <p className="text-[32px] font-black" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[15px] text-white/50">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Platform Optionality */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <p className="text-[13px] font-mono tracking-[0.3em] uppercase text-white/30 mb-4">One Patent. Multiple Markets.</p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Building2, title: 'Commercial Solar & Fleet EV', desc: 'SEGI scaled to warehouses, campuses, and commercial fleets. 10–100x capacity per account.', color: 'hsl(207,90%,54%)' },
              { icon: Zap, title: 'Grid Demand Response & VPP', desc: 'Manufacturer-agnostic aggregation for utility dispatch signaling and capacity payments.', color: 'hsl(142,76%,50%)' },
              { icon: Wrench, title: 'Installer Mint Network', desc: 'B2B channel: installers mint 1 $ZSOLAR per 1 kW installed. Verified on-chain portfolio.', color: 'hsl(45,93%,47%)' },
            ].map((item, i) => (
              <div key={item.title} className="p-5 rounded-xl border border-white/10 bg-white/5">
                <item.icon className="w-7 h-7 mb-3" style={{ color: item.color }} />
                <p className="text-[17px] font-semibold mb-2" style={{ color: item.color }}>{item.title}</p>
                <p className="text-[14px] text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
