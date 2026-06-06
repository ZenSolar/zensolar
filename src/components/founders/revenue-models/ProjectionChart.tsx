import { lazy, Suspense } from "react";
import type { ProjectionRow } from "@/lib/revenueModelProjection";

const Impl = lazy(() => import("./ProjectionChartImpl"));

interface Props {
  rows: ProjectionRow[];
  series: "lp" | "cash";
  title: string;
  subtitle?: string;
}

export function ProjectionChart({ rows, series, title, subtitle }: Props) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-4">
      <div className="mb-3">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</div>
        )}
      </div>
      <Suspense
        fallback={
          <div className="h-64 w-full animate-pulse rounded-md bg-muted/30" aria-hidden />
        }
      >
        <Impl rows={rows} series={series} />
      </Suspense>
    </div>
  );
}
