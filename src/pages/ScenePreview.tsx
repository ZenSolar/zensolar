/**
 * Temporary QA preview for the v4 EnergyFlowScene rebuild.
 * Mounts the scene with mock telemetry so we can verify halo alignment
 * and dynamic-car placement without live Tesla data.
 *
 * Routes (toggle via ?state=...&scene=...):
 *   - default: day, all systems active
 *   - state=charging, state=exporting, state=idle, state=discharging
 *   - scene=day, scene=night, scene=night-ev, scene=rain (force)
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EnergyFlowScene, type SceneKey } from '@/components/dashboard/EnergyFlowScene';
import type { EnergyFlowData } from '@/components/dashboard/AnimatedEnergyFlow';

const PRESETS: Record<string, EnergyFlowData> = {
  default: {
    solarPower: 4.2,
    homePower: 2.1,
    batteryPower: 1.6,
    gridPower: -0.5,
    batteryPercent: 72,
    evPower: 0,
    tesla: { isCharging: false } as any,
    charging_state: 'Disconnected',
  },
  charging: {
    solarPower: 5.5,
    homePower: 2.8,
    batteryPower: 0.4,
    gridPower: 0.3,
    batteryPercent: 95,
    evPower: 7.2,
    tesla: { isCharging: true } as any,
    charging_state: 'Charging',
  },
  exporting: {
    solarPower: 7.8,
    homePower: 1.4,
    batteryPower: 2.0,
    gridPower: -4.4,
    batteryPercent: 88,
    evPower: 0,
    tesla: { isCharging: false } as any,
    charging_state: 'Disconnected',
  },
  idle: {
    solarPower: 0,
    homePower: 0.6,
    batteryPower: -0.4,
    gridPower: 0,
    batteryPercent: 64,
    evPower: 0,
    tesla: undefined,
    charging_state: undefined,
  },
  discharging: {
    solarPower: 0,
    homePower: 3.1,
    batteryPower: -2.8,
    gridPower: 0.2,
    batteryPercent: 41,
    evPower: 0,
    tesla: { isCharging: false } as any,
    charging_state: 'Disconnected',
  },
  plugged: {
    solarPower: 4.2,
    homePower: 2.1,
    batteryPower: 1.6,
    gridPower: -0.5,
    batteryPercent: 100,
    evPower: 0,
    tesla: { isCharging: false } as any,
    charging_state: 'Complete',
  },
};

export default function ScenePreview() {
  const [params] = useSearchParams();
  const state = params.get('state') ?? 'default';
  const scene = (params.get('scene') ?? undefined) as SceneKey | undefined;
  const data = useMemo(() => PRESETS[state] ?? PRESETS.default, [state]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Scene Preview · state={state}{scene ? ` · scene=${scene}` : ''}
        </h1>
        <div className="overflow-hidden rounded-xl border border-primary/20 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%)]">
          <EnergyFlowScene
            className="aspect-square w-full"
            data={data}
            forceScene={scene}
            vehicleModel="modelx"
            vehicleColor="solid-black"
            teslaPayload={{ display_name: 'ZenX' }}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {Object.keys(PRESETS).map((k) => (
            <a key={k} href={`?state=${k}${scene ? `&scene=${scene}` : ''}`} className="rounded border border-primary/30 px-2 py-1 text-foreground/80">
              {k}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {(['day', 'night', 'night-ev', 'rain'] as const).map((s) => (
            <a key={s} href={`?state=${state}&scene=${s}`} className="rounded border border-primary/30 px-2 py-1 text-foreground/80">
              {s}
            </a>
          ))}
          <a href={`?state=${state}`} className="rounded border border-primary/30 px-2 py-1 text-foreground/80">auto</a>
        </div>
      </div>
    </div>
  );
}
