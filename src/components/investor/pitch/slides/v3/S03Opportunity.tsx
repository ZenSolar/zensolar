import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';

const tam = [
  { label: 'TAM', value: '1.5B', desc: 'Global solar-capable homes', accent: 'text-sky-400' },
  { label: 'SAM', value: '33M', desc: 'US + EU solar households', accent: 'text-secondary' },
  { label: 'SOM', value: '4.2M', desc: 'US solar + EV owners (Year 1 target)', accent: 'text-amber-400' },
];

export function S03Opportunity() {
  return (
    <SlideLayout variant="gradient">
      <SlideHeader label="The Opportunity" number={3} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top right, hsl(var(--secondary) / 0.12), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        <SectionHeader
          kicker="The Opportunity"
          title="A $240B market nobody's tokenized."
          subtitle="1.5 billion solar-capable homes globally. 4M+ US solar + EV households today. Zero platforms tokenize verified energy production as a real-world asset."
        />

        <div className="grid grid-cols-3 gap-6 mb-8">
          {tam.map((t) => (
            <DeckCard key={t.label} className="flex flex-col">
              <CardKicker className={`${t.accent}/80`}>{t.label}</CardKicker>
              <p className={`text-[80px] font-semibold leading-none mt-3 ${t.accent}`}>
                {t.value}
              </p>
              <p className="text-[20px] text-white/60 mt-5">{t.desc}</p>
            </DeckCard>
          ))}
        </div>

        <DeckCard emphasized>
          <CardKicker className="text-secondary">One patent · multiple markets</CardKicker>
          <div className="grid grid-cols-3 gap-8 mt-4">
            {[
              { title: 'Commercial Solar & Fleet EV', desc: 'Proof-of-Genesis™ scaled to warehouses, campuses, and commercial fleets. 10–100× capacity per account.' },
              { title: 'Grid Demand Response & VPP', desc: 'Manufacturer-agnostic aggregation for utility dispatch signaling and capacity payments.' },
              { title: 'Installer Mint Network', desc: 'B2B channel — installers mint 1 $ZSOLAR per 1 kW installed. Verified on-chain portfolio.' },
            ].map((c) => (
              <div key={c.title}>
                <p className="text-[22px] font-semibold text-white leading-tight">
                  {c.title}
                </p>
                <p className="text-[16px] text-white/60 mt-3 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </DeckCard>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
