import { SEO } from '@/components/SEO';
import { HowToPlayHero } from '@/components/how-it-works/HowToPlayHero';
import { GameSteps } from '@/components/how-it-works/GameSteps';
import { LevelUpSection } from '@/components/how-it-works/LevelUpSection';
import { PioneerRewards } from '@/components/how-it-works/PioneerRewards';
import { ReadyToPlayCTA } from '@/components/how-it-works/ReadyToPlayCTA';

export default function HowItWorks() {
  return (
    <>
      <SEO 
        title="How to Play | ZenSolar"
        description="Your clean energy is worth real money. Connect your solar, EV, or battery and start earning $ZSOLAR rewards with one tap."
        url="https://zensolar.lovable.app/how-it-works"
      />
      <div className="min-h-screen">
        <HowToPlayHero />
        <GameSteps />
        <LevelUpSection />
        <PioneerRewards />
        <ReadyToPlayCTA />
      </div>
    </>
  );
}
