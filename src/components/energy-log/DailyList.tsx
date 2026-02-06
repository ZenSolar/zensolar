import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { ActivityType, DailyProduction } from '@/hooks/useEnergyLog';

interface DailyListProps {
  days: DailyProduction[];
  unit?: string;
}

export function DailyList({ days, unit = 'kWh' }: DailyListProps) {
  const today = new Date();

  // Show days in reverse chronological order (most recent first), skip today (shown in hero)
  const sortedDays = [...days]
    .filter(d => !isSameDay(d.date, today))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  if (sortedDays.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No daily data yet this month.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {sortedDays.map(day => (
        <div
          key={day.date.toISOString()}
          className="flex items-center justify-between py-3 px-1"
        >
          <span className="text-sm text-muted-foreground">
            {format(day.date, 'EEE, MMM d')}
          </span>
          <span className={cn(
            "text-sm font-semibold tabular-nums",
            day.kWh > 0 ? "text-foreground" : "text-muted-foreground/40"
          )}>
            {day.kWh > 0 ? (
              <>{day.kWh.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{unit}</span></>
            ) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
