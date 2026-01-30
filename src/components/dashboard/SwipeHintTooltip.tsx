import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeHintTooltipProps {
  show: boolean;
  onDismiss: () => void;
}

export function SwipeHintTooltip({ show, onDismiss }: SwipeHintTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Delay showing the hint to let the page load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            "relative mx-auto mb-3 max-w-sm px-4 py-3 rounded-xl",
            "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30",
            "shadow-lg shadow-primary/10"
          )}
        >
          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary/10 transition-colors"
            aria-label="Dismiss hint"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            {/* Animated swipe icon */}
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary/20">
              <motion.div
                animate={{ x: [-5, 0, -5] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                <ArrowLeft className="h-5 w-5 text-primary" />
              </motion.div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Swipe left to hide
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Don't have an EV or battery? Swipe left on any unconnected field to hide it from your dashboard.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
