import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, ChevronRight, BatteryCharging, Zap, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RecentOutageRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  soc_pct_start: number | null;
  soc_pct_end: number | null;
  peak_load_kw: number | null;
  deason_interacted: boolean | null;
}

interface Props {
  /** Hide the card while an outage is currently active (the live panel covers it). */
  hideWhileActive?: boolean;
}

function fmtDuration(secs: number | null, startedAt: string, endedAt: string | null): string {
  let s = secs;
  if (s == null) {
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    s = Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 1000));
  }
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
}

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `Today · ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Compact recap of the most recent grid outage, shown beneath the live
 * energy card on the dashboard. Hidden when there are no recorded outages
 * (or while one is currently active — the live panel takes precedence).
 */
export function OutageRecapCard({ hideWhileActive = false }: Props = {}) {
  const { user } = useAuth();
  const [row, setRow] = useState<RecentOutageRow | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setRow(null);
      return;
    }
    void (async () => {
      const { data, error } = await supabase
        .from('grid_outage_events')
        .select('id, started_at, ended_at, duration_seconds, soc_pct_start, soc_pct_end, peak_load_kw, deason_interacted')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setRow(null);
        return;
      }
      setRow(data[0] as RecentOutageRow);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (hideWhileActive) return null;
  if (row === undefined) return null; // still loading — no skeleton on dashboard
  if (row === null) return null;
  // If the most recent event is still ongoing, the live outage panel is
  // already shown — don't double up.
  if (!row.ended_at) return null;

  const socDelta = row.soc_pct_start != null && row.soc_pct_end != null
    ? row.soc_pct_end - row.soc_pct_start
    : null;

  return (
    <Link
      to="/outage-history"
      data-testid="outage-recap-card"
      className="block rounded-xl border border-border/50 bg-card/50 px-4 py-3 transition-colors hover:bg-card/70"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
            <History className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Outage</p>
            <p className="text-sm font-semibold text-foreground">{fmtWhen(row.started_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="tabular-nums font-semibold text-foreground">
            {fmtDuration(row.duration_seconds, row.started_at, row.ended_at)}
          </span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <BatteryCharging className="h-3 w-3" />
          <span className="tabular-nums">
            {row.soc_pct_start != null ? `${Math.round(row.soc_pct_start)}%` : '—'}
            {socDelta != null && (
              <span className={socDelta < 0 ? 'ml-1 text-amber-300' : 'ml-1 text-emerald-300'}>
                ({socDelta > 0 ? '+' : ''}{Math.round(socDelta)}%)
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="h-3 w-3" />
          <span className="tabular-nums">
            {row.peak_load_kw != null ? `${row.peak_load_kw.toFixed(1)} kW peak` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          <span>{row.deason_interacted ? 'Deason used' : 'No Deason'}</span>
        </div>
      </div>
    </Link>
  );
}
