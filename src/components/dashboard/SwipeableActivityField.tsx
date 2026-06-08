import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { EyeOff, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwipeHintShown } from '@/hooks/useSwipeHintShown';

interface SwipeableActivityFieldProps {
  children: React.ReactNode;
  onHide: () => void;
  disabled?: boolean;
  locked?: boolean; // True if this field has a connected provider (cannot be hidden)
}

/**
 * Swipe-LEFT to hide a KPI tile.
 *
 * Affordance system (subtle Apple/Tesla register):
 *  - Hairline border `border-primary/15` reacts to drag, brightening to
 *    `border-destructive/40` once the user crosses the hide threshold.
 *  - Tiny right-edge chevron whispers the gesture direction; opacity rises
 *    with idle dwell and falls during drag.
 *  - One-time 8px left "tease" nudge on first mount (per device), gated by
 *    `useSwipeHintShown`. The motion teaches the gesture once, then stops.
 */
export function SwipeableActivityField({
  children,
  onHide,
  disabled = false,
  locked = false,
}: SwipeableActivityFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const { shouldShowHint, markHintSeen } = useSwipeHintShown();

  const x = useMotionValue(0);
  const hideButtonOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const hideButtonScale = useTransform(x, [-100, -50, 0], [1, 0.8, 0.6]);
  // Edge chevron fades out as user starts dragging — it's a "before" cue.
  const chevronOpacity = useTransform(x, [-40, -10, 0], [0, 0.25, 0.55]);
  // Hairline border intensifies past the commit threshold (−20px).
  const borderOpacity = useTransform(x, [-100, -20, 0], [1, 0.6, 0.18]);
  const destructiveBorderOpacity = useTransform(x, [-100, -20, 0], [1, 0, 0]);

  // One-time tease: gently nudge 8px left then back, so users see the rail move.
  useEffect(() => {
    if (disabled || locked) return;
    if (!shouldShowHint) return;
    const t = setTimeout(() => {
      animate(x, -8, { duration: 0.35, ease: 'easeOut' }).then(() => {
        animate(x, 0, { type: 'spring', stiffness: 380, damping: 22 });
      });
    }, 900);
    return () => clearTimeout(t);
  }, [disabled, locked, shouldShowHint, x]);

  const handleDragStart = () => {
    setIsDragging(true);
    if (!hasInteracted) {
      setHasInteracted(true);
      markHintSeen();
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x < -80 || info.velocity.x < -500) {
      animate(x, -340, { type: 'spring', stiffness: 260, damping: 32, velocity: info.velocity.x }).then(() => onHide());
    } else {
      animate(x, 0, { type: 'spring', stiffness: 320, damping: 34, velocity: info.velocity.x });
    }
  };

  if (disabled || locked) {
    return <>{children}</>;
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-xl">
      {/* Hide action background (revealed as user drags left) */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-gradient-to-l from-destructive/20 to-transparent pointer-events-none"
        style={{ opacity: hideButtonOpacity, width: '100px' }}
      >
        <motion.div
          style={{ scale: hideButtonScale }}
          className="flex items-center gap-2 text-destructive"
        >
          <EyeOff className="h-5 w-5" />
          <span className="text-sm font-medium">Hide</span>
        </motion.div>
      </motion.div>

      {/* Reactive hairline border — visual confirmation the card is interactive */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl border border-primary/15"
        style={{ opacity: borderOpacity }}
      />
      {/* Border brightens to destructive when crossing the commit threshold */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl border border-destructive/40"
        style={{ opacity: destructiveBorderOpacity }}
      />

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.18, right: 0 }}
        dragMomentum={false}
        dragTransition={{ power: 0.18, timeConstant: 220, bounceStiffness: 320, bounceDamping: 34 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ x, willChange: 'transform' }}
        className={cn(
          'relative bg-card touch-pan-y',
          isDragging && 'cursor-grabbing',
        )}
      >
        {children}
      </motion.div>

      {/* Edge chevron — whispers the gesture direction */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center"
        style={{ opacity: chevronOpacity }}
      >
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/70" strokeWidth={2.25} />
      </motion.div>
    </div>
  );
}
