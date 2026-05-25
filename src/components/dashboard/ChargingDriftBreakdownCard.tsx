import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Home, AlertTriangle } from "lucide-react";

/**
 * Per-provider drift breakdown for the Clean Energy Center dashboard.
 *
 * Renders Supercharger and Home charging drift as TWO independent rows.
 * They are never summed or merged in the UI — the on-chain ABI call is the
 * only place a combined charging counter exists.
 *
 * Source: per-mint `mint_reconciliation_log` rows over rolling 7d for the
 * signed-in user, grouped by `category` ('supercharger' | 'home_charging').
 */
type DriftRow = {
  category: "supercharger" | "home_charging";
  headline: number;
  onchain: number;
  mints: number;
  failed: number;
};

const META = {
  supercharger: { label: "Supercharger", icon: Zap, accent: "text-cyan-400" },
  home_charging: { label: "Home charging", icon: Home, accent: "text-emerald-400" },
} as const;

function severity(diffPct: number, failed: number): "info" | "warn" | "critical" {
  if (failed > 0 || Math.abs(diffPct) > 5) return "critical";
  if (Math.abs(diffPct) > 1) return "warn";
  return "info";
}

function fmt(n: number, d = 2) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: d });
}

export function ChargingDriftBreakdownCard() {
  const [rows, setRows] = useState<DriftRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        if (!cancelled) {
          setRows([]);
          setLoading(false);
        }
        return;
      }
      const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("mint_reconciliation_log")
        .select("category, headline_amount, on_chain_amount, passed")
        .eq("user_id", uid)
        .in("category", ["supercharger", "home_charging"])
        .gte("created_at", sinceIso)
        .limit(500);

      const buckets = new Map<DriftRow["category"], DriftRow>();
      for (const cat of ["supercharger", "home_charging"] as const) {
        buckets.set(cat, { category: cat, headline: 0, onchain: 0, mints: 0, failed: 0 });
      }
      for (const r of data ?? []) {
        const cat = r.category as DriftRow["category"];
        if (cat !== "supercharger" && cat !== "home_charging") continue;
        const b = buckets.get(cat)!;
        b.headline += Number(r.headline_amount) || 0;
        b.onchain += Number(r.on_chain_amount) || 0;
        b.mints += 1;
        if (!r.passed) b.failed += 1;
      }
      if (!cancelled) {
        setRows(Array.from(buckets.values()));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="bg-card/80 border-primary/15">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          Charging drift · last 7d
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
            per provider
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="text-xs text-muted-foreground">Loading…</div>
        ) : (rows ?? []).every((r) => r.mints === 0) ? (
          <div className="text-xs text-muted-foreground">
            No charging mints in the last 7 days.
          </div>
        ) : (
          (rows ?? []).map((r) => {
            const denom = Math.max(Math.abs(r.headline), Math.abs(r.onchain), 0.5);
            const diff = r.headline - r.onchain;
            const diffPct = (diff / denom) * 100;
            const sev = severity(diffPct, r.failed);
            const m = META[r.category];
            const Icon = m.icon;
            return (
              <div
                key={r.category}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 ${m.accent}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.label}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {fmt(r.headline)} kWh KPI · {fmt(r.onchain)} on-chain
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {sev === "critical" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {fmt(diffPct, 2)}%
                  </span>
                  <Badge
                    variant={
                      sev === "critical" ? "destructive" : sev === "warn" ? "secondary" : "outline"
                    }
                    className="text-[10px]"
                  >
                    {sev}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
        <p className="text-[10px] text-muted-foreground/70 pt-1">
          Supercharger and Home charging are diagnosed separately end-to-end. Never combined in UX or data pulls.
        </p>
      </CardContent>
    </Card>
  );
}

export default ChargingDriftBreakdownCard;
