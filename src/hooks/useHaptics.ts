/**
 * Haptic feedback hook for PWA - provides native-feeling tactile feedback
 * Uses the Vibration API when available (Android/some browsers)
 */
export function useHaptics() {
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (canVibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently fail if vibration not supported
      }
    }
  };

  // Light tap - for buttons, menu items
  const lightTap = () => triggerHaptic(10);

  // Medium tap - for important actions
  const mediumTap = () => triggerHaptic(20);

  // Heavy tap - for destructive or significant actions
  const heavyTap = () => triggerHaptic(30);

  // Success feedback
  const success = () => triggerHaptic([10, 50, 20]);

  // Error feedback
  const error = () => triggerHaptic([30, 50, 30, 50, 30]);

  // Selection change
  const selection = () => triggerHaptic(5);

  return {
    canVibrate,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
    selection,
    triggerHaptic,
  };
}

// Standalone function for use outside React components
export function triggerLightTap() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10);
    } catch {
      // Silently fail
    }
  }
}
