/**
 * FirstTimeMintBanner — calm L2 first-time banner.
 *
 * Shown once per user per eventKey. Locked, short copy. Auto-dismiss after
 * 8s. No audio, no confetti. Mirrors the SuperchargerBanner tone.
 */
import * as React from 'react';
import { useEffect } from 'react';
import { useUxFirstSeen } from '@/hooks/useUxFirstSeen';

interface Props {
  eventKey: string;
  /** Locked copy, e.g. "First solar mint accruing." */
  message: string;
  /** Whether the underlying source is currently producing/active. */
  trigger: boolean;
  /** Auto-dismiss duration. */
  durationMs?: number;
}

export function FirstTimeMintBanner({
  eventKey,
  message,
  trigger,
  durationMs = 8000,
}: Props) {
  const { seen, markSeen } = useUxFirstSeen(eventKey);
  const [visible, setVisible] = React.useState(false);

  useEffect(() => {
    if (seen !== false) return;
    if (!trigger) return;
    setVisible(true);
    void markSeen();
    const t = setTimeout(() => setVisible(false), durationMs);
    return () => clearTimeout(t);
  }, [seen, trigger, markSeen, durationMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-1 mb-2 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[12px] text-foreground/90 transition-opacity duration-500"
    >
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary/80" />
      <span>{message}</span>
    </div>
  );
}
