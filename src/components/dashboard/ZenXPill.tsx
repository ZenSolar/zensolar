/**
 * Thin "ZenX" status pill that sits under the energy scene.
 *
 * Reads clean like the Tesla app:
 *   🚗 ZenX • 38% • 123 mi • Parked
 *   🚗 ZenX • Charging at 11.2 kW • 38%
 *
 * Tappable — scrolls to the detailed EVTile below.
 */
import { Car } from 'lucide-react';
import type { TeslaFlow } from './LiveEnergyMonitoringCard';

export interface ZenXPillProps {
  tesla: TeslaFlow | null;
  /** Optional vehicle nickname (defaults to "ZenX"). */
  nickname?: string;
  onClick?: () => void;
}

export function ZenXPill({ tesla, nickname = 'ZenX', onClick }: ZenXPillProps) {
  if (!tesla) return null;

  const soc = Math.round(tesla.soc);
  const miles = Math.round(tesla.rangeMi);
  const stateRaw = (tesla.rawChargingState ?? '').toLowerCase();

  let middle: string;
  let dotClass: string;
  let pulse = false;

  if (tesla.isCharging) {
    middle = `Charging at ${tesla.kW.toFixed(1)} kW`;
    dotClass = 'bg-emerald-400 shadow-[0_0_8px_hsla(142,76%,50%,0.7)]';
    pulse = true;
  } else if (['stopped', 'complete', 'nopower', 'starting'].includes(stateRaw)) {
    middle = 'Plugged · Idle';
    dotClass = 'bg-amber-400 shadow-[0_0_6px_hsla(38,92%,55%,0.6)]';
  } else {
    middle = stateRaw ? stateRaw.charAt(0).toUpperCase() + stateRaw.slice(1) : 'Parked';
    dotClass = 'bg-muted-foreground/60';
  }

  const trailing = tesla.isCharging
    ? `${soc}%`
    : `${soc}% · ${miles} mi`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${nickname}, ${middle}, ${trailing}. Activate to view vehicle details.`}
      className="group inline-flex min-h-10 w-full items-center gap-2.5 rounded-full border border-primary/20 bg-background/40 px-3.5 py-2 text-[12px] font-medium tracking-wide text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span aria-hidden="true" className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`}>
        {pulse && (
          <span className={`absolute inset-0 inline-flex h-full w-full animate-ping rounded-full ${dotClass} opacity-70`} />
        )}
      </span>
      <Car className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      <span className="font-semibold">{nickname}</span>
      <span aria-hidden="true" className="text-muted-foreground/50">•</span>
      <span className="truncate text-muted-foreground">{middle}</span>
      <span aria-hidden="true" className="ml-auto text-muted-foreground/50">•</span>
      <span className="tabular-nums text-foreground">{trailing}</span>
    </button>
  );
}
