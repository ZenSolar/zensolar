import { SEO } from '@/components/SEO';
import { LandingNav, HeroSection } from '@/components/landing/HeroSection';
import { MultiOemMoat } from '@/components/landing/MultiOemMoat';
import { FlywheelStrip } from '@/components/landing/FlywheelStrip';
import { ThreeEnginesLanding } from '@/components/landing/ThreeEnginesLanding';
import { MintOneToOneStrip } from '@/components/landing/MintOneToOneStrip';
import { InvestorStrip } from '@/components/landing/InvestorStrip';
import { CTASection } from '@/components/landing/BenefitsAndCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function Landing() {
  return (
    <>
      <SEO
        title="ZenSolar — Creating Currency From Energy"
        description="Every verified kWh becomes $ZSOLAR through the Proof-of-Genesis™ protocol. The first-of-its-kind multi-OEM cockpit for Tesla, Enphase, SolarEdge, and Wallbox."
        url="https://zensolar.com"
        image="https://zensolar.com/og-image.png"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'ZenSolar',
          url: 'https://zensolar.com',
          logo: 'https://zensolar.com/logos/zen-logo-horizontal-new.png',
          description: 'ZenSolar turns every verified kWh into $ZSOLAR via the Proof-of-Genesis™ protocol, with a multi-OEM cockpit for Tesla, Enphase, SolarEdge, and Wallbox.',
          sameAs: ['https://twitter.com/ZenSolar'],
          foundingDate: '2024',
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            url: 'https://zensolar.com/home#faq',
          },
        }}
      />
      <div className="min-h-screen bg-background bg-gradient-to-br from-background via-background to-primary/5">
        <LandingNav />
        <main id="main-content">
          <HeroSection />
          <MultiOemMoat />
          <FlywheelStrip />
          <ThreeEnginesLanding />
          <MintOneToOneStrip />
          <InvestorStrip />
          <CTASection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
