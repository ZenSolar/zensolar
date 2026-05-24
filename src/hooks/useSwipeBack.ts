import { useEffect, useRef } from 'react';

interface SwipeBackOptions {
  enabled?: boolean;
  /** Minimum horizontal distance (px) to count as a swipe. */
  threshold?: number;
  /** Max time (ms) the gesture can take. */
  maxDuration?: number;
  /** Required horizontal vs. vertical ratio to disambiguate from scroll. */
  ratio?: number;
  /** Only start tracking when finger begins within this many px of the left edge. */
  edgeOnly?: boolean;
  edgeWidth?: number;
}

/**
 * Detects a right-swipe gesture (back) on a target element. Defaults to a full-
 * surface swipe with strong horizontal dominance so vertical scroll still works.
 * Set `edgeOnly` to true for the iOS-style edge-swipe-only behavior.
 */
export function useSwipeBack(
  targetRef: React.RefObject<HTMLElement>,
  onSwipeBack: () => void,
  opts: SwipeBackOptions = {}
) {
  const {
    enabled = true,
    threshold = 70,
    maxDuration = 600,
    ratio = 1.8,
    edgeOnly = false,
    edgeWidth = 32,
  } = opts;

  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || !enabled) return;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (edgeOnly && t.clientX > edgeWidth) {
        startRef.current = null;
        return;
      }
      startRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    };

    const onEnd = (e: TouchEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const dt = Date.now() - start.t;

      if (dt > maxDuration) return;
      if (dx < threshold) return; // must swipe right
      if (Math.abs(dx) < Math.abs(dy) * ratio) return; // mostly horizontal

      onSwipeBack();
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [targetRef, enabled, threshold, maxDuration, ratio, edgeOnly, edgeWidth, onSwipeBack]);
}
