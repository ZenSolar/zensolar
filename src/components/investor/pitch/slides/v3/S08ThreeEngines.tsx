import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { CreditCard, Coins, Database, ArrowRight, Sparkles } from 'lucide-react';

export function S08ThreeEngines() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="Three Revenue Engines" number={8} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top, hsl(var(--secondary) / 0.14), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        <SectionHeader kicker="Three Revenue Engines" title="Three engines. One flywheel." />

        <DeckCard className="mb-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-3">
            <FlowStep label="Verified kWh" className="text-secondary" />
            <ArrowRight className="h-6 w-6 text-white/30" />
            <FlowStep label="Data" className="text-sky-400" />
            <ArrowRight className="h-6 w-6 text-white/30" />
            <FlowStep label="AI" className="text-eco" />
            <ArrowRight className="h-6 w-6 text-white/30" />
            <FlowStep label="$ZSOLAR" className="text-amber-400" />
          </div>
          <p className="text-center text-[16px] text-white/55 mt-3 leading-relaxed">
            A paid subscription unlocks minting and the Deason AI upgrade. Minting
            produces verified kWh. Data + AI drive token demand and the
            aggregated-data revenue line. Every loop tightens the token.
          </p>
        </DeckCard>

        <div className="grid grid-cols-3 gap-5 flex-1">
          <DeckCard className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <CardKicker className="text-eco/80">Engine 01</CardKicker>
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-6 h-6 text-eco" />
                <Sparkles className="w-6 h-6 text-eco opacity-70" />
              </div>
            </div>
            <p className="text-[22px] font-semibold text-white leading-tight">
              Subscription + Deason AI
            </p>
            <p className="text-[15px] text-eco italic mt-1.5">
              The access fee, plus the premium AI upgrade.
            </p>
            <p className="text-[15px] text-white/65 mt-4 leading-relaxed">
              Paid base sub is required to mint. Tiers{' '}
              <span className="text-white">$9.99 / $19.99 / $49.99</span>.{' '}
              <span className="text-white">Deason AI is a +$4.99/mo add-on</span>{' '}
              on any tier — Monthly Clean Energy Report, bill + rate-plan
              optimization, device-aware advice.
            </p>
            <ul className="mt-4 space-y-1.5">
              {[
                '50% of every sub dollar → LP',
                '50% of every sub dollar → treasury',
                'Unlocks Zen Monitoring (Tesla + Enphase + SolarEdge + Wallbox)',
              ].map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-[14px] text-white/75 leading-snug"
                >
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-eco shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4 border-t border-white/10">
              <p className="text-[24px] font-semibold text-eco">$9.99 + $4.99</p>
              <p className="text-[12px] uppercase tracking-wider text-white/45 mt-1">
                base sub · premium AI upgrade
              </p>
            </div>
          </DeckCard>

          <DeckCard
            emphasized
            accentClass="ring-1 ring-amber-400/20"
            className="flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <CardKicker className="text-amber-400/80">Engine 02</CardKicker>
              <Coins className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-[22px] font-semibold text-white leading-tight">
              Token Economics
            </p>
            <p className="text-[15px] text-amber-400 italic mt-1.5">
              Core product and primary long-term revenue driver.
            </p>
            <p className="text-[15px] text-white/65 mt-4 leading-relaxed">
              1T hard cap. Every verified kWh shows{' '}
              <span className="text-white">1:1</span> in the user's wallet; the
              protocol matches it 1-for-1 in the background — a 401(k)-style
              match for clean energy.
            </p>
            <ul className="mt-4 space-y-1.5">
              {[
                'Mint split: 50 user · 25 LP · 20 burn · 5 treasury',
                'Separate 3% transfer tax → LP (recycle only)',
                '$0.10 LP-seeded launch on Base · 1T hard cap',
                'Mint split + transfer tax compound supply + LP depth',
              ].map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 text-[14px] text-white/80 leading-snug"
                >
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4 border-t border-white/10">
              <p className="text-[24px] font-semibold text-amber-400">1T cap</p>
              <p className="text-[12px] uppercase tracking-wider text-white/45 mt-1">
                transfer tax + treasury yield
              </p>
            </div>
          </DeckCard>

          <DeckCard className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <CardKicker className="text-sky-400/80">Engine 03</CardKicker>
              <Database className="w-6 h-6 text-sky-400" />
            </div>
            <p className="text-[22px] font-semibold text-white leading-tight">
              Aggregated Energy Data
            </p>
            <p className="text-[15px] text-sky-400 italic mt-1.5">
              Valuable secondary revenue stream.
            </p>
            <p className="text-[15px] text-white/65 mt-4 leading-relaxed">
              Verified production, consumption, and device telemetry from{' '}
              <span className="text-white">
                Tesla, Enphase, SolarEdge, and Wallbox
              </span>{' '}
              — already flowing through us. Anonymized, aggregated, never
              per-household PII. Sold to utilities, ISOs/RTOs, REC registries,
              and climate researchers.
            </p>
            <p className="text-[14px] text-white/70 mt-4 italic leading-snug">
              Only possible because we built the first unified multi-OEM
              monitoring layer.
            </p>
            <div className="mt-auto pt-4 border-t border-white/10">
              <p className="text-[24px] font-semibold text-sky-400">$2B+</p>
              <p className="text-[12px] uppercase tracking-wider text-white/45 mt-1">
                U.S. utility analytics TAM
              </p>
            </div>
          </DeckCard>
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}

function FlowStep({ label, className }: { label: string; className: string }) {
  return (
    <span className={`text-[28px] font-semibold tracking-tight ${className}`}>
      {label}
    </span>
  );
}
