import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { Shield, Layers, FileLock2 } from 'lucide-react';

const walls = [
  {
    icon: FileLock2,
    tag: 'Wall 1 · IP',
    title: 'The TM Stack',
    accent: 'amber-400',
    items: [
      'Mint-on-Proof™ · Proof-of-Delta™ · Proof-of-Genesis™',
      'Proof-of-Genesis™ · Genesis Anchor™',
      'Device Watermark Registry™',
      'Energy Price Oracle (Series A track)',
    ],
    footer: 'Non-provisional patent filed (U.S. App. 19/634,402).',
  },
  {
    icon: Layers,
    tag: 'Wall 2 · Multi-OEM',
    title: 'Unified Monitoring',
    accent: 'secondary',
    items: [
      'Tesla (solar + Powerwall + EV + home charging)',
      'Enphase (inverters)',
      'SolarEdge (PV)',
      'Wallbox (EV charging)',
    ],
    footer:
      'First-of-its-kind. No other consumer app aggregates all four into one premium dashboard.',
  },
  {
    icon: Shield,
    tag: 'Wall 3 · Trust',
    title: 'Verification Stack',
    accent: 'sky-400',
    items: [
      'Proof-of-Delta™ — SHA-256 hash chains',
      'Device Watermark Registry — one device → one wallet',
      'Server-side mint reconciliation',
      'Weather + irradiance cross-reference',
      'Bidirectional EV proofs (charge / discharge / miles)',
    ],
    footer:
      '10 verification layers shipping or specified — before Chainlink (Series A) or ZK (Series B).',
  },
];

export function S06FoundationalMoat() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="The Foundational Moat" number={6} />
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
          kicker="The Foundational Moat"
          title="Three walls competitors would need years to climb."
          subtitle="A patent-pending protocol, a first-of-its-kind multi-OEM monitoring app, and a verification stack built on years of utility data nobody else has."
        />

        <div className="grid grid-cols-3 gap-6 flex-1">
          {walls.map((w) => (
            <DeckCard key={w.title} className="flex flex-col">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <w.icon className={`w-7 h-7 text-${w.accent}`} />
                </div>
                <div>
                  <CardKicker className={`text-${w.accent}/80`}>{w.tag}</CardKicker>
                  <p className="text-[22px] font-semibold text-white leading-tight mt-1">
                    {w.title}
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 flex-1">
                {w.items.map((it) => (
                  <li
                    key={it}
                    className="flex items-start gap-3 text-[16px] text-white/75 leading-snug"
                  >
                    <span className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 bg-${w.accent}`} />
                    {it}
                  </li>
                ))}
              </ul>
              <p className={`text-[14px] italic mt-5 pt-4 border-t border-white/10 text-${w.accent}/80`}>
                {w.footer}
              </p>
            </DeckCard>
          ))}
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
