import { useEffect, useState, useRef } from 'react';
import { getSharedAudioContext } from '@/hooks/useMintSound';

/**
 * Temporary debug overlay — shows AudioContext state, tap count,
 * and timing info. Remove when audio issues are resolved.
 */
export function AudioDebugOverlay() {
  const [lines, setLines] = useState<string[]>(['waiting…']);
  const tapCountRef = useRef(0);
  const firstTapRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      const ctx = getSharedAudioContext();
      const now = performance.now();
      const entries: string[] = [];

      entries.push(`ctx: ${ctx ? ctx.state : 'null'}`);
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
    };

    const onGesture = () => {
      tapCountRef.current += 1;
      if (firstTapRef.current === null) firstTapRef.current = performance.now();
      // Force a resume attempt on every gesture so we can watch the state change
      const ctx = getSharedAudioContext();
      if (ctx && ctx.state !== 'running') {
        ctx.resume().catch(() => {});
      }
      update();
    };

    const opts: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('touchstart', onGesture, opts);
    window.addEventListener('pointerdown', onGesture, opts);

    const id = setInterval(update, 500);
    update();

    return () => {
      clearInterval(id);
      window.removeEventListener('touchstart', onGesture, true);
      window.removeEventListener('pointerdown', onGesture, true);
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
        background: 'rgba(0,0,0,0.82)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '10px',
        lineHeight: '14px',
        padding: '6px 8px',
        borderRadius: 6,
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}