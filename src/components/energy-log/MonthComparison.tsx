import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthData } from '@/hooks/useEnergyLog';

interface MonthComparisonProps {
  current: MonthData;
  previous: MonthData;
  currentLabel: string;
  previousLabel: string;
}

export function MonthComparison({ current, previous, currentLabel, previousLabel }: MonthComparisonProps) {
  const diff = current.totalKwh - previous.totalKwh;
  const pctChange = previous.totalKwh > 0 ? Math.round((diff / previous.totalKwh) * 100) : 0;
  const isUp = diff > 0;
  const isFlat = diff === 0;

  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Month-over-Month
        </p>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{previousLabel}</span>
              <span className="text-lg font-bold text-foreground">{previous.totalKwh.toLocaleString()} kWh</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{currentLabel}</span>
              <span className="text-lg font-bold text-foreground">{current.totalKwh.toLocaleString()} kWh</span>
            </div>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold",
            isFlat ? "bg-muted text-muted-foreground" :
            isUp ? "bg-emerald-500/15 text-emerald-500" : "bg-destructive/15 text-destructive"
          )}>
            {isFlat ? <Minus className="h-4 w-4" /> : isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {isFlat ? '0%' : `${isUp ? '+' : ''}${pctChange}%`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
