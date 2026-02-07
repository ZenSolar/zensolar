import { useEffect, useRef, useState } from 'react';
import { useEnergyLog } from '@/hooks/useEnergyLog';
import { useChargingSessions } from '@/hooks/useChargingSessions';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Sun, Calendar, Loader2, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { MonthSummaryCard } from '@/components/energy-log/MonthSummaryCard';
import { MonthComparison } from '@/components/energy-log/MonthComparison';
import { SystemPerformanceCard } from '@/components/energy-log/SystemPerformanceCard';
import { ActivityTabs } from '@/components/energy-log/ActivityTabs';
import { ComingSoon } from '@/components/energy-log/ComingSoon';
import { TodayHero } from '@/components/energy-log/TodayHero';
import { DailyList } from '@/components/energy-log/DailyList';
import { ChargingSessionList } from '@/components/energy-log/ChargingSessionList';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

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

  const { data: chargingSessions = [] } = useChargingSessions(currentMonth);
  const queryClient = useQueryClient();
  const backfillTriggered = useRef(false);
  const [showMonthStats, setShowMonthStats] = useState(true);
  const [showSessions, setShowSessions] = useState(true);

  // One-time historical backfill for existing Enphase users
  useEffect(() => {
    if (backfillTriggered.current) return;
    backfillTriggered.current = true;

    const triggerBackfills = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Enphase backfill
        const { data: enphaseTokens } = await supabase
          .from('energy_tokens')
          .select('provider')
          .eq('provider', 'enphase')
          .limit(1);

        if (enphaseTokens && enphaseTokens.length > 0) {
          const backfillKey = `enphase_backfill_done_${session.user.id}`;
          if (!localStorage.getItem(backfillKey)) {
            console.log('[EnergyLog] Running one-time Enphase historical backfill...');
            const res = await supabase.functions.invoke('enphase-historical', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.data?.success) {
              console.log(`[EnergyLog] Enphase backfill complete: ${res.data.total_days_imported} days imported`);
              localStorage.setItem(backfillKey, 'true');
              queryClient.invalidateQueries({ queryKey: ['energy-log-records'] });
            }
          }
        }

        // Tesla backfill (solar + battery + EV charging)
        const { data: teslaTokens } = await supabase
          .from('energy_tokens')
          .select('provider')
          .eq('provider', 'tesla')
          .limit(1);

        if (teslaTokens && teslaTokens.length > 0) {
          const backfillKey = `tesla_backfill_v2_${session.user.id}`;
          if (!localStorage.getItem(backfillKey)) {
            console.log('[EnergyLog] Running one-time Tesla historical backfill...');
            const res = await supabase.functions.invoke('tesla-historical', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.data?.success) {
              console.log(`[EnergyLog] Tesla backfill complete:`, res.data);
              localStorage.setItem(backfillKey, 'true');
              queryClient.invalidateQueries({ queryKey: ['energy-log-records'] });
            } else if (res.error) {
              console.error('[EnergyLog] Tesla backfill error:', res.error);
            }
          }
        }
      } catch (err) {
        console.error('[EnergyLog] Backfill error:', err);
      }
    };

    triggerBackfills();
  }, [queryClient]);

  return (
    <AnimatedContainer className="w-full max-w-lg mx-auto px-3 sm:px-4 py-6 space-y-4">
      {/* Header */}
      <AnimatedItem className="space-y-1">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {activeTab === 'solar' && 'Solar Energy Log'}
            {activeTab === 'battery' && 'Battery Storage Log'}
            {activeTab === 'ev-charging' && 'EV Charging Log'}
            {activeTab === 'ev-miles' && 'EV Miles Log'}
          </h1>
        </div>
      </AnimatedItem>

      {/* Activity Tabs */}
      <AnimatedItem>
        <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </AnimatedItem>

      {/* Tab Content */}
      {false ? (
        <AnimatedItem>
          <ComingSoon activityType={activeTab} />
        </AnimatedItem>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Today Hero */}
          <AnimatedItem>
            <TodayHero days={currentMonthData.days} activityType={activeTab} />
          </AnimatedItem>

          {/* Month Navigation — compact */}
          <AnimatedItem>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="font-semibold text-foreground">
                  {currentMonthData.totalKwh.toLocaleString()} {activeTab === 'ev-miles' ? 'mi' : 'kWh'}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth} disabled={!canGoForward}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </AnimatedItem>

          {/* Daily List */}
          <AnimatedItem>
            <Card className="bg-card border-border/50">
              <CardContent className="px-3 py-1">
                <DailyList days={currentMonthData.days} unit={activeTab === 'ev-miles' ? 'mi' : 'kWh'} activityType={activeTab} />
              </CardContent>
            </Card>
          </AnimatedItem>

          {/* Charging Sessions Detail — only on EV Charging tab */}
          {activeTab === 'ev-charging' && chargingSessions.length > 0 && (
            <AnimatedItem>
              <button
                onClick={() => setShowSessions(prev => !prev)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>{showSessions ? 'Hide' : 'View'} session details</span>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  showSessions && "rotate-180"
                )} />
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
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showMonthStats && "rotate-180"
              )} />
            </button>
            {showMonthStats && (
              <div className="space-y-3">
                <MonthSummaryCard data={currentMonthData} label={format(currentMonth, 'MMMM yyyy')} unit={activeTab === 'ev-miles' ? 'mi' : 'kWh'} />
                <MonthComparison
                  current={currentMonthData}
                  previous={compareMonthData}
                  currentLabel={format(currentMonth, 'MMM')}
                  previousLabel={format(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1), 'MMM')}
                  unit={activeTab === 'ev-miles' ? 'mi' : 'kWh'}
                />
              </div>
            )}
          </AnimatedItem>

          {/* System Performance */}
          <AnimatedItem>
            <SystemPerformanceCard enabled={activeTab === 'solar'} />
          </AnimatedItem>
        </>
      )}
    </AnimatedContainer>
  );
}
