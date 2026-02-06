import { useEnergyLog } from '@/hooks/useEnergyLog';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Sun, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { MonthSummaryCard } from '@/components/energy-log/MonthSummaryCard';
import { MonthComparison } from '@/components/energy-log/MonthComparison';
import { DayRow } from '@/components/energy-log/DayRow';
import { ActivityTabs } from '@/components/energy-log/ActivityTabs';
import { ComingSoon } from '@/components/energy-log/ComingSoon';

export default function EnergyLog() {
  const {
    currentMonth,
    currentMonthData,
    compareMonthData,
    isLoading,
    goToPreviousMonth,
    goToNextMonth,
    canGoForward,
    activeTab,
    setActiveTab,
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
          Daily production — your clean energy statement.
        </p>
      </AnimatedItem>

      {/* Activity Tabs */}
      <AnimatedItem>
        <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />
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

      {/* Tab Content */}
      {activeTab !== 'solar' ? (
        <AnimatedItem>
          <ComingSoon activityType={activeTab} />
        </AnimatedItem>
      ) : isLoading ? (
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
