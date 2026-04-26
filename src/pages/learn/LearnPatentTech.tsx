import { Cpu } from 'lucide-react';
import { LearnSubPageShell } from '@/components/learn/LearnSubPageShell';
import { PatentTechSection } from '@/components/learn/sections';

export default function LearnPatentTech() {
  return (
    <LearnSubPageShell
      title="Patent Tech"
      description="SEGI — the four-layer engine behind every verified mint."
      icon={Cpu}
      seoTitle="ZenSolar Patent Tech"
      seoUrl="https://beta.zen.solar/demo/learn/patent-tech"
    >
      <PatentTechSection />
    </LearnSubPageShell>
  );
}
