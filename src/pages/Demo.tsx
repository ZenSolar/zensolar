import { ZenSolarDashboard } from '@/components/ZenSolarDashboard';
import { SEO } from '@/components/SEO';

const Demo = () => {
  return (
    <>
      <SEO 
        title="Demo - Try ZenSolar"
        description="Experience ZenSolar's clean energy rewards platform. See how you can earn $ZSOLAR tokens and NFTs for your solar, EV, and battery usage."
        url="https://zensolar.lovable.app/demo"
        image="https://zensolar.lovable.app/og-demo.png"
      />
      <ZenSolarDashboard isDemo />
    </>
  );
};

export default Demo;
