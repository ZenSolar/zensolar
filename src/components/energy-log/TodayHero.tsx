import { isSameDay, subDays, format } from 'date-fns';
import { Sun, TrendingUp, TrendingDown, Minus, Battery, Plug, Car } from 'lucide-react';
import type { ActivityType, DailyProduction } from '@/hooks/useEnergyLog';

interface TodayHeroProps {
  days: DailyProduction[];
  activityType: ActivityType;
}

const tabConfig: Record<ActivityType, { icon: React.ReactNode; unit: string; emptyLabel: string }> = {
  solar: { icon: <Sun className="h-6 w-6 text-primary self-center" />, unit: 'kWh', emptyLabel: 'No production recorded yet today' },
  battery: { icon: <Battery className="h-6 w-6 text-primary self-center" />, unit: 'kWh', emptyLabel: 'No battery discharge recorded yet today' },
  'ev-charging': { icon: <Plug className="h-6 w-6 text-primary self-center" />, unit: 'kWh', emptyLabel: 'No charging recorded yet today' },
  'ev-miles': { icon: <Car className="h-6 w-6 text-primary self-center" />, unit: 'mi', emptyLabel: 'No miles recorded yet today' },
};

export function TodayHero({ days, activityType }: TodayHeroProps) {
  const today = new Date();
  const todayData = days.find(d => isSameDay(d.date, today));
  const yesterdayData = days.find(d => isSameDay(d.date, subDays(today, 1)));

  const todayKwh = todayData?.kWh ?? 0;
  const yesterdayKwh = yesterdayData?.kWh ?? 0;

  const diff = todayKwh - yesterdayKwh;
  const showComparison = yesterdayKwh > 0 && todayKwh > 0;
  const config = tabConfig[activityType];

  return (
    <div className="text-center py-4 space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {format(today, 'EEEE, MMM d')}
      </p>
      <div className="flex items-baseline justify-center gap-1.5">
        {config.icon}
        <span className="text-5xl font-bold tabular-nums text-foreground tracking-tight">
          {todayKwh > 0 ? todayKwh.toLocaleString() : '—'}
        </span>
        <span className="text-lg text-muted-foreground font-medium">{config.unit}</span>
      </div>
      {showComparison ? (
        <div className="flex items-center justify-center gap-1 text-xs">
          {diff > 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : diff < 0 ? (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={
            diff > 0 ? "text-emerald-500 font-medium" :
            diff < 0 ? "text-destructive font-medium" :
            "text-muted-foreground"
          }>
            {diff > 0 ? '+' : ''}{diff.toLocaleString()} {config.unit} vs yesterday
          </span>
        </div>
      ) : todayKwh === 0 ? (
        <p className="text-xs text-muted-foreground">{config.emptyLabel}</p>
      ) : null}
    </div>
  );
}
