import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const isReady = pullDistance >= threshold;

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
      style={{ height: isRefreshing ? 48 : pullDistance }}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full p-2 transition-all duration-200',
          isReady || isRefreshing ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
        style={{
          transform: `scale(${0.5 + progress * 0.5}) rotate(${progress * 180}deg)`,
          opacity: Math.min(progress * 1.5, 1),
        }}
      >
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowDown className={cn('h-5 w-5 transition-transform', isReady && 'rotate-180')} />
        )}
      </div>
    </div>
  );
}
