import { useState, useMemo } from 'react';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths, isAfter, startOfDay } from 'date-fns';
import { Sun, Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { MonthSummaryCard } from '@/components/energy-log/MonthSummaryCard';
import { MonthComparison } from '@/components/energy-log/MonthComparison';
import { ActivityTabs } from '@/components/energy-log/ActivityTabs';
import { TodayHero } from '@/components/energy-log/TodayHero';
import { DailyList } from '@/components/energy-log/DailyList';
import { ChargingSessionList } from '@/components/energy-log/ChargingSessionList';
import { cn } from '@/lib/utils';
import type { ActivityType, DailyProduction, MonthData } from '@/hooks/useEnergyLog';
import type { ChargingSession } from '@/hooks/useChargingSessions';

// Seed-based pseudo-random for consistent demo data
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDemoMonth(monthStart: Date, monthEnd: Date, tab: ActivityType): DailyProduction[] {
  const today = new Date();
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return days
    .filter(day => !isAfter(day, today))
    .map((day, i) => {
      const seed = day.getTime() / 86400000 + tab.charCodeAt(0);
      const rand = seededRandom(seed);
      const dayOfWeek = day.getDay();

      let kWh: number;
      switch (tab) {
        case 'solar':
          // 25-65 kWh, slightly less on cloudy days (seeded), zero on ~10% of days
          kWh = rand < 0.1 ? 0 : Math.round((25 + rand * 40) * 10) / 10;
          break;
        case 'battery':
          // 3-18 kWh discharge, ~20% zero days
          kWh = rand < 0.2 ? 0 : Math.round((3 + rand * 15) * 10) / 10;
          break;
        case 'ev-charging':
          // 0-45 kWh, many zero days (charge every 3-4 days)
          kWh = rand < 0.6 ? 0 : Math.round((8 + rand * 37) * 10) / 10;
          break;
        case 'ev-miles':
          // 15-85 miles on most days, ~15% zero
          kWh = rand < 0.15 ? 0 : Math.round((15 + rand * 70) * 10) / 10;
          break;
      }

      return { date: day, kWh };
    });
}

function computeMonthData(days: DailyProduction[]): MonthData {
  const daysWithData = days.filter(d => d.kWh > 0).length;
  const totalKwh = Math.round(days.reduce((sum, d) => sum + d.kWh, 0) * 10) / 10;
  const avgKwh = daysWithData > 0 ? Math.round((totalKwh / daysWithData) * 10) / 10 : 0;
  const bestDay = days.reduce<DailyProduction | null>((best, d) => {
    if (!best || d.kWh > best.kWh) return d;
    return best;
  }, null);
  return { days, totalKwh, avgKwh, bestDay, daysWithData };
}

function generateDemoChargingSessions(monthStart: Date, monthEnd: Date): ChargingSession[] {
  const today = new Date();
  const sessions: ChargingSession[] = [];
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(d => !isAfter(d, today));

  days.forEach((day, i) => {
    const rand = seededRandom(day.getTime() / 86400000 + 99);
    if (rand > 0.35) return; // ~35% of days have charging

    const isHome = rand < 0.22;
    const isSupercharger = !isHome && rand < 0.3;
    const startHour = 8 + Math.floor(rand * 12);
    const durationMins = isHome ? 180 + Math.floor(rand * 300) : 20 + Math.floor(rand * 40);
    const startDate = new Date(day);
    startDate.setHours(startHour, Math.floor(rand * 60));
    const endDate = new Date(startDate.getTime() + durationMins * 60000);
    const kwh = isHome
      ? Math.round((8 + rand * 30) * 10) / 10
      : isSupercharger
        ? Math.round((15 + rand * 40) * 10) / 10
        : Math.round((5 + rand * 20) * 10) / 10;

    sessions.push({
      id: `demo-${i}-${day.getTime()}`,
      provider: 'tesla',
      device_id: 'demo-vehicle',
      session_date: format(day, 'yyyy-MM-dd'),
      energy_kwh: kwh,
      location: isHome ? 'Home' : isSupercharger ? 'Tesla Supercharger - Mountain View' : 'Whole Foods Market',
      fee_amount: isSupercharger ? Math.round(kwh * 0.42 * 100) / 100 : null,
      fee_currency: isSupercharger ? 'USD' : null,
      charging_type: isHome ? 'home' : isSupercharger ? 'fast' : 'other_ac',
      session_metadata: {
        source: isHome ? 'charge_monitor' : 'tesla_billing',
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      },
    });
  });

  return sessions.sort((a, b) => b.session_date.localeCompare(a.session_date));
}

const tabTitles: Record<ActivityType, string> = {
  solar: 'Solar Production',
  battery: 'Battery Storage Exported',
  'ev-charging': 'EV Charging',
  'ev-miles': 'EV Miles',
};

export function DemoEnergyLog() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<ActivityType>('solar');
  const [showMonthStats, setShowMonthStats] = useState(true);
  const [showSessions, setShowSessions] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const prevMonthStart = startOfMonth(subMonths(currentMonth, 1));
  const prevMonthEnd = endOfMonth(subMonths(currentMonth, 1));
  const canGoForward = !isAfter(startOfMonth(addMonths(currentMonth, 1)), new Date());

  const currentMonthData = useMemo(() => {
    const days = generateDemoMonth(monthStart, monthEnd, activeTab);
    return computeMonthData(days);
  }, [monthStart.getTime(), activeTab]);

  const compareMonthData = useMemo(() => {
    const days = generateDemoMonth(prevMonthStart, prevMonthEnd, activeTab);
    return computeMonthData(days);
  }, [prevMonthStart.getTime(), activeTab]);

  const chargingSessions = useMemo(() => {
    return activeTab === 'ev-charging' ? generateDemoChargingSessions(monthStart, monthEnd) : [];
  }, [monthStart.getTime(), activeTab]);

  const unit = activeTab === 'ev-miles' ? 'mi' : 'kWh';

  return (
    <AnimatedContainer className="w-full max-w-lg mx-auto px-3 sm:px-4 py-6 space-y-4">
      <AnimatedItem className="space-y-1">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">{tabTitles[activeTab]}</h1>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </AnimatedItem>

      <AnimatedItem>
        <TodayHero days={currentMonthData.days} activityType={activeTab} />
      </AnimatedItem>

      <AnimatedItem>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{format(currentMonth, 'MMMM yyyy')}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-semibold text-foreground">{currentMonthData.totalKwh.toLocaleString()} {unit}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { if (canGoForward) setCurrentMonth(prev => addMonths(prev, 1)); }} disabled={!canGoForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card className="bg-card border-border/50">
          <CardContent className="px-3 py-1">
            <DailyList days={currentMonthData.days} unit={unit} activityType={activeTab} />
          </CardContent>
        </Card>
      </AnimatedItem>

      {activeTab === 'ev-charging' && chargingSessions.length > 0 && (
        <AnimatedItem>
          <button
            onClick={() => setShowSessions(prev => !prev)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>{showSessions ? 'Hide' : 'View'} session details</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showSessions && "rotate-180")} />
          </button>
          {showSessions && <ChargingSessionList sessions={chargingSessions} />}
        </AnimatedItem>
      )}

      <AnimatedItem>
        <button
          onClick={() => setShowMonthStats(prev => !prev)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{showMonthStats ? 'Hide' : 'View'} month stats</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showMonthStats && "rotate-180")} />
        </button>
        {showMonthStats && (
          <div className="space-y-3">
            <MonthSummaryCard data={currentMonthData} label={format(currentMonth, 'MMMM yyyy')} unit={unit} />
            <MonthComparison
              current={currentMonthData}
              previous={compareMonthData}
              currentLabel={format(currentMonth, 'MMM')}
              previousLabel={format(subMonths(currentMonth, 1), 'MMM')}
              unit={unit}
            />
          </div>
        )}
      </AnimatedItem>
    </AnimatedContainer>
  );
}
