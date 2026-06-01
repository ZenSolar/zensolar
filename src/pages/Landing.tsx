import { lazy, Suspense } from 'react';
import { SEO } from '@/components/SEO';
import { LandingNav, HeroSection } from '@/components/landing/HeroSection';
import { LazySection } from '@/components/home/LazySection';
import { LandingFooter } from '@/components/landing/LandingFooter';

// Lazy-load below-fold sections to protect LCP
const MultiOemMoat = lazy(() =>
  import('@/components/landing/MultiOemMoat').then((m) => ({ default: m.MultiOemMoat }))
);
const FlywheelStrip = lazy(() =>
  import('@/components/landing/FlywheelStrip').then((m) => ({ default: m.FlywheelStrip }))
);
const ThreeEnginesLanding = lazy(() =>
  import('@/components/landing/ThreeEnginesLanding').then((m) => ({
    default: m.ThreeEnginesLanding,
  }))
);
const MintOneToOneStrip = lazy(() =>
  import('@/components/landing/MintOneToOneStrip').then((m) => ({ default: m.MintOneToOneStrip }))
);
const InvestorStrip = lazy(() =>
  import('@/components/landing/InvestorStrip').then((m) => ({ default: m.InvestorStrip }))
);
const CTASection = lazy(() =>
  import('@/components/landing/BenefitsAndCTA').then((m) => ({ default: m.CTASection }))
);

const SectionFallback = () => <div className="min-h-[240px]" aria-hidden />;

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
          <Suspense fallback={<SectionFallback />}>
            <LazySection minHeight="320px">
              <MultiOemMoat />
            </LazySection>
            <LazySection minHeight="320px">
              <FlywheelStrip />
            </LazySection>
            <LazySection minHeight="480px">
              <ThreeEnginesLanding />
            </LazySection>
            <LazySection minHeight="240px">
              <MintOneToOneStrip />
            </LazySection>
            <LazySection minHeight="280px">
              <InvestorStrip />
            </LazySection>
            <LazySection minHeight="320px">
              <CTASection />
            </LazySection>
          </Suspense>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
