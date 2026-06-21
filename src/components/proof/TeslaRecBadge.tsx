/**
 * TeslaRecBadge — Phase 4 deliverable for the Tesla Charging Experience v2.
 *
 * Renders the two required surfaces for any mint that includes Supercharger
 * energy:
 *
 *   1. A small badge: "⚡ Tesla Supercharger · 100% REC-matched clean energy"
 *   2. A dual CO₂ line:
 *        "0.00 t CO₂ via Tesla REC  ·  X.XX t vs local grid average"
 *
 * Designed to slot into both the per-receipt page (VerifyPoAContent) and the
 * Quick-View ReceiptDrawer. Calm visual treatment — no audio, no animation
 * beyond a single fade-in.
 */
import { Zap, Leaf } from 'lucide-react';
import { teslaRecCo2 } from '@/lib/co2Math';
import { cn } from '@/lib/utils';

interface Props {
  /** kWh attributed to Supercharger inside this mint. */
  superchargerKwh: number;
  /** Compact = drawer; default = full receipt. */
  compact?: boolean;
  className?: string;
}

export function TeslaRecBadge({ superchargerKwh, compact = false, className }: Props) {
  if (!superchargerKwh || superchargerKwh <= 0) return null;
  const co2 = teslaRecCo2(superchargerKwh);

  return (
    <div className={cn('space-y-1.5', className)}>
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
          'border-[hsl(28_95%_55%)]/35 bg-[hsl(28_95%_55%)]/[0.08]',
          compact ? 'text-[10px]' : 'text-[11px]',
        )}
      >
        <Zap className="h-3 w-3 text-[hsl(28_95%_65%)]" />
        <span className="font-semibold uppercase tracking-wider text-[hsl(28_95%_75%)]">
          Tesla Supercharger
        </span>
        <span className="text-muted-foreground/80">·</span>
        <span className="text-foreground/90">100% REC-matched clean energy</span>
      </div>

      <div
        className={cn(
          'flex items-center gap-1.5 text-muted-foreground',
          compact ? 'text-[10px]' : 'text-[11px]',
        )}
        title="Tesla retires RECs covering 100% of Supercharger electricity. Grid comparator uses the local-grid CO₂ intensity."
      >
        <Leaf className="h-3 w-3 shrink-0 text-eco" />
        <span className="tabular-nums text-eco font-semibold">
          {(co2.tesla_rec_kg / 1000).toFixed(2)} t
        </span>
        <span>via Tesla REC</span>
        <span className="opacity-60">·</span>
        <span className="tabular-nums">
          {(co2.grid_avg_kg / 1000).toFixed(2)} t
        </span>
        <span>vs local grid avg</span>
      </div>
    </div>
  );
}
