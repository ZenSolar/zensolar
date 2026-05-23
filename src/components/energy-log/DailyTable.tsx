import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DailyProduction } from "@/hooks/useEnergyLog";
import type { ActivityType } from "@/hooks/useEnergyLog";
import { SourceBadges } from "@/components/energy-log/SourceBadges";

type SortKey = "date" | "value";
type SortDir = "asc" | "desc";

interface DailyTableProps {
  days: DailyProduction[];
  unit: "kWh" | "mi";
  activityType: ActivityType;
}

/**
 * Pass D · #1 — sortable table view of daily Energy Log data.
 *
 * Renders the same data as DailyList in a denser table format, suitable
 * for desktop (xl:+). Click headers to sort, sticky header inside the
 * scroll container.
 */
export function DailyTable({ days, unit }: DailyTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...days];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = a.date.getTime() - b.date.getTime();
      } else {
        cmp = a.kWh - b.kWh;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [days, sortKey, sortDir]);

  const total = useMemo(() => days.reduce((s, d) => s + d.kWh, 0), [days]);
  const best = useMemo(
    () => days.reduce<number>((m, d) => (d.kWh > m ? d.kWh : m), 0),
    [days],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "desc");
    }
  };

  const SortIcon = ({ active }: { active: boolean }) => {
    if (!active) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
      <div className="max-h-[640px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow>
              <TableHead
                onClick={() => toggleSort("date")}
                className="cursor-pointer select-none hover:text-foreground transition-colors"
                aria-sort={sortKey === "date" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="inline-flex items-center">
                  Date <SortIcon active={sortKey === "date"} />
                </span>
              </TableHead>
              <TableHead
                onClick={() => toggleSort("value")}
                className="cursor-pointer select-none text-right hover:text-foreground transition-colors"
                aria-sort={sortKey === "value" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="inline-flex items-center justify-end">
                  {unit} <SortIcon active={sortKey === "value"} />
                </span>
              </TableHead>
              <TableHead className="text-right w-24">vs. Best</TableHead>
              <TableHead className="text-right w-[140px]">Verified by</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-sm">
                  No data for this period yet.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((d) => {
                const pct = best > 0 ? Math.round((d.kWh / best) * 100) : 0;
                return (
                  <TableRow key={d.date.toISOString()}>
                    <TableCell className="font-medium tabular-nums">
                      <span className="text-foreground">{format(d.date, "EEE")}</span>
                      <span className="text-muted-foreground ml-2">{format(d.date, "MMM d")}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {d.kWh > 0 ? d.kWh.toLocaleString() : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-2 w-full justify-end">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              pct >= 80 ? "bg-primary" : pct >= 40 ? "bg-primary/70" : "bg-primary/40",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] tabular-nums text-muted-foreground w-9 text-right">
                          {pct}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {d.kWh > 0 ? (
                        <SourceBadges providers={d.providers} className="justify-end" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {sorted.length > 0 && (
        <div className="flex items-center justify-between border-t border-border/50 px-4 py-2 text-xs text-muted-foreground bg-muted/20">
          <span>
            {days.filter((d) => d.kWh > 0).length} of {days.length} days with data
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            {Math.round(total * 10) / 10} {unit} total
          </span>
        </div>
      )}
    </div>
  );
}
