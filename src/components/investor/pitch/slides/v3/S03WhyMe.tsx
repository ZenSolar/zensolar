import { SlideLayout, SlideHeader, SlideFooter } from '../../SlideLayout';
import { SectionHeader } from '../../v3/SectionHeader';
import { DeckCard, CardKicker } from '../../v3/DeckCard';

const proof = [
  { k: '15 yrs', v: 'renewable energy' },
  { k: 'Ex-SolarCity', v: 'sales · marketing · partnerships' },
  { k: 'Shipped with AI', v: 'and relentless iteration' },
];

export function S03WhyMe() {
  return (
    <SlideLayout variant="dark">
      <SlideHeader label="Why Me" number={3} />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at top left, hsl(var(--secondary) / 0.16), transparent 55%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col px-24 pt-28 pb-20">
        <SectionHeader
          kicker="Why Me"
          title="I lived this problem. Then AI let me build the answer."
        />

        <DeckCard emphasized className="mb-6">
          <p className="text-[26px] text-white/85 leading-[1.55] max-w-[1500px]">
            I spent{' '}
            <span className="text-white font-semibold">
              15 years in renewable energy
            </span>{' '}
            — sales, marketing, partnerships,{' '}
            <span className="text-white font-semibold">including SolarCity</span>.
            I watched every incentive cycle. Then last year I got laid off the
            same week my daughter was born. I'd already gone deep on Web3 and
            seen the same pattern in both industries I love — real technology,
            dragged down by bad actors. When I heard{' '}
            <span className="text-white">
              Elon tell Rogan that AI could write code for you
            </span>
            , I finally had the missing piece. So I built the consumer app I'd
            been sketching for a decade.
          </p>
        </DeckCard>

        <div className="grid grid-cols-3 gap-5 flex-1">
          {proof.map((p) => (
            <DeckCard key={p.k} className="flex flex-col justify-center">
              <p className="text-[40px] font-semibold text-secondary leading-none">
                {p.k}
              </p>
              <p className="text-[18px] text-white/60 mt-4 leading-snug">
                {p.v}
              </p>
            </DeckCard>
          ))}
        </div>

        <DeckCard className="mt-6">
          <CardKicker className="text-secondary/80">And I'm not alone</CardKicker>
          <p className="text-[20px] text-white/80 mt-3 leading-relaxed">
            <span className="text-white font-semibold">Michael Tschida</span> —
            lifelong best friend, co-founder, CFO/CRO — runs the numbers so I
            can run the product.
          </p>
        </DeckCard>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}
