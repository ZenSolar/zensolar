import { Sun, Zap, Coins, Wallet, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const steps = [
  {
    icon: Sun,
    title: 'Connect Your System',
    description: 'Link your solar panels, battery, or EV charger through Tesla, Enphase, SolarEdge, or Wallbox.',
  },
  {
    icon: Zap,
    title: 'Generate & Drive Clean',
    description: 'Your devices report real kWh from solar production and EV charging to ZenSolar.',
  },
  {
    icon: Coins,
    title: 'Earn $ZSOLAR & NFTs',
    description: 'Tokens and digital collectibles are minted based on verified energy data—unlock rewards as you grow.',
  },
  {
    icon: Wallet,
    title: 'Mint to Your Wallet',
    description: 'Claim your $ZSOLAR tokens and NFTs directly to your connected crypto wallet.',
  },
];

interface HowItWorksProps {
  showCard?: boolean;
}

export function HowItWorks({ showCard = true }: HowItWorksProps) {
  const content = (
    <div className="space-y-4">
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
      <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
        <Gift className="h-4 w-4 text-primary" />
        <span>Use your rewards for exclusive perks, discounts, and community benefits.</span>
      </div>
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">How It Works</CardTitle>
          <Link 
            to="/how-it-works" 
            className="text-xs text-primary hover:underline"
          >
            Learn more
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );
}
