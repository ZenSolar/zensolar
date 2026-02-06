import { Card, CardContent } from '@/components/ui/card';
import type { MonthData } from '@/hooks/useEnergyLog';

interface MonthSummaryCardProps {
  data: MonthData;
  label: string;
  unit?: string; // pass 'mi' for EV miles
}

export function MonthSummaryCard({ data, label, unit = 'kWh' }: MonthSummaryCardProps) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-2xl font-bold text-foreground">{data.totalKwh.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total {unit}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{data.avgKwh}</p>
            <p className="text-xs text-muted-foreground">Daily Avg</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{data.bestDay ? data.bestDay.kWh : '—'}</p>
            <p className="text-xs text-muted-foreground">Best Day</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
