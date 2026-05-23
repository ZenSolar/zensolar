import { Sun, Zap, Car, BatteryFull, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Pass E · #3 — verification source metadata.
 *
 * Maps internal provider keys to human-friendly labels, icons, and a
 * short verification rationale shown in the badge tooltip.
 */
export interface SourceMeta {
  key: string;
  label: string;
  icon: LucideIcon;
  /** What proof / cryptographic standard backs data from this source. */
  verification: string;
  /** Tailwind classes for the badge accent (text + ring + bg). */
  className: string;
}

const META: Record<string, SourceMeta> = {
  enphase: {
    key: "enphase",
    label: "Enphase",
    icon: Sun,
    verification: "OAuth-signed API · 15-min meter readings",
    className: "text-accent-warm bg-accent-warm/10 ring-accent-warm/30",
  },
  solaredge: {
    key: "solaredge",
    label: "SolarEdge",
    icon: Sun,
    verification: "OAuth-signed API · inverter telemetry",
    className: "text-accent-warm bg-accent-warm/10 ring-accent-warm/30",
  },
  tesla: {
    key: "tesla",
    label: "Tesla",
    icon: Car,
    verification: "Tesla Fleet API · cumulative odometer / battery counters",
    className: "text-primary bg-primary/10 ring-primary/30",
  },
  tesla_historical: {
    key: "tesla_historical",
    label: "Tesla Historical",
    icon: BatteryFull,
    verification: "Tesla Fleet API · daily aggregates",
    className: "text-primary bg-primary/10 ring-primary/30",
  },
  wallbox: {
    key: "wallbox",
    label: "Wallbox",
    icon: Zap,
    verification: "Wallbox API · session-level meter",
    className: "text-accent-cool bg-accent-cool/10 ring-accent-cool/30",
  },
};

export function getSourceMeta(provider: string): SourceMeta {
  return (
    META[provider] ?? {
      key: provider,
      label: provider.replace(/_/g, " "),
      icon: ShieldCheck,
      verification: "Verified data source",
      className: "text-muted-foreground bg-muted/40 ring-border",
    }
  );
}
