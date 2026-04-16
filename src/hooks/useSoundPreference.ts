import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'zen-sound-enabled';

/** Global sound preference — persisted in localStorage */
export function useSoundPreference() {
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== 'false'; // default true
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      window.dispatchEvent(new CustomEvent('zen-sound-changed', { detail: next }));
      return next;
    });
  }, []);

  // Listen for cross-component changes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setEnabled(detail);
    };
    window.addEventListener('zen-sound-changed', handler);
    return () => window.removeEventListener('zen-sound-changed', handler);
  }, []);

  return { soundEnabled: enabled, toggleSound: toggle };
}
