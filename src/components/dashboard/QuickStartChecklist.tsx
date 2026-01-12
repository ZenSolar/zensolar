import { Check, Wallet, Zap, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface QuickStartChecklistProps {
  walletConnected: boolean;
  energyAccountConnected: boolean;
  socialAccountConnected: boolean;
}

export function QuickStartChecklist({
  walletConnected,
  energyAccountConnected,
  socialAccountConnected,
}: QuickStartChecklistProps) {
  const steps = [
    {
      id: 'wallet',
      label: 'Connect your wallet',
      description: 'Required to receive $ZSOLAR tokens',
      completed: walletConnected,
      icon: Wallet,
    },
    {
      id: 'energy',
      label: 'Connect an energy account',
      description: 'Tesla, Enphase, or SolarEdge',
      completed: energyAccountConnected,
      icon: Zap,
    },
    {
      id: 'social',
      label: 'Link a social account',
      description: 'Earn bonus tokens for sharing',
      completed: socialAccountConnected,
      icon: Share2,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const allComplete = completedCount === steps.length;

  if (allComplete) {
    return null; // Hide when all steps are complete
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Quick Start</CardTitle>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{steps.length} complete
          </span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg transition-colors',
              step.completed
                ? 'bg-primary/10 opacity-60'
                : 'bg-muted/50 hover:bg-muted'
            )}
          >
            <div
              className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                step.completed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted-foreground/20 text-muted-foreground'
              )}
            >
              {step.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.completed && 'line-through text-muted-foreground'
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
