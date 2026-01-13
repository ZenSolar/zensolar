import { useState } from 'react';
import { 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Circle,
  ExternalLink,
  Wallet,
  Sun,
  Car,
  Battery
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface GettingStartedGuideProps {
  onConnectEnergy: () => void;
  onConnectWallet: () => void;
  energyConnected: boolean;
  walletConnected: boolean;
}

const GUIDE_STEPS = [
  {
    id: 1,
    title: 'Welcome to ZenSolar',
    description: 'Turn your clean energy into crypto rewards',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          ZenSolar connects your solar panels, EV charger, or home battery to the blockchain, 
          rewarding you with <strong>$ZSOLAR tokens</strong> and exclusive <strong>NFTs</strong> for 
          generating and using clean energy.
        </p>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10">
            <Sun className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">Solar Panels</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10">
            <Car className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">EV Charging</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/10">
            <Battery className="h-6 w-6 text-primary" />
            <span className="text-xs text-center">Home Battery</span>
          </div>
        </div>
      </div>
    ),
    icon: Zap,
  },
  {
    id: 2,
    title: 'Connect Your Energy System',
    description: 'Link your solar, EV, or battery account',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We support the most popular clean energy platforms. Connect one or more to start earning:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span><strong>Tesla</strong> - Solar, Powerwall, and EV charging</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span><strong>Enphase</strong> - Solar microinverters</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span><strong>SolarEdge</strong> - Solar inverters</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span><strong>Wallbox</strong> - EV chargers</span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground italic">
          More integrations coming soon!
        </p>
      </div>
    ),
    icon: Sun,
    actionLabel: 'Connect Energy System',
    actionKey: 'energy',
  },
  {
    id: 3,
    title: 'Set Up Your Wallet',
    description: 'Where your rewards will be sent',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          A crypto wallet is like a digital bank account for your tokens and NFTs. 
          Don't worry if you're new to this—we'll guide you through it!
        </p>
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-sm font-medium text-accent-foreground mb-2">What you'll need:</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• A wallet app like MetaMask or Rainbow</li>
            <li>• Just a few minutes to set up</li>
            <li>• No prior crypto experience needed</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          Your wallet address is how we'll send your $ZSOLAR tokens and NFT rewards.
        </p>
      </div>
    ),
    icon: Wallet,
    actionLabel: 'Connect Wallet',
    actionKey: 'wallet',
  },
  {
    id: 4,
    title: 'Start Earning!',
    description: 'Your journey to clean energy rewards begins',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Once connected, you'll automatically start earning rewards:
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">$ZSOLAR Tokens</p>
              <p className="text-xs text-muted-foreground">
                Earn tokens based on your energy production and EV charging
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <CheckCircle2 className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">NFT Milestones</p>
              <p className="text-xs text-muted-foreground">
                Unlock unique digital collectibles as you hit energy goals
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-center font-medium text-primary pt-2">
          🎉 You're ready to go!
        </p>
      </div>
    ),
    icon: CheckCircle2,
  },
];

export function GettingStartedGuide({
  onConnectEnergy,
  onConnectWallet,
  energyConnected,
  walletConnected,
}: GettingStartedGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Don't show if both are connected or dismissed - use display:none to prevent layout shift
  const shouldHide = (energyConnected && walletConnected) || dismissed;

  if (shouldHide) {
    return null;
  }

  const step = GUIDE_STEPS[currentStep];
  const progress = ((currentStep + 1) / GUIDE_STEPS.length) * 100;

  const handleAction = () => {
    if (step.actionKey === 'energy') {
      onConnectEnergy();
    } else if (step.actionKey === 'wallet') {
      onConnectWallet();
    }
  };

  const isStepComplete = (stepId: number) => {
    if (stepId === 2) return energyConnected;
    if (stepId === 3) return walletConnected;
    return false;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <step.icon className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Getting Started</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep + 1} of {GUIDE_STEPS.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-6 px-2"
              onClick={() => setDismissed(true)}
            >
              Skip
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mt-3" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 pb-2">
          {GUIDE_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                idx === currentStep
                  ? 'bg-primary w-6'
                  : isStepComplete(s.id)
                  ? 'bg-primary/60'
                  : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[200px]">
          <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
          {step.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-2">
            {step.actionLabel && (
              <Button
                size="sm"
                variant={isStepComplete(step.id) ? 'secondary' : 'default'}
                onClick={handleAction}
                disabled={isStepComplete(step.id)}
                className="gap-1"
              >
                {isStepComplete(step.id) ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Connected
                  </>
                ) : (
                  <>
                    {step.actionLabel}
                    <ExternalLink className="h-3 w-3" />
                  </>
                )}
              </Button>
            )}

            {currentStep < GUIDE_STEPS.length - 1 ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setDismissed(true)}
                className="gap-1"
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
