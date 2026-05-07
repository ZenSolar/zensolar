import { BookOpen } from 'lucide-react';
import { LearnSubPageShell } from '@/components/learn/LearnSubPageShell';
import { Card, CardContent } from '@/components/ui/card';
import { HowItWorksCTA } from '@/components/how-it-works/HowItWorksCTA';

export default function LearnHowItWorks() {
  return (
    <LearnSubPageShell
      title="How It Works"
      description="The four steps from sunlight to $ZSOLAR — explained without jargon."
      icon={BookOpen}
      seoTitle="How ZenSolar works"
      seoUrl="https://beta.zen.solar/learn/how-it-works"
    >
      <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-foreground/90 leading-relaxed">
            Connect your solar, battery, or EV — we verify your clean energy on-chain
            and you earn $ZSOLAR with one tap.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The full guide covers tiers, vesting, halving, the 100–200 year scarcity
            outlook, and everything else — in plain English.
          </p>
          <HowItWorksCTA
            label="Learn more → How ZenSolar Works"
            variant="default"
            layout="inline"
            className="w-full sm:w-auto"
          />
        </CardContent>
      </Card>
    </LearnSubPageShell>
  );
}
