import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Users, Zap, Award, Code } from 'lucide-react';

export function Slide11Traction() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Traction & Beta" number={11} />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[48px] font-bold mb-3">
          Live Beta. <span className="text-[hsl(142,76%,50%)]">Real Users.</span> Real Energy.
        </motion.h2>
        <p className="text-[20px] text-white/50 mb-12 max-w-[800px]">
          ZenSolar is live in beta with paying users, verified energy production, and minted tokens.
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {[
            { icon: Users, label: 'Beta Users', value: 'Growing', color: 'hsl(207,90%,54%)' },
            { icon: Zap, label: 'kWh Verified', value: 'Live', color: 'hsl(142,76%,50%)' },
            { icon: Award, label: 'Pioneer NFTs', value: 'Minted', color: 'hsl(45,93%,47%)' },
            { icon: Code, label: 'Patent', value: 'Filed', color: 'hsl(280,68%,60%)' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-6 rounded-xl border border-white/10 bg-white/5 text-center">
              <item.icon className="w-8 h-8 mx-auto mb-3" style={{ color: item.color }} />
              <p className="text-[28px] font-black" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[14px] text-white/40 mt-1">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* What's built */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="grid grid-cols-3 gap-6">
          {[
            { title: 'Full-Stack Platform', items: ['Dashboard with live energy data', 'Multi-device support (Solar, EV, Battery)', 'NFT milestone system', 'Token store & redemption'] },
            { title: 'SEGI Integration', items: ['Tesla API connected', 'Enphase API connected', 'SolarEdge integration', 'Wallbox EV charging'] },
            { title: 'Blockchain Layer', items: ['Smart contracts deployed', 'Proof-of-Delta verification', 'Device Watermark Registry', 'Base L2 (Coinbase)'] },
          ].map((col) => (
            <div key={col.title} className="p-5 rounded-xl border border-white/10 bg-white/5">
              <p className="text-[16px] font-bold mb-3 text-[hsl(207,90%,54%)]">{col.title}</p>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[14px] text-white/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142,76%,50%)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
