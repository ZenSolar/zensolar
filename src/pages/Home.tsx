import { SEO } from '@/components/SEO';
import { HomeHero } from '@/components/home/HomeHero';
import { LiveStatsBar } from '@/components/home/LiveStatsBar';
import { HomeNav } from '@/components/home/HomeNav';
import { FloatingSectionNav } from '@/components/home/FloatingSectionNav';
import { SectionDivider } from '@/components/ui/section-divider';
import { LazySection } from '@/components/home/LazySection';
import { lazy, Suspense } from 'react';

// Lazy-load below-the-fold sections for faster initial paint
const HowItWorksSection = lazy(() => import('@/components/home/HowItWorksSection').then(m => ({ default: m.HowItWorksSection })));
const DashboardShowcase = lazy(() => import('@/components/home/DashboardShowcase').then(m => ({ default: m.DashboardShowcase })));
const CleanEnergyCenterShowcase = lazy(() => import('@/components/home/CleanEnergyCenterShowcase').then(m => ({ default: m.CleanEnergyCenterShowcase })));
const NFTMilestoneSection = lazy(() => import('@/components/home/NFTMilestoneSection').then(m => ({ default: m.NFTMilestoneSection })));
const StoreRedemptionSection = lazy(() => import('@/components/home/StoreRedemptionSection').then(m => ({ default: m.StoreRedemptionSection })));
const WhyZenSolarSection = lazy(() => import('@/components/home/WhyZenSolarSection').then(m => ({ default: m.WhyZenSolarSection })));
const TokenizationWaveSection = lazy(() => import('@/components/home/TokenizationWaveSection').then(m => ({ default: m.TokenizationWaveSection })));
const PricingSection = lazy(() => import('@/components/home/PricingSection').then(m => ({ default: m.PricingSection })));
const SubscriptionTransparencyPanel = lazy(() => import('@/components/home/SubscriptionTransparencyPanel').then(m => ({ default: m.SubscriptionTransparencyPanel })));
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const FAQSection = lazy(() => import('@/components/home/FAQSection').then(m => ({ default: m.FAQSection })));
const HomeCTA = lazy(() => import('@/components/home/HomeCTA').then(m => ({ default: m.HomeCTA })));
const HomeFooter = lazy(() => import('@/components/home/HomeFooter').then(m => ({ default: m.HomeFooter })));

export default function Home() {
  return (
    <>
      <SEO
        title="ZenSolar — Tokenize Your Clean Energy Into Digital Income"
        description="Tokenize your solar production, battery storage, and EV driving into $ZSOLAR rewards. The world's first physics-backed clean energy token."
        url="https://zensolar.com/home"
        image="https://zensolar.com/og-image.png"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'ZenSolar',
          url: 'https://zensolar.com',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web, iOS, Android',
          description: 'Earn $ZSOLAR tokens and NFTs for every kWh your solar panels produce, every EV mile you drive, and every battery cycle.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', ratingCount: '124' },
        }}
      />
      <div className="relative min-h-screen bg-background dark:bg-gradient-to-br dark:from-background dark:via-background dark:to-primary/5">
        <HomeNav />
        <FloatingSectionNav />
        <main>
          {/* Above-the-fold: loaded eagerly */}
          <HomeHero />
          <LiveStatsBar />

          {/* Below-the-fold: loaded on scroll */}
          <Suspense fallback={null}>
            <SectionDivider variant="chevron" />
            <LazySection>
              <HowItWorksSection />
            </LazySection>
            <SectionDivider variant="diamond" />
            <LazySection>
              <DashboardShowcase />
            </LazySection>
            <SectionDivider variant="diamond" />
            <LazySection>
              <CleanEnergyCenterShowcase />
            </LazySection>
            <SectionDivider variant="angle" />
            <LazySection>
              <NFTMilestoneSection />
            </LazySection>
            <SectionDivider variant="chevron" />
            <LazySection>
              <StoreRedemptionSection />
            </LazySection>
            <SectionDivider variant="angle" />
            <LazySection>
              <WhyZenSolarSection />
            </LazySection>
            <SectionDivider variant="angle" flip />
            <LazySection>
              <TokenizationWaveSection />
            </LazySection>
            <SectionDivider variant="diamond" />
            <LazySection>
              <PricingSection />
            </LazySection>
            <LazySection>
              <SubscriptionTransparencyPanel />
            </LazySection>
            <SectionDivider variant="chevron" />
            <LazySection>
              <TestimonialsSection />
            </LazySection>
            <SectionDivider variant="angle" />
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
