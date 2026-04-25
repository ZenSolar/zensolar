import { useEffect, useRef, useState, useCallback } from 'react';
import { useEnergyLog } from '@/hooks/useEnergyLog';
import { useChargingSessions } from '@/hooks/useChargingSessions';
import { useDeviceLabels, getEnergyLogTitle } from '@/hooks/useDeviceLabels';
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
import { EnergyLogFallback, type ProviderStatus } from '@/components/energy-log/EnergyLogFallback';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const deviceLabels = useDeviceLabels();

  // Fetch per-provider freshness so we can render the fallback panel.
  // Reads connected_devices.updated_at — written every successful sync.
  const loadProviderStatuses = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: devices } = await supabase
      .from('connected_devices')
      .select('provider, updated_at')
      .eq('user_id', user.id);
    if (!devices) return;

    const PROVIDER_LABELS: Record<string, string> = {
      tesla: 'Tesla (solar / EV / battery)',
      enphase: 'Enphase Solar',
      solaredge: 'SolarEdge',
      wallbox: 'Wallbox EV Charger',
    };
    const byProvider = new Map<string, string>();
    for (const d of devices as Array<{ provider: string; updated_at: string }>) {
      const existing = byProvider.get(d.provider);
      if (!existing || new Date(d.updated_at) > new Date(existing)) {
        byProvider.set(d.provider, d.updated_at);
      }
    }
    const STALE_HOURS = 36; // we sync daily — anything older than 36h is stale
    const statuses: ProviderStatus[] = Array.from(byProvider.entries())
      .filter(([p]) => p in PROVIDER_LABELS)
      .map(([provider, updated_at]) => {
        const ageHours = (Date.now() - new Date(updated_at).getTime()) / (1000 * 60 * 60);
        return {
          provider: provider as ProviderStatus['provider'],
          label: PROVIDER_LABELS[provider],
          lastUpdatedAt: updated_at,
          hasError: ageHours > STALE_HOURS,
          errorMessage: ageHours > STALE_HOURS ? `No fresh data in ${Math.round(ageHours)}h` : undefined,
        };
      });
    setProviderStatuses(statuses);
  }, []);

  useEffect(() => {
    loadProviderStatuses();
  }, [loadProviderStatuses]);

  const handleProviderRetry = useCallback(async (provider: ProviderStatus['provider']) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please sign in to sync');
      return;
    }
    const fnMap: Record<ProviderStatus['provider'], string> = {
      tesla: 'tesla-data',
      enphase: 'enphase-data',
      solaredge: 'solaredge-data',
      wallbox: 'wallbox-data',
    };
    try {
      const res = await supabase.functions.invoke(fnMap[provider], {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw res.error;
      toast.success(`${provider} synced`);
      queryClient.invalidateQueries({ queryKey: ['energy-log-records'] });
      await loadProviderStatuses();
    } catch (err) {
      console.error(`[EnergyLog] Retry ${provider} failed:`, err);
      toast.error(`Could not sync ${provider}. Try again in a moment.`);
    }
  }, [queryClient, loadProviderStatuses]);

  // One-time historical backfill for existing Enphase users
  useEffect(() => {
    if (backfillTriggered.current) return;
    backfillTriggered.current = true;

    const triggerBackfills = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Enphase backfill
        const { data: allProviders } = await supabase.rpc('get_connected_providers', { _user_id: session.user.id });
        const enphaseTokens = allProviders?.filter((r: { provider: string }) => r.provider === 'enphase');

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
        const teslaTokens = allProviders?.filter((r: { provider: string }) => r.provider === 'tesla');

        if (teslaTokens && teslaTokens.length > 0) {
          const backfillKey = `tesla_backfill_v2_${session.user.id}`;
          // One-time re-sync to populate charging session duration data (remove after Feb 2026)
          const resyncKey = `tesla_resync_duration_v1_${session.user.id}`;
          if (!localStorage.getItem(resyncKey)) {
            localStorage.removeItem(backfillKey);
            localStorage.setItem(resyncKey, 'true');
          }
          if (!localStorage.getItem(backfillKey)) {
            console.log('[EnergyLog] Running one-time Tesla historical backfill...');
            const res = await supabase.functions.invoke('tesla-historical', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (res.data?.success) {
              console.log(`[EnergyLog] Tesla backfill complete:`, res.data);
              localStorage.setItem(backfillKey, 'true');
              queryClient.invalidateQueries({ queryKey: ['energy-log-records'] });
              queryClient.invalidateQueries({ queryKey: ['charging-sessions'] });
            } else if (res.error) {
              console.error('[EnergyLog] Tesla backfill error:', res.error);
            }
          }

          // EV Miles historical backfill (energy-weighted distribution from charging history)
          const evMilesKey = `tesla_ev_miles_backfill_${session.user.id}`;
          if (!localStorage.getItem(evMilesKey)) {
            console.log('[EnergyLog] Running one-time EV Miles historical backfill...');
            const evRes = await supabase.functions.invoke('tesla-ev-miles-backfill', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (evRes.data?.success) {
              console.log(`[EnergyLog] EV Miles backfill complete:`, evRes.data);
              localStorage.setItem(evMilesKey, 'true');
              queryClient.invalidateQueries({ queryKey: ['energy-log-records'] });
            } else if (evRes.error) {
              console.error('[EnergyLog] EV Miles backfill error:', evRes.error);
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
    <AnimatedContainer className="w-full max-w-lg mx-auto px-3 sm:px-4 py-5 space-y-3.5">
      {/* Header */}
      <AnimatedItem className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {getEnergyLogTitle(activeTab, deviceLabels)}
          </h1>
        </div>
      </AnimatedItem>

      {/* Activity Tabs */}
      <AnimatedItem>
        <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </AnimatedItem>

      {/* Per-provider freshness + retry — fallback when Tesla / Enphase / SolarEdge data is stale or missing */}
      {providerStatuses.length > 0 && (
        <AnimatedItem>
          <EnergyLogFallback
            statuses={providerStatuses}
            onRetry={handleProviderRetry}
            isEmpty={providerStatuses.every((s) => !s.lastUpdatedAt)}
          />
        </AnimatedItem>
      )}

      {/* Tab Content */}
      {false ? (
        <AnimatedItem>
          <ComingSoon activityType={activeTab} />
        </AnimatedItem>
      ) : isLoading ? (
        <PageLoader label="Loading your energy data…" />
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
