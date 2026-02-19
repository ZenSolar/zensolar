import { useState, useRef, useCallback, useEffect } from 'react';
import { triggerLightTap, triggerMediumTap, triggerSuccess } from '@/hooks/useHaptics';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
  activationDelay?: number;
  /** Max Y position (in viewport px) where a touch can start to activate pull-to-refresh */
  activationZoneHeight?: number;
  /** When false, touch listeners are not attached (default: true) */
  enabled?: boolean;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  isRefreshing: boolean;
  isPulling: boolean;
  isReady: boolean;
  isActive: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

// Smooth easing function for natural feel
function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function usePullToRefresh({
  onRefresh,
  threshold = 140,
  maxPull = 200,
  activationDelay = 250,
  activationZoneHeight = 160,
  enabled = true,
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
  const animationFrameId = useRef<number | null>(null);
  const targetPullDistance = useRef(0);

  // Smooth animation for pull distance
  const animatePullDistance = useCallback(() => {
    const current = pullDistance;
    const target = targetPullDistance.current;
    const diff = target - current;
    
    if (Math.abs(diff) < 0.5) {
      setPullDistance(target);
      return;
    }
    
    // Smooth interpolation
    const newDistance = current + diff * 0.15;
    setPullDistance(newDistance);
    animationFrameId.current = requestAnimationFrame(animatePullDistance);
  }, [pullDistance]);

  // Helper: get current scroll position (supports both element scroll and window scroll)
  const getScrollTop = useCallback(() => {
    const container = containerRef.current;
    if (!container) return window.scrollY;
    // If the container itself scrolls, use it; otherwise fall back to window scroll
    return container.scrollHeight > container.clientHeight && container.scrollTop > 0
      ? container.scrollTop
      : window.scrollY;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    const scrollTop = getScrollTop();
    initialScrollTop.current = scrollTop;
    
    const touchY = e.touches[0].clientY;
    
    // Only enable pull-to-refresh when at the top AND touch started in the header zone
    if (scrollTop <= 0 && touchY <= activationZoneHeight) {
      startY.current = touchY;
      startTime.current = Date.now();
      setIsPulling(true);
      setIsActive(false);
      hasTriggeredThresholdHaptic.current = false;
    }
  }, [isRefreshing, activationZoneHeight, getScrollTop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const scrollTop = getScrollTop();

    // If user scrolled away from top, cancel pull-to-refresh
    if (scrollTop > 0) {
      setIsPulling(false);
      targetPullDistance.current = 0;
      setPullDistance(0);
      setIsReady(false);
      setIsActive(false);
      return;
    }
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    const elapsed = Date.now() - startTime.current;
    
    // Only activate after a small delay and with downward motion
    if (diff > 30 && elapsed > activationDelay) {
      setIsActive(true);
      
      // Apply smooth rubber-band resistance using easing
      const normalizedPull = Math.min((diff - 30) / maxPull, 1);
      const easedPull = easeOutCubic(normalizedPull);
      const distance = easedPull * maxPull;
      
      targetPullDistance.current = Math.max(0, distance);
      
      // Directly set for responsiveness during active pull
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
      
      // Animate to a consistent refreshing position
      targetPullDistance.current = 60;
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        // Success haptic when done
        triggerSuccess();
        
        // Small delay for success state to show
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Reset all state to allow another pull
        setIsRefreshing(false);
        targetPullDistance.current = 0;
        setPullDistance(0);
        setIsReady(false);
        hasTriggeredThresholdHaptic.current = false;
      }
      return;
    }
    
    // If not refreshing, animate back to zero
    targetPullDistance.current = 0;
    
    // Animate pull distance back to 0
    const animateBack = () => {
      setPullDistance(prev => {
        const newVal = prev * 0.85;
        if (newVal < 1) {
          setIsReady(false);
          return 0;
        }
        requestAnimationFrame(animateBack);
        return newVal;
      });
    };
    requestAnimationFrame(animateBack);
    
    setIsReady(false);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    // Attach to document so we capture touches regardless of which element is scrolling
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, enabled]);

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    isReady,
    isActive,
    containerRef,
  };
}
