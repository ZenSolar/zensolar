import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerLightTap } from '@/hooks/useHaptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  isReady: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const hasTriggeredThresholdHaptic = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;
    
    // Only enable pull-to-refresh when at the top of the scroll container
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      hasTriggeredThresholdHaptic.current = false;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Apply resistance effect - gets harder to pull as you go further
      const resistance = Math.max(0.3, 0.6 - (diff / maxPull) * 0.3);
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
      
      // Track ready state and trigger haptic when crossing threshold
      const nowReady = distance >= threshold;
      if (nowReady !== isReady) {
        setIsReady(nowReady);
        if (nowReady && !hasTriggeredThresholdHaptic.current) {
          triggerLightTap();
          hasTriggeredThresholdHaptic.current = true;
        }
      }
      
      // Prevent default scrolling while pulling
      if (distance > 0) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing, maxPull, threshold, isReady]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      // Strong haptic on refresh trigger
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 30, 15]);
      }
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        // Success haptic
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setIsReady(false);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    isReady,
    containerRef,
  };
}
