import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Sun, Zap, Coins, Lock } from 'lucide-react';

export function Slide05Solution() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="The Solution" number={5} />

      {/* Large glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(45,93%,47%)]/8 blur-[120px]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-16 pt-20 pb-20">
        {/* DOMINANT: Formula */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="text-center mb-10">
          <h2 className="text-[88px] font-black leading-[1]">
            1 kWh = 1 <span className="text-[hsl(45,93%,47%)]">$ZSOLAR</span>
          </h2>
          <p className="text-[26px] text-white/55 mt-4">
            The simplest formula in crypto. Backed by physics, not promises.
          </p>
        </motion.div>

        {/* Flow */}
        <div className="flex items-center gap-8 mb-12">
          {[
            { icon: Sun, label: 'Produce', desc: 'Solar panels generate kWh', color: 'hsl(45,93%,47%)' },
            { icon: Zap, label: 'Verify', desc: 'Proof-of-Genesis™ confirms production', color: 'hsl(207,90%,54%)' },
            { icon: Coins, label: 'Mint', desc: 'Tokens auto-minted', color: 'hsl(142,76%,50%)' },
            { icon: Lock, label: 'Retire', desc: 'Energy cryptographically locked', color: 'hsl(280,68%,60%)' },
          ].map((step, i) => (
            <motion.div key={step.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center">
                <step.icon className="w-10 h-10" style={{ color: step.color }} />
              </div>
              <p className="text-[18px] font-bold">{step.label}</p>
              <p className="text-[14px] text-white/40 text-center w-[160px]">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* SUBORDINATE: Market opportunity, condensed from former Slide 4 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
          className="w-full max-w-[1500px]">
          <p className="text-[13px] font-mono tracking-[0.3em] uppercase text-white/35 mb-3 text-center">
            A $240B Market Nobody's Tokenized
          </p>
          <div className="grid grid-cols-3 gap-5">
            {[
              { label: 'TAM', value: '1.5B', desc: 'Global solar-capable homes', color: 'hsl(207,90%,54%)' },
              { label: 'SAM', value: '33M', desc: 'US + EU solar households', color: 'hsl(142,76%,50%)' },
              { label: 'SOM', value: '4.2M', desc: 'US solar + EV owners (Year 1)', color: 'hsl(45,93%,47%)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-[13px] font-mono text-white/40 uppercase w-12">{item.label}</p>
                <p className="text-[34px] font-black" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[15px] text-white/55 flex-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
