import { SlideLayout, SlideHeader, SlideFooter } from '../SlideLayout';
import { motion } from 'framer-motion';
import { FileLock2, Layers, ShieldCheck } from 'lucide-react';

const walls = [
  {
    icon: FileLock2,
    tag: 'Wall 1 · IP',
    title: 'The TM Stack',
    color: 'hsl(280,68%,60%)',
    items: [
      'Track 1 — Mint-on-Proof™',
      'Track 2 — Proof-of-Delta™ / SEGI™',
      'Track 2.5 — Energy Price Oracle',
      'Track 3 — Device Watermark Registry',
      'Track 4 — ZK-Proof-of-Genesis',
    ],
    footer:
      'TMs: Proof-of-Genesis™, Proof of Genesis™, Proof-of-Permanence™, Genesis Anchor™, Proof-of-Custody™, SEGI™, ZPPA',
  },
  {
    icon: Layers,
    tag: 'Wall 2 · Scarcity',
    title: '5-Layer Scarcity Stack',
    color: 'hsl(45,93%,47%)',
    items: [
      '1T hard cap (contract-enforced)',
      '20% burn-per-mint (novel)',
      '4-year halving (Bitcoin cadence)',
      'Founder pact-lock (200B until $6.67 / $20)',
      'Protocol-Owned Liquidity (no mercenary LP)',
    ],
    footer: 'Bitcoin has 1 layer. We stacked 5. Net-deflationary by year ~16 vs Bitcoin year ~116.',
  },
  {
    icon: ShieldCheck,
    tag: 'Wall 3 · Trust',
    title: '10-Layer Verification',
    color: 'hsl(142,76%,50%)',
    items: [
      'Multi-OEM OAuth (Tesla, SolarEdge, Enphase, Wallbox)',
      'Device Watermark Registry (one device → one wallet)',
      'Server-side mint reconciliation',
      'Weather + irradiance cross-reference',
      'Bidirectional EV proofs (charge / discharge / miles / FSD)',
      'Subscription dual-gate · Producer-gated LP · VPP settlement',
    ],
    footer: '10 layers shipping or specified — before Chainlink (Series A) or ZK (Series B).',
  },
];

export function Slide10ThreeWallsMoat() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="The Moat" number={10} />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[hsl(207,90%,54%)]/8 blur-[140px]" />

      <div className="absolute inset-0 flex flex-col px-16 pt-24 pb-14">
        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-[48px] font-bold leading-[1.05] mb-2">
          Three walls competitors would need <span className="text-[hsl(45,93%,47%)]">years</span> to climb.
        </motion.h2>
        <p className="text-[18px] text-white/55 mb-7 max-w-[1100px]">
          Even if Tesla or Coinbase shipped tomorrow, they'd face a patent wall, a five-layer scarcity
          wall, and a verification stack built on years of multi-OEM utility data they don't have.
        </p>

        <div className="grid grid-cols-3 gap-5 flex-1">
          {walls.map((w, i) => (
            <motion.div key={w.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="flex flex-col p-5 rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${w.color}18`, border: `1px solid ${w.color}35` }}>
                  <w.icon className="w-5 h-5" style={{ color: w.color }} />
                </div>
                <div>
                  <p className="text-[11px] font-mono tracking-[0.2em] uppercase" style={{ color: w.color }}>{w.tag}</p>
                  <p className="text-[20px] font-bold leading-tight">{w.title}</p>
                </div>
              </div>
              <ul className="space-y-1.5 flex-1">
                {w.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-[13.5px] text-white/75 leading-snug">
                    <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: w.color }} />
                    {it}
                  </li>
                ))}
              </ul>
              <p className="text-[12px] italic mt-4 pt-3 border-t border-white/10" style={{ color: w.color }}>
                {w.footer}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
