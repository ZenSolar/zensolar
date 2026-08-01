/**
 * /prototype/cockpit-anchors — anchor-verification sandbox.
 *
 * Renders the live EnergyFlowScene at a fixed 393px mobile width with
 * deterministic demo telemetry so the `?anchors=1` debug overlay can be
 * screenshotted and each anchor checked against the baked house art.
 * No auth, no network: purely a geometry rig.
 */
import { EnergyFlowScene } from '@/components/dashboard/EnergyFlowScene';
import { INVESTOR_DEMO_FLOW, INVESTOR_DEMO_TESLA_PAYLOAD } from '@/data/investorDemo/energyFlow';

export default function PrototypeCockpitAnchors() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto w-[393px]">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Anchor rig · append ?anchors=1
        </p>
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <EnergyFlowScene
            data={INVESTOR_DEMO_FLOW}
            forceScene="day"
            teslaPayload={INVESTOR_DEMO_TESLA_PAYLOAD}
            hasBattery
            hasTesla
            hasCharger
          />
        </div>
      </div>
    </div>
  );
}
