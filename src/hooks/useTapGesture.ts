import { useCallback, useRef, useEffect } from 'react';

/**
 * Shared tap / double-tap timing constants used by every KPI card and
 * TokenPriceCard so behavior is identical across iOS and Android.
 *
 * - TAP_DEBOUNCE_MS: minimum gap between two registered taps. Drops the
 *   touchend → ghost-click pair and finger jitter that would otherwise
 *   collapse two intended taps into one.
 * - DOUBLE_TAP_WINDOW: max gap between first and second tap to count as
 *   a double-tap. Tuned for forgiving demo / first-time-user gestures.
 * - GHOST_CLICK_SUPPRESSION: window after a touchend during which a
 *   synthetic mouse-click is ignored.
 * - HINT_DURATION_MS: how long the "tap again to mint" indicator stays
 *   visible after the first tap. Long enough that brand-new users have
 *   time to read it before it fades.
 */
export const TAP_GESTURE_TIMINGS = {
  TAP_DEBOUNCE_MS: 80,
  DOUBLE_TAP_WINDOW: 500,
  GHOST_CLICK_SUPPRESSION: 700,
  HINT_DURATION_MS: 1400,
} as const;

export interface TapGestureHandlers {
  /**
   * Process a tap at the given relative position. Internally enforces the
   * shared debounce + double-tap window. Calls `onSingleTap` on the first
   * tap and `onDoubleTap` when a second tap arrives within the window.
   */
  processTap: (posX: number, posY: number) => void;
  /** Reset all gesture state — used on visibility change / unmount. */
  reset: () => void;
}

interface UseTapGestureArgs {
  onSingleTap: (posX: number, posY: number) => void;
  onDoubleTap: (posX: number, posY: number) => void;
  /** Called when the "tap again" hint should hide (timeout or double-tap). */
  onHintHide?: () => void;
}

/**
 * Shared single/double-tap gesture engine. All KPI cards use this so the
 * timing behavior is identical and centrally tunable.
 */
export function useTapGesture({ onSingleTap, onDoubleTap, onHintHide }: UseTapGestureArgs): TapGestureHandlers {
  const lastTapTimeRef = useRef<number>(0);
  const tapCooldownUntilRef = useRef<number>(0);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    lastTapTimeRef.current = 0;
    tapCooldownUntilRef.current = 0;
    if (doubleTapTimerRef.current) {
      clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = null;
    }
  }, []);

  const processTap = useCallback((posX: number, posY: number) => {
    const now = Date.now();
    if (now < tapCooldownUntilRef.current) return;
    tapCooldownUntilRef.current = now + TAP_GESTURE_TIMINGS.TAP_DEBOUNCE_MS;

    const timeSinceLast = now - lastTapTimeRef.current;
    if (lastTapTimeRef.current > 0 && timeSinceLast < TAP_GESTURE_TIMINGS.DOUBLE_TAP_WINDOW) {
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = now;
      onHintHide?.();
      onDoubleTap(posX, posY);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
      }, TAP_GESTURE_TIMINGS.DOUBLE_TAP_WINDOW);
    } else {
      lastTapTimeRef.current = now;
      onSingleTap(posX, posY);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        onHintHide?.();
      }, TAP_GESTURE_TIMINGS.HINT_DURATION_MS);
    }
  }, [onSingleTap, onDoubleTap, onHintHide]);

  useEffect(() => {
    return () => {
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    };
  }, []);

  return { processTap, reset };
}
