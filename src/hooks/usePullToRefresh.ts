import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerLightTap, triggerMediumTap, triggerSuccess } from '@/hooks/useHaptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
  activationDelay?: number;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  isReady: boolean;
  isActive: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 100,
  maxPull = 150,
  activationDelay = 50,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const startTime = useRef(0);
  const currentY = useRef(0);
  const hasTriggeredThresholdHaptic = useRef(false);
  const initialScrollTop = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;
    
    initialScrollTop.current = container.scrollTop;
    
    // Only enable pull-to-refresh when completely at the top
    if (container.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      startTime.current = Date.now();
      setIsPulling(true);
      setIsActive(false);
      hasTriggeredThresholdHaptic.current = false;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!isPulling || isRefreshing || !container) return;
    
    // If user scrolled away from top, cancel pull-to-refresh
    if (container.scrollTop > 0) {
      setIsPulling(false);
      setPullDistance(0);
      setIsReady(false);
      setIsActive(false);
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    const elapsed = Date.now() - startTime.current;
    
    // Only activate after a small delay and with downward motion
    if (diff > 10 && elapsed > activationDelay) {
      setIsActive(true);
      
      // Apply stronger resistance - requires more intentional pull
      const resistance = Math.max(0.25, 0.5 - (diff / maxPull) * 0.25);
      const distance = Math.min((diff - 10) * resistance, maxPull);
      setPullDistance(Math.max(0, distance));
      
      // Track ready state and trigger haptic when crossing threshold
      const nowReady = distance >= threshold;
      if (nowReady !== isReady) {
        setIsReady(nowReady);
        if (nowReady && !hasTriggeredThresholdHaptic.current) {
          triggerLightTap();
          hasTriggeredThresholdHaptic.current = true;
        }
      }
      
      // Prevent default scrolling while actively pulling
      if (distance > 0) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing, maxPull, threshold, isReady, activationDelay]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    setIsActive(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      // Medium haptic on refresh trigger
      triggerMediumTap();
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        // Success haptic when done
        triggerSuccess();
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
    isActive,
    containerRef,
  };
}
