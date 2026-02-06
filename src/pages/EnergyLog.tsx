import { useEnergyLog, DailyProduction, MonthData } from '@/hooks/useEnergyLog';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Sun, TrendingUp, Calendar, Loader2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';

function MonthSummaryCard({ data, label }: { data: MonthData; label: string }) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-2xl font-bold text-foreground">{data.totalKwh.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total kWh</p>
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

function MonthComparison({ current, previous, currentLabel, previousLabel }: { 
  current: MonthData; 
  previous: MonthData; 
  currentLabel: string;
  previousLabel: string;
}) {
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

function DayRow({ day, maxKwh, isBestDay }: { day: DailyProduction; maxKwh: number; isBestDay: boolean }) {
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

export default function EnergyLog() {
  const {
    currentMonth,
    currentMonthData,
    compareMonthData,
    isLoading,
    goToPreviousMonth,
    goToNextMonth,
    canGoForward,
  } = useEnergyLog();

  const maxKwh = Math.max(...currentMonthData.days.map(d => d.kWh), 1);

  return (
    <AnimatedContainer className="w-full max-w-lg mx-auto px-3 sm:px-4 py-6 space-y-5">
      {/* Header */}
      <AnimatedItem className="space-y-1">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Energy Log</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Daily solar production — your clean energy statement.
        </p>
      </AnimatedItem>

      {/* Month Navigation */}
      <AnimatedItem>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} disabled={!canGoForward}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </AnimatedItem>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Month Summary */}
          <AnimatedItem>
            <MonthSummaryCard data={currentMonthData} label={format(currentMonth, 'MMMM yyyy')} />
          </AnimatedItem>

          {/* Month Comparison */}
          <AnimatedItem>
            <MonthComparison
              current={currentMonthData}
              previous={compareMonthData}
              currentLabel={format(currentMonth, 'MMM')}
              previousLabel={format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1), 'MMM')}
            />
          </AnimatedItem>

          {/* Daily List */}
          <AnimatedItem>
            <Card className="bg-card border-border/50 overflow-hidden">
              <CardContent className="p-2 sm:p-3">
                <div className="space-y-0.5">
                  {currentMonthData.days.length > 0 ? (
                    currentMonthData.days.map(day => (
                      <DayRow
                        key={day.date.toISOString()}
                        day={day}
                        maxKwh={maxKwh}
                        isBestDay={!!(currentMonthData.bestDay && isSameDay(day.date, currentMonthData.bestDay.date) && day.kWh > 0)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Sun className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No production data yet</p>
                      <p className="text-sm mt-1">Connect your solar system to start tracking.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedItem>
        </>
      )}
    </AnimatedContainer>
  );
}
