import type { BetaHomeSelections, BetaStatus, BetaStep } from '@/hooks/useBetaFlow';

/**
 * Compute the next incomplete unified-onboarding step.
 * Order: tesla → solar → charger → proof → account → done.
 * "Extras" is legacy and only used if flow lands there explicitly.
 */
export function computeNextStep(sel: BetaHomeSelections, status: BetaStatus): BetaStep {
  const teslaNeeded = !!(sel.vehicle || sel.battery || sel.charger);
  const teslaDone =
    (!!status.vehicle?.state && status.vehicle.state !== 'not_started' && status.vehicle.state !== 'pending') ||
    status.vehicle?.state === 'skipped';

  if (teslaNeeded && !sel.vehicle && (sel.battery || sel.charger)) {
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

  // Any device connected? Go to proof, then account.
  const anyConnected =
    (status.vehicle?.state && status.vehicle.state.startsWith('connected')) ||
    (status.solar?.state && status.solar.state.startsWith('connected')) ||
    (status.battery?.state && status.battery.state.startsWith('connected')) ||
    (status.charger?.state && status.charger.state.startsWith('connected'));

  const proofSeen = !!(status as unknown as { proof?: { state?: string } }).proof?.state;
  if (anyConnected && !proofSeen) return 'proof';

  const accountState = (status as unknown as { account?: { state?: string } }).account?.state;
  if (accountState !== 'secured' && accountState !== 'skipped') return 'account';

  return 'done';
}
