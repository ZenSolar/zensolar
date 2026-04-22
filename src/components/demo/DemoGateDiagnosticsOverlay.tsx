import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AUDIO_DEBUG_EVENT, getAudioDebugEntries, type AudioDebugEntry } from '@/lib/audioDebug';

interface DiagnosticEvent {
  t: number;
  tag: string;
  data: string;
}

interface DemoGateDiagnosticsOverlayProps {
  platformLabel: string;
  route: string;
  phase: string;
  hexAwake: boolean;
  revealed: boolean;
  holding: boolean;
  holdReady: boolean;
  holdHint: boolean;
  firstTapBurst: boolean;
  lockedFlash: boolean;
  inputFocused: boolean;
  codeLength: number;
  keyboardInset: number;
  keyboardMode: boolean;
  pinned: boolean;
  viewportHeight: number;
  viewportOffsetTop: number;
  innerHeight: number;
  inputTop: number | null;
  inputBottom: number | null;
  inputHeight: number | null;
  audioContextState: string;
  fallbackArmed: string;
  fallbackFired: string;
  synthHandoff: string;
  lastAudioEvent: string;
  iosQaEvents: DiagnosticEvent[];
  gestureEvents: DiagnosticEvent[];
}

function formatMetric(value: number | null) {
  return value === null ? '—' : String(Math.round(value));
}

function getToneClass(value: string) {
  const normalized = value.toLowerCase();

  if (/(failed|missed|timeout|too-early|offscreen=true|cancel|denied|false-start)/.test(normalized)) {
    return 'text-destructive';
  }

  if (/(armed|fired|running|ready|reveal|focus|pinned=true|holding=true|hexawake=true)/.test(normalized)) {
    return 'text-primary';
  }

  return 'text-foreground/80';
}

function LogBlock({
  title,
  entries,
}: {
  title: string;
  entries: Array<{ key: string; summary: string; tone?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/70 px-2 py-1.5">
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1">
        {entries.length === 0 ? (
          <div className="font-mono text-[10px] leading-4 text-muted-foreground">waiting…</div>
        ) : (
          entries.map((entry) => (
            <div key={entry.key} className={cn('font-mono text-[10px] leading-4 break-all', entry.tone ?? 'text-foreground/80')}>
              {entry.summary}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function DemoGateDiagnosticsOverlay({
  platformLabel,
  route,
  phase,
  hexAwake,
  revealed,
  holding,
  holdReady,
  holdHint,
  firstTapBurst,
  lockedFlash,
  inputFocused,
  codeLength,
  keyboardInset,
  keyboardMode,
  pinned,
  viewportHeight,
  viewportOffsetTop,
  innerHeight,
  inputTop,
  inputBottom,
  inputHeight,
  audioContextState,
  fallbackArmed,
  fallbackFired,
  synthHandoff,
  lastAudioEvent,
  iosQaEvents,
  gestureEvents,
}: DemoGateDiagnosticsOverlayProps) {
  const [audioEntries, setAudioEntries] = useState<AudioDebugEntry[]>(() => getAudioDebugEntries());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onAudioDebugEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ entries: AudioDebugEntry[] }>;
      setAudioEntries(customEvent.detail?.entries ?? getAudioDebugEntries());
    };

    window.addEventListener(AUDIO_DEBUG_EVENT, onAudioDebugEvent as EventListener);
    return () => window.removeEventListener(AUDIO_DEBUG_EVENT, onAudioDebugEvent as EventListener);
  }, []);

  const stateRows = [
    `phase=${phase}`,
    `hexAwake=${hexAwake}`,
    `revealed=${revealed}`,
    `holding=${holding}`,
    `holdReady=${holdReady}`,
    `holdHint=${holdHint}`,
    `burst=${firstTapBurst}`,
    `locked=${lockedFlash}`,
    `focus=${inputFocused}`,
    `codeLen=${codeLength}`,
  ];

  const layoutRows = [
    `vh=${viewportHeight} inner=${innerHeight} offTop=${viewportOffsetTop}`,
    `keyboardInset=${Math.round(keyboardInset)} keyboardMode=${keyboardMode} pinned=${pinned}`,
    `inputTop=${formatMetric(inputTop)} inputBottom=${formatMetric(inputBottom)} inputH=${formatMetric(inputHeight)}`,
    `route=${route}`,
  ];

  const audioRows = [
    `ctx=${audioContextState}`,
    `armed=${fallbackArmed}`,
    `fired=${fallbackFired}`,
    `handoff=${synthHandoff}`,
    `last=${lastAudioEvent}`,
  ];

  if (collapsed) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-2 z-[9999] flex justify-center">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="pointer-events-auto rounded-full border border-border/70 bg-background/95 px-3 py-1 font-mono text-[10px] text-foreground/80 shadow-md backdrop-blur-md"
        >
          ▴ diag {phase}
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-2 top-2 z-[9999] flex justify-center">
      <section className="pointer-events-auto w-full max-w-sm rounded-xl border border-border/70 bg-background/95 px-2.5 py-2 shadow-[0_18px_48px_hsl(var(--foreground)/0.16)] backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Gate diagnostics</div>
            <div className="text-[10px] text-muted-foreground">{platformLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('font-mono text-[10px]', getToneClass(lastAudioEvent))}>{phase}</div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded-md border border-border/70 px-2 py-0.5 font-mono text-[10px] text-foreground/80"
              aria-label="Minimize diagnostics"
            >
              ▾
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <LogBlock
            title="state"
            entries={stateRows.map((row, index) => ({ key: `state-${index}`, summary: row, tone: getToneClass(row) }))}
          />

          <LogBlock
            title="layout"
            entries={layoutRows.map((row, index) => ({ key: `layout-${index}`, summary: row, tone: getToneClass(row) }))}
          />

          <LogBlock
            title="audio"
            entries={audioRows.map((row, index) => ({ key: `audio-${index}`, summary: row, tone: getToneClass(row) }))}
          />

          <LogBlock
            title={`gesture log (${gestureEvents.length})`}
            entries={gestureEvents.slice(-7).reverse().map((entry, index) => ({
              key: `gesture-${index}-${entry.t}`,
              summary: `+${entry.t}ms ${entry.tag}${entry.data ? ` ${entry.data}` : ''}`,
              tone: getToneClass(`${entry.tag} ${entry.data}`),
            }))}
          />

          <LogBlock
            title={`viewport log (${iosQaEvents.length})`}
            entries={iosQaEvents.slice(-7).reverse().map((entry, index) => ({
              key: `viewport-${index}-${entry.t}`,
              summary: `+${entry.t}ms ${entry.tag}${entry.data ? ` ${entry.data}` : ''}`,
              tone: getToneClass(`${entry.tag} ${entry.data}`),
            }))}
          />

          <LogBlock
            title={`audio log (${audioEntries.length})`}
            entries={audioEntries.slice(-6).reverse().map((entry) => ({
              key: entry.id,
              summary: `${entry.time} ${entry.message}`,
              tone: getToneClass(entry.message),
            }))}
          />
        </div>
      </section>
    </div>
  );
}