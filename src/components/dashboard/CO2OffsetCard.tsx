import { Card, CardContent } from '@/components/ui/card';
import { Leaf, TreePine } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CO2OffsetCardProps {
  /** Lifetime CO2 offset in pounds (from calculateCO2Offset). */
  co2Pounds: number;
  isLoading?: boolean;
  className?: string;
}

const LBS_PER_TON = 2000;
// EPA: an average mature tree absorbs ~48 lbs CO2/year
const LBS_PER_TREE_YEAR = 48;

/**
 * Prominent CO2 offset card — matches the new sidebar styling
 * (left accent bar + emerald primary + clean rounded card surface).
 *
 * Displays the headline number in TONS (per user request) with lbs and
 * tree-equivalents as secondary context.
 */
export function CO2OffsetCard({ co2Pounds, isLoading, className }: CO2OffsetCardProps) {
  if (isLoading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-l-2 border-l-primary/60 bg-gradient-to-br from-eco/10 to-primary/5',
          className,
        )}
      >
        <CardContent className="p-4 space-y-3">
          <div className="h-4 w-32 rounded bg-muted/40 animate-pulse" />
          <div className="h-9 w-40 rounded bg-muted/50 animate-pulse" />
          <div className="h-3 w-48 rounded bg-muted/30 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const tons = co2Pounds / LBS_PER_TON;
  const treeYears = Math.max(0, Math.round(co2Pounds / LBS_PER_TREE_YEAR));
  const tonsDisplay = tons >= 100
    ? tons.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : tons.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-l-2 border-l-primary bg-gradient-to-br from-eco/10 via-primary/5 to-transparent transition-colors hover:border-l-primary/80',
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-eco/20 text-eco shrink-0">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Lifetime CO₂ Offset
            </p>
            <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-foreground">
              {tonsDisplay}
              <span className="ml-1.5 text-base font-semibold text-muted-foreground">tons</span>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {co2Pounds.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs avoided
              </span>
              <span className="inline-flex items-center gap-1">
                <TreePine className="h-3 w-3 text-eco" />
                ≈ {treeYears.toLocaleString()} tree-years
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
