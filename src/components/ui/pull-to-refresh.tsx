import { Loader2, ArrowDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  isReady?: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  isReady = false,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 0 || isRefreshing;

  if (!showIndicator) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{ 
        height: isRefreshing ? 56 : pullDistance,
        transition: isRefreshing ? 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
      }}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full transition-all duration-200',
          isReady || isRefreshing 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
            : 'bg-muted text-muted-foreground'
        )}
        style={{
          width: 40 + progress * 8,
          height: 40 + progress * 8,
          transform: `rotate(${progress * 180}deg)`,
          opacity: Math.min(progress * 1.5, 1),
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowDown 
            className={cn(
              'h-5 w-5 transition-all duration-200',
              isReady && 'scale-110'
            )} 
            style={{
              transform: isReady ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        )}
      </div>
      {isReady && !isRefreshing && (
        <span className="absolute mt-16 text-xs font-medium text-primary animate-fade-in">
          Release to refresh
        </span>
      )}
    </div>
  );
}
