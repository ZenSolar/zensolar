/**
 * EvChargingCable — dedicated charging cable layer for the Live Energy
 * Monitoring scene. Renders inside the same 0–100 viewBox as the rest of
 * the scene overlay so anchors stay locked to the baked house geometry.
 *
 * States:
 *   · `idle`     — plugged in but not drawing; muted grey cable, no glow
 *   · `charging` — actively charging at home; emerald glow + traveling LED
 *
 * Never rendered when the car is supercharging away from home — that is
 * gated at the call site (EnergyFlowScene) before mounting this component.
 */
import { HOME_BLUEPRINT } from './HomeBlueprint';

const EMERALD_LED = 'hsl(142 90% 78%)';

export interface EvChargingCableProps {
  state: 'idle' | 'charging';
  /** Car anchor in 0–100 viewBox space — passed in so the cable tracks
   *  whichever spot the dynamic Tesla is occupying this frame. */
  carAnchor: { x: number; y: number };
  carWidth: number;
  carHeight: number;
  reducedMotion?: boolean;
}

export function EvChargingCable({
  state,
  carAnchor,
  carWidth,
  carHeight,
  reducedMotion,
}: EvChargingCableProps) {
  const wc = HOME_BLUEPRINT.wallCharger;
  // Charge port lives just above-right of the car center, scaled to its size.
  const port = {
    x: carAnchor.x + carWidth * 0.30,
    y: carAnchor.y - carHeight * 0.05,
  };
  // Single cubic bezier — drops out of the wall connector, sags slightly,
  // arcs back up into the charge port. No tangles.
  const cableD =
    `M ${wc.x} ${wc.y} ` +
    `C ${wc.x - 2} ${wc.y + 8} ${port.x - 4} ${port.y + 6} ${port.x} ${port.y}`;
  const cableId = 'ev-cable-path';

  if (state === 'idle') {
    return (
      <g style={{ pointerEvents: 'none' }} data-testid="ev-cable" data-state="idle">
        <path
          d={cableD}
          stroke="hsl(220 10% 55% / 0.6)"
          strokeWidth={0.6}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  return (
    <g style={{ pointerEvents: 'none' }} data-testid="ev-cable" data-state="charging">
      {/* Outer glow halo */}
      <path
        d={cableD}
        stroke="hsl(142 70% 45% / 0.55)"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
        style={{ filter: 'blur(1.1px)' }}
      />
      {/* Hero cable */}
      <path
        id={cableId}
        d={cableD}
        stroke={EMERALD_LED}
        strokeWidth={0.65}
        strokeLinecap="round"
        fill="none"
        opacity={0.95}
      />
      {!reducedMotion && (
        <circle r={0.9} fill={EMERALD_LED} opacity={0}>
          <animateMotion
            dur="2.2s"
            repeatCount="indefinite"
            calcMode="linear"
            keyPoints="0;1"
            keyTimes="0;1"
          >
            <mpath href={`#${cableId}`} />
          </animateMotion>
          <animate
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.2;0.8;1"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </g>
  );
}
