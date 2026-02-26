import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';

export function Slide10UnitEconomics() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Unit Economics" number={10} />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[48px] font-bold mb-3">
          <span className="text-[hsl(142,76%,50%)]">10–16x</span> LTV:CAC Advantage
        </motion.h2>
        <p className="text-[20px] text-white/50 mb-12 max-w-[700px]">
          Clean energy hardware creates built-in switching costs. Once connected, churn is minimal.
        </p>

        <div className="grid grid-cols-2 gap-12">
          {/* Key Metrics */}
          <div className="space-y-5">
            {[
              { metric: 'CAC', value: '$15–$25', desc: 'Organic + referral-driven. Solar communities are tightly networked.', color: 'hsl(207,90%,54%)' },
              { metric: 'LTV', value: '$240–$400', desc: '$9.99–$19.99/mo × 24+ month avg retention. Hardware lock-in.', color: 'hsl(142,76%,50%)' },
              { metric: 'LTV:CAC', value: '10–16x', desc: 'SaaS benchmark is 3x. We exceed this because solar owners don\'t churn.', color: 'hsl(45,93%,47%)' },
              { metric: 'Payback', value: '<30 days', desc: 'First subscription payment recoups acquisition cost.', color: 'hsl(280,68%,60%)' },
            ].map((item, i) => (
              <motion.div key={item.metric} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}
                className="flex items-center gap-5 p-5 rounded-xl border border-white/10 bg-white/5">
                <div className="w-20 text-right">
                  <p className="text-[13px] font-mono text-white/40">{item.metric}</p>
                </div>
                <p className="text-[28px] font-black w-36" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[14px] text-white/50 flex-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Revenue projections */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
            className="p-6 rounded-xl border border-white/10 bg-white/5">
            <p className="text-[14px] font-mono tracking-wider text-white/30 mb-5">REVENUE TRAJECTORY</p>
            <div className="space-y-4">
              {[
                { users: '10K', arr: '$1.2M–$2.4M', phase: 'Post-Seed' },
                { users: '50K', arr: '$6M–$12M', phase: 'Series A' },
                { users: '250K', arr: '$30M–$60M', phase: 'Series B' },
                { users: '1M', arr: '$120M–$240M', phase: 'Series C' },
              ].map((row, i) => (
                <div key={row.phase} className="flex items-center gap-4">
                  <div className="w-full bg-white/5 rounded-lg overflow-hidden h-12 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${[12, 28, 55, 100][i]}%` }}
                      transition={{ delay: 0.9 + i * 0.15, duration: 0.6 }}
                      className="absolute inset-y-0 left-0 rounded-lg"
                      style={{ background: `linear-gradient(90deg, hsl(207,90%,54%), hsl(142,76%,36%))`, opacity: 0.3 + i * 0.2 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <span className="text-[14px] font-semibold">{row.users} users</span>
                      <span className="text-[16px] font-bold text-[hsl(142,76%,50%)]">{row.arr}</span>
                    </div>
                  </div>
                  <span className="text-[12px] text-white/40 w-20">{row.phase}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <p className="text-[14px] text-white/40">
                <strong className="text-[hsl(45,93%,47%)]">$1.2B–$2.4B</strong> valuation at 1M users
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
