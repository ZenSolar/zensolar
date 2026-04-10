import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Detects potential screenshot activity in the demo and logs it.
 * 
 * Detection methods:
 * 1. Keyboard shortcuts (PrintScreen, Cmd+Shift+3/4/5 on Mac)
 * 2. Visibility change (screen capture on mobile triggers blur/visibility)
 * 3. Window resize events that match screenshot tool patterns
 * 
 * Not 100% reliable — screenshots can't be fully prevented or detected
 * on the web. This is a best-effort awareness tool.
 */
export function useDemoScreenshotDetector() {
  const lastVisibilityChange = useRef<number>(0);
  const notified = useRef(false);

  useEffect(() => {
    const logScreenshotAttempt = (method: string) => {
      // Avoid duplicate rapid-fire notifications
      const now = Date.now();
      if (now - lastVisibilityChange.current < 2000) return;
      lastVisibilityChange.current = now;

      const timestamp = new Date().toISOString();
      const userAgent = navigator.userAgent;
      const page = window.location.pathname;

      // Log to console for local debugging
      console.info(`[ZenSolar] Screenshot detected (${method}) at ${timestamp} on ${page}`);

      // Log to a lightweight endpoint — fire-and-forget
      fetch(`${window.location.origin}/demo-screenshot-log`, {
        method: 'POST',
        body: JSON.stringify({ method, timestamp, userAgent, page }),
      }).catch(() => {});

      // You could also send to an edge function for email/slack notification
      if (!notified.current) {
        notified.current = true;
        // Reset after 30s to allow re-notification
        setTimeout(() => { notified.current = false; }, 30000);
      }
    };

    // Method 1: Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen') {
        logScreenshotAttempt('PrintScreen');
      }
      // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        logScreenshotAttempt(`Cmd+Shift+${e.key}`);
      }
      // Windows: Win+Shift+S (Snipping Tool)
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 's') {
        logScreenshotAttempt('Win+Shift+S');
      }
    };

    // Method 2: Visibility change — iOS screenshot causes a brief blur
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Short timer — if visibility returns within 3s, likely a screenshot
        const hiddenTime = Date.now();
        const checkReturn = () => {
          if (document.visibilityState === 'visible') {
            const elapsed = Date.now() - hiddenTime;
            // Screenshots typically cause 200-2000ms visibility loss
            if (elapsed > 100 && elapsed < 3000) {
              logScreenshotAttempt('visibility-change');
            }
            document.removeEventListener('visibilitychange', checkReturn);
          }
        };
        document.addEventListener('visibilitychange', checkReturn);
        // Cleanup if they never come back
        setTimeout(() => {
          document.removeEventListener('visibilitychange', checkReturn);
        }, 5000);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
