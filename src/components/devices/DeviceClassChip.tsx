import { Activity, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DEVICE CLASS CHIP — derived at render from the live authority rules, never
 * from a stored flag. A device's class is a consequence of what else is
 * connected to the account, so caching it would let it drift.
 *
 * Metered              — this device's readings are the ones counted.
 * Monitored, not metered — shown in the cockpit, not counted, because a more
 *                          precise meter for the same energy is connected.
 *
 * The copy deliberately says the other source is the MORE PRECISE meter. It
 * never implies a past miscount: nothing was overpaid, the account simply now
 * has a better instrument for that reading.
 */

export type DeviceClass = 'metered' | 'observer';

export function DeviceClassChip({
  deviceClass,
  label,
  className,
}: {
  deviceClass: DeviceClass;
  /** Optional per-capability label, e.g. "Battery metered". */
  label?: string;
  className?: string;
}) {
  const metered = deviceClass === 'metered';
  const Icon = metered ? Activity : Eye;
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider ring-1',
        metered
          ? 'bg-primary/10 text-primary ring-primary/25'
          : 'bg-muted/40 text-muted-foreground ring-border/60',
        className,
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {label ?? (metered ? 'Metered' : 'Monitored, not metered')}
    </span>
  );
}

/**
 * TRANSITION ANNOUNCEMENT — shown once when a device changes class, so the
 * change is stated rather than discovered.
 */
export function DeviceClassTransitionNote({
  deviceName,
  to,
  authoritativeName,
  onDismiss,
}: {
  deviceName: string;
  to: DeviceClass;
  authoritativeName?: string | null;
  onDismiss?: () => void;
}) {
  const body =
    to === 'observer'
      ? `${deviceName} is now monitored rather than metered. ${
          authoritativeName ?? 'A dedicated meter'
        } measures the same energy more precisely, so it is the source of record. ${deviceName} keeps reporting to your cockpit.`
      : `${deviceName} is now the metered source for its readings. Its measurements are counted from here on.`;

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 px-3 py-2.5">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        Device role changed
      </p>
      <p className="text-[11.5px] leading-relaxed text-foreground/85">{body}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Got it
        </button>
      )}
    </div>
  );
}
