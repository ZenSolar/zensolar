import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { Database, Zap } from 'lucide-react';

export function S09ScaleOpportunity() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="Scale Opportunity" number={9} />
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
          kicker="Scale Opportunity"
          title="Aggregated Data + Virtual Power Plant."
          subtitle="Two scale layers that ride on the same multi-OEM monitoring foundation — both unlock once the user base crosses the data-density threshold."
        />

        <DeckCard accentClass="ring-1 ring-sky-400/20" className="mb-5">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl border border-sky-400/30 bg-sky-400/10 flex items-center justify-center shrink-0">
              <Database className="w-8 h-8 text-sky-400" />
            </div>
            <div className="flex-1">
              <CardKicker className="text-sky-400/80">Aggregated Data</CardKicker>
              <p className="text-[30px] font-semibold text-white mt-2 leading-tight">
                High-Margin Data Business at Scale
              </p>
              <p className="text-[18px] text-white/70 mt-3 leading-relaxed">
                ZenSolar becomes the largest source of verified, real-time
                residential clean energy data in the markets we serve.
                Anonymized, multi-OEM telemetry from{' '}
                <span className="text-white">
                  Tesla, Enphase, SolarEdge, and Wallbox
                </span>{' '}
                is sold to utilities, ISOs/RTOs, REC registries (M-RETS, WREGIS,
                PJM-GATS), and climate researchers.
              </p>
            </div>
            <div className="text-right shrink-0 pl-6 border-l border-white/10">
              <p className="text-[44px] font-semibold text-sky-400 leading-none">
                $2B+
              </p>
              <p className="text-[12px] uppercase tracking-wider text-white/45 mt-2 max-w-[160px]">
                U.S. utility analytics TAM
              </p>
            </div>
          </div>
        </DeckCard>

        <DeckCard
          emphasized
          accentClass="ring-1 ring-amber-400/20"
          className="flex-1"
        >
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl border border-amber-400/30 bg-amber-400/10 flex items-center justify-center shrink-0">
              <Zap className="w-8 h-8 text-amber-400" />
            </div>
            <div className="flex-1">
              <CardKicker className="text-amber-400/80">ZenSolar VPP</CardKicker>
              <p className="text-[30px] font-semibold text-white mt-2 leading-tight">
                The First Crypto-Rewarding Virtual Power Plant
              </p>
              <p className="text-[18px] text-white/70 mt-3 leading-relaxed">
                ZenSolar VPP is the{' '}
                <span className="text-amber-400">
                  first Virtual Power Plant that issues crypto rewards directly
                  to participants via Proof-of-Genesis™
                </span>
                . Homeowners earn $ZSOLAR in real time (30–60 seconds) for
                verified grid-supporting behavior. This creates a powerful new
                flywheel between the grid, users, and the $ZSOLAR token.
              </p>

              <div className="grid grid-cols-4 gap-3 mt-5">
                {[
                  { v: '50%', l: 'LP injection' },
                  { v: '30%', l: 'User cash · monthly' },
                  { v: '15%', l: 'ZenSolar ops' },
                  { v: '5%', l: 'Tokens · real-time' },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-4 py-3"
                  >
                    <p className="text-[24px] font-semibold text-amber-400 leading-none">
                      {s.v}
                    </p>
                    <p className="text-[12px] uppercase tracking-wider text-white/55 mt-2 leading-tight">
                      {s.l}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DeckCard>

        <p className="mt-5 text-[14px] text-white/45 italic leading-snug max-w-[1400px]">
          At scale, both the Aggregated Data and VPP engines have the potential to become major high-margin contributors as the network grows.
        </p>

        <div className="mt-4 flex items-center gap-3 px-5 py-3 rounded-xl border border-white/10 bg-white/[0.03]">
          <span className="text-[11px] font-mono tracking-[0.24em] uppercase text-white/45 whitespace-nowrap">
            Phase 2 path
          </span>
          <span className="text-[14px] text-white/65 leading-snug">
            Leap Energy white-label → CAISO first → OEM partner-tier APIs
            (Tesla / Enphase / SolarEdge).
          </span>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
