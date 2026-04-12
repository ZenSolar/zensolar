import { useEffect, useRef, useState } from 'react';
import { getSharedAudioContext } from '@/hooks/useMintSound';
import {
  AUDIO_DEBUG_EVENT,
  clearAudioDebugEntries,
  getAudioDebugEntries,
  logAudioDebug,
  type AudioDebugEntry,
} from '@/lib/audioDebug';

/**
 * Temporary debug overlay — shows AudioContext state, tap count,
 * and timing info. Remove when audio issues are resolved.
 */
export function AudioDebugOverlay() {
  const [lines, setLines] = useState<string[]>(['waiting…']);
  const [entries, setEntries] = useState<AudioDebugEntry[]>(() => getAudioDebugEntries());
  const tapCountRef = useRef(0);
  const firstTapRef = useRef<number | null>(null);
  const lastCtxStateRef = useRef<string | null>(null);

  useEffect(() => {
    clearAudioDebugEntries();

    const update = () => {
      const ctx = getSharedAudioContext();
      const now = performance.now();
      const entries: string[] = [];
      const ctxState = ctx ? ctx.state : 'null';

      entries.push(`ctx: ${ctxState}`);
      if (ctx) {
        entries.push(`sampleRate: ${ctx.sampleRate}`);
        entries.push(`currentTime: ${ctx.currentTime.toFixed(3)}`);
        entries.push(`baseLatency: ${(ctx as any).baseLatency?.toFixed(3) ?? 'n/a'}`);
      }
      entries.push(`taps: ${tapCountRef.current}`);
      if (firstTapRef.current !== null) {
        entries.push(`since1st: ${((now - firstTapRef.current) / 1000).toFixed(1)}s`);
      }
      entries.push(`ua: ${navigator.userAgent.slice(0, 60)}`);
      setLines(entries);

      if (lastCtxStateRef.current !== ctxState) {
        lastCtxStateRef.current = ctxState;
        logAudioDebug('audio-context-state', { ctx: ctxState });
      }
    };

    const onGesture = () => {
      tapCountRef.current += 1;
      if (firstTapRef.current === null) firstTapRef.current = performance.now();
      const ctx = getSharedAudioContext();
      if (ctx && ctx.state !== 'running') {
        ctx.resume().catch(() => {});
      }
      update();
    };

    const onDebugEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ entries: AudioDebugEntry[] }>;
      setEntries(customEvent.detail?.entries ?? getAudioDebugEntries());
    };

    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('touchstart', onGesture, opts);
    window.addEventListener('pointerdown', onGesture, opts);
    window.addEventListener(AUDIO_DEBUG_EVENT, onDebugEvent as EventListener);

    const id = setInterval(update, 500);
    logAudioDebug('overlay-attached', { path: window.location.pathname });
    update();

    return () => {
      clearInterval(id);
      window.removeEventListener('touchstart', onGesture, true);
      window.removeEventListener('pointerdown', onGesture, true);
      window.removeEventListener(AUDIO_DEBUG_EVENT, onDebugEvent as EventListener);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 8,
        left: 8,
        right: 8,
        zIndex: 9999,
        background: 'hsl(var(--background) / 0.92)',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border) / 0.6)',
        boxShadow: '0 12px 28px hsl(var(--foreground) / 0.16)',
        fontFamily: 'monospace',
        fontSize: '10px',
        lineHeight: '14px',
        padding: '6px 8px',
        borderRadius: 6,
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        maxHeight: '45vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ color: 'hsl(var(--primary))', marginBottom: 4 }}>audio debug</div>
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid hsl(var(--border) / 0.5)',
          maxHeight: '22vh',
          overflow: 'auto',
        }}
      >
        {entries.length === 0 ? (
          <div>event log: waiting…</div>
        ) : (
          entries
            .slice()
            .reverse()
            .map((entry) => (
              <div key={entry.id}>
                {entry.time} {entry.message}
              </div>
            ))
        )}
      </div>
    </div>
  );
}