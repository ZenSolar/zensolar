import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { Flame, Coins, Sun } from 'lucide-react';

const rows = [
  {
    icon: Flame,
    name: 'Proof-of-Work',
    anchor: 'Bitcoin · 2009',
    does: 'Burns electricity to secure a ledger',
    critique: 'Energy is wasted to prove trust',
    color: 'hsl(15,90%,55%)',
  },
  {
    icon: Coins,
    name: 'Proof-of-Stake',
    anchor: 'Ethereum · 2022',
    does: 'Stakes capital to secure a ledger',
    critique: 'Rewards the already-wealthy; plutocratic',
    color: 'hsl(207,90%,54%)',
  },
  {
    icon: Sun,
    name: 'Proof-of-Genesis™',
    anchor: 'ZenSolar · 2026',
    does: 'Produces clean energy to mint the asset',
    critique: 'The work IS the value — energy isn\'t burned to secure, energy IS the asset',
    color: 'hsl(45,93%,47%)',
    highlight: true,
  },
];

export function Slide07ThirdPrimitive() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="The Third Consensus Primitive" number={7} />

      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-[hsl(45,93%,47%)]/8 blur-[140px]" />

      <div className="absolute inset-0 flex flex-col px-16 pt-24 pb-16">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[52px] font-bold leading-[1.05] mb-3">
          PoW burned energy. PoS staked capital.{' '}
          <span className="text-[hsl(45,93%,47%)]">PoG produces energy.</span>
        </motion.h2>
        <p className="text-[19px] text-white/55 mb-9 max-w-[1100px]">
          Crypto has had two consensus primitives in 17 years. Proof-of-Genesis™ is the third — and the
          first where the work <span className="italic">is</span> the value, not a tax paid to secure the ledger.
        </p>

        <div className="flex-1 flex flex-col gap-4">
          {rows.map((row, i) => (
            <motion.div key={row.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={`grid grid-cols-12 gap-5 p-5 rounded-xl border ${
                row.highlight
                  ? 'border-[hsl(45,93%,47%)]/40 bg-[hsl(45,93%,47%)]/[0.06]'
                  : 'border-white/10 bg-white/[0.03]'
              }`}>
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${row.color}18`, border: `1px solid ${row.color}35` }}>
                  <row.icon className="w-6 h-6" style={{ color: row.color }} />
                </div>
                <div>
                  <p className="text-[20px] font-bold leading-tight" style={{ color: row.highlight ? row.color : 'white' }}>
                    {row.name}
                  </p>
                  <p className="text-[12px] font-mono text-white/40 mt-0.5">{row.anchor}</p>
                </div>
              </div>
              <div className="col-span-4 flex items-center text-[15px] text-white/80">{row.does}</div>
              <div className="col-span-5 flex items-center text-[15px] italic text-white/65">{row.critique}</div>
            </motion.div>
          ))}
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}
          className="text-[18px] text-white/80 italic mt-6 max-w-[1100px]">
          "Bitcoin proved you can tokenize trust. We're tokenizing the thing trust was always for —{' '}
          <span className="not-italic font-semibold text-[hsl(45,93%,47%)]">productive work.</span>"
        </motion.p>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
