import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, RefreshCw, AlertTriangle, Activity, Users2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type DriftRow = {
  id: string;
  user_id: string | null;
  kpi_key: string;
  severity: string;
  headline_value: number | null;
  computed_value: number | null;
  diff: number | null;
  diff_pct: number | null;
  passed: boolean;
  detected_at: string;
};

type InvariantRow = {
  id: string;
  user_id: string | null;
  check_name: string;
  severity: string;
  expected: number | null;
  actual: number | null;
  diff_pct: number | null;
  details: Record<string, unknown> | null;
  detected_at: string;
};

type CollusionRow = {
  id: string;
  signal_key: string;
  severity: string;
  user_ids: string[] | null;
  evidence: Record<string, unknown> | null;
  fingerprint: string | null;
  detected_at: string;
};

const sevColor = (s: string) =>
  s === "critical" ? "destructive" : s === "warn" ? "secondary" : "outline";

export default function AdminProtocolIntegrity() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [drifts, setDrifts] = useState<DriftRow[]>([]);
  const [invariants, setInvariants] = useState<InvariantRow[]>([]);
  const [collusion, setCollusion] = useState<CollusionRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [d, i, c] = await Promise.all([
      supabase
        .from("kpi_reconciliation_log")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(100),
      supabase
        .from("user_invariant_violations")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(100),
      supabase
        .from("collusion_signals")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(100),
    ]);
    if (d.error) toast.error(`KPI drift: ${d.error.message}`);
    if (i.error) toast.error(`Invariants: ${i.error.message}`);
    if (c.error) toast.error(`Collusion: ${c.error.message}`);
    setDrifts((d.data as DriftRow[]) ?? []);
    setInvariants((i.data as InvariantRow[]) ?? []);
    setCollusion((c.data as CollusionRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSweep = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-user-invariants", {
        body: {},
      });
      if (error) throw error;
      const summary = data as {
        kpi_drifts?: number;
        invariant_violations?: number;
        collusion_signals?: number;
        collusion_criticals?: number;
      };
      toast.success(
        `Sweep complete: ${summary.kpi_drifts ?? 0} KPI drifts · ${summary.invariant_violations ?? 0} invariants · ${summary.collusion_signals ?? 0} collusion`,
      );
      await load();
    } catch (e) {
      toast.error(`Sweep failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  const criticalCount =
    drifts.filter((d) => d.severity === "critical").length +
    invariants.filter((i) => i.severity === "critical").length +
    collusion.filter((c) => c.severity === "critical").length;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Protocol Integrity
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            KPI reconciliation drift · per-user invariants · anti-collusion graph signals.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={runSweep} disabled={running}>
            {running ? "Running…" : "Run sweep now"}
          </Button>
        </div>
      </div>

      {criticalCount > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm">
              <strong>{criticalCount}</strong> critical integrity event{criticalCount === 1 ? "" : "s"} in the latest window.
            </span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="drift">
        <TabsList>
          <TabsTrigger value="drift">
            <Activity className="h-4 w-4 mr-1" /> KPI Drift ({drifts.length})
          </TabsTrigger>
          <TabsTrigger value="invariants">
            <ShieldAlert className="h-4 w-4 mr-1" /> Invariants ({invariants.length})
          </TabsTrigger>
          <TabsTrigger value="collusion">
            <Users2 className="h-4 w-4 mr-1" /> Collusion ({collusion.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drift" className="space-y-2">
          {drifts.length === 0 ? (
            <EmptyState label="No drift events recorded." />
          ) : (
            drifts.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <span className="font-mono">{d.kpi_key}</span>
                    <Badge variant={sevColor(d.severity) as never}>{d.severity}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div>
                    headline <span className="font-mono text-foreground">{fmt(d.headline_value)}</span>{" "}
                    · computed <span className="font-mono text-foreground">{fmt(d.computed_value)}</span>{" "}
                    · diff <span className="font-mono text-foreground">{fmt(d.diff)}</span>{" "}
                    (<span className="font-mono">{fmt(d.diff_pct)}%</span>)
                  </div>
                  <div className="opacity-70">
                    user {d.user_id?.slice(0, 8) ?? "—"} · {format(new Date(d.detected_at), "MMM d, HH:mm")}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="invariants" className="space-y-2">
          {invariants.length === 0 ? (
            <EmptyState label="No invariant violations." />
          ) : (
            invariants.map((i) => (
              <Card key={i.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <span className="font-mono">{i.check_name}</span>
                    <Badge variant={sevColor(i.severity) as never}>{i.severity}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div>
                    expected <span className="font-mono text-foreground">{fmt(i.expected)}</span> ·
                    actual <span className="font-mono text-foreground">{fmt(i.actual)}</span> ·
                    diff <span className="font-mono text-foreground">{fmt(i.diff_pct)}%</span>
                  </div>
                  {i.details && (
                    <pre className="bg-muted/40 rounded p-2 overflow-x-auto text-[10px]">
                      {JSON.stringify(i.details, null, 2)}
                    </pre>
                  )}
                  <div className="opacity-70">
                    user {i.user_id?.slice(0, 8) ?? "—"} · {format(new Date(i.detected_at), "MMM d, HH:mm")}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="collusion" className="space-y-2">
          {collusion.length === 0 ? (
            <EmptyState label="No collusion signals detected." />
          ) : (
            collusion.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between gap-2">
                    <span className="font-mono">{c.signal_key}</span>
                    <Badge variant={sevColor(c.severity) as never}>{c.severity}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <div>
                    {c.user_ids?.length ?? 0} users involved · fp{" "}
                    <span className="font-mono text-foreground">{c.fingerprint?.slice(0, 32)}</span>
                  </div>
                  {c.evidence && (
                    <pre className="bg-muted/40 rounded p-2 overflow-x-auto text-[10px]">
                      {JSON.stringify(c.evidence, null, 2)}
                    </pre>
                  )}
                  <div className="opacity-70">
                    {format(new Date(c.detected_at), "MMM d, HH:mm")}
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

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v.toFixed(4).replace(/\.?0+$/, "");
}
