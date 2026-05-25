import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, RefreshCw, AlertTriangle, Scale, Layers } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Rolling window summary row produced by verify_kpi_vs_mint_window_7d()
type WindowRow = {
  id: string;
  user_id: string | null;
  kpi_key: string; // recon7d_<category>_vs_mint
  severity: "info" | "warn" | "critical" | string;
  headline_value: number | null;
  computed_value: number | null; // on-chain minted aggregate
  diff: number | null;
  diff_pct: number | null;
  passed: boolean;
  detected_at: string;
  source_breakdown: {
    category?: string;
    mint_count?: number;
    failed_mints?: number;
    max_per_mint_diff_pct?: number;
    window_days?: number;
  } | null;
};

// Per-mint row from mint_reconciliation_log
type MintRow = {
  id: string;
  user_id: string;
  mint_tx_hash: string;
  category: string;
  headline_amount: number;
  on_chain_amount: number;
  diff_pct: number;
  passed: boolean;
  created_at: string;
  source_breakdown: Record<string, unknown> | null;
};

const sevColor = (s: string) =>
  s === "critical" ? "destructive" : s === "warn" ? "secondary" : "outline";

const CATEGORY_LABEL: Record<string, string> = {
  solar: "Solar kWh",
  battery: "Battery exported kWh",
  ev_miles: "EV miles",
  supercharger: "Supercharger kWh",
  home_charging: "Home charging kWh",
  charging: "Charging kWh (super + home)",
};

