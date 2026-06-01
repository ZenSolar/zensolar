import { lazy, Suspense } from "react";

export interface TrendPoint {
  monthLabel: string; // e.g. "Aug"
  dollars: number;
  kwh: number;
}

interface Props {
  data: TrendPoint[];
}

const ChartImpl = lazy(() => import("./TrendSparklineImpl"));

/**
 * 6-month savings trend. Recharts is heavy (~120kb gz) so we lazy-load it
 * to keep the Deason hub TTI fast on mobile. Renders a thin skeleton
 * while the chart bundle streams in.
 */
export function TrendSparkline({ data }: Props) {
  if (!data || data.length < 2) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          6-month savings trend
        </div>
        <div className="text-[10px] text-muted-foreground">$ saved / month</div>
      </div>
      <Suspense
        fallback={
          <div className="h-24 w-full animate-pulse rounded-md bg-muted/30" aria-hidden />
        }
      >
        <ChartImpl data={data} />
      </Suspense>
    </div>
  );
}
