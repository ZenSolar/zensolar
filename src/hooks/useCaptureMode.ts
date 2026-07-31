import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { syncCaptureMode } from '@/lib/captureMode';

/**
 * Keeps `document.body[data-capture-mode]` in sync with the current URL.
 * Presentation-only — see `src/lib/captureMode.ts`.
 */
export function useCaptureMode(): boolean {
  const location = useLocation();
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(syncCaptureMode(location.search));
  }, [location.search, location.pathname]);

  return on;
}
