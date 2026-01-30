import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'zensolar_swipe_hint_shown';

/**
 * Hook to track whether the swipe-to-hide hint has been shown to the user.
 * Persists to localStorage so it only shows once per device.
 */
export function useSwipeHintShown() {
  const [hasSeenHint, setHasSeenHint] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  // Mark the hint as shown
  const markHintSeen = useCallback(() => {
    setHasSeenHint(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  // Reset hint (for testing)
  const resetHint = useCallback(() => {
    setHasSeenHint(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    hasSeenHint,
    markHintSeen,
    resetHint,
    shouldShowHint: !hasSeenHint,
  };
}
