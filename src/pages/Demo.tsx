import { ZenSolarDashboard } from '@/components/ZenSolarDashboard';
import { SEO } from '@/components/SEO';

const Demo = () => {
  return (
    <>
      <SEO 
        title="Demo - Try ZenSolar"
        url="https://zensolar.lovable.app/demo"
        image="https://zensolar.lovable.app/og-demo.png"
      />
      <ZenSolarDashboard isDemo />
    </>
  );
};

export default Demo;
