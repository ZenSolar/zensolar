import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

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
  threshold = 100,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = (pullDistance > 0 && isActive) || isRefreshing;
  const [isBouncing, setIsBouncing] = useState(false);
  const [wasReady, setWasReady] = useState(false);

  // Trigger bounce animation when crossing threshold
  useEffect(() => {
    if (isReady && !wasReady && !isRefreshing) {
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 300);
      return () => clearTimeout(timer);
    }
    setWasReady(isReady);
  }, [isReady, wasReady, isRefreshing]);

  if (!showIndicator) return null;

  return (
    <div
      className="flex flex-col items-center justify-center overflow-hidden"
      style={{ 
        height: isRefreshing ? 64 : Math.min(pullDistance, threshold + 20),
        transition: isRefreshing ? 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full transition-all duration-200',
          isRefreshing 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
            : isReady 
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
              : 'bg-muted/80 text-muted-foreground border border-border/50',
          isBouncing && 'animate-bounce-once'
        )}
        style={{
          width: 44 + progress * 4,
          height: 44 + progress * 4,
          opacity: Math.min(progress * 2, 1),
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <RefreshCw 
            className={cn(
              'h-5 w-5 transition-all duration-300',
              isReady && 'text-primary-foreground'
            )} 
            style={{
              transform: `rotate(${progress * 360}deg)`,
            }}
          />
        )}
      </div>
      <span 
        className={cn(
          'mt-2 text-xs font-medium transition-all duration-200',
          isReady ? 'text-primary' : 'text-muted-foreground'
        )}
        style={{
          opacity: Math.min(progress * 1.5, 1),
        }}
      >
        {isReady ? 'Release to refresh' : 'Pull to refresh'}
      </span>
    </div>
  );
}
