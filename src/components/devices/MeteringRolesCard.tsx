import { Card, CardContent } from '@/components/ui/card';
import { DeviceClassChip } from '@/components/devices/DeviceClassChip';
import { useDeviceClasses } from '@/hooks/useDeviceClasses';

/**
 * METERING ROLES — the member-facing home for the device class chip.
 *
 * Every connected device is listed with the role it currently holds, so
 * "shown, not counted" is a stated fact on a permanent surface rather than
 * something a member has to infer from a number that looks low.
 *
 * The role is derived at render from the live authority rules (see
 * `lib/deviceAuthority.ts`), never read from a stored flag: a device's role is
 * a consequence of what else is connected, so it changes when the account
 * changes.
 */

const TYPE_LABEL: Record<string, string> = {
  solar: 'Solar',
  solar_system: 'Solar',
  pv: 'Solar',
  powerwall: 'Home battery',
  battery: 'Home battery',
  vehicle: 'Vehicle',
  wall_connector: 'Wall connector',
  home_charger: 'Home charger',
  ev_charger: 'Charger',
};

export function MeteringRolesCard() {
  const { loading, devices, classes } = useDeviceClasses();

  if (loading || devices.length === 0) return null;

  const anyObserver = devices.some((d) => classes[d.device_id]?.deviceClass === 'observer');

  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Metering roles</h2>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
            Every connected device reports to your cockpit. One device is the source of record for
            each reading, so the same energy is never counted twice.
          </p>
        </div>

        <ul className="divide-y divide-border/50">
          {devices.map((d) => {
            const c = classes[d.device_id] ?? { deviceClass: 'metered' as const };
            return (
              <li key={d.device_id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {d.device_name || TYPE_LABEL[d.device_type] || d.device_type}
                  </p>
                  <p className="mt-0.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                    {TYPE_LABEL[d.device_type] ?? d.device_type} · {d.provider}
                  </p>
                  {c.deviceClass === 'observer' && c.reason && (
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                      {c.reason}
                      {c.authoritativeName ? ` Source of record: ${c.authoritativeName}.` : ''}
                    </p>
                  )}
                </div>
                <DeviceClassChip deviceClass={c.deviceClass} className="mt-0.5 shrink-0" />
              </li>
            );
          })}
        </ul>

        {anyObserver && (
          <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            A monitored device is not earning less than it should. Its readings overlap a more
            precise meter on the same energy, and that meter is the one counted.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
