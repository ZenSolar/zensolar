import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard } from '../../v3/DeckCard';
import { Sun, Zap, Coins, Lock, ArrowRight } from 'lucide-react';

const flow = [
  { icon: Sun, label: 'Produce', desc: 'Solar panels generate kWh' },
  { icon: Zap, label: 'Verify', desc: 'Proof-of-Genesis™ confirms production' },
  { icon: Coins, label: 'Mint', desc: 'Tokens auto-minted 1:1' },
  { icon: Lock, label: 'Retire', desc: 'Energy cryptographically locked' },
];

export function S05Solution() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="The Solution" number={5} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, hsl(var(--secondary) / 0.18), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        <SectionHeader
          kicker="The Solution"
          title="1 kWh = 1 $ZSOLAR."
          subtitle="The simplest formula in crypto. Backed by physics, not promises — and routed through the first multi-OEM monitoring layer (Tesla + Enphase + SolarEdge + Wallbox)."
        />

        <DeckCard emphasized className="mb-8">
          <div className="flex items-center justify-between gap-6">
            {flow.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-3 w-[220px]">
                  <div className="w-20 h-20 rounded-2xl border border-secondary/30 bg-secondary/10 flex items-center justify-center">
                    <s.icon className="w-10 h-10 text-secondary" />
                  </div>
                  <p className="text-[22px] font-semibold text-white">{s.label}</p>
                  <p className="text-[15px] text-white/55 text-center leading-snug">
                    {s.desc}
                  </p>
                </div>
                {i < flow.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-white/30 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </DeckCard>

        <div className="grid grid-cols-2 gap-6">
          <DeckCard>
            <p className="text-[24px] font-semibold text-white leading-tight">
              Built on the first unified multi-OEM monitoring app
            </p>
            <p className="text-[18px] text-white/65 mt-4 leading-relaxed">
              Tesla, Enphase, SolarEdge, and Wallbox in one premium dashboard.
              The prerequisite for every revenue engine — homeowners with mixed
              systems finally get unified visibility, and Proof-of-Genesis™
              minting on top.
            </p>
          </DeckCard>
          <DeckCard>
            <p className="text-[24px] font-semibold text-white leading-tight">
              Permanent, market-driven incentive
            </p>
            <p className="text-[18px] text-white/65 mt-4 leading-relaxed">
              No federal credits. No utility rebates. Every kWh earns $ZSOLAR
              backed by real production. SolarCity made solar affordable —
              ZenSolar makes solar profitable, forever.
            </p>
          </DeckCard>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
