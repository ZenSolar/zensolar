import { cn } from '@/lib/utils';

interface ReleaseAudioDiagnosticsProps {
  fallbackArmed: string;
  fallbackFired: string;
  audioContextState: string;
  synthHandoff: string;
  lastEvent: string;
  updatedAt: number | null;
}

function formatUpdatedAt(updatedAt: number | null) {
  if (!updatedAt) return 'waiting…';

  return new Date(updatedAt).toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getStatusTone(value: string) {
  const normalized = value.toLowerCase();

  if (['armed', 'fired', 'running', 'completed', 'not-needed', 'skipped'].includes(normalized)) {
    return 'text-primary';
  }

  if (['failed', 'missed', 'timeout', 'null', 'closed'].includes(normalized)) {
    return 'text-destructive';
  }

  return 'text-foreground';
}

export function ReleaseAudioDiagnostics({
  fallbackArmed,
  fallbackFired,
  audioContextState,
  synthHandoff,
  lastEvent,
  updatedAt,
}: ReleaseAudioDiagnosticsProps) {
  const rows = [
    { label: 'fallback armed', value: fallbackArmed },
    { label: 'fallback fired', value: fallbackFired },
    { label: 'audio context', value: audioContextState },
    { label: 'synth handoff', value: synthHandoff },
  ];

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[220] flex justify-center">
      <section className="w-full max-w-sm rounded-2xl border border-border/70 bg-background/85 px-3 py-2.5 shadow-[0_18px_48px_hsl(var(--foreground)/0.16)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
            Release audio diag
          </p>
          <span className="text-[10px] text-muted-foreground">{formatUpdatedAt(updatedAt)}</span>
        </div>

        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[11px] leading-4">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="font-medium uppercase tracking-[0.14em] text-muted-foreground">{row.label}</dt>
              <dd className={cn('justify-self-end font-mono text-[11px] uppercase', getStatusTone(row.value))}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-2 border-t border-border/60 pt-2">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            last event
          </div>
          <div className="mt-1 break-all font-mono text-[11px] leading-4 text-foreground/90">
            {lastEvent}
          </div>
        </div>
      </section>
    </div>
  );
}