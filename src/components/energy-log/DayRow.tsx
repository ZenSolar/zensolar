import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DailyProduction } from '@/hooks/useEnergyLog';

interface DayRowProps {
  day: DailyProduction;
  maxKwh: number;
  isBestDay: boolean;
}

export function DayRow({ day, maxKwh, isBestDay }: DayRowProps) {
  const intensity = maxKwh > 0 ? day.kWh / maxKwh : 0;
  const barWidth = maxKwh > 0 ? Math.max(3, intensity * 100) : 0;
  const isToday = isSameDay(day.date, new Date());

  return (
    <div className={cn(
      "relative flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
      isToday && "bg-primary/5 border border-primary/20",
    )}>
      {/* Spark strip background */}
      {day.kWh > 0 && (
        <div
          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
          style={{
            width: `${barWidth}%`,
            background: isBestDay
              ? 'linear-gradient(90deg, hsl(45 93% 47% / 0.15), hsl(45 93% 47% / 0.08))'
              : `linear-gradient(90deg, hsl(207 90% 54% / ${0.08 + intensity * 0.12}), hsl(207 90% 54% / 0.03))`,
          }}
        />
      )}

      {/* Date */}
      <div className="relative w-24 shrink-0">
        <p className={cn(
          "text-sm font-medium",
          isToday ? "text-primary" : "text-foreground"
        )}>
          {format(day.date, 'EEE, MMM d')}
        </p>
        {isToday && <p className="text-[10px] text-primary font-semibold uppercase tracking-wide">Today</p>}
      </div>

      {/* Spacer */}
      <div className="relative flex-1 flex items-center">
        {isBestDay && day.kWh > 0 && (
          <span className="text-[10px] font-semibold text-amber-500/80">⭐ Best</span>
        )}
      </div>

      {/* Value */}
      <div className="relative w-16 text-right shrink-0">
        <span className={cn(
          "text-sm font-bold tabular-nums",
          day.kWh > 0 ? "text-foreground" : "text-muted-foreground/40"
        )}>
          {day.kWh > 0 ? day.kWh.toLocaleString() : '—'}
        </span>
        {day.kWh > 0 && <span className="text-xs text-muted-foreground ml-0.5">kWh</span>}
      </div>
    </div>
  );
}
