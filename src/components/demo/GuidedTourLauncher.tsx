import { useEffect, useState } from 'react';
import { PlayCircle, X } from 'lucide-react';
import { hasSeenTour } from '@/hooks/useGuidedTour';
import { isInvestorDemoModeSync } from '@/hooks/useInvestorDemoMode';

interface Props { onStart: () => void; }

/**
 * Floating "Take the 60-second tour" CTA, shown only in investor demo mode,
 * once per visitor, and dismissible.
 */
export function GuidedTourLauncher({ onStart }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isInvestorDemoModeSync()) return;
    if (hasSeenTour()) return;
    const t = window.setTimeout(() => setVisible(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed z-[140] left-1/2 -translate-x-1/2 pointer-events-auto"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + var(--bottom-nav-total-h, 72px) + 12px)' }}
    >
      <div className="flex items-center gap-2 rounded-full border border-secondary/50 bg-card/95 backdrop-blur-md shadow-[0_12px_40px_-12px_hsl(var(--secondary)/0.65)] pl-3 pr-1 py-1">
        <button
          type="button"
          onClick={() => { setVisible(false); onStart(); }}
          className="inline-flex items-center gap-2 text-[12px] font-semibold text-secondary hover:text-secondary/90"
        >
          <PlayCircle className="h-4 w-4" />
          Take the 60-second tour
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Dismiss tour invitation"
          className="inline-flex items-center justify-center h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
