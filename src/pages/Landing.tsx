import { SectionDivider } from '@/components/ui/section-divider';
import { SEO } from '@/components/SEO';
import { LandingNav, HeroSection } from '@/components/landing/HeroSection';
import { SEGISection } from '@/components/landing/SEGISection';
import { CompetitiveEdge } from '@/components/landing/CompetitiveEdge';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { BenefitsSection, CTASection } from '@/components/landing/BenefitsAndCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function Landing() {
  return (
    <>
      <SEO
        title="Earn $ZSOLAR For Your Clean Energy Use"
        description="Turn your solar panels, batteries, and EVs into digital income. ZenSolar rewards every kWh with blockchain tokens — no crypto experience needed."
        url="https://zensolar.com"
        image="https://zensolar.com/og-image.png"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'ZenSolar',
          url: 'https://zensolar.com',
          logo: 'https://zensolar.com/logos/zen-logo-horizontal-new.png',
          description: 'ZenSolar rewards clean energy production with blockchain tokens. Connect solar panels, batteries, or EVs and earn $ZSOLAR automatically.',
          sameAs: ['https://twitter.com/ZenSolar'],
          foundingDate: '2024',
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            url: 'https://zensolar.com/home#faq',
          },
        }}
      />
      <div className="min-h-screen bg-background dark:bg-gradient-to-br dark:from-background dark:via-background dark:to-primary/5">
        <LandingNav />
        <main id="main-content">
          <HeroSection />
          <SectionDivider variant="chevron" />
          <SEGISection />
          <SectionDivider variant="diamond" />
          <CompetitiveEdge />
          <SectionDivider variant="angle" />
          <FeaturesGrid />
          <SectionDivider variant="angle" flip />
          <BenefitsSection />
          <SectionDivider variant="chevron" />
          <CTASection />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
