import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Users, Zap, Award, Code } from 'lucide-react';

export function Slide11Traction() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Traction & Beta" number={3} />

      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[52px] font-bold mb-3 leading-tight">
          Live on Base L2 Blockchain testnet. <span className="text-[hsl(142,76%,50%)]">Real devices.</span> Real mints.
        </motion.h2>
        <p className="text-[22px] text-white/55 mb-10 max-w-[1100px]">
          Every number below is on-chain or in the database today — no projections, no mockups.
        </p>

        {/* Hero stats */}
        <div className="grid grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Beta users', value: '11', sub: 'real wallets, real homes', color: 'hsl(207,90%,54%)' },
            { label: 'kWh verified', value: '3.34M', sub: 'across Tesla, Enphase, Wallbox', color: 'hsl(207,90%,54%)' },
            { label: '$ZSOLAR minted', value: '496K', sub: '45 on-chain mint txns', color: 'hsl(207,90%,54%)' },
            { label: 'Pioneer NFTs', value: '6', sub: 'minted on Base Sepolia', color: 'hsl(207,90%,54%)' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-6 rounded-xl border border-white/10 bg-white/5 text-center">
              <p className="text-[44px] font-black leading-none" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[15px] font-semibold mt-3 text-white/80">{item.label}</p>
              <p className="text-[12px] text-white/40 mt-1">{item.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* What's live */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="grid grid-cols-3 gap-6">
          {[
            { title: 'OEMs Live', items: ['Tesla (solar + home charging)', 'Enphase (inverters)', 'SolarEdge (PV)', 'Wallbox (EV charging)'] },
            { title: 'Protocol Live', items: ['Smart contracts deployed', 'Proof-of-Delta verification', 'Device Watermark Registry', 'Base Sepolia anchored'] },
            { title: 'IP & Defensibility', items: ['Non-provisional patent filed', 'Mint-on-Proof™ trademark', 'Proof-of-Genesis receipt live', '5 device providers ingested'] },
          ].map((col) => (
            <div key={col.title} className="p-5 rounded-xl border border-white/10 bg-white/5">
              <p className="text-[17px] font-bold mb-3 text-[hsl(207,90%,54%)]">{col.title}</p>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-[15px] text-white/70">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(142,76%,50%)] shrink-0" />
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
