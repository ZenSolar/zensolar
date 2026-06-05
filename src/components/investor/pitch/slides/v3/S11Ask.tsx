import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { Sparkles } from 'lucide-react';

const useOfFunds = [
  { bucket: 'LP Reserve (3 tranches)', amt: '$2.0M', pct: '40%', note: 'Critical for flywheel health' },
  { bucket: 'Team & Ops (18–24 mo)', amt: '$1.8M', pct: '36%', note: 'Founders + 3 hires' },
  { bucket: 'Audits, Legal, Patents', amt: '$400K', pct: '8%', note: 'Smart-contract + security audits, securities counsel, patents' },
  { bucket: 'Growth / User Acquisition', amt: '$500K', pct: '10%', note: 'Paid acquisition, creator partnerships, Proof-of-Genesis viral loop' },
  { bucket: 'Reserves / Buffer', amt: '$300K', pct: '6%', note: 'Contingency' },
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
          title="$5M target · $7M hard cap · SAFE (post-money)."
          subtitle="18–24 month runway to mainnet TGE, first revenue, and Series A readiness. $20M post-money. Cap shared under NDA."
        />

        <div className="grid grid-cols-12 gap-6 flex-1">
          <DeckCard className="col-span-8 !p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 bg-card/40">
              <CardKicker className="text-white/55">
                Use of Funds · $5M Target
              </CardKicker>
            </div>
            <div className="divide-y divide-border/40">
              {useOfFunds.map((r) => (
                <div
                  key={r.bucket}
                  className="grid grid-cols-[1.6fr_auto_auto] gap-5 px-5 py-4 items-start"
                >
                  <div className="min-w-0">
                    <div className="text-[18px] font-semibold text-white leading-tight">
                      {r.bucket}
                    </div>
                    <div className="text-[14px] text-white/50 mt-1 leading-snug">
                      {r.note}
                    </div>
                  </div>
                  <div className="text-[20px] font-semibold text-secondary tabular-nums">
                    {r.amt}
                  </div>
                  <div className="text-[14px] text-white/55 tabular-nums pt-1.5">
                    {r.pct}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-[1.6fr_auto_auto] gap-5 px-5 py-4 bg-card/40">
                <div className="text-[14px] font-semibold uppercase tracking-wider text-white">
                  Total
                </div>
                <div className="text-[20px] font-bold text-white tabular-nums">
                  $5.0M
                </div>
                <div className="text-[14px] text-white/80 tabular-nums pt-1.5">
                  100%
                </div>
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
                  'Series A in 18–24 months',
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
              <CardKicker className="text-amber-400/80">Capital efficiency</CardKicker>
              <p className="text-[44px] font-semibold text-amber-400 mt-3 leading-none">
                76%
              </p>
              <p className="text-[15px] text-white/65 mt-3 leading-snug">
                deployed directly into the flywheel (LP + team). Audits, growth,
                and a flexible reserve cover the rest.
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
