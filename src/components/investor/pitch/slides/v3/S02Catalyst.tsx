import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';

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
          title="A $1.7T market — and nobody has tokenized the kWh itself."
          subtitle="Federal incentives just collapsed. Households need a permanent, market-driven incentive — and the multi-OEM monitoring layer it requires has never existed before now."
        />

        <div className="grid grid-cols-3 gap-6 flex-1">
          <DeckCard className="flex flex-col">
            <CardKicker className="text-amber-400/80">Market</CardKicker>
            <p className="text-[64px] font-semibold text-amber-400 mt-3 leading-none">
              $1.7T
            </p>
            <p className="text-[22px] text-white/65 mt-6 leading-snug">
              Annual clean-energy capex globally. Nobody has tokenized the kWh
              itself.
            </p>
          </DeckCard>

          <DeckCard className="flex flex-col">
            <CardKicker className="text-sky-400/80">IP</CardKicker>
            <p className="text-[36px] font-semibold text-sky-400 mt-3 leading-tight">
              Patent-pending
            </p>
            <p className="text-[20px] text-white/65 mt-5 leading-snug">
              U.S. App. 19/634,402 covers the Proof of Genesis™ protocol — a
              novel system for turning verified clean-energy production into a
              hard-capped, asset-backed digital currency on Base.
            </p>
          </DeckCard>

          <DeckCard emphasized className="flex flex-col">
            <CardKicker className="text-secondary">Foundational moat</CardKicker>
            <p className="text-[32px] font-semibold text-white mt-3 leading-tight">
              First-of-its-kind multi-OEM monitoring
            </p>
            <p className="text-[19px] text-white/70 mt-5 leading-snug">
              <span className="text-white">Zen Monitoring</span> aggregates
              real-time data from{' '}
              <span className="text-white">
                Tesla, Enphase, SolarEdge, and Wallbox
              </span>{' '}
              into one premium dashboard. Mixed-system homeowners finally get
              unified visibility — and Proof-of-Genesis™ minting on top.
            </p>
          </DeckCard>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
