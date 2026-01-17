import { Loader2, RefreshCw, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isReady?: boolean;
  isActive?: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isReady = false,
  isActive = false,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = (pullDistance > 0 && isActive) || isRefreshing;
  const [isBouncing, setIsBouncing] = useState(false);
  const [wasReady, setWasReady] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Trigger bounce animation when crossing threshold
  useEffect(() => {
    if (isReady && !wasReady && !isRefreshing) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 300);
      return () => clearTimeout(timer);
    }
    setWasReady(isReady);
  }, [isReady, wasReady, isRefreshing]);

  // Show success state briefly after refresh completes
  useEffect(() => {
    if (!isRefreshing && wasReady) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, wasReady]);

  if (!showIndicator && !showSuccess) return null;

  // Calculate dynamic sizing
  const iconSize = 20 + progress * 4;
  const containerSize = 48 + progress * 8;

  return (
    <motion.div
      className="flex flex-col items-center justify-center overflow-hidden"
      initial={{ height: 0, opacity: 0 }}
      animate={{ 
        height: isRefreshing ? 80 : showSuccess ? 64 : Math.min(pullDistance * 0.8, threshold),
        opacity: 1 
      }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ 
        height: { type: 'spring', stiffness: 400, damping: 30 },
        opacity: { duration: 0.2 }
      }}
    >
      <motion.div
        className={cn(
          'relative flex items-center justify-center rounded-full transition-all duration-200',
          isRefreshing 
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/40' 
            : showSuccess
              ? 'bg-gradient-to-br from-eco to-eco/80 text-eco-foreground shadow-lg shadow-eco/40'
              : isReady 
                ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30' 
                : 'bg-muted/90 text-muted-foreground border border-border/60 backdrop-blur-sm',
          isBouncing && 'scale-110'
        )}
        style={{
          width: containerSize,
          height: containerSize,
        }}
        animate={{
          scale: isBouncing ? 1.15 : 1,
          opacity: Math.min(progress * 1.5 + 0.3, 1),
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        {/* Glow ring for ready state */}
        <AnimatePresence>
          {isReady && !isRefreshing && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.4, opacity: [0, 0.5, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </AnimatePresence>

        {/* Success checkmark */}
        {showSuccess ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Check className="h-6 w-6" />
          </motion.div>
        ) : isRefreshing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 style={{ width: iconSize, height: iconSize }} />
          </motion.div>
        ) : (
          <motion.div
            animate={{ rotate: progress * 360 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <RefreshCw 
              style={{ width: iconSize, height: iconSize }}
              className={cn(isReady && 'text-primary-foreground')}
            />
          </motion.div>
        )}

        {/* Sparkle effect on ready */}
        <AnimatePresence>
          {isReady && !isRefreshing && (
            <>
              <motion.div
                className="absolute -top-1 -right-1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Sparkles className="h-3 w-3 text-primary" />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-1"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Sparkles className="h-2.5 w-2.5 text-primary" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status text with smooth transitions */}
      <AnimatePresence mode="wait">
        <motion.span
          key={showSuccess ? 'success' : isRefreshing ? 'refreshing' : isReady ? 'ready' : 'pull'}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'mt-3 text-xs font-semibold tracking-wide transition-colors',
            showSuccess ? 'text-eco' : isReady || isRefreshing ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {showSuccess 
            ? '✓ Updated!' 
            : isRefreshing 
              ? 'Refreshing...' 
              : isReady 
                ? 'Release to refresh' 
                : 'Pull to refresh'}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
