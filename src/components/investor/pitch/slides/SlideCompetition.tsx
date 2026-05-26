import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Sun, Zap, Factory, Cpu } from 'lucide-react';

const topThreats = [
  {
    icon: Sun,
    name: 'SolarCoin (kSLR)',
    meta: 'Base L2 · Relaunched 2026 · Community/Foundation',
    pitch: '1 kSLR per kWh on Base — mirrors our chain + ratio. Validates the category.',
    wedge:
      'No app, no embedded wallet, no subscription, no verification. Honor-system uploads on top of a 98B legacy pool. Legacy SLR trades at ~$0.0007–0.002 on ~$1/day volume; new kSLR has no live pairs yet.',
    color: 'hsl(45,93%,55%)',
  },
  {
    icon: Factory,
    name: 'Daylight Energy',
    meta: 'Ethereum / Solana · $75M (Framework + Turtle Hill, Oct 2025)',
    pitch: 'DePIN-financed panel installs — removes upfront cost of solar.',
    wedge:
      'Capital-heavy: they own the hardware, then tokenize. We are software-only on the gear people already own. They build a fleet; we build the asset class.',
    color: 'hsl(207,90%,60%)',
  },
  {
    icon: Zap,
    name: 'Glow Protocol',
    meta: 'Custom L2 · $30M+ (Framework, Union Square)',
    pitch: 'B2B solar farms + GCC carbon credits.',
    wedge:
      'B2B-only — requires hardware install on commercial farms. We are consumer-first, software-only, on residential gear with 4M+ qualifying US households.',
    color: 'hsl(142,76%,55%)',
  },
  {
    icon: Cpu,
    name: 'GridPay',
    meta: 'Arbitrum · Live Mar 2026 · Pre-seed ($5M @ $20M)',
    pitch: 'Autonomous mint every 15 min from ERCOT solar export.',
    wedge:
      'Solo-founder hackathon project, ERCOT-only, no verification methodology, no IP. Their launch validates the category — our nationwide multi-vertical scope + Proof-of-Delta™ is the moat.',
    color: 'hsl(280,68%,65%)',
  },
];

const alsoTracked = [
  'EVearn (VeChain · EV miles only)',
  'Arkreen (Polygon · hardware DePIN)',
  'C+Charge (BSC · EV charging carbon credits)',
  'DeCharge (Peaq · charging hardware)',
  'PowerPod (IoTeX · charger sharing)',
];

export function SlideCompetition() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Competitive Landscape" number={13} />

      <div className="absolute inset-0 flex flex-col px-16 pt-24 pb-16">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[44px] font-bold leading-tight mb-2"
        >
          The category is forming. <span className="text-[hsl(142,76%,55%)]">Nobody owns the stack.</span>
        </motion.h2>
        <p className="text-[18px] text-white/55 mb-7 max-w-[1100px]">
          Every direct competitor is either hardware-heavy, B2B-only, single-vertical, or honor-system.
          ZenSolar is the only consumer-first, software-only, multi-vertical play with cryptographic verification
          (Proof-of-Delta™ + Proof-of-Origin™) and an embedded Coinbase Smart Wallet.
        </p>

        <div className="grid grid-cols-2 gap-5 mb-6">
          {topThreats.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.1 }}
              className="p-5 rounded-xl border border-white/10 bg-white/5"
            >
              <div className="flex items-center gap-3 mb-3">
                <c.icon className="w-6 h-6" style={{ color: c.color }} />
                <p className="text-[20px] font-bold leading-none">{c.name}</p>
                <span className="ml-auto text-[11px] font-mono uppercase tracking-wider text-[hsl(0,84%,65%)]/70">
                  High Threat
                </span>
              </div>
              <p className="text-[12px] font-mono uppercase tracking-wider text-white/35 mb-2">{c.meta}</p>
              <p className="text-[14px] text-white/70 mb-3 italic">"{c.pitch}"</p>
              <div className="p-3 rounded-lg bg-[hsl(142,76%,36%)]/8 border border-[hsl(142,76%,36%)]/15">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[hsl(142,76%,55%)]/80 mb-1">
                  Our Wedge
                </p>
                <p className="text-[14px] text-white/80 leading-snug">{c.wedge}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="flex items-center gap-3 text-[13px] text-white/40"
        >
          <span className="font-mono uppercase tracking-wider text-white/35">Also tracked (low/medium):</span>
          <span>{alsoTracked.join('  ·  ')}</span>
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
