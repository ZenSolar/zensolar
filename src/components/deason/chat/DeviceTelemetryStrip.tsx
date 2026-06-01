import { Sun, BatteryCharging, Plug } from "lucide-react";
import { useDeasonDeviceSnapshot } from "@/hooks/useDeasonDeviceSnapshot";

const PROVIDER_LABEL: Record<string, string> = {
  tesla: "Tesla",
  enphase: "Enphase",
  solaredge: "SolarEdge",
  wallbox: "Wallbox",
  sunpower: "SunPower",
  generac: "Generac",
};

const label = (p: string) => PROVIDER_LABEL[p.toLowerCase()] ?? p;

/**
 * Today-snapshot strip rendered at the top of the chat. Shows one chip per
 * connected OEM (Solar / Battery / Charger) with today's most useful number.
 * Silent when the user has no telemetry yet — never blocks the chat.
 */
export function DeviceTelemetryStrip({ enabled = true }: { enabled?: boolean }) {
  const { snapshots } = useDeasonDeviceSnapshot(enabled);
  if (!snapshots.length) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {snapshots.map((s, i) => {
        let icon = <Sun className="h-3 w-3" />;
        let body = "";
        if (s.device_type === "solar") {
          body = `${label(s.provider)} · ${(s.produced_today_kwh ?? 0).toFixed(1)} kWh today`;
        } else if (s.device_type === "battery") {
          icon = <BatteryCharging className="h-3 w-3" />;
          const soc = typeof s.soc_pct === "number" ? ` · ${s.soc_pct}% SOC` : "";
          body = `${label(s.provider)}${soc}`;
        } else if (s.device_type === "charger") {
          icon = <Plug className="h-3 w-3" />;
          body = `${label(s.provider)} · ${(s.charged_today_kwh ?? 0).toFixed(1)} kWh charged`;
        } else {
          body = `${label(s.provider)} · ${s.device_type}`;
        }
        return (
          <span
            key={`${s.provider}-${s.device_type}-${i}`}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground"
          >
            <span className="text-amber-500">{icon}</span>
            {body}
          </span>
        );
      })}
    </div>
  );
}
