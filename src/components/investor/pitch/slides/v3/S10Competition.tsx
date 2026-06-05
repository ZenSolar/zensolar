import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { Sun, Factory, Zap, Cpu } from 'lucide-react';

const threats = [
  {
    icon: Sun,
    name: 'SolarCoin (kSLR)',
    meta: 'Base L2 · Relaunched 2026 · Community/Foundation',
    pitch: '1 kSLR per kWh on Base — mirrors our chain + ratio.',
    wedge:
      'No app, no embedded wallet, no subscription, no verification. Honor-system uploads on a 98B legacy pool. New kSLR has no live pairs yet.',
  },
  {
    icon: Factory,
    name: 'Daylight Energy',
    meta: 'Ethereum / Solana · $75M (Framework + Turtle Hill, 2025)',
    pitch: 'DePIN-financed panel installs — removes upfront cost.',
    wedge:
      'Capital-heavy: they own the hardware then tokenize. We are software-only on the gear people already own. They build a fleet; we build the asset class.',
  },
  {
    icon: Zap,
    name: 'Glow Protocol',
    meta: 'Custom L2 · $30M+ (Framework, Union Square)',
    pitch: 'B2B solar farms + GCC carbon credits.',
    wedge:
      'B2B-only — requires hardware install on commercial farms. We are consumer-first, software-only, on residential gear with 4M+ qualifying US households.',
  },
  {
    icon: Cpu,
    name: 'GridPay',
    meta: 'Arbitrum · Live Mar 2026 · Pre-seed ($5M @ $20M)',
    pitch: 'Autonomous mint every 15 min from ERCOT solar export.',
    wedge:
      'Solo-founder hackathon project, ERCOT-only, no verification methodology, no IP. Our nationwide multi-vertical scope + Proof-of-Delta™ is the moat.',
  },
];

export function S10Competition() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Competition" number={10} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, hsl(var(--secondary) / 0.12), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        <SectionHeader
          kicker="Competition"
          title="The category is forming. Nobody owns the stack."
          subtitle="Every direct competitor is hardware-heavy, B2B-only, single-vertical, or honor-system. ZenSolar is the only consumer-first, software-only, multi-vertical play with cryptographic verification + embedded Coinbase Smart Wallet."
        />

        <div className="grid grid-cols-2 gap-5 flex-1">
          {threats.map((c) => (
            <DeckCard key={c.name} className="flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                  <c.icon className="w-6 h-6 text-sky-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[22px] font-semibold text-white leading-tight">
                    {c.name}
                  </p>
                  <p className="text-[12px] text-white/35 mt-1">{c.meta}</p>
                </div>
              </div>
              <p className="text-[15px] text-white/65 italic mb-3">"{c.pitch}"</p>
              <div className="mt-auto rounded-xl border border-secondary/25 bg-secondary/5 p-3">
                <CardKicker className="text-secondary !text-[11px]">
                  Our wedge
                </CardKicker>
                <p className="text-[14px] text-white/80 mt-1.5 leading-snug">
                  {c.wedge}
                </p>
              </div>
            </DeckCard>
          ))}
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
