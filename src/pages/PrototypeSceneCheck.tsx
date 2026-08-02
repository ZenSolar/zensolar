/**
 * PrototypeSceneCheck — visual harness for the ZenEnergy consolidated scene.
 *
 * Renders <EnergyFlowScene /> with the exact live reading captured from
 * ZenAiredale while ZenX was charging (solar 0, home 0.347 kW measured,
 * grid 11.347 kW import reconciled, EV 11 kW at the wall connector), so the
 * driveway seating and the EV conductor route can be screenshot-verified
 * without a signed-in session.
 *
 * Not linked from the app. Route: /prototype/scene-check
 */
import { EnergyFlowScene } from '@/components/dashboard/EnergyFlowScene';

export default function PrototypeSceneCheck() {
  const data = {
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
          vehicleColor="white"
          presenceProven
          hasBattery={false}
          hasCharger
          hasTesla
          gridSource="reconciled"
          homeDerived
        />
      </div>
    </div>
  );
}
