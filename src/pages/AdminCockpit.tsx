/**
 * /admin/cockpit — sandbox for the new UnifiedEnergyCockpit (2.5D Pentagon
 * multi-OEM flow card). Compare it against the legacy AnimatedEnergyFlow
 * before we swap it into LiveEnergyMonitoringCard.
 */
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnifiedEnergyCockpit } from '@/components/dashboard/UnifiedEnergyCockpit';
import {
  INVESTOR_DEMO_FLOW,
  INVESTOR_DEMO_OUTAGE_FLOW,
} from '@/data/investorDemo/energyFlow';
import type { EnergyFlowData } from '@/components/dashboard/AnimatedEnergyFlow';

const PARKED_FLOW: EnergyFlowData = {
  ...INVESTOR_DEMO_FLOW,
  evPower: 0,
  tesla: { ...INVESTOR_DEMO_FLOW.tesla!, isCharging: false, kW: 0 },
};

const V2H_FLOW: EnergyFlowData = {
  ...INVESTOR_DEMO_FLOW,
  evPower: -3.2,
  batteryPower: 0,
  homePower: 3.2,
  solarPower: 0,
  gridPower: 0,
  tesla: { ...INVESTOR_DEMO_FLOW.tesla!, isCharging: false, kW: 0 },
};

const EXPORT_FLOW: EnergyFlowData = {
  ...INVESTOR_DEMO_FLOW,
  solarPower: 8.2,
  homePower: 1.4,
  batteryPower: 0,
  evPower: 0,
  gridPower: -6.8,
  tesla: { ...INVESTOR_DEMO_FLOW.tesla!, isCharging: false, kW: 0 },
};

export default function AdminCockpit() {
  const [flow, setFlow] = useState<EnergyFlowData>(INVESTOR_DEMO_FLOW);

  const update = (patch: Partial<EnergyFlowData>) =>
    setFlow((prev) => ({ ...prev, ...patch }));

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="secondary">Prototype</Badge>
              <Badge>v2 · 2.5D Pentagon</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Unified Energy Cockpit</h1>
            <p className="text-sm text-muted-foreground">
              Multi-OEM single-card scene · drop-in for LiveEnergyMonitoringCard
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[393px_1fr]">
          {/* Mobile-sized preview */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <UnifiedEnergyCockpit data={flow} />
          </div>

          {/* Controls */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Scenarios
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button variant="outline" size="sm" onClick={() => setFlow(INVESTOR_DEMO_FLOW)}>
                Sunny + Charging
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFlow(PARKED_FLOW)}>
                Parked
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFlow(V2H_FLOW)}>
                V2H Discharge
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFlow(EXPORT_FLOW)}>
                Exporting
              </Button>
              <Button variant="outline" size="sm" onClick={() => setFlow(INVESTOR_DEMO_OUTAGE_FLOW)}>
                Grid Outage
              </Button>
            </div>

            <h2 className="pt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Manual
            </h2>
            <Row label="Solar" value={flow.solarPower} min={0} max={12} step={0.1}
              onChange={(v) => update({ solarPower: v })} unit="kW" />
            <Row label="Home" value={flow.homePower} min={0} max={12} step={0.1}
              onChange={(v) => update({ homePower: v })} unit="kW" />
            <Row label="Battery (+ charge / − discharge)" value={flow.batteryPower} min={-5} max={5} step={0.1}
              onChange={(v) => update({ batteryPower: v })} unit="kW" />
            <Row label="Battery SOC" value={flow.batteryPercent} min={0} max={100} step={1}
              onChange={(v) => update({ batteryPercent: v })} unit="%" isInt />
            <Row label="Grid (+ import / − export)" value={flow.gridPower} min={-10} max={10} step={0.1}
              onChange={(v) => update({ gridPower: v })} unit="kW" />
            <Row label="EV (+ charge / − V2H)" value={flow.evPower} min={-10} max={12} step={0.1}
              onChange={(v) => update({ evPower: v })} unit="kW" />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <h3 className="mb-2 font-semibold text-foreground">Notes</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>Pure SVG + CSS. No Three.js. Mobile-first 393px.</li>
            <li>EV node is always visible with status (Charging / Discharging / Parked).</li>
            <li>OEM chips in header surface the multi-OEM moat at a glance.</li>
            <li>Particle speed scales with kW magnitude; idle lines render faintly.</li>
            <li>Consumes the same <code>EnergyFlowData</code> shape as <code>AnimatedEnergyFlow</code> — drop-in swap.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({
  label, value, min, max, step, onChange, unit, isInt,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; unit: string; isInt?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold text-foreground">
          {isInt ? Math.round(value) : value.toFixed(2)} {unit}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step}
        onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
