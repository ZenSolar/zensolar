import { motion } from "framer-motion";
import { Hourglass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ROWS = [
  { year: "2026", activity: "~2.8T kWh + 10B miles", minted: "~0.3 trillion", pct: "0.03%", tone: "text-emerald-300" },
  { year: "2050", activity: "~20–50T kWh + 1–3T miles", minted: "~5–15 trillion", pct: "0.5–1.5%", tone: "text-emerald-300" },
  { year: "2100", activity: "~100–300T kWh + 10–30T miles", minted: "~50–150 trillion", pct: "5–15%", tone: "text-cyan-300" },
  { year: "2150", activity: "~300–1,000T kWh + 50–100T miles", minted: "~200–600 trillion", pct: "20–60%", tone: "text-amber-300" },
  { year: "2225", activity: "Extremely speculative (new tech & fleet growth)", minted: "~500T – 2 quadrillion+", pct: "50% – 200%+", tone: "text-rose-300" },
];

export function ScarcityOutlookSection({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={cn(
          "border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01]",
          "backdrop-blur-xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]",
          className,
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hourglass className="h-5 w-5 text-primary" />
            100–200 Year Scarcity Outlook
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            ZenSolar is being built as a 100–200+ year company. Even at massive global scale (hundreds of millions of
            Tesla, solar, and EV users), the 1 trillion hard cap remains extremely difficult to approach — exactly like
            Bitcoin's 21 million supply.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile: stacked cards */}
          <div className="space-y-2 md:hidden">
            {ROWS.map((r) => (
              <div
                key={r.year}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-2"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bold tabular-nums text-base">{r.year}</span>
                  <span className={cn("font-semibold tabular-nums text-sm", r.tone)}>{r.pct}</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Activity</div>
                    <div className="text-foreground/80">{r.activity}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cumulative Minted (10:1)</div>
                    <div className="tabular-nums">{r.minted}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/tablet: table with horizontal scroll fallback */}
          <div className="hidden md:block rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-[11px] uppercase tracking-wider">Year</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Approx. Annual Solar + FSD/EV Activity</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider">Cumulative Minted (10:1)</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-right">% of 1T Cap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROWS.map((r) => (
                  <TableRow key={r.year} className="border-white/5">
                    <TableCell className="font-bold tabular-nums">{r.year}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.activity}</TableCell>
                    <TableCell className="text-xs tabular-nums">{r.minted}</TableCell>
                    <TableCell className={cn("text-right font-semibold tabular-nums", r.tone)}>{r.pct}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-100/90 leading-relaxed">
            Even with explosive long-term adoption, the combination of default 12-month vesting, strong staking, Genesis
            Halving, and future scarcity upgrades keeps the effective circulating supply growing very slowly. The 1T
            hard cap therefore behaves like Bitcoin's 21M — the number exists, but hitting full circulation remains
            practically impossible for generations.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
