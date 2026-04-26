import { BookOpen } from 'lucide-react';
import { LearnSubPageShell } from '@/components/learn/LearnSubPageShell';
import { HowItWorksSection } from '@/components/learn/sections';

export default function LearnHowItWorks() {
  return (
    <LearnSubPageShell
      title="How It Works"
      description="The four steps from sunlight to $ZSOLAR — explained without jargon."
      icon={BookOpen}
      seoTitle="How ZenSolar works"
      seoUrl="https://beta.zen.solar/demo/learn/how-it-works"
    >
      <HowItWorksSection />
    </LearnSubPageShell>
  );
}
