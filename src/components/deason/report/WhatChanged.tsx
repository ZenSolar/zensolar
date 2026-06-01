import { AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import type { EnergyReportPreview, EnergyReportFull } from "@/hooks/useEnergyReport";

interface Props {
  preview?: EnergyReportPreview;
  full?: EnergyReportFull;
  prevDollarsSaved: number | null;
  currDollarsSaved: number;
}

type Bullet = {
  kind: "insight" | "risk" | "trend";
  text: string;
};

/**
 * "What changed" — 2-3 auto-generated bullets derived from the structured
 * report + MoM delta. Falls back to the executive_summary when the
 * structured report is missing.
 */
export function WhatChanged({ preview, full, prevDollarsSaved, currDollarsSaved }: Props) {
  const bullets: Bullet[] = [];

  if (preview?.top_insight) {
    bullets.push({ kind: "insight", text: preview.top_insight });
  }

  if (prevDollarsSaved != null && prevDollarsSaved > 0) {
    const diff = currDollarsSaved - prevDollarsSaved;
    const pct = Math.round((diff / prevDollarsSaved) * 100);
    if (Math.abs(pct) >= 5) {
      const direction = pct >= 0 ? "up" : "down";
      bullets.push({
        kind: "trend",
        text: `Bill savings ${direction} ${Math.abs(pct)}% vs last month ($${Math.round(
          Math.abs(diff),
        )} difference).`,
      });
    }
  }

  if (preview?.top_risk_flag && bullets.length < 3) {
    bullets.push({ kind: "risk", text: preview.top_risk_flag });
  }

  const firstAction = full?.action_items?.[0];
  if (firstAction && bullets.length < 3) {
    bullets.push({
      kind: "insight",
      text: `${firstAction.title} — est. $${Math.round(
        firstAction.estimated_annual_impact_usd,
      )}/yr impact.`,
    });
  }

  if (bullets.length === 0 && preview?.executive_summary) {
    bullets.push({ kind: "insight", text: preview.executive_summary });
  }

  if (bullets.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-3.5">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        What changed
      </div>
      <ul className="space-y-2">
        {bullets.slice(0, 3).map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-snug">
            <span className="mt-0.5 shrink-0">
              {b.kind === "risk" && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
              {b.kind === "trend" && <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />}
              {b.kind === "insight" && <Lightbulb className="h-3.5 w-3.5 text-sky-400" />}
            </span>
            <span className="text-foreground/90">{b.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
