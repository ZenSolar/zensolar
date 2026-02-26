import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';

const logos = [
  { name: 'BlackRock', stat: '$107.4B', desc: 'Digital asset holdings', color: 'hsl(207,90%,54%)' },
  { name: 'Hedera', stat: 'HBAR', desc: 'Enterprise-grade DLT for RWA', color: 'hsl(142,76%,50%)' },
  { name: 'JPMorgan', stat: 'Onyx', desc: 'Tokenized asset platform', color: 'hsl(45,93%,47%)' },
  { name: 'Goldman Sachs', stat: 'GS DAP', desc: 'Digital asset platform', color: 'hsl(280,68%,60%)' },
];

export function Slide03Supercycle() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Tokenization Supercycle" number={3} />
      
      <div className="absolute inset-0 flex flex-col justify-center px-16 pt-20 pb-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <h2 className="text-[52px] font-bold leading-tight mb-3">
            The Tokenization <span className="text-[hsl(207,90%,54%)]">Supercycle</span>
          </h2>
          <p className="text-[22px] text-white/50 max-w-[900px]">
            Every major financial institution is building tokenization infrastructure. ZenSolar rides this wave with real-world asset backing.
          </p>
        </motion.div>

        {/* Larry Fink quote */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-8 rounded-2xl border border-[hsl(207,90%,54%)]/20 bg-[hsl(207,90%,54%)]/5 mb-10">
          <p className="text-[26px] font-light italic text-white/80 leading-relaxed">
            "The tokenization of every financial asset will be the <strong className="text-[hsl(207,90%,54%)] font-bold">next generation</strong> for markets."
          </p>
          <p className="text-[16px] text-white/40 mt-3">— Larry Fink, CEO of BlackRock</p>
        </motion.div>

        {/* Institution cards */}
        <div className="grid grid-cols-4 gap-6">
          {logos.map((item, i) => (
            <motion.div key={item.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-6 rounded-xl border border-white/10 bg-white/5 text-center">
              <p className="text-[36px] font-black" style={{ color: item.color }}>{item.stat}</p>
              <p className="text-[18px] font-semibold mt-2">{item.name}</p>
              <p className="text-[14px] text-white/40 mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="mt-8 text-center">
          <p className="text-[16px] text-white/30">
            ZenSolar is the first to tokenize <strong className="text-white/60">verified residential energy production</strong> as a real-world asset
          </p>
        </motion.div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
