import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BatteryCharging, Loader2, Plug, Sparkles, Zap, RefreshCw, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { useBatteryTelemetry, useEVChargerTelemetry, type CachedTelemetry } from '@/hooks/useDeviceTelemetry';
import { useEnergyInsightsSubscription } from '@/hooks/useEnergyInsightsSubscription';

interface InsightsReport {
  headline: string;
  battery_story: string;
  ev_charger_story: string;
  smart_tip: string;
  this_week_win: string;
}

interface ReportRow {
  id: string;
  created_at: string;
  status: string;
  full_report: InsightsReport | null;
  inputs_summary: any;
}

function pickNumber(payload: any, keys: string[]): number | null {
  for (const k of keys) {
    const v = payload?.[k] ?? payload?.response?.[k] ?? payload?.data?.[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

function BatteryCard({ t }: { t: CachedTelemetry }) {
  const soc = pickNumber(t.payload, ['percentage_charged', 'battery_soc', 'soc', 'state_of_charge']);
  const power = pickNumber(t.payload, ['battery_power', 'power_kw', 'charge_power']);
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-background p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BatteryCharging className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">Battery · {t.oem}</span>
        </div>
        <span className={`text-[10px] uppercase tracking-wide ${t.fresh ? 'text-primary' : 'text-muted-foreground'}`}>
          {t.fresh ? 'Live' : 'Cached'}
        </span>
      </div>
      <div className="mt-4 flex items-end gap-4">
        <div>
          <div className="text-3xl font-bold text-foreground">
            {soc !== null ? `${Math.round(soc)}%` : '—'}
          </div>
          <div className="text-xs text-muted-foreground">State of charge</div>
        </div>
        {power !== null && (
          <div className="ml-auto text-right">
            <div className="text-lg font-semibold text-primary">
              {power > 0 ? '+' : ''}
              {power.toFixed(1)} kW
            </div>
            <div className="text-xs text-muted-foreground">
              {power > 0 ? 'Charging' : power < 0 ? 'Discharging' : 'Idle'}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function EVChargerCard({ t }: { t: CachedTelemetry }) {
  const power = pickNumber(t.payload, ['charging_power_kw', 'power_kw', 'current_kw']);
  const sessionKwh = pickNumber(t.payload, ['session_kwh', 'energy_kwh']);
  const statusRaw =
    t.payload?.status ?? t.payload?.charger_status ?? t.payload?.state ?? (power && power > 0 ? 'Charging' : 'Idle');
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-background p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-foreground">EV Charger · {t.oem}</span>
        </div>
        <span className={`text-[10px] uppercase tracking-wide ${t.fresh ? 'text-primary' : 'text-muted-foreground'}`}>
          {t.fresh ? 'Live' : 'Cached'}
        </span>
      </div>
      <div className="mt-4 flex items-end gap-4">
        <div>
          <div className="text-3xl font-bold text-foreground capitalize">{String(statusRaw).toLowerCase()}</div>
          <div className="text-xs text-muted-foreground">Charger status</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-semibold text-primary">{power !== null ? `${power.toFixed(1)} kW` : '—'}</div>
          <div className="text-xs text-muted-foreground">
            {sessionKwh !== null ? `${sessionKwh.toFixed(1)} kWh this session` : 'Live rate'}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Paywall({ onUnlock }: { onUnlock: () => void }) {
  return (
    <Card className="relative overflow-hidden border-primary/40 bg-gradient-to-br from-primary/15 via-background to-background p-8 text-center">
      <Lock className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-4 text-2xl font-bold text-foreground">Unlock Premium Energy Insights</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Get AI-powered daily reports from your battery and EV charger — written like a friendly concierge, not a
        spreadsheet. Cancel any time.
      </p>
      <div className="mt-6 inline-flex items-baseline gap-1">
        <span className="text-4xl font-bold text-foreground">$4.99</span>
        <span className="text-sm text-muted-foreground">/month</span>
      </div>
      <Button onClick={onUnlock} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
        Start Premium · $4.99/mo
      </Button>
    </Card>
  );
}

function ReportView({ report, createdAt, model }: { report: InsightsReport; createdAt: string; model?: string }) {
  return (
    <Card className="border-primary/30 bg-card/60 p-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>
          {model?.includes('pro') ? 'Generated with Pro intelligence' : 'Generated with Fast intelligence'} ·{' '}
          {new Date(createdAt).toLocaleString()}
        </span>
      </div>
      <h2 className="mt-3 text-2xl font-bold text-foreground">{report.headline}</h2>
      <div className="mt-5 space-y-5">
        <Section icon={<BatteryCharging className="h-4 w-4 text-primary" />} title="Your battery">
          {report.battery_story}
        </Section>
        <Section icon={<Plug className="h-4 w-4 text-primary" />} title="Your EV charger">
          {report.ev_charger_story}
        </Section>
        <Section icon={<Zap className="h-4 w-4 text-primary" />} title="Smart tip">
          {report.smart_tip}
        </Section>
        <Section icon={<Sparkles className="h-4 w-4 text-primary" />} title="This week's win">
          {report.this_week_win}
        </Section>
      </div>
    </Card>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export default function EnergyInsightsPage() {
  const { user } = useAuth();
  const { subscription, loading: subLoading } = useEnergyInsightsSubscription();
  const subscribed = !!subscription?.active;

  const battery = useBatteryTelemetry();
  const ev = useEVChargerTelemetry();

  const [latest, setLatest] = useState<ReportRow | null>(null);
  const [latestLoading, setLatestLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadLatest = useCallback(async () => {
    if (!user) return;
    setLatestLoading(true);
    const { data } = await supabase
      .from('energy_reports')
      .select('id, created_at, status, full_report, inputs_summary')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    const live = (data ?? []).find((r: any) => r.inputs_summary?.kind === 'live_insights' && r.status === 'ready');
    setLatest((live as unknown as ReportRow) ?? null);
    setLatestLoading(false);
  }, [user]);

  useEffect(() => {
    if (subscribed) void loadLatest();
  }, [subscribed, loadLatest]);

  const handleGenerate = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-energy-insights-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const json = await res.json();
      if (!res.ok) {
        if (json.error === 'throttled') {
          toast.info(json.message ?? 'Next report available in 24h.');
        } else if (json.error === 'no_telemetry') {
          toast.error('Connect a battery or EV charger first.');
        } else if (json.error === 'rate_limited') {
          toast.error('Too many requests, try again shortly.');
        } else if (json.error === 'credits_exhausted') {
          toast.error('AI credits exhausted — try again later.');
        } else {
          toast.error(json.message ?? 'Could not generate report.');
        }
        return;
      }
      toast.success(json.first_report ? 'Your first Pro report is ready!' : 'New insights generated!');
      await loadLatest();
    } catch (e: any) {
      toast.error(e?.message ?? 'Network error');
    } finally {
      setGenerating(false);
    }
  }, [user, loadLatest]);

  const handleUnlock = () => {
    // Placeholder for v1.1 Stripe checkout
    toast.info('Stripe checkout coming soon — $4.99/mo Premium Energy Insights.');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <SEO title="Premium Energy Insights | ZenSolar" description="AI-powered live battery and EV charger insights." />
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Link>
        </Button>

        <div className="mt-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Premium Energy Insights</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Live battery + EV charger telemetry, told as a story you can actually read.
        </p>

        {/* Cross-link to Deason document analysis (separate product) */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('deason:open'))}
          className="mt-3 flex w-full items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-amber-500/10"
        >
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>
            Have a <span className="text-foreground">utility bill, solar contract, PPA, or loan paperwork</span>?
            Ask Deason for a one-time Concierge document analysis →
          </span>
        </button>

        {subLoading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !subscribed ? (
          <div className="mt-6">
            <Paywall onUnlock={handleUnlock} />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Live telemetry cards */}
            {(battery.loading || ev.loading) && battery.data.length === 0 && ev.data.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : battery.data.length === 0 && ev.data.length === 0 ? (
              <Card className="border-border bg-card/60 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No live battery or EV charger connected yet.{' '}
                  <Link to="/clean-energy-center" className="text-primary hover:underline">
                    Connect one
                  </Link>{' '}
                  to power your insights.
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {battery.data.map((t) => (
                  <BatteryCard key={`b-${t.oem}-${t.site_id}`} t={t} />
                ))}
                {ev.data.map((t) => (
                  <EVChargerCard key={`e-${t.oem}-${t.site_id}`} t={t} />
                ))}
              </div>
            )}

            {/* Generate / latest report */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Latest report</h2>
              <Button
                onClick={handleGenerate}
                disabled={generating || (battery.data.length === 0 && ev.data.length === 0)}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Generate new
              </Button>
            </div>

            {latestLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : latest?.full_report ? (
              <ReportView
                report={latest.full_report}
                createdAt={latest.created_at}
                model={latest.inputs_summary?.model}
              />
            ) : (
              <Card className="border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
                No report yet. Tap <span className="text-primary">Generate new</span> to create your first one.
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