function fmt(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export default function AdminKpiReconciliation() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [windowRows, setWindowRows] = useState<WindowRow[]>([]);
  const [mintRows, setMintRows] = useState<MintRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [w, m] = await Promise.all([
      supabase
        .from("kpi_reconciliation_log")
        .select("*")
        .like("kpi_key", "recon7d_%_vs_mint")
        .gte("detected_at", sinceIso)
        .order("detected_at", { ascending: false })
        .limit(500),
      supabase
        .from("mint_reconciliation_log")
        .select("*")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    if (w.error) toast.error(`Window recon: ${w.error.message}`);
    if (m.error) toast.error(`Per-mint recon: ${m.error.message}`);
    setWindowRows((w.data as WindowRow[]) ?? []);
    setMintRows((m.data as MintRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.rpc("verify_kpi_vs_mint_window_7d");
      if (error) throw error;
      toast.success(`Recon sweep complete: ${data ?? 0} new divergence row(s) logged.`);
      await load();
    } catch (e) {
      toast.error(`Sweep failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  // Group window rows by user × category — keep most recent per pair
  const latestPerPair = useMemo(() => {
    const map = new Map<string, WindowRow>();
    for (const r of windowRows) {
      const key = `${r.user_id ?? "_" }::${r.kpi_key}`;
      if (!map.has(key)) map.set(key, r);
    }
    return Array.from(map.values());
  }, [windowRows]);

  const criticalRows = latestPerPair.filter((r) => r.severity === "critical");
  const warnRows = latestPerPair.filter((r) => r.severity === "warn");
  const failedMints = mintRows.filter((m) => !m.passed);

  // Per-category roll-up
  const categoryRollup = useMemo(() => {
    const buckets = new Map<
      string,
      { headline: number; onchain: number; mints: number; failed: number; users: Set<string> }
    >();
    for (const m of mintRows) {
      const b = buckets.get(m.category) ?? {
        headline: 0,
        onchain: 0,
        mints: 0,
        failed: 0,
        users: new Set<string>(),
      };
      b.headline += Number(m.headline_amount) || 0;
      b.onchain += Number(m.on_chain_amount) || 0;
      b.mints += 1;
      if (!m.passed) b.failed += 1;
      b.users.add(m.user_id);
      buckets.set(m.category, b);
    }
    return Array.from(buckets.entries()).map(([cat, v]) => {
      const denom = Math.max(Math.abs(v.headline), Math.abs(v.onchain), 0.5);
      const diff = v.headline - v.onchain;
      const diffPct = (diff / denom) * 100;
      return { cat, ...v, diff, diffPct, userCount: v.users.size };
    });
  }, [mintRows]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            KPI ↔ On-Chain Mint Reconciliation
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Rolling 7-day check: dashboard KPI value vs the kWh / miles credited on-chain, per user and per category
            (Solar, Battery, EV miles, Supercharger, Home charging). Auto-runs every 6 hours.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={runNow} disabled={running}>
            {running ? "Running…" : "Run reconciliation now"}
          </Button>
        </div>
      </div>

      {/* Summary banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Critical divergence" value={criticalRows.length} tone="critical" />
        <SummaryCard label="Warnings" value={warnRows.length} tone="warn" />
        <SummaryCard label="Per-mint failures" value={failedMints.length} tone={failedMints.length ? "critical" : "ok"} />
        <SummaryCard label="Mints in window" value={mintRows.length} tone="ok" />
      </div>

      {criticalRows.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm">
              <strong>{criticalRows.length}</strong> user/category pair{criticalRows.length === 1 ? "" : "s"} have
              KPI ↔ on-chain drift over 5% in the last 7 days. Investigate before broad rollout.
            </span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="rollup">
        <TabsList>
          <TabsTrigger value="rollup">
            <Layers className="h-4 w-4 mr-1" /> Category Roll-up
          </TabsTrigger>
          <TabsTrigger value="window">
            <Activity className="h-4 w-4 mr-1" /> Per User × Category ({latestPerPair.length})
          </TabsTrigger>
          <TabsTrigger value="mints">
            <Scale className="h-4 w-4 mr-1" /> Per-Mint Log ({mintRows.length})
          </TabsTrigger>
        </TabsList>

        {/* Category roll-up: aggregated headline vs on-chain across all users in 7d */}
        <TabsContent value="rollup" className="space-y-2">
          {categoryRollup.length === 0 ? (
            <EmptyState label="No mints in the last 7 days." />
          ) : (
            categoryRollup.map((r) => {
              const sev = r.failed > 0 || Math.abs(r.diffPct) > 5 ? "critical" : Math.abs(r.diffPct) > 1 ? "warn" : "info";
              return (
                <Card key={r.cat} className={sev === "critical" ? "border-destructive/40" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <span>{CATEGORY_LABEL[r.cat] ?? r.cat}</span>
                      <Badge variant={sevColor(sev) as never}>{sev}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Metric label="KPI headline" value={fmt(r.headline)} />
                    <Metric label="On-chain minted" value={fmt(r.onchain)} />
                    <Metric label="Diff" value={`${fmt(r.diff)} (${fmt(r.diffPct, 3)}%)`} />
                    <Metric label="Mints / users" value={`${r.mints} / ${r.userCount}`} />
                    <Metric label="Failed mints" value={`${r.failed}`} tone={r.failed ? "bad" : undefined} />
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Per user × category divergence (from window job) */}
        <TabsContent value="window" className="space-y-2">
          {latestPerPair.length === 0 ? (
            <EmptyState label="No user × category divergence flagged in the last 7 days." />
          ) : (
            latestPerPair.map((r) => {
              const cat = r.source_breakdown?.category ?? r.kpi_key.replace(/^recon7d_|_vs_mint$/g, "");
              return (
                <Card key={r.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <span>
                        <span className="font-mono text-xs opacity-70">
                          {r.user_id?.slice(0, 8) ?? "—"}
                        </span>{" "}
                        · {CATEGORY_LABEL[cat] ?? cat}
                      </span>
                      <Badge variant={sevColor(r.severity) as never}>{r.severity}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1">
                    <div>
                      headline <span className="font-mono text-foreground">{fmt(r.headline_value)}</span> · on-chain{" "}
                      <span className="font-mono text-foreground">{fmt(r.computed_value)}</span> · diff{" "}
                      <span className="font-mono text-foreground">{fmt(r.diff)}</span> (
                      <span className="font-mono">{fmt(r.diff_pct, 3)}%</span>)
                    </div>
                    <div className="opacity-70">
                      {r.source_breakdown?.mint_count ?? 0} mints ·{" "}
                      {r.source_breakdown?.failed_mints ?? 0} failed · max per-mint diff{" "}
                      {fmt(r.source_breakdown?.max_per_mint_diff_pct, 3)}% ·{" "}
                      {format(new Date(r.detected_at), "MMM d, HH:mm")}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Raw per-mint log */}
        <TabsContent value="mints" className="space-y-2">
          {mintRows.length === 0 ? (
            <EmptyState label="No per-mint reconciliation entries in the last 7 days." />
          ) : (
            mintRows.map((m) => (
              <Card key={m.id} className={!m.passed ? "border-destructive/40" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <span>
                      <span className="font-mono text-xs opacity-70">{m.user_id.slice(0, 8)}</span> ·{" "}
                      {CATEGORY_LABEL[m.category] ?? m.category}
                    </span>
                    <Badge variant={m.passed ? "outline" : "destructive"}>
                      {m.passed ? "passed" : "failed"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div>
                    headline <span className="font-mono text-foreground">{fmt(m.headline_amount)}</span> · on-chain{" "}
                    <span className="font-mono text-foreground">{fmt(m.on_chain_amount)}</span> · diff{" "}
                    <span className="font-mono">{fmt(m.diff_pct, 3)}%</span>
                  </div>
                  <div className="opacity-70 font-mono truncate">
                    tx {m.mint_tx_hash.slice(0, 18)}… · {format(new Date(m.created_at), "MMM d, HH:mm")}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="py-8 text-center text-sm text-muted-foreground">{label}</CardContent>
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "critical";
}) {
  const cls =
    tone === "critical"
      ? "border-destructive/40 bg-destructive/5"
      : tone === "warn"
        ? "border-secondary/40 bg-secondary/5"
        : "";
  return (
    <Card className={cls}>
      <CardContent className="py-4">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "bad" }) {
  return (
    <div>
      <div className={`font-mono ${tone === "bad" ? "text-destructive" : "text-foreground"}`}>{value}</div>
      <div className="opacity-70">{label}</div>
    </div>
  );
}
