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
  const solarState = state === 'solar';
  /** Grid IMPORT at night, battery idle — checks the orange import sweep. */
  const importState = state === 'import';
  /** Battery discharging into the house — checks the dual home line. */
  const dischargeState = state === 'discharge';

  const data = {
    solarPower: solarState ? 6.4 : dischargeState ? 1.2 : 0,
    homePower: dischargeState ? 4.1 : 0.347,
    gridPower: solarState ? -3.65 : importState ? 4.8 : charging ? 11.347 : 0.347,
    batteryPower: solarState ? 2.4 : dischargeState ? -3.2 : 0,
    batteryPercent: solarState ? 58 : dischargeState ? 41 : 0,
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
          hasBattery={solarState}
          hasCharger
          hasTesla
          gridSource="reconciled"
          homeDerived
        />
      </div>
    </div>
  );
}
