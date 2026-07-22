import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { TrendingDown, Sparkles } from 'lucide-react';

const gone = [
  '30% Solar & Storage Investment Tax Credit',
  '$7,500 Federal EV Tax Credit',
  'Net metering rolled back state-by-state',
];

export function S02Catalyst() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="The Catalyst" number={2} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, hsl(var(--secondary) / 0.14), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        <SectionHeader
          kicker="The Catalyst"
          title="The 30% Solar ITC and $7,500 EV Credit are gone."
          subtitle="For the first time in a generation, Americans have zero federal financial incentive to go clean. The industry needs a new incentive — one the market provides, not Washington."
        />

        <div className="grid grid-cols-2 gap-6 flex-1">
          <DeckCard className="flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl border border-destructive/30 bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-7 h-7 text-destructive" />
              </div>
              <CardKicker className="text-destructive/85">
                What just disappeared
              </CardKicker>
            </div>
            <ul className="space-y-4 flex-1">
              {gone.map((g) => (
                <li
                  key={g}
                  className="flex items-start gap-3 text-[22px] text-white/85 leading-snug"
                >
                  <span className="mt-3 h-2 w-2 rounded-full bg-destructive shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
            <p className="mt-6 pt-5 border-t border-white/10 text-[16px] italic text-white/50 leading-snug">
              Repealed under the Big Beautiful Bill Act — signed July 4, 2025.
              Residential ITC eliminated for systems placed in service after
              12/31/2025; EV credit terminated for vehicles acquired after
              9/30/2025.
            </p>
          </DeckCard>

          <DeckCard emphasized className="flex flex-col">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl border border-secondary/30 bg-secondary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-secondary" />
              </div>
              <CardKicker className="text-secondary">
                What has to replace it
              </CardKicker>
            </div>
            <p className="text-[32px] font-semibold text-white leading-tight">
              A permanent, market-driven incentive that pays homeowners every
              time their panels or EV do their job.
            </p>
            <p className="text-[22px] text-secondary mt-5 leading-snug">
              That's $ZSOLAR.
            </p>
            <p className="mt-auto pt-6 text-[18px] text-white/70 italic leading-relaxed">
              Bitcoin proved a market can create its own incentive.
              <br />
              We're doing it for energy.
            </p>
          </DeckCard>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
