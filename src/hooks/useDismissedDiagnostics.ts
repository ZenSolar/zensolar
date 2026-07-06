import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Per-user, per-device dismissal tracker for informational OEM diagnostic
 * banners. Stored in localStorage as a single JSON blob keyed by user id:
 *
 *   oem-diag-dismissed:<userId>  →  { [diagnosticKey]: true }
 *
 * UI-only — does not affect audit logging or backend state.
 */
function storageKey(userId: string | null | undefined): string | null {
  if (!userId) return null;
  return `oem-diag-dismissed:${userId}`;
}

function readDismissed(userId: string | null | undefined): Record<string, boolean> {
  const key = storageKey(userId);
  if (!key || typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export function useDismissedDiagnostics() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [dismissed, setDismissed] = useState<Record<string, boolean>>(() => readDismissed(userId));

  // Re-hydrate when the signed-in user changes.
  useEffect(() => {
    setDismissed(readDismissed(userId));
  }, [userId]);

  const isDismissed = useCallback(
    (key: string) => Boolean(dismissed[key]),
    [dismissed],
  );

  const dismiss = useCallback(
    (key: string) => {
      const storeKey = storageKey(userId);
      if (!storeKey || typeof window === 'undefined') return;
      setDismissed((prev) => {
        const next = { ...prev, [key]: true };
        try {
          window.localStorage.setItem(storeKey, JSON.stringify(next));
        } catch {
          // Ignore write failures (quota, private mode, etc.)
        }
        return next;
      });
    },
    [userId],
  );

  return { isDismissed, dismiss };
}
