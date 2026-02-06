import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DailyProduction } from '@/hooks/useEnergyLog';

interface DayRowProps {
  day: DailyProduction;
  maxKwh: number;
  isBestDay: boolean;
}

export function DayRow({ day, maxKwh, isBestDay }: DayRowProps) {
  const barWidth = maxKwh > 0 ? Math.max(2, (day.kWh / maxKwh) * 100) : 0;
  const isToday = isSameDay(day.date, new Date());

  return (
    <div className={cn(
      "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
      isToday && "bg-primary/5 border border-primary/20",
      isBestDay && !isToday && "bg-amber-500/5",
    )}>
      {/* Date */}
      <div className="w-20 shrink-0">
        <p className={cn(
          "text-sm font-medium",
          isToday ? "text-primary" : "text-foreground"
        )}>
          {format(day.date, 'EEE, MMM d')}
        </p>
        {isToday && <p className="text-[10px] text-primary font-semibold uppercase">Today</p>}
      </div>

      {/* Bar */}
      <div className="flex-1 h-6 bg-muted/30 rounded-full overflow-hidden relative">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isBestDay
              ? "bg-gradient-to-r from-amber-500 to-yellow-400"
              : day.kWh > 0
                ? "bg-gradient-to-r from-primary to-primary/70"
                : "bg-muted/50"
          )}
          style={{ width: `${day.kWh > 0 ? barWidth : 0}%` }}
        />
        {isBestDay && day.kWh > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-500">
            ⭐ BEST
          </span>
        )}
      </div>

      {/* Value */}
      <div className="w-16 text-right shrink-0">
        <span className={cn(
          "text-sm font-bold tabular-nums",
          day.kWh > 0 ? "text-foreground" : "text-muted-foreground/50"
        )}>
          {day.kWh > 0 ? day.kWh.toLocaleString() : '—'}
        </span>
        <span className="text-xs text-muted-foreground ml-0.5">kWh</span>
      </div>
    </div>
  );
}
