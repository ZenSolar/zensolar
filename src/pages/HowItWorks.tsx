import { useRef } from 'react';
import { SEO } from '@/components/SEO';
import { HowToPlayHero } from '@/components/how-it-works/HowToPlayHero';
import { GameSteps } from '@/components/how-it-works/GameSteps';
import { StepProgressTimeline } from '@/components/how-it-works/StepProgressTimeline';
import { LevelUpSection } from '@/components/how-it-works/LevelUpSection';
import { PioneerRewards } from '@/components/how-it-works/PioneerRewards';
import { ReadyToPlayCTA } from '@/components/how-it-works/ReadyToPlayCTA';
import { DeflationaryFlywheel } from '@/components/how-it-works/DeflationaryFlywheel';
import { TokenomicsExplained } from '@/components/how-it-works/TokenomicsExplained';
import { ScarcityOutlookSection } from '@/components/founders/ScarcityOutlookSection';

export default function HowItWorks() {
  const stepsRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <SEO
        title="How ZenSolar Works"
        description="Your clean energy is worth real money. Connect your solar, EV, or battery and start earning $ZSOLAR rewards with one tap."
        url="https://beta.zen.solar/how-it-works"
      />
      <div className="min-h-screen">
        <HowToPlayHero />
        <StepProgressTimeline containerRef={stepsRef} />
        <GameSteps ref={stepsRef} />
        <TokenomicsExplained />
        <LevelUpSection />
        <DeflationaryFlywheel />
        <section className="py-[clamp(2rem,6vw,4rem)]">
          <div className="container max-w-5xl mx-auto px-4">
            <ScarcityOutlookSection />
          </div>
        </section>
        <PioneerRewards />
        <ReadyToPlayCTA />
      </div>
    </>
  );
}
