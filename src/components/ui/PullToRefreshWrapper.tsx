import { ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { cn } from '@/lib/utils';

interface PullToRefreshWrapperProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  threshold?: number;
  maxPull?: number;
}

/**
 * A reusable wrapper component that adds pull-to-refresh functionality
 * with haptic feedback, visual indicators, and smooth animations.
 * 
 * Usage:
 * ```tsx
 * <PullToRefreshWrapper onRefresh={async () => { await refetch(); }}>
 *   <YourPageContent />
 * </PullToRefreshWrapper>
 * ```
 */
export function PullToRefreshWrapper({
  onRefresh,
  children,
  className,
  threshold = 80,
  maxPull = 140,
}: PullToRefreshWrapperProps) {
  const { 
    pullDistance, 
    isRefreshing, 
    isReady, 
    isActive,
    containerRef 
  } = usePullToRefresh({
    onRefresh,
    threshold,
    maxPull,
  });

  return (
    <div
      ref={containerRef}
      className={cn(
        'min-h-full overscroll-contain',
        className
      )}
    >
      {/* Pull-to-refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        isReady={isReady}
        isActive={isActive}
        threshold={threshold}
      />
      
      {/* Page content */}
      {children}
    </div>
  );
}
