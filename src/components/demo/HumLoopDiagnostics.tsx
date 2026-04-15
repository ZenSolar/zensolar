import { useEffect, useState } from 'react';
import { getHumLoopDiagnostics, type HumLoopDiagnostics } from '@/lib/demoEntryFallbackAudio';
import { cn } from '@/lib/utils';

/**
 * Temporary on-screen diagnostics for the hum loop crossfade scheduler.
 * Shows voice count, timing, wrap points, and gain in real-time.
 * Remove once audio loop issues are resolved.
 */
export function HumLoopDiagnosticsOverlay() {
  const [diag, setDiag] = useState<HumLoopDiagnostics | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setDiag(getHumLoopDiagnostics());
    }, 200);
    return () => clearInterval(id);
  }, []);

  if (!diag) return null;

  const timeUntilNext = diag.nextStart !== null
    ? Math.max(0, diag.nextStart - diag.ctxTime).toFixed(3)
    : '—';

  const rows: [string, string, string][] = [
    ['active', diag.active ? 'YES' : 'NO', diag.active ? 'text-primary' : 'text-destructive'],
    ['voices', String(diag.voices), diag.voices >= 2 ? 'text-yellow-400' : 'text-primary'],
    ['ctx state', diag.ctxState, diag.ctxState === 'running' ? 'text-primary' : 'text-destructive'],
    ['ctx time', diag.ctxTime.toFixed(2) + 's', 'text-foreground'],
    ['gain', diag.gainValue.toFixed(3), diag.gainValue > 0 ? 'text-primary' : 'text-muted-foreground'],
    ['next start', diag.nextStart?.toFixed(3) ?? '—', 'text-foreground'],
    ['Δ next', timeUntilNext + 's', 'text-foreground'],
    ['next offset', diag.nextOffset.toFixed(3), 'text-foreground'],
    ['buf dur', diag.bufferDuration.toFixed(3) + 's', 'text-foreground'],
    ['loop', `${diag.loopStart.toFixed(2)}→${diag.loopEnd.toFixed(2)}`, 'text-foreground'],
    ['overlap', diag.overlapMs + 'ms', 'text-foreground'],
    ['media bridge', diag.mediaBridge ? 'ON' : 'off', diag.mediaBridge ? 'text-yellow-400' : 'text-muted-foreground'],
    ['media time', diag.mediaTime.toFixed(2) + 's', 'text-foreground'],
    ['media playing', diag.mediaPlaying ? 'YES' : 'NO', diag.mediaPlaying ? 'text-yellow-400' : 'text-muted-foreground'],
  ];

  return (
    <div className="pointer-events-none fixed inset-x-2 top-2 z-[9998] flex justify-center">
      <div className="w-full max-w-xs rounded-xl border border-border/60 bg-background/95 px-2.5 py-2 shadow-lg backdrop-blur-md">
        <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 mb-1.5">
          🔁 Hum Loop Diag
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[9px] leading-[13px] font-mono">
          {rows.map(([label, value, color]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground uppercase">{label}</dt>
              <dd className={cn('text-right', color)}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
