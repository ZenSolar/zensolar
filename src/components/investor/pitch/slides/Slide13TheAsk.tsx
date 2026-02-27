import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Rocket, Target, Users, Globe } from 'lucide-react';

export function Slide13TheAsk() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="The Ask" number={13} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[hsl(207,90%,54%)]/10 blur-[150px]" />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-10">
          <h2 className="text-[56px] font-bold mb-3">
            Raising <span className="text-[hsl(45,93%,47%)]">$500K</span> Pre-Seed
          </h2>
          <p className="text-[22px] text-white/50">
            To scale from live beta to 10,000 paying subscribers
          </p>
        </motion.div>

        {/* Use of Funds */}
        <div className="grid grid-cols-4 gap-5 mb-10">
          {[
            { pct: '40%', label: 'Engineering', desc: 'SEGI expansion, smart contracts, mobile app', icon: Rocket, color: 'hsl(207,90%,54%)' },
            { pct: '25%', label: 'LP Seeding', desc: 'Initial USDC/ZSOLAR liquidity pool', icon: Target, color: 'hsl(142,76%,50%)' },
            { pct: '20%', label: 'Growth', desc: 'Community, partnerships, installer network', icon: Users, color: 'hsl(45,93%,47%)' },
            { pct: '15%', label: 'Operations', desc: 'Legal, compliance, infrastructure', icon: Globe, color: 'hsl(280,68%,60%)' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-5 rounded-xl border border-white/10 bg-white/5 text-center">
              <item.icon className="w-7 h-7 mx-auto mb-3" style={{ color: item.color }} />
              <p className="text-[32px] font-black" style={{ color: item.color }}>{item.pct}</p>
              <p className="text-[16px] font-semibold mt-1">{item.label}</p>
              <p className="text-[13px] text-white/40 mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Roadmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="p-6 rounded-2xl border border-white/10 bg-white/5">
          <p className="text-[14px] font-mono tracking-wider text-white/30 mb-4">UNICORN TRAJECTORY</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { phase: 'Pre-Seed', raise: '$500K', target: '10K users', valuation: '$5M', timeline: 'Now' },
              { phase: 'Seed', raise: '$2M', target: '50K users', valuation: '$20M', timeline: 'Q4 2026' },
              { phase: 'Series A', raise: '$10M', target: '250K users', valuation: '$100M', timeline: '2027' },
              { phase: 'Series C', raise: '$50M+', target: '1M users', valuation: '$1.2B–$2.4B', timeline: '2029' },
            ].map((item, i) => (
              <div key={item.phase} className={`p-4 rounded-xl border ${i === 0 ? 'border-[hsl(45,93%,47%)]/30 bg-[hsl(45,93%,47%)]/5' : 'border-white/10 bg-white/[0.02]'}`}>
                <p className={`text-[14px] font-bold mb-2 ${i === 0 ? 'text-[hsl(45,93%,47%)]' : 'text-white/60'}`}>{item.phase}</p>
                <p className="text-[20px] font-black text-white">{item.raise}</p>
                <p className="text-[13px] text-white/40 mt-2">{item.target}</p>
                <p className="text-[13px] font-semibold text-[hsl(142,76%,50%)] mt-1">{item.valuation}</p>
                <p className="text-[12px] text-white/30 mt-1">{item.timeline}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
