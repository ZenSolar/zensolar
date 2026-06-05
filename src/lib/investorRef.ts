/**
 * Investor share-link personalization.
 * Reads `?ref=name` from the URL, persists to localStorage, and exposes
 * a hook so /investor can greet the visitor by name and pre-fill the NDA.
 */
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'zs:investor:ref:v1';

function sanitize(raw: string | null): string | null {
  if (!raw) return null;
  // Keep letters, spaces, hyphens, apostrophes. Trim.
  const cleaned = raw.replace(/[^a-zA-Z\s'-]/g, '').trim().slice(0, 40);
  return cleaned.length >= 1 ? cleaned : null;
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

function readStored(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URLSearchParams(window.location.search).get('ref');
    const fromUrl = sanitize(url);
    if (fromUrl) {
      try { window.localStorage.setItem(STORAGE_KEY, fromUrl); } catch { /* noop */ }
      return fromUrl;
    }
    return sanitize(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function useInvestorRef(): { raw: string | null; displayName: string | null; firstName: string | null } {
  const [raw, setRaw] = useState<string | null>(() => readStored());
  useEffect(() => {
    // Re-read once on mount in case URL was added after first render.
    const v = readStored();
    if (v !== raw) setRaw(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const displayName = raw ? titleCase(raw) : null;
  const firstName = displayName ? displayName.split(' ')[0] : null;
  return { raw, displayName, firstName };
}
