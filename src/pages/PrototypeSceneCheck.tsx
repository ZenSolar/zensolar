/**
 * PrototypeSceneCheck — visual harness for the ZenEnergy consolidated scene.
 *
 * Default: the exact live reading captured from ZenAiredale while ZenX was
 * charging (solar 0, home 0.347 kW measured, grid 11.347 kW import reconciled,
 * EV 11 kW at the wall connector).
 *
 * `?row=14` renders the worst case from the flow matrix — all six spokes
 * active at once (solar source, grid source, battery source, home sink,
 * EV1 sink, EV2 sink) — used for the framing/legibility check.
 *
 * Not linked from the app. Route: /prototype/scene-check
 */
import { EnergyFlowScene } from '@/components/dashboard/EnergyFlowScene';
import secondCar from '@/assets/zencasa/vehicles/model-3-deep-blue.png';

export default function PrototypeSceneCheck() {
  const row =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('row')
      : null;

  const isRow14 = row === '14';

  const data = isRow14
    ? {
        // Row 14 — every spoke live. Solar + grid + battery all sourcing,
        // home + two EVs all sinking.
        solarPower: 6.2,
        homePower: 2.4,
        gridPower: 7.8,
        batteryPower: -4.1,
        batteryPercent: 74,
        evPower: 18.4,
        tesla: { isCharging: true, kW: 11, soc: 62, rangeMi: 210, source: 'home' as const },
      }
    : {
        solarPower: 0,
        homePower: 0.347,
        gridPower: 11.347,
        batteryPower: 0,
        batteryPercent: 0,
        evPower: 11,
        tesla: { isCharging: true, kW: 11, soc: 62, rangeMi: 210, source: 'home' as const },
      };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md rounded-2xl border border-border/40 bg-card p-3">
        <EnergyFlowScene
          data={data as never}
          forceScene="day"
          vehicleModel="modelx"
          vehicleColor="pearl-white"
          presenceProven
          hasBattery={isRow14}
          hasCharger
          hasTesla
          secondVehicle={
            isRow14
              ? { src: secondCar, name: 'TesYto', kw: 7.4, soc: 48, charging: true }
              : null
          }
          gridSource="reconciled"
          homeDerived
        />
      </div>
    </div>
  );
}
