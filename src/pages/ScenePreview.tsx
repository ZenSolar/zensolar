/**
 * Temporary QA preview for the v4 EnergyFlowScene rebuild.
 * Mounts the scene with mock telemetry so we can verify halo alignment,
 * conditional car rendering, and dynamic-car placement without live data.
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EnergyFlowScene, type SceneKey } from '@/components/dashboard/EnergyFlowScene';
import type { EnergyFlowData } from '@/components/dashboard/AnimatedEnergyFlow';

type Preset = { data: EnergyFlowData; chargingState?: string };

const PRESETS: Record<string, Preset> = {
  default: {
    data: { solarPower: 4.2, homePower: 2.1, batteryPower: 1.6, gridPower: -0.5, batteryPercent: 72, evPower: 0, tesla: { isCharging: false } as any },
    chargingState: 'Disconnected',
  },
  charging: {
    data: { solarPower: 5.5, homePower: 2.8, batteryPower: 0.4, gridPower: 0.3, batteryPercent: 95, evPower: 7.2, tesla: { isCharging: true } as any },
    chargingState: 'Charging',
  },
  exporting: {
    data: { solarPower: 7.8, homePower: 1.4, batteryPower: 2.0, gridPower: -4.4, batteryPercent: 88, evPower: 0, tesla: { isCharging: false } as any },
    chargingState: 'Disconnected',
  },
  idle: {
    data: { solarPower: 0, homePower: 0.6, batteryPower: -0.4, gridPower: 0, batteryPercent: 64, evPower: 0, tesla: undefined },
    chargingState: undefined,
  },
  discharging: {
    data: { solarPower: 0, homePower: 3.1, batteryPower: -2.8, gridPower: 0.2, batteryPercent: 41, evPower: 0, tesla: { isCharging: false } as any },
    chargingState: 'Disconnected',
  },
  plugged: {
    data: { solarPower: 4.2, homePower: 2.1, batteryPower: 1.6, gridPower: -0.5, batteryPercent: 100, evPower: 0, tesla: { isCharging: false } as any },
    chargingState: 'Complete',
  },
};

export default function ScenePreview() {
  const [params] = useSearchParams();
  const state = params.get('state') ?? 'default';
  const scene = (params.get('scene') ?? undefined) as SceneKey | undefined;
  const preset = useMemo(() => PRESETS[state] ?? PRESETS.default, [state]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md space-y-3">
        <h1 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Scene Preview · state={state}{scene ? ` · scene=${scene}` : ''} · car={preset.chargingState ?? 'none'}
        </h1>
        <div className="overflow-hidden rounded-xl border border-primary/20 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_70%)]">
          <EnergyFlowScene
            className="aspect-square w-full"
            data={preset.data}
            forceScene={scene}
            vehicleModel="modelx"
            vehicleColor="solid-black"
            teslaPayload={{ display_name: 'ZenX', charging_state: preset.chargingState }}
          />
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {Object.keys(PRESETS).map((k) => (
            <a key={k} href={`?state=${k}${scene ? `&scene=${scene}` : ''}${params.get('debug') ? '&debug=1' : ''}`} className="rounded border border-primary/30 px-2 py-1 text-foreground/80">
              {k}
            </a>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {(['day', 'night', 'night-ev', 'rain'] as const).map((s) => (
            <a key={s} href={`?state=${state}&scene=${s}${params.get('debug') ? '&debug=1' : ''}`} className="rounded border border-primary/30 px-2 py-1 text-foreground/80">
              {s}
            </a>
          ))}
          <a href={`?state=${state}${params.get('debug') ? '&debug=1' : ''}`} className="rounded border border-primary/30 px-2 py-1 text-foreground/80">auto</a>
        </div>
      </div>
    </div>
  );
}
