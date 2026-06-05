import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';
import { Zap, Network, ShieldCheck } from 'lucide-react';

const comparison = {
  left: {
    label: 'Bitcoin',
    sublabel: 'Proof-of-Work',
    rows: [
      { stat: '~1,400,000 kWh', desc: 'per coin' },
      { stat: 'Energy intensive', desc: 'centralized mining' },
      { stat: 'No real-world tie', desc: 'value detached from physical assets' },
    ],
  },
  right: {
    label: '$ZSOLAR',
    sublabel: 'Proof-of-Genesis™ (PoG)',
    rows: [
      { stat: '1 kWh', desc: 'of clean energy per $ZSOLAR' },
      { stat: 'Energy efficient', desc: 'distributed across real homes' },
      { stat: 'Directly tied', desc: 'to verified clean energy generation' },
    ],
  },
};

const bottomCards = [
  {
    icon: Zap,
    title: 'Real-time verification',
    body: 'Tesla + Enphase + SolarEdge + Wallbox telemetry → mint in 30–60 seconds.',
  },
  {
    icon: Network,
    title: 'Multi-OEM unified',
    body: 'The only protocol that verifies multiple OEMs in a single unified system.',
  },
  {
    icon: ShieldCheck,
    title: 'Patent-pending stack',
    chips: ['Mint-on-Proof™', 'Proof-of-Delta™', 'Proof-of-Origin™'],
  },
];

export function S07Tech() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Proprietary Tech & IP" number={7} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center top, hsl(var(--secondary) / 0.14), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        {/* Hero band */}
        <div className="mb-10">
          <SectionHeader
            kicker="Proprietary Tech & IP"
            title=""
            subtitle=""
          />
          <div className="-mt-4">
            <h1 className="text-[96px] font-semibold tracking-tight text-white leading-none">
              Proof-of-Genesis<span className="text-secondary">™</span>
            </h1>
            <div className="mt-3 flex items-center gap-4">
              <span className="text-[14px] uppercase tracking-[0.18em] text-white/40 font-mono">
                Short form: PoG
              </span>
              <span className="px-3 py-1 rounded-md text-[12px] font-medium border border-secondary/30 bg-secondary/10 text-white/80">
                U.S. App. 19/634,402 · Patent-pending
              </span>
            </div>
            <p className="mt-5 text-[22px] text-white/70 max-w-[1100px] leading-snug">
              The first real-time, multi-OEM verification protocol that mints
              currency directly from verified clean energy.
            </p>
          </div>
        </div>

        {/* Efficiency comparison — emphasized */}
        <DeckCard emphasized className="flex-1 !p-0 overflow-hidden">
          <div className="grid grid-cols-2 h-full divide-x divide-secondary/20">
            {/* Left — Bitcoin */}
            <div className="p-10 flex flex-col">
              <CardKicker className="text-white/40">
                {comparison.left.sublabel}
              </CardKicker>
              <p className="text-[44px] font-semibold text-white/55 mt-2 leading-none">
                {comparison.left.label}
              </p>
              <div className="mt-8 space-y-6 flex-1">
                {comparison.left.rows.map((r) => (
                  <div key={r.stat}>
                    <p className="text-[28px] font-semibold text-white/55 leading-tight">
                      {r.stat}
                    </p>
                    <p className="text-[15px] text-white/40 mt-1">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — $ZSOLAR */}
            <div
              className="p-10 flex flex-col relative"
              style={{
                background:
                  'radial-gradient(ellipse at right, hsl(45 96% 56% / 0.08), transparent 60%)',
              }}
            >
              <CardKicker className="text-amber-400/80">
                {comparison.right.sublabel}
              </CardKicker>
              <p className="text-[44px] font-semibold text-white mt-2 leading-none">
                {comparison.right.label}
              </p>
              <div className="mt-8 space-y-6 flex-1">
                {comparison.right.rows.map((r) => (
                  <div key={r.stat}>
                    <p className="text-[28px] font-semibold text-amber-400 leading-tight">
                      {r.stat}
                    </p>
                    <p className="text-[15px] text-white/65 mt-1">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DeckCard>

        {/* Bottom strip */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {bottomCards.map((c) => (
            <DeckCard key={c.title} className="!p-5">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg border border-sky-400/30 bg-sky-400/10 flex items-center justify-center shrink-0">
                  <c.icon className="w-5 h-5 text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-semibold text-white">
                    {c.title}
                  </p>
                  {c.body && (
                    <p className="text-[14px] text-white/60 mt-1.5 leading-snug">
                      {c.body}
                    </p>
                  )}
                  {c.chips && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {c.chips.map((chip) => (
                        <span
                          key={chip}
                          className="px-2 py-1 rounded-md text-[12px] font-medium border border-secondary/30 bg-secondary/10 text-white/85"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DeckCard>
          ))}
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
