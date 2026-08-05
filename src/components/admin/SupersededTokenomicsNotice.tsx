import { AlertTriangle } from 'lucide-react';

/**
 * Sticky, non-dismissible banner for archived pages that still contain
 * pre-v4.0 tokenomics figures (10:1 ratios, 20% burn, 50/25/20/5 and
 * 75/20/3/2 splits, LP mint, Genesis Halving).
 *
 * Those numbers are historical record and are intentionally NOT edited in
 * place — the pages are frozen snapshots. This banner states the canonical
 * v4.0 values so no reader can mistake the archive for current policy.
 */
export function SupersededTokenomicsNotice() {
  return (
    <div className="sticky top-0 z-[60] border-b-2 border-destructive/50 bg-destructive/15 backdrop-blur-md">
      <div className="container mx-auto flex items-start gap-3 px-4 py-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
        <p className="text-xs leading-relaxed text-foreground/90">
          <span className="font-semibold">Historical — superseded tokenomics.</span>{' '}
          Any mint ratio, mint split, burn rate or halving on this page is obsolete.
          Canonical v4.0: <span className="font-semibold">1 verified unit = 1.25 $ZSOLAR
          issued — 1.0 to the member, 0.25 to treasury</span>. No LP mint, no burn at
          mint, no halving. Supply control is the treasury-share step-down (0.25 → 0.10).
        </p>
      </div>
    </div>
  );
}
