import type { BetaHomeSelections, BetaStatus, BetaStep } from '@/hooks/useBetaFlow';

/**
 * Compute the next incomplete beta step from the user's home selections and
 * current per-category status. Order: tesla → solar → charger → extras → summary.
 * A module is considered "done" if any category it can satisfy already has a
 * connected/skipped/not_detected status.
 */
export function computeNextStep(sel: BetaHomeSelections, status: BetaStatus): BetaStep {
  const teslaNeeded = !!(sel.vehicle || sel.battery || sel.charger);
  const teslaDone =
    !!status.vehicle?.state && status.vehicle.state !== 'not_started' && status.vehicle.state !== 'pending' ||
    // If user checked battery/charger only, treat Tesla module as done once
    // either was resolved by Tesla OR user skipped Tesla.
    !!(status.vehicle?.state === 'skipped');

  if (teslaNeeded && !sel.vehicle && (sel.battery || sel.charger)) {
    // Battery/charger only: Tesla is one *option* to resolve them; if the
    // user hasn't touched Tesla and hasn't connected solar yet, still offer it.
    const batteryHandled = !!status.battery?.state && status.battery.state !== 'not_started';
    const chargerHandled = !!status.charger?.state && status.charger.state !== 'not_started';
    if (!batteryHandled && !chargerHandled && !status.vehicle?.state) return 'tesla';
  } else if (teslaNeeded && !teslaDone) {
    return 'tesla';
  }

  const solarNeeded = !!(sel.solar || (sel.battery && status.battery?.state !== 'connected_auto' && status.battery?.state !== 'connected_manual'));
  const solarDone = !!status.solar?.state && status.solar.state !== 'not_started' && status.solar.state !== 'pending';
  if (solarNeeded && !solarDone) return 'solar';

  const chargerNeeded = !!sel.charger;
  const chargerDone =
    !!status.charger?.state &&
    status.charger.state !== 'not_started' &&
    status.charger.state !== 'pending';
  if (chargerNeeded && !chargerDone) return 'charger';

  // Extras is shown once, then summary.
  if (!status.vehicle && !status.solar && !status.battery && !status.charger) return 'summary';
  return 'extras';
}
