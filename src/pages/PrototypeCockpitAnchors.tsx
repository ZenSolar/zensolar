/**
 * /prototype/cockpit-anchors — geometry and flow-state sandbox.
 *
 * FIXTURE SURFACE. Every number on this page comes from
 * `src/data/investorDemo/energyFlow.ts`. No telemetry reaches it and none may
 * ever be added: a surface is either entirely live or unmistakably a
 * prototype, never a composite of the two.
 *
 *   ?anchors=1   overlay every named anchor as a labelled dot
 *   ?state=import   (default) 11 kW-class home charging, grid import dominant
 *   ?state=export   sunny midday, exporting, nothing charging
 */
import { EnergyFlowScene } from '@/components/dashboard/EnergyFlowScene';
import { INVESTOR_DEMO_FLOW, INVESTOR_DEMO_TESLA_PAYLOAD } from '@/data/investorDemo/energyFlow';
import { computeSiteBalance } from '@/lib/siteBalance';

const EXPORT_FLOW = {
  ...INVESTOR_DEMO_FLOW,
  solarPower: 6.8,
  homePower: 1.2,
  batteryPower: 0,
  gridPower: -5.6,
  evPower: 0,
  tesla: { ...INVESTOR_DEMO_FLOW.tesla!, kW: 0, isCharging: false },
};

const EXPORT_PAYLOAD = {
  ...INVESTOR_DEMO_TESLA_PAYLOAD,
  charging_state: 'Stopped',
  charge_rate_kw: 0,
  charger_power: 0,
};

export default function PrototypeCockpitAnchors() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const state = params.get('state') === 'export' ? 'export' : 'import';
  const data = state === 'export' ? EXPORT_FLOW : INVESTOR_DEMO_FLOW;
  const payload = state === 'export' ? EXPORT_PAYLOAD : INVESTOR_DEMO_TESLA_PAYLOAD;

  const balance = computeSiteBalance({
    solarKw: data.solarPower,
    gridKw: data.gridPower,
    batteryKw: data.batteryPower,
    homeKw: data.homePower,
    evKw: data.evPower ?? 0,
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto w-[393px]">
        <div className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
            Prototype · fixture data
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            No live telemetry on this surface. State: {state === 'import' ? 'grid import dominant' : 'exporting'}.
            Append ?anchors=1 for anchors, ?state=export to switch.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <EnergyFlowScene
            data={data}
            forceScene="day"
            teslaPayload={payload}
            hasBattery
            hasTesla
            hasCharger
          />
        </div>
        <div className="mt-3 rounded-lg border border-border bg-card px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          <div>sources {balance.sourcesKw.toFixed(1)} kW · loads {balance.loadsKw.toFixed(1)} kW</div>
          <div>residual {balance.residualKw.toFixed(2)} kW · tolerance ±{balance.toleranceKw.toFixed(2)} kW</div>
          <div className={balance.balanced ? 'text-emerald-400' : 'text-amber-300'}>
            width assertion: {balance.balanced ? 'PASS' : 'FAIL'} · inflow {balance.inflowWidth.toFixed(2)} vs outflow{' '}
            {balance.outflowWidth.toFixed(2)}
            {balance.clamped ? ' · clamped (widths not comparable)' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
