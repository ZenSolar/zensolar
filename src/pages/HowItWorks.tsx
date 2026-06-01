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
import { MultiOemMoat } from '@/components/landing/MultiOemMoat';
import { FlywheelStrip } from '@/components/landing/FlywheelStrip';
import { ThreeEnginesLanding } from '@/components/landing/ThreeEnginesLanding';

export default function HowItWorks() {
  const stepsRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <SEO
        title="How ZenSolar Works — Creating Currency From Energy"
        description="Connect your Tesla, Enphase, SolarEdge, or Wallbox. Every verified kWh becomes $ZSOLAR through the Proof-of-Genesis™ protocol — 1 kWh = 1 $ZSOLAR."
        url="https://zensolar.com/how-it-works"
        image="https://zensolar.com/og-technology.png"
      />
      <div className="min-h-screen">
        <HowToPlayHero />
        <MultiOemMoat />
        <StepProgressTimeline containerRef={stepsRef} />
        <GameSteps ref={stepsRef} />
        <FlywheelStrip />
        <TokenomicsExplained />
        <DeflationaryFlywheel />
        <ThreeEnginesLanding />
        <LevelUpSection />
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
