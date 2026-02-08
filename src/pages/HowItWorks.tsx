import { useRef } from 'react';
import { SEO } from '@/components/SEO';
import { HowToPlayHero } from '@/components/how-it-works/HowToPlayHero';
import { GameSteps } from '@/components/how-it-works/GameSteps';
import { StepProgressTimeline } from '@/components/how-it-works/StepProgressTimeline';
import { LevelUpSection } from '@/components/how-it-works/LevelUpSection';
import { PioneerRewards } from '@/components/how-it-works/PioneerRewards';
import { ReadyToPlayCTA } from '@/components/how-it-works/ReadyToPlayCTA';

export default function HowItWorks() {
  const stepsRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <SEO 
        title="How It Works | ZenSolar"
        description="Your clean energy is worth real money. Connect your solar, EV, or battery and start earning $ZSOLAR rewards with one tap."
        url="https://zensolar.lovable.app/how-it-works"
      />
      <div className="min-h-screen">
        <HowToPlayHero />
        <StepProgressTimeline containerRef={stepsRef} />
        <GameSteps ref={stepsRef} />
        <LevelUpSection />
        <PioneerRewards />
        <ReadyToPlayCTA />
      </div>
    </>
  );
}
