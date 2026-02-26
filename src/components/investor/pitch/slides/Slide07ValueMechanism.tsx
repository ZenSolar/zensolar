import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';

export function Slide07ValueMechanism() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Value Mechanism" number={7} />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[48px] font-bold mb-3">
          Deterministic <span className="text-[hsl(142,76%,50%)]">Price Floor</span>
        </motion.h2>
        <p className="text-[20px] text-white/50 mb-12 max-w-[800px]">
          Unlike speculative tokens, $ZSOLAR has a mathematically guaranteed minimum value.
        </p>

        {/* The Formula */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          className="p-10 rounded-2xl border border-[hsl(207,90%,54%)]/20 bg-[hsl(207,90%,54%)]/5 text-center mb-12">
          <p className="text-[14px] font-mono text-white/40 mb-4 tracking-wider">PRICE FLOOR FORMULA</p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-[20px] text-white/60">USDC Reserve</p>
              <div className="w-full h-px bg-white/20 my-3" />
              <p className="text-[20px] text-white/60">Tokens in Pool</p>
            </div>
            <p className="text-[48px] font-light text-white/30">=</p>
            <div>
              <p className="text-[48px] font-black text-[hsl(142,76%,50%)]">Price Floor</p>
              <p className="text-[16px] text-white/40 mt-1">Guaranteed minimum $/token</p>
            </div>
          </div>
        </motion.div>

        {/* Why it only goes up */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { title: 'Burns Reduce Supply', desc: '20% mint burn + 3% transfer burn permanently destroys tokens every interaction', color: 'hsl(0,84%,60%)' },
            { title: 'Subscriptions Add Reserve', desc: '50% of every $9.99–$19.99 subscription flows into the USDC liquidity pool', color: 'hsl(207,90%,54%)' },
            { title: 'Floor Only Rises', desc: 'Numerator grows (more USDC), denominator shrinks (more burns). Math guarantees trajectory.', color: 'hsl(142,76%,50%)' },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              className="p-5 rounded-xl border border-white/10 bg-white/5">
              <p className="text-[17px] font-bold mb-2" style={{ color: item.color }}>{item.title}</p>
              <p className="text-[14px] text-white/50 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
