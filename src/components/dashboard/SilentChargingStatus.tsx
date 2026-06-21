/**
 * SilentChargingStatus — Phase 3 thin status line.
 *
 * Renders a single muted line when a home / wallbox session is active. No
 * card, no toast, no takeover. The whole point is the user notices nothing,
 * just glances and sees "still accruing". Mounted inline in the dashboard.
 */
import { useActiveChargingSessionV2 } from '@/hooks/useActiveChargingSessionV2';

export function SilentChargingStatus() {
  const { data: session } = useActiveChargingSessionV2();
  if (!session) return null;
  if (session.source !== 'home' && session.source !== 'wallbox') return null;

  // Always say "AC charging" — covers home + away L2 (friend's house, hotel,
  // unpaired Tesla Wall Connector). Per "Home & AC Charging" rename.
  const label = 'AC charging';
  return (
    <div
      role="status"
      aria-live="off"
      className="flex items-center gap-2 px-1 py-1 text-[11px] text-muted-foreground/80"
    >
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary/70" />
      <span>
        {label} • accruing silently
        <span className="ml-1.5 tabular-nums text-muted-foreground/60">
          +{session.kwh_so_far.toFixed(1)} kWh
        </span>
      </span>
    </div>
  );
}
