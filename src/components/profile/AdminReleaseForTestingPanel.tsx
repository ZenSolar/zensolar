import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FlaskConical, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Device = {
  id: string;
  provider: string;
  device_id: string;
  device_type: string;
  device_name: string | null;
  paused_for_testing: boolean;
};

type Snapshot = {
  id: string;
  provider: string;
  device_id: string;
  device_name: string | null;
  released_at: string;
};

export function AdminReleaseForTestingPanel() {
  const { isAdmin, isChecking } = useAdminCheck();
  const [devices, setDevices] = useState<Device[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const [devRes, snapRes] = await Promise.all([
      supabase
        .from("connected_devices")
        .select("id, provider, device_id, device_type, device_name, paused_for_testing")
        .eq("user_id", user.id)
        .order("provider"),
      supabase
        .from("admin_device_snapshots")
        .select("id, provider, device_id, device_name, released_at")
        .eq("admin_user_id", user.id)
        .is("restored_at", null)
        .order("released_at", { ascending: false }),
    ]);
    setDevices((devRes.data as Device[]) ?? []);
    setSnapshots((snapRes.data as Snapshot[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);

  const call = async (mode: "snapshot_and_release" | "restore", provider: string, device_id: string) => {
    const key = `${mode}:${provider}:${device_id}`;
    setBusyKey(key);
    try {
      const { data, error } = await supabase.functions.invoke("admin-release-device", {
        body: { mode, provider, device_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        mode === "snapshot_and_release"
          ? "Device released — you can now claim it on a test account."
          : "Device restored with original baseline."
      );
      await load();
    } catch (e: any) {
      toast.error(`Failed: ${e?.message ?? "unknown error"}`);
    } finally {
      setBusyKey(null);
    }
  };

  if (isChecking || !isAdmin) return null;

  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <FlaskConical className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Release for Beta Testing (admin)</CardTitle>
            <CardDescription>
              Temporarily hand a device off so a burner beta account can walk the full claim flow. Restore
              puts your original baselines and lifetime totals back exactly.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {snapshots.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              {snapshots.length} device{snapshots.length > 1 ? "s" : ""} currently released for testing
            </div>
            {snapshots.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span>
                  <span className="uppercase text-xs text-muted-foreground mr-2">{s.provider}</span>
                  {s.device_name ?? s.device_id}
                  <span className="text-xs text-muted-foreground ml-2">
                    since {new Date(s.released_at).toLocaleString()}
                  </span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyKey === `restore:${s.provider}:${s.device_id}`}
                  onClick={() => call("restore", s.provider, s.device_id)}
                >
                  {busyKey === `restore:${s.provider}:${s.device_id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RotateCcw className="h-3 w-3 mr-1" />
                  )}
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading devices…</div>
        ) : devices.length === 0 ? (
          <div className="text-sm text-muted-foreground">No connected devices on this account.</div>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="uppercase text-[10px]">{d.provider}</Badge>
                    <span className="text-sm font-medium truncate">{d.device_name ?? d.device_id}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {d.device_type} · {d.device_id}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busyKey === `snapshot_and_release:${d.provider}:${d.device_id}`}
                  onClick={() => call("snapshot_and_release", d.provider, d.device_id)}
                >
                  {busyKey === `snapshot_and_release:${d.provider}:${d.device_id}` ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <FlaskConical className="h-3 w-3 mr-1" />
                  )}
                  Release for beta test
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
