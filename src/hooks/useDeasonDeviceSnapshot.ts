import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DeasonDeviceSnapshot {
  provider: string;
  device_type: string;
  device_name: string | null;
  produced_today_kwh?: number;
  consumed_today_kwh?: number;
  soc_pct?: number;
  charged_today_kwh?: number;
}

const startOfTodayISO = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

/**
 * Lightweight, read-only "today snapshot" per connected OEM, for Deason's
 * chat context strip. Aggregates today's bidirectional_mint_events and
 * charging_sessions. Silent on errors / no devices.
 */
export function useDeasonDeviceSnapshot(enabled = true) {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<DeasonDeviceSnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !enabled) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const sinceISO = startOfTodayISO();
        const [devicesRes, mintRes, chargeRes] = await Promise.all([
          supabase
            .from("connected_devices")
            .select("provider, device_type, device_name, device_metadata")
            .eq("user_id", user.id)
            .limit(20),
          supabase
            .from("bidirectional_mint_events")
            .select("provider, direction, energy_kwh, recorded_at")
            .eq("user_id", user.id)
            .gte("recorded_at", sinceISO),
          supabase
            .from("charging_sessions")
            .select("provider, energy_kwh, session_date")
            .eq("user_id", user.id)
            .gte("session_date", sinceISO.slice(0, 10)),
        ]);

        if (cancelled) return;

        const byKey = new Map<string, DeasonDeviceSnapshot>();
        const devices = (devicesRes.data ?? []) as Array<{
          provider: string;
          device_type: string;
          device_name: string | null;
          device_metadata: Record<string, unknown> | null;
        }>;
        devices.forEach((d) => {
          const key = `${d.provider}:${d.device_type}`;
          if (!byKey.has(key)) {
            byKey.set(key, {
              provider: d.provider,
              device_type: d.device_type,
              device_name: d.device_name,
            });
          }
          const md = (d.device_metadata ?? {}) as Record<string, unknown>;
          const soc =
            typeof md.soc_pct === "number"
              ? md.soc_pct
              : typeof md.battery_soc === "number"
                ? (md.battery_soc as number)
                : undefined;
          if (typeof soc === "number") {
            byKey.get(key)!.soc_pct = Math.round(soc);
          }
        });

        const mintRows = (mintRes.data ?? []) as Array<{
          provider: string;
          direction: string;
          energy_kwh: number;
        }>;
        mintRows.forEach((r) => {
          const isExport = r.direction === "export" || r.direction === "produced";
          const key = `${r.provider}:${isExport ? "solar" : "battery"}`;
          const snap =
            byKey.get(key) ?? {
              provider: r.provider,
              device_type: isExport ? "solar" : "battery",
              device_name: null,
            };
          if (isExport) {
            snap.produced_today_kwh = (snap.produced_today_kwh ?? 0) + (r.energy_kwh ?? 0);
          } else {
            snap.consumed_today_kwh = (snap.consumed_today_kwh ?? 0) + (r.energy_kwh ?? 0);
          }
          byKey.set(key, snap);
        });

        const chargeRows = (chargeRes.data ?? []) as Array<{ provider: string; energy_kwh: number }>;
        chargeRows.forEach((r) => {
          const key = `${r.provider}:charger`;
          const snap =
            byKey.get(key) ?? {
              provider: r.provider,
              device_type: "charger",
              device_name: null,
            };
          snap.charged_today_kwh = (snap.charged_today_kwh ?? 0) + (r.energy_kwh ?? 0);
          byKey.set(key, snap);
        });

        setSnapshots(Array.from(byKey.values()));
      } catch {
        if (!cancelled) setSnapshots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, enabled]);

  return { snapshots, loading };
}
