import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BatteryCharging, Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OutageEventRow {
  id: string;
  source: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  soc_pct_start: number | null;
  soc_pct_end: number | null;
  peak_load_kw: number | null;
  deason_interacted: boolean | null;
  estimated_backup_hours_at_start: number | null;
}

function formatDuration(seconds: number | null, startedAt: string, endedAt: string | null): string {
  let secs = seconds;
  if (secs == null) {
    if (!endedAt) {
      const ms = Date.now() - new Date(startedAt).getTime();
      secs = Math.max(0, Math.floor(ms / 1000));
    } else {
      secs = Math.max(0, Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
    }
  }
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function OutageHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<OutageEventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    void (async () => {
      const { data, error } = await supabase
        .from('grid_outage_events')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setRows([]);
        return;
      }
      setRows((data ?? []) as OutageEventRow[]);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back to dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-card/60 text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Outage History</h1>
          <p className="text-xs text-muted-foreground">Every grid outage we've recorded on your home.</p>
        </div>
      </header>

      {rows === null && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border/40 bg-card/40" />
          ))}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 text-center">
          <p className="text-sm font-medium text-foreground">No outages recorded yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Your grid has been steady — we'll log any future outages here.</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          Couldn't load outage history: {error}
        </div>
      )}

      <div className="space-y-3">
        {rows?.map((r) => {
          const ongoing = !r.ended_at;
          const socDelta = r.soc_pct_start != null && r.soc_pct_end != null
            ? r.soc_pct_end - r.soc_pct_start
            : null;
          return (
            <article
              key={r.id}
              data-testid="outage-history-row"
              className="rounded-xl border border-border/50 bg-card/60 p-4 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {formatDate(r.started_at)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatTime(r.started_at)} → {ongoing ? 'Ongoing' : formatTime(r.ended_at!)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {ongoing ? (
                    <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Ongoing
                    </span>
                  ) : (
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {formatDuration(r.duration_seconds, r.started_at, r.ended_at)}
                    </span>
                  )}
                  {r.source && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.source}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
                  <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <BatteryCharging className="h-2.5 w-2.5" /> SOC
                  </div>
                  <div className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">
                    {r.soc_pct_start != null ? `${Math.round(r.soc_pct_start)}%` : '—'}
                    {' → '}
                    {r.soc_pct_end != null ? `${Math.round(r.soc_pct_end)}%` : ongoing ? '…' : '—'}
                  </div>
                  {socDelta != null && (
                    <div className={`text-[10px] tabular-nums ${socDelta < 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {socDelta > 0 ? '+' : ''}{Math.round(socDelta)}%
                    </div>
                  )}
                </div>
                <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
                  <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Zap className="h-2.5 w-2.5" /> Peak Load
                  </div>
                  <div className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">
                    {r.peak_load_kw != null ? `${r.peak_load_kw.toFixed(1)} kW` : '—'}
                  </div>
                </div>
                <div className="rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
                  <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-2.5 w-2.5" /> Deason
                  </div>
                  <div className={`mt-0.5 text-xs font-semibold ${r.deason_interacted ? 'text-amber-200' : 'text-muted-foreground'}`}>
                    {r.deason_interacted ? 'Used' : 'Not used'}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
