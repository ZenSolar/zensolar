import { BookOpen, Sparkles, Activity, Flame, Rocket } from 'lucide-react';
import { LearnSubPageShell } from '@/components/learn/LearnSubPageShell';
import { Card, CardContent } from '@/components/ui/card';
import { HowItWorksCTA } from '@/components/how-it-works/HowItWorksCTA';

const bullets = [
  { icon: Sparkles, text: 'What you see is what you mint — 1 kWh = 1 $ZSOLAR, every time.' },
  { icon: Activity, text: 'One cockpit for Tesla, Enphase, SolarEdge, and Wallbox — verified live on Base.' },
  { icon: Flame, text: 'Continuous 20% burn on every mint + separate 3% transfer tax recycled to LP.' },
  { icon: Rocket, text: 'Launches at $0.10 via LP-seeded rounds — no speculative pre-pump.' },
];

export default function LearnHowItWorks() {
  return (
    <LearnSubPageShell
      title="How It Works"
      description="Creating Currency From Energy — explained without jargon."
      icon={BookOpen}
      seoTitle="How ZenSolar works"
      seoUrl="https://beta.zen.solar/learn/how-it-works"
    >
      <Card className="border-border/60 bg-card/70 backdrop-blur-sm">
        <CardContent className="p-6 space-y-5">
          <p className="text-sm text-foreground/90 leading-relaxed">
            Connect your solar, battery, or EV. ZenSolar verifies every kWh on-chain through the
            Proof-of-Genesis™ protocol and mints $ZSOLAR with one tap.
          </p>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b.text} className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground/90 leading-relaxed">{b.text}</span>
              </li>
            ))}
          </ul>
          <HowItWorksCTA
            label="See the full guide →"
            variant="default"
            layout="inline"
            className="w-full sm:w-auto"
          />
        </CardContent>
      </Card>
    </LearnSubPageShell>
  );
}
