import { useCaptureMode } from '@/hooks/useCaptureMode';

/**
 * Presentation-only. Mirrors the `?capture=1` flag onto the body element so
 * `[data-capture-hide]` affordances drop out of a screen capture.
 */
export function CaptureModeManager() {
  useCaptureMode();
  return null;
}
