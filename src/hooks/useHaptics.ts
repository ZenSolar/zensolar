/**
 * Haptic feedback hook - uses Capacitor Haptics for native apps,
 * falls back to Vibration API for Android PWA
 */
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Check if running in Capacitor native context
const isNative = typeof window !== 'undefined' && 
  'Capacitor' in window && 
  (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.() === true;

// Fallback vibration for Android PWA
const vibrateWeb = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail
    }
  }
};

export function useHaptics() {
  const canVibrate = isNative || (typeof navigator !== 'undefined' && 'vibrate' in navigator);

  // Light tap - for buttons, menu items
  const lightTap = async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else {
      vibrateWeb(10);
    }
  };

  // Medium tap - for important actions
  const mediumTap = async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else {
      vibrateWeb(20);
    }
  };

  // Heavy tap - for destructive or significant actions
  const heavyTap = async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else {
      vibrateWeb(30);
    }
  };

  // Success feedback
  const success = async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Success });
    } else {
      vibrateWeb([10, 50, 20]);
    }
  };

  // Error feedback
  const error = async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Error });
    } else {
      vibrateWeb([30, 50, 30, 50, 30]);
    }
  };

  // Warning feedback
  const warning = async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Warning });
    } else {
      vibrateWeb([20, 40, 20]);
    }
  };

  // Selection change - very light
  const selection = async () => {
    if (isNative) {
      await Haptics.selectionStart();
      await Haptics.selectionEnd();
    } else {
      vibrateWeb(5);
    }
  };

  return {
    canVibrate,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
    warning,
    selection,
    isNative,
  };
}

// Standalone functions for use outside React components
export async function triggerLightTap() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Light });
  } else {
    vibrateWeb(10);
  }
}

export async function triggerMediumTap() {
  if (isNative) {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } else {
    vibrateWeb(20);
  }
}

export async function triggerSuccess() {
  if (isNative) {
    await Haptics.notification({ type: NotificationType.Success });
  } else {
    vibrateWeb([10, 50, 20]);
  }
}

export async function triggerSelectionChanged() {
  if (isNative) {
    await Haptics.selectionChanged();
  } else {
    vibrateWeb(5);
  }
}
