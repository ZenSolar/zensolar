import { useRef } from 'react';

interface DialogSwipeHandleProps {
  onDismiss: () => void;
  /** Vertical distance (px) on the handle to trigger dismiss. */
  threshold?: number;
}

/**
 * Visible grab handle for dialogs. Detects a downward swipe gesture
 * *on the handle itself* and calls onDismiss. Keeps inner dialog
 * scrolling intact (gesture is scoped to the handle, not the body).
 */
export function DialogSwipeHandle({ onDismiss, threshold = 50 }: DialogSwipeHandleProps) {
  const startRef = useRef<{ y: number; t: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    startRef.current = { y: t.clientY, t: Date.now() };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.t;
    if (dy > threshold && dt < 700) onDismiss();
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={() => {
        /* tap on handle also dismisses for desktop accessibility */
      }}
      className="flex justify-center pt-1 pb-3 -mt-2 -mx-6 cursor-grab active:cursor-grabbing touch-none select-none"
      aria-label="Swipe down to close"
      role="button"
    >
      <div className="h-1.5 w-10 rounded-full bg-muted-foreground/40 hover:bg-muted-foreground/60 transition-colors" />
    </div>
  );
}
