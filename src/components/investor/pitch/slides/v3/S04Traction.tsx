import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';

const stats = [
  { label: 'Beta users', value: '23', sub: 'real wallets, real homes' },
  { label: 'kWh verified', value: '3.34M', sub: 'across Tesla, Enphase, Wallbox' },
  { label: '$ZSOLAR minted', value: '496K', sub: '45 on-chain mint txns' },
  { label: 'Pioneer NFTs', value: '6', sub: 'minted on Base Sepolia' },
];

const cols = [
  {
    title: 'OEMs live',
    items: [
      'Tesla (solar + home charging)',
      'Enphase (inverters)',
      'SolarEdge (PV)',
      'Wallbox (EV charging)',
    ],
  },
  {
    title: 'Protocol live',
    items: [
      'Smart contracts deployed',
      'Proof-of-Delta™ verification',
      'Device Watermark Registry',
      'Base Sepolia anchored',
    ],
  },
  {
    title: 'IP & defensibility',
    items: [
      'Non-provisional patent filed',
      'Mint-on-Proof™ trademark',
      'Proof-of-Genesis receipt live',
      '5 device providers ingested',
    ],
  },
];

export function S04Traction() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="Traction & Beta" number={4} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at bottom, hsl(var(--secondary) / 0.12), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        <SectionHeader
          kicker="Traction & Beta"
          title="Live on Base. Real devices. Real mints."
          subtitle="Every number below is on-chain or in the database today — no projections, no mockups."
        />

        <div className="grid grid-cols-4 gap-5 mb-8">
          {stats.map((s) => (
            <DeckCard key={s.label} className="text-center">
              <p className="text-[64px] font-semibold leading-none text-secondary">
                {s.value}
              </p>
              <p className="text-[18px] font-semibold text-white/85 mt-5">
                {s.label}
              </p>
              <p className="text-[14px] text-white/45 mt-1">{s.sub}</p>
            </DeckCard>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">
          {cols.map((c) => (
            <DeckCard key={c.title}>
              <CardKicker className="text-sky-400/80">{c.title}</CardKicker>
              <ul className="mt-4 space-y-2.5">
                {c.items.map((it) => (
                  <li
                    key={it}
                    className="flex items-start gap-3 text-[17px] text-white/75 leading-snug"
                  >
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                    {it}
                  </li>
                ))}
              </ul>
            </DeckCard>
          ))}
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
