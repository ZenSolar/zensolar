import { ZenSolarDashboard } from '@/components/ZenSolarDashboard';
import { SEO } from '@/components/SEO';

const Demo = () => {
  return (
    <>
      <SEO 
        title="Demo - Try ZenSolar"
        url="https://beta.zen.solar/demo"
        image="https://beta.zen.solar/og-demo.png"
      />
      <ZenSolarDashboard isDemo />
    </>
  );
};

export default Demo;
