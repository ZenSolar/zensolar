import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { Sparkles } from 'lucide-react';

const useOfFunds = [
  { bucket: 'Token Launch & Liquidity', range: '$625K – $875K' },
  { bucket: 'Legal, Compliance & Audits', range: '$500K – $700K' },
  { bucket: 'App Polish & Onboarding', range: '$375K – $525K' },
  { bucket: 'Growth & User Acquisition', range: '$375K – $525K' },
  { bucket: 'Operational Runway (18–24 months)', range: '$625K – $875K' },
];

export function S11Ask() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="The Ask" number={11} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, hsl(var(--secondary) / 0.2), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        <SectionHeader
          kicker="The Ask"
          title="Seed Round — Part 1 of 2 · $2.5M – $3.5M · Convertible Note."
          subtitle="Part 1 launches the token and ignites the flywheel. Part 2 scales once traction is proven — designed to reach self-sustainability without a traditional Series A."
        />

        <div className="grid grid-cols-12 gap-6 flex-1">
          <DeckCard className="col-span-8 !p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 bg-card/40">
              <CardKicker className="text-white/55">
                Use of Funds · Part 1 ($2.5M – $3.5M)
              </CardKicker>
            </div>
            <div className="divide-y divide-border/40">
              {useOfFunds.map((r) => (
                <div
                  key={r.bucket}
                  className="grid grid-cols-[1.6fr_auto] gap-5 px-5 py-4 items-center"
                >
                  <div className="text-[18px] font-semibold text-white leading-tight">
                    {r.bucket}
                  </div>
                  <div className="text-[20px] font-semibold text-secondary tabular-nums whitespace-nowrap">
                    {r.range}
                  </div>
                </div>
              ))}
              <div className="px-5 py-3 bg-card/40 text-[13px] italic text-white/55">
                Indicative allocations across the $2.5M – $3.5M Part 1 range.
              </div>
            </div>
          </DeckCard>

          <div className="col-span-4 flex flex-col gap-4">
            <DeckCard emphasized className="flex-1">
              <CardKicker className="text-secondary">Milestones funded</CardKicker>
              <ul className="mt-4 space-y-2.5">
                {[
                  'Mainnet TGE on Base (chain 8453)',
                  '1,000 verified homes',
                  'Subscriptions live ($9.99 + Deason $4.99)',
                  '2nd LP tranche seeded',
                  'Path to self-sustainability (no Series A required)',
                ].map((m) => (
                  <li
                    key={m}
                    className="flex items-start gap-3 text-[15px] text-white/80 leading-snug"
                  >
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </DeckCard>

            <DeckCard className="flex-1">
              <CardKicker className="text-amber-400/80">What Part 2 unlocks</CardKicker>
              <p className="text-[16px] text-white/75 mt-3 leading-relaxed">
                Scale user acquisition, deepen liquidity, and expand rewardable
                behaviors once Part 1 milestones are achieved and the flywheel
                is validated.
              </p>
            </DeckCard>
          </div>
        </div>

        <p className="mt-8 text-center text-[28px] font-light italic text-white/85">
          <Sparkles className="inline h-6 w-6 text-secondary mr-2 -mt-1" />
          Bitcoin tokenized scarcity. We're tokenizing abundance.
        </p>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
