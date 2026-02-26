import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Sun, Zap, Coins, Lock } from 'lucide-react';

export function Slide05Solution() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="The Solution" number={5} />

      {/* Large glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(45,93%,47%)]/8 blur-[120px]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-16 pt-16 pb-16">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="text-center mb-12">
          <h2 className="text-[72px] font-black leading-[1]">
            1 kWh = 1 <span className="text-[hsl(45,93%,47%)]">$ZSOLAR</span>
          </h2>
          <p className="text-[24px] text-white/50 mt-4">
            The simplest formula in crypto. Backed by physics, not promises.
          </p>
        </motion.div>

        {/* Flow */}
        <div className="flex items-center gap-6 mb-14">
          {[
            { icon: Sun, label: 'Produce', desc: 'Solar panels generate kWh', color: 'hsl(45,93%,47%)' },
            { icon: Zap, label: 'Verify', desc: 'SEGI confirms production', color: 'hsl(207,90%,54%)' },
            { icon: Coins, label: 'Mint', desc: 'Tokens auto-minted', color: 'hsl(142,76%,50%)' },
            { icon: Lock, label: 'Retire', desc: 'Energy cryptographically locked', color: 'hsl(280,68%,60%)' },
          ].map((step, i) => (
            <motion.div key={step.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className="flex flex-col items-center gap-3">
              {i > 0 && (
                <div className="absolute -left-8 top-1/2 -translate-y-1/2">
                </div>
              )}
              <div className="w-20 h-20 rounded-2xl border border-white/15 bg-white/5 flex items-center justify-center">
                <step.icon className="w-10 h-10" style={{ color: step.color }} />
              </div>
              <p className="text-[18px] font-bold">{step.label}</p>
              <p className="text-[14px] text-white/40 text-center w-[160px]">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Scarcity comparison */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="grid grid-cols-2 gap-8 max-w-[900px]">
          <div className="p-5 rounded-xl border border-white/10 bg-white/5 text-center">
            <p className="text-[14px] text-white/40 mb-2">Bitcoin's Scarcity</p>
            <p className="text-[20px] font-bold">Math limits supply</p>
            <p className="text-[14px] text-white/30 mt-1">Algorithmic 21M cap</p>
          </div>
          <div className="p-5 rounded-xl border border-[hsl(142,76%,36%)]/30 bg-[hsl(142,76%,36%)]/5 text-center">
            <p className="text-[14px] text-[hsl(142,76%,50%)] mb-2">$ZSOLAR's Scarcity</p>
            <p className="text-[20px] font-bold">Physics + Math</p>
            <p className="text-[14px] text-white/40 mt-1">Your roof can't produce that energy twice</p>
          </div>
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
