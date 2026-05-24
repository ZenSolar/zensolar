import { motion, PanInfo } from 'framer-motion';
import { ReactNode } from 'react';

interface SwipeDismissWrapperProps {
  onDismiss: () => void;
  children: ReactNode;
  /** Distance in px to trigger dismiss. */
  threshold?: number;
}

/**
 * Wraps dialog content with a drag-down-to-dismiss gesture and a visible
 * grab handle. Use inside DialogContent for mobile-native bottom-sheet feel.
 */
export function SwipeDismissWrapper({
  onDismiss,
  children,
  threshold = 110,
}: SwipeDismissWrapperProps) {
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > threshold || info.velocity.y > 600) {
      onDismiss();
    }
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={handleDragEnd}
      className="touch-pan-y"
    >
      {/* Drag handle */}
      <div
        className="flex justify-center pt-1 pb-2 cursor-grab active:cursor-grabbing"
        aria-hidden
      >
        <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
      </div>
      {children}
    </motion.div>
  );
}
