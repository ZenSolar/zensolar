/**
 * Renders one ZenDriveLiveCard per connected Tesla / EV so multi-car households
 * see per-vehicle SOC, range, charging state, and Home/Supercharger kWh totals.
 * Falls back to the single-card empty state when no vehicle is linked.
 */
import { useEVChargerTelemetry } from '@/hooks/useDeviceTelemetry';
import { ZenDriveLiveCard } from './ZenDriveLiveCard';

export function ZenDriveMultiCard() {
  const ev = useEVChargerTelemetry();
  const count = ev.data.length;
  if (count === 0) {
    return (
      <div className="mt-4">
        <ZenDriveLiveCard />
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-4">
      {ev.data.map((v, i) => (
        <ZenDriveLiveCard key={v.site_id ?? i} deviceIndex={i} />
      ))}
    </div>
  );
}
