import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useAppBack } from "@/hooks/useAppHistory";
import { cn } from "@/lib/utils";

/**
 * iOS-style swipe-from-left-edge to go back.
 *
 * Behaviour:
 * - Touch must start within EDGE_PX of the left screen edge.
 * - Horizontal travel must dominate vertical travel (so vertical scroll
 *   and sidebar interactions are not hijacked).
 * - Crossing TRIGGER_PX while still pulling commits the back navigation
 *   on release; a subtle indicator confirms the gesture.
 * - Disabled on home routes (canGoBack === false).
 * - Disabled when prefers-reduced-motion is set or for non-touch input.
 */
const EDGE_PX = 24;          // how close to the left edge the touch must start
const TRIGGER_PX = 80;       // horizontal pull required to commit
const VERTICAL_TOLERANCE = 40; // if vertical drift exceeds this, cancel

export function SwipeBackHandler() {
  const { canGoBack, goBack } = useAppBack();
  const [pull, setPull] = useState(0);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  useEffect(() => {
    if (!canGoBack) return;
    if (typeof window === "undefined") return;
    if (!("ontouchstart" in window)) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      // Must start near the left edge
      if (t.clientX > EDGE_PX) return;
      startX.current = t.clientX;
      startY.current = t.clientY;
      active.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!active.current || startX.current === null || startY.current === null) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
      const dy = Math.abs(t.clientY - startY.current);

      // Cancel if user is mostly scrolling vertically
      if (dy > VERTICAL_TOLERANCE && dy > Math.abs(dx)) {
        active.current = false;
        startX.current = null;
        startY.current = null;
        setPull(0);
        return;
      }

      if (dx > 0) {
        // Visual feedback only — keep light to avoid jank
        if (!reduced) setPull(Math.min(dx, 140));
      }
    };

    const onEnd = () => {
      if (!active.current) return;
      const dx = pull;
      active.current = false;
      startX.current = null;
      startY.current = null;
      setPull(0);
      if (dx >= TRIGGER_PX) {
        goBack();
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [canGoBack, goBack, pull]);

  if (!canGoBack || pull <= 0) return null;

  const progress = Math.min(pull / TRIGGER_PX, 1);
  const committed = pull >= TRIGGER_PX;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 left-0 z-[60] flex items-center"
      style={{
        transform: `translateX(${Math.min(pull * 0.4, 56)}px)`,
        opacity: 0.4 + progress * 0.6,
      }}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-r-full bg-background/90 border border-l-0 border-border shadow-lg transition-colors",
          committed && "bg-primary text-primary-foreground border-primary"
        )}
      >
        <ChevronLeft className="h-6 w-6" />
      </div>
    </div>
  );
}
