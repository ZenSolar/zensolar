import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { GRID_KG_PER_KWH } from '@/lib/co2Math';

/**
 * Format metric tons CO₂ avoided from kg. Used for the public landing
 * stat that replaced the "founding members" count — until we have real
 * paying customers, CO₂ avoided is a defensible, investor-friendly
 * proof-of-impact metric that scales 1:1 with mints.
 */
function formatTons(kg: number): string {
  const t = kg / 1000;
  if (t >= 1_000) return `${(t / 1_000).toFixed(1)}K`;
  if (t >= 100) return Math.round(t).toLocaleString();
  if (t >= 10) return t.toFixed(1);
  return t.toFixed(2);
}

interface Stats {
  lifetime_tokens: number;
  lifetime_mints: number;
  month_tokens: number;
  month_mints: number;
  unique_minters: number;
  last_mint_at: string | null;
}

const POLL_MS = 30_000;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

/**
 * Subtle live earnings ticker for the public landing/gate.
 * Pulls aggregate (non-personal) mint totals via the `get_live_earnings_stats` RPC.
 * Tick-up animation when the value changes — minimal, web-quality polish.
 */
export function LiveEarningsCounter({ className }: { className?: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [displayed, setDisplayed] = useState(0);
  const targetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Fetch + poll
  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      const { data, error } = await supabase.rpc('get_live_earnings_stats');
      if (cancelled || error || !data) return;
      const s = data as unknown as Stats;
      setStats(s);
      targetRef.current = Number(s.lifetime_tokens) || 0;
    }

    fetchStats();
    const id = setInterval(fetchStats, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Smooth tick-up animation toward target
  useEffect(() => {
    function step() {
      const target = targetRef.current;
      setDisplayed((curr) => {
        const diff = target - curr;
        if (Math.abs(diff) < 0.5) return target;
        return curr + diff * 0.08;
      });
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!stats) {
    return (
      <div className={cn('h-3 w-48 mx-auto rounded bg-primary/5 animate-pulse', className)} aria-hidden />
    );
  }

  const co2Tons = formatTons((Number(stats.lifetime_tokens) || 0) * GRID_KG_PER_KWH);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1.5 text-[10px] tracking-wider uppercase text-muted-foreground/80 font-medium',
        className,
      )}
      aria-live="polite"
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
        style={{ boxShadow: '0 0 8px hsl(var(--primary) / 0.7)', animation: 'pulse 2s ease-in-out infinite' }}
        aria-hidden
      />
      <span className="text-foreground/90 font-semibold tabular-nums">
        {formatNumber(displayed)}
      </span>
      <span>$ZSOLAR minted</span>
      <span className="text-muted-foreground/40">·</span>
      <span className="tabular-nums text-foreground/80">{co2Tons}</span>
      <span>tons CO₂ avoided</span>
    </div>
  );
}
