import { SEO } from '@/components/SEO';
import { HomeHero } from '@/components/home/HomeHero';
import { LiveStatsBar } from '@/components/home/LiveStatsBar';
import { HowItWorksSection } from '@/components/home/HowItWorksSection';
import { IntegrationLogos } from '@/components/home/IntegrationLogos';
import { TokenomicsOverview } from '@/components/home/TokenomicsOverview';
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
        url="https://zensolar.lovable.app/home"
        image="https://zensolar.lovable.app/og-image.png"
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
          <TokenomicsOverview />
          <SectionDivider variant="angle" flip />
          <TestimonialsSection />
          <SectionDivider variant="chevron" />
          <FAQSection />
          <HomeCTA />
        </main>
        <HomeFooter />
      </div>
    </>
  );
}
