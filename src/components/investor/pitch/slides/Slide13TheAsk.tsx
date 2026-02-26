import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Code, Target, Users, Scale, Shield, Zap } from 'lucide-react';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

export function Slide13TheAsk() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="The Ask" number={13} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[hsl(207,90%,54%)]/10 blur-[150px]" />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
          <img src={zenLogo} alt="ZenSolar" className="h-10 w-auto mx-auto mb-4 drop-shadow-[0_0_30px_rgba(34,197,94,0.3)]" />
          <h2 className="text-[52px] font-bold mb-3">
            Raising <span className="text-[hsl(45,93%,47%)]">$1.5M–$2M</span> Pre-Seed
          </h2>
          <p className="text-[22px] text-white/50">
            Capital to dominate the category before the window closes
          </p>
        </motion.div>

        {/* Use of Funds */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {[
            { pct: '38%', label: 'Team', desc: 'Founder + 2 devs + growth hire (24mo)', icon: Code, color: 'hsl(207,90%,54%)' },
            { pct: '17%', label: 'LP Seed', desc: 'Day-one token price stability', icon: Target, color: 'hsl(142,76%,50%)' },
            { pct: '10%', label: 'Growth', desc: 'Acquisition + installer network', icon: Users, color: 'hsl(45,93%,47%)' },
            { pct: '7%', label: 'Legal & IP', desc: 'Patent, token opinion letter', icon: Scale, color: 'hsl(280,68%,60%)' },
            { pct: '5%', label: 'Infra', desc: 'RPC, monitoring, hosting', icon: Zap, color: 'hsl(207,70%,70%)' },
            { pct: '3%', label: 'Audit', desc: 'Smart contract security audit', icon: Shield, color: 'hsl(0,70%,60%)' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="p-4 rounded-xl border border-white/10 bg-white/5 text-center">
              <item.icon className="w-6 h-6 mx-auto mb-2" style={{ color: item.color }} />
              <p className="text-[26px] font-black" style={{ color: item.color }}>{item.pct}</p>
              <p className="text-[14px] font-semibold mt-1">{item.label}</p>
              <p className="text-[11px] text-white/40 mt-1 leading-tight">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Roadmap */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="p-5 rounded-2xl border border-white/10 bg-white/5">
          <p className="text-[14px] font-mono tracking-wider text-white/30 mb-4">UNICORN TRAJECTORY</p>
          <div className="grid grid-cols-4 gap-4">
            {[
              { phase: 'Pre-Seed', raise: '$1.5M–$2M', target: '10K users', valuation: '$8M–$12M', timeline: 'Now' },
              { phase: 'Seed', raise: '$5M', target: '50K users', valuation: '$30M–$50M', timeline: 'Q4 2026' },
              { phase: 'Series A', raise: '$15M', target: '250K users', valuation: '$150M+', timeline: '2027' },
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
