import { Card, CardContent } from '@/components/ui/card';
import type { ActivityType } from '@/hooks/useEnergyLog';

const labels: Record<ActivityType, string> = {
  solar: 'Solar Energy',
  battery: 'Battery Storage',
  'ev-charging': 'EV Charging',
  'ev-miles': 'EV Miles',
};

interface ComingSoonProps {
  activityType: ActivityType;
}

export function ComingSoon({ activityType }: ComingSoonProps) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-semibold">{labels[activityType]} Log</p>
          <p className="text-sm mt-2">Coming soon — we're working on pulling this data.</p>
        </div>
      </CardContent>
    </Card>
  );
}
