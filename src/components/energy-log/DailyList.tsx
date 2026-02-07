import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { WifiOff } from 'lucide-react';
import type { ActivityType, DailyProduction } from '@/hooks/useEnergyLog';

interface DailyListProps {
  days: DailyProduction[];
  unit?: string;
  activityType?: ActivityType;
}

export function DailyList({ days, unit = 'kWh', activityType }: DailyListProps) {
  const today = new Date();

  // Show days in reverse chronological order (most recent first), skip today (shown in hero)
  const sortedDays = [...days]
    .filter(d => !isSameDay(d.date, today))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  // Detect if the entire month has no data (gateway offline)
  const allZero = sortedDays.length > 0 && sortedDays.every(d => d.kWh === 0);
  const isBattery = activityType === 'battery';

  if (sortedDays.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No daily data yet this month.</p>
      </div>
    );
  }

  return (
    <div>
      {allZero && isBattery && (
        <div className="flex items-center gap-2 px-3 py-2.5 mb-1 rounded-lg bg-muted/50 border border-border/30">
          <span className="text-xs text-muted-foreground">
            No battery discharge recorded this month — the battery may have been set to 100% backup reserve.
          </span>
        </div>
      )}
      <div className="divide-y divide-border/40">
        {sortedDays.map(day => (
          <div
            key={day.date.toISOString()}
            className="flex items-center justify-between py-3 px-1"
          >
            <span className="text-sm text-muted-foreground">
              {format(day.date, 'EEE, MMM d')}
            </span>
            {day.kWh > 0 ? (
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {day.kWh.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
              </span>
            ) : (
              <span className="text-sm font-semibold tabular-nums text-muted-foreground/40">—</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}