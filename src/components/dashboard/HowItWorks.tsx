import { Sun, Zap, Coins, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    icon: Sun,
    title: 'Connect Your System',
    description: 'Link your solar panels, battery, or EV charger through Tesla, Enphase, or SolarEdge.',
  },
  {
    icon: Zap,
    title: 'Generate Clean Energy',
    description: 'Your devices automatically report real kWh production data to the ZenSolar platform.',
  },
  {
    icon: Coins,
    title: 'Earn $ZSOLAR Tokens',
    description: 'Tokens are minted based on your verified energy production—no guesswork, just real impact.',
  },
  {
    icon: Award,
    title: 'Unlock Rewards',
    description: 'Use tokens for exclusive perks, discounts, and community benefits as the ecosystem grows.',
  },
];

export function HowItWorks() {
  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">How It Works</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-start gap-3">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
              <step.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
              </div>
              <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
