import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { DollarSign, Flame, ArrowRight, TrendingUp, Award } from 'lucide-react';

export function Slide09Revenue() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Revenue Model" number={9} />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[48px] font-bold mb-10">
          Five Revenue Streams, <span className="text-[hsl(45,93%,47%)]">Day One</span>
        </motion.h2>

        <div className="grid grid-cols-5 gap-4 mb-10">
          {[
            { icon: DollarSign, title: 'Subscription SaaS', stat: '$9.99–$19.99/mo', desc: 'Auto-minting access', color: 'hsl(207,90%,54%)' },
            { icon: ArrowRight, title: '7% Transfer Tax', stat: '3%+2%+2%', desc: 'Burn · LP · Treasury', color: 'hsl(0,84%,60%)' },
            { icon: Flame, title: 'Mint Distribution', stat: '20%+3%+2%', desc: 'Burn · LP · Treasury', color: 'hsl(45,93%,47%)' },
            { icon: TrendingUp, title: 'Treasury Growth', stat: 'Passive', desc: 'Compounding reserve', color: 'hsl(142,76%,50%)' },
            { icon: Award, title: 'NFT Fees', stat: 'Per Mint', desc: 'Milestone NFT charges', color: 'hsl(280,68%,60%)' },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-5 rounded-xl border border-white/10 bg-white/5 text-center">
              <item.icon className="w-8 h-8 mx-auto mb-3" style={{ color: item.color }} />
              <p className="text-[15px] font-bold mb-1">{item.title}</p>
              <p className="text-[20px] font-black" style={{ color: item.color }}>{item.stat}</p>
              <p className="text-[12px] text-white/40 mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Flywheel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="p-6 rounded-2xl border border-[hsl(207,90%,54%)]/20 bg-[hsl(207,90%,54%)]/5">
          <p className="text-[14px] font-mono tracking-[0.2em] uppercase text-white/30 mb-4">THE FLYWHEEL</p>
          <div className="flex items-center justify-between px-8">
            {['More Users', 'More Revenue', 'More LP Depth', 'Higher Floor', 'More Users'].map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className={`text-[16px] font-semibold ${i === 4 ? 'text-[hsl(142,76%,50%)]' : 'text-white/70'}`}>{step}</span>
                {i < 4 && <ArrowRight className="w-5 h-5 text-[hsl(207,90%,54%)]/50" />}
              </div>
            ))}
          </div>
          <p className="text-center mt-4 text-[14px] text-white/30">
            At <strong className="text-white/60">25,000 subscribers</strong>, monthly LP injections match seed capital. Self-sustaining.
          </p>
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
