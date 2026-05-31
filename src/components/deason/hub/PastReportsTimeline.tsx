import { useMemo, useState } from "react";
import { Calendar, Filter, FileText, ChevronRight } from "lucide-react";
import type { MonthlyReport, LibraryDoc } from "@/hooks/useDeasonHub";

/** Resolves the chat thread href used for "ask Deason about this report". */
export function threadHrefForReport(reportId: string): string {
  return `/deason?reportId=${encodeURIComponent(reportId)}`;
}

export interface DocumentLinkContext {
  doc: LibraryDoc;
  report: MonthlyReport | null;
  threadHref: string | null;
}

interface Props {
  reports: MonthlyReport[];
  library: LibraryDoc[];
  /** Fired when the user clicks a document under a report row. */
  onOpenDocument?: (ctx: DocumentLinkContext) => void;
}

type RangeKey = "all" | "3m" | "6m" | "12m";
type DocFilter = "any" | "utility_bill" | "installer_contract" | "ppa" | "loan";

/**
 * Filterable timeline of past monthly reports. Filters: time range and
 * document set (e.g. "only months where I uploaded a PPA"). Designed to
 * scale up to 12+ rows without overwhelming the hub.
 */
export function PastReportsTimeline({ reports, library }: Props) {
  const [range, setRange] = useState<RangeKey>("all");
  const [docFilter, setDocFilter] = useState<DocFilter>("any");
  const [query, setQuery] = useState("");

  // Group library docs by their period_month for fast lookup.
  const docsByMonth = useMemo(() => {
    const map = new Map<string, LibraryDoc[]>();
    for (const d of library) {
      if (!d.period_month) continue;
      const key = d.period_month;
      (map.get(key) ?? map.set(key, []).get(key)!).push(d);
    }
    return map;
  }, [library]);

  const filtered = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    if (range === "3m") cutoff.setMonth(cutoff.getMonth() - 3);
    else if (range === "6m") cutoff.setMonth(cutoff.getMonth() - 6);
    else if (range === "12m") cutoff.setMonth(cutoff.getMonth() - 12);

    return reports.filter((r) => {
      const d = new Date(r.period_month);
      if (range !== "all" && d < cutoff) return false;
      if (docFilter !== "any") {
        const docs = docsByMonth.get(r.period_month) ?? [];
        if (!docs.some((dd) => dd.kind === docFilter)) return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hay = `${r.narrative ?? ""} ${new Date(r.period_month).toLocaleString(undefined, { month: "long", year: "numeric" })}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reports, range, docFilter, query, docsByMonth]);

  if (reports.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4 text-amber-500" /> Past reports
        </div>
        <span className="text-[11px] text-muted-foreground">
          {filtered.length} of {reports.length}
        </span>
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(["all", "3m", "6m", "12m"] as RangeKey[]).map((k) => (
          <FilterPill key={k} active={range === k} onClick={() => setRange(k)}>
            {k === "all" ? "All time" : `Last ${k.replace("m", "")} mo`}
          </FilterPill>
        ))}
        <span className="mx-1 h-4 w-px bg-border" />
        <select
          value={docFilter}
          onChange={(e) => setDocFilter(e.target.value as DocFilter)}
          className="rounded-full border border-border bg-background px-2 py-1 text-[11px] text-foreground hover:bg-accent"
        >
          <option value="any">Any documents</option>
          <option value="utility_bill">Has utility bill</option>
          <option value="installer_contract">Has installer contract</option>
          <option value="ppa">Has PPA</option>
          <option value="loan">Has loan</option>
        </select>
      </div>

      <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2 py-1">
        <Filter className="h-3 w-3 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by month or note…"
          className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {filtered.length === 0 ? (
          <li className="rounded-md bg-background px-3 py-4 text-center text-xs text-muted-foreground">
            No reports match these filters.
          </li>
        ) : (
          filtered.map((r) => {
            const docs = docsByMonth.get(r.period_month) ?? [];
            const monthLabel = new Date(r.period_month).toLocaleString(undefined, { month: "long", year: "numeric" });
            return (
              <li key={r.id} className="rounded-lg bg-background px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium">{monthLabel}</div>
                  <div className="text-xs font-semibold text-amber-500">${Math.round(r.dollars_saved)}</div>
                </div>
                {(r.narrative || docs.length > 0) && (
                  <div className="mt-1 flex items-start justify-between gap-2">
                    {r.narrative && (
                      <p className="line-clamp-1 flex-1 text-[11px] text-muted-foreground">{r.narrative}</p>
                    )}
                    {docs.length > 0 && (
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <FileText className="h-2.5 w-2.5" /> {docs.length}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "bg-amber-500 text-black"
          : "border border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
