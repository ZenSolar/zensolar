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
      <SlideHeader label="The Opportunity" number={4} />
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
          title="$1.7T/yr flows into clean energy. Nobody has tokenized the kWh itself."
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
          <CardKicker className="text-secondary">Proof-of-Work vs Proof-of-Genesis™</CardKicker>
          <p className="text-[22px] text-white/85 mt-4 leading-relaxed max-w-[1500px]">
            <span className="text-white font-semibold">Bitcoin burns energy to create scarcity.</span>{' '}
            <span className="text-secondary">We reward energy to create currency.</span>
          </p>
          <p className="text-[17px] text-white/60 mt-3 leading-relaxed max-w-[1500px]">
            One verified clean kilowatt-hour → one $ZSOLAR. Abundance becomes value, instead of consumption becoming artificial scarcity.
          </p>
        </DeckCard>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
