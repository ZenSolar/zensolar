import { SEO } from '@/components/SEO';
import { HomeHero } from '@/components/home/HomeHero';
import { LiveStatsBar } from '@/components/home/LiveStatsBar';
import { WhyZenSolarSection } from '@/components/home/WhyZenSolarSection';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { IntegrationLogos } from '@/components/home/IntegrationLogos';
import { PricingSection } from '@/components/home/PricingSection';

import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FAQSection } from '@/components/home/FAQSection';
import { HomeCTA } from '@/components/home/HomeCTA';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeNav } from '@/components/home/HomeNav';
import { SectionDivider } from '@/components/ui/section-divider';

export default function Home() {
  return (
    <>
      <SEO
        title="ZenSolar — Turn Clean Energy Into Digital Income"
        description="Earn $ZSOLAR tokens and NFTs for your solar production, battery storage, and EV driving. The world's first mint-on-proof clean energy rewards platform."
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
      <div className="min-h-screen bg-background dark:bg-gradient-to-br dark:from-background dark:via-background dark:to-primary/5">
        <HomeNav />
        <main>
          <HomeHero />
          <LiveStatsBar />
          <SectionDivider variant="chevron" />
          <HowItWorksSection />
          <SectionDivider variant="diamond" />
          <IntegrationLogos />
          <SectionDivider variant="angle" />
          <WhyZenSolarSection />
          <SectionDivider variant="angle" flip />
          <PricingSection />
          <SectionDivider variant="chevron" />
          <SectionDivider variant="diamond" />
          <TestimonialsSection />
          <SectionDivider variant="angle" />
          <FAQSection />
          <HomeCTA />
        </main>
        <HomeFooter />
      </div>
    </>
  );
}
