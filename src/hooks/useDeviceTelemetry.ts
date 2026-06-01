import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DeviceSnapshot {
  provider: string;            // tesla, enphase, solaredge, wallbox, …
  device_type: string;         // solar, battery, charger, …
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
 * Light-weight, read-only device telemetry snapshot for chat context.
 * Aggregates today's `bidirectional_mint_events` (solar/battery) and
 * `charging_sessions` (EV/charger) per provider. Falls back silently when
 * the user has no connected devices or no rows yet.
 */
export function useDeviceTelemetry(enabled = true) {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<DeviceSnapshot[]>([]);
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
            .select("provider, direction, energy_kwh, recorded_at, proof_metadata")
            .eq("user_id", user.id)
            .gte("recorded_at", sinceISO),
          supabase
            .from("charging_sessions")
            .select("provider, energy_kwh, session_date")
            .eq("user_id", user.id)
            .gte("session_date", sinceISO.slice(0, 10)),
        ]);

        if (cancelled) return;

        const byProvider = new Map<string, DeviceSnapshot>();
        const devices = (devicesRes.data ?? []) as Array<{
          provider: string;
          device_type: string;
          device_name: string | null;
          device_metadata: Record<string, unknown> | null;
        }>;
        devices.forEach((d) => {
          const key = `${d.provider}:${d.device_type}`;
          if (!byProvider.has(key)) {
            byProvider.set(key, {
              provider: d.provider,
              device_type: d.device_type,
              device_name: d.device_name,
            });
          }
          const md = (d.device_metadata ?? {}) as Record<string, unknown>;
          const soc = typeof md.soc_pct === "number" ? md.soc_pct : (typeof md.battery_soc === "number" ? md.battery_soc : undefined);
          if (typeof soc === "number") {
            const snap = byProvider.get(key)!;
            snap.soc_pct = Math.round(soc);
          }
        });

        // Solar production / battery flow from mint events
        const mintRows = (mintRes.data ?? []) as Array<{ provider: string; direction: string; energy_kwh: number }>;
        mintRows.forEach((r) => {
          const isExport = r.direction === "export" || r.direction === "produced";
          const key = `${r.provider}:${isExport ? "solar" : "battery"}`;
          const snap = byProvider.get(key) ?? {
            provider: r.provider,
            device_type: isExport ? "solar" : "battery",
            device_name: null,
          };
          if (isExport) {
            snap.produced_today_kwh = (snap.produced_today_kwh ?? 0) + (r.energy_kwh ?? 0);
          } else {
            snap.consumed_today_kwh = (snap.consumed_today_kwh ?? 0) + (r.energy_kwh ?? 0);
          }
          byProvider.set(key, snap);
        });

        // Charger sessions today
        const chargeRows = (chargeRes.data ?? []) as Array<{ provider: string; energy_kwh: number }>;
        chargeRows.forEach((r) => {
          const key = `${r.provider}:charger`;
          const snap = byProvider.get(key) ?? {
            provider: r.provider,
            device_type: "charger",
            device_name: null,
          };
          snap.charged_today_kwh = (snap.charged_today_kwh ?? 0) + (r.energy_kwh ?? 0);
          byProvider.set(key, snap);
        });

        setSnapshots(Array.from(byProvider.values()));
      } catch {
        if (!cancelled) setSnapshots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, enabled]);

  return { snapshots, loading };
}
