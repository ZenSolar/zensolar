import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

// PublicHome is the new marketing surface for the production hosts
// (zensolar.com / www.zensolar.com) and every preview host. The legacy
// marketing sections in this file are no longer reachable at `/`.
const PublicHome = lazy(() => import('./PublicHome'));

// Beta hosts get their own minimal Quiet Current front door that routes
// into the passwordless /onboarding flow.
const BETA_HOSTS = new Set([
  'beta.zensolar.com',
  'www.beta.zensolar.com',
  // Legacy hosts kept during DNS transition
  'beta.zen.solar',
  'www.beta.zen.solar',
]);

export default function Home() {
  if (typeof window !== 'undefined' && BETA_HOSTS.has(window.location.hostname)) {
    return <Navigate to="/beta-welcome" replace />;
  }
  return (
    <Suspense fallback={null}>
      <PublicHome />
    </Suspense>
  );
}

        title="ZenSolar — Tokenize Your Clean Energy Into Digital Income"
        description="Turn your solar production, battery storage, and EV driving into verified rewards. The world's first physics-backed clean energy token."
        url="https://zensolar.com/home"
        image="https://zensolar.com/og-image.png"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'ZenSolar',
          url: 'https://zensolar.com',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web, iOS, Android',
          description: 'Earn rewards and NFTs for every kWh your solar panels produce, every EV mile you drive, and every battery cycle.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '124' },
        }}
      />
      <div className="relative min-h-screen bg-background text-foreground">
        <HomeNav />
        <Suspense fallback={null}>
          <FloatingSectionNav />
        </Suspense>
        <main>
          {/* Above-the-fold: loaded eagerly */}
          <HomeHero />
          <LiveStatsBar />

          {/* Below-the-fold: loaded on scroll */}
          <Suspense fallback={null}>
            <LazySection>
              <HowItWorksSection />
            </LazySection>
            <LazySection>
              <CleanEnergyCenterShowcase />
            </LazySection>
            <LazySection>
              <NFTMilestoneSection />
            </LazySection>
            <LazySection>
              <StoreRedemptionSection />
            </LazySection>
            <LazySection>
              <WhyZenSolarSection />
            </LazySection>
            <LazySection>
              <PricingSection />
            </LazySection>
            <LazySection>
              <SubscriptionTransparencyPanel />
            </LazySection>
            <LazySection>
              <TestimonialsSection />
            </LazySection>
            <LazySection>
              <FAQSection />
            </LazySection>
            <LazySection>
              <HomeCTA />
            </LazySection>
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <LazySection>
            <HomeFooter />
          </LazySection>
        </Suspense>
      </div>
    </>
  );
}
