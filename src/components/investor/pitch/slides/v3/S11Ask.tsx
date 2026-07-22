import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { Sparkles } from 'lucide-react';

const useOfFunds = [
  { bucket: 'Token Launch & Liquidity', amount: '$250K' },
  { bucket: 'Legal, Compliance & Audits', amount: '$200K' },
  { bucket: 'App Polish & Onboarding', amount: '$150K' },
  { bucket: 'Growth & User Acquisition', amount: '$150K' },
  { bucket: 'Operational Runway (18–24 months)', amount: '$250K' },
];

export function S11Ask() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="The Ask" number={12} />
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
          title="Seed Round — $1M Target · $2M Hard Cap · Convertible Note."
          subtitle="We are raising the absolute minimum required to ship mainnet, seed the LP, and prove the subscription flywheel — designed to reach self-sustainability without a traditional Series A."
        />

        <div className="grid grid-cols-12 gap-6 flex-1">
          <DeckCard className="col-span-8 !p-0 overflow-hidden">
            <div className="px-5 py-3 border-b border-border/60 bg-card/40">
              <CardKicker className="text-white/55">
                Use of Funds · $1M Target
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
                    {r.amount}
                  </div>
                </div>
              ))}
              <div className="px-5 py-3 bg-card/40 text-[13px] italic text-white/55">
                Hard cap of $2M absorbs oversubscription into LP depth and extended runway.
              </div>
            </div>
          </DeckCard>

          <div className="col-span-4 flex flex-col gap-4">
            <DeckCard emphasized className="flex-1">
              <CardKicker className="text-secondary">Milestones funded</CardKicker>
              <ul className="mt-4 space-y-2.5">
                {[
                  'Mainnet TGE on Base (chain 8453)',
                  'LP seeded at $0.10 ($200K USDC + 2M $ZSOLAR)',
                  '1,000 paying subscribers',
                  'Deason AI premium add-on live',
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
              <CardKicker className="text-amber-400/80">Why so lean</CardKicker>
              <p className="text-[16px] text-white/75 mt-3 leading-relaxed">
                Disciplined founder-led execution. 100% of subscription revenue
                compounds into the LP. Scale on usage, not on the next round.
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
