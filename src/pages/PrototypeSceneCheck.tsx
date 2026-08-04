/**
 * PrototypeSceneCheck — visual harness for the ZenEnergy consolidated scene.
 *
 * Default: the exact live reading captured from ZenAiredale while ZenX was
 * charging (solar 0, home 0.347 kW measured, grid 11.347 kW import reconciled,
 * EV 11 kW at the wall connector).
 *
 * `?state=parked` → vehicle present at the driveway anchor, not charging.
 * `?state=away`   → no presence evidence; the driveway sits empty.
 *
 * Not linked from the app. Route: /prototype/scene-check
 */
import { EnergyFlowScene } from '@/components/dashboard/EnergyFlowScene';

export default function PrototypeSceneCheck() {
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();

  const state = params.get('state') ?? 'charging';
  const charging = state === 'charging';

  // Deterministic all-path verification frame: every physical run is visible
  // in one crop while the vehicle is actively charging at home.
  const data = {
    solarPower: 4.8,
    homePower: 2.4,
    gridPower: charging ? 7.1 : -1.2,
    batteryPower: 1.3,
    batteryPercent: 64,
    evPower: charging ? 11 : 0,
    tesla: {
      isCharging: charging,
      kW: charging ? 11 : 0,
      soc: 62,
      rangeMi: 210,
      source: 'home' as const,
    },
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md rounded-2xl border border-border/40 bg-card p-3">
        <EnergyFlowScene
          data={data as never}
          forceScene="day"
          vehicleModel="modelx"
          vehicleColor="pearl-white"
          presenceProven={state !== 'away'}
          hasBattery
          hasCharger
          hasTesla
          gridSource="reconciled"
          homeDerived
        />
      </div>
    </div>
  );
}
