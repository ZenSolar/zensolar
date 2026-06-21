/**
 * CalmMintingStatus — single integrator for the calm minting UX across
 * Solar, Battery Export, EV Mileage, and FSD.
 *
 *   L1  ONE consolidated quiet status line (never a stacked list)
 *   L2  understated first-time banner — ONE at a time, queued, suppressed
 *       entirely if the user already has meaningful lifetime totals
 *       (i.e. they're not actually a first-time minter for that source)
 *   L3  soft chime + subtle haptic on true milestones (no DOM text)
 *
 * Copy is LOCKED per the calm UX contract — see mem://features/calm-minting-ux.md.
 */
import { useDashboardData } from '@/hooks/useDashboardData';
import { FirstTimeMintBanner } from './FirstTimeMintBanner';
import { MilestoneChime } from './MilestoneChime';

// LOCKED COPY — do not edit without product approval.
const COPY = {
  solar: { l2: 'First solar mint accruing.' },
  battery: { l2: 'First battery export earned tokens.' },
  driving: { l2: 'Your driving is now earning $ZSOLAR.' },
  fsd: { l2: 'First FSD miles now earning.' },
} as const;

// Active-source epsilons.
const SOLAR_ACTIVE_KWH = 0.05;
const BATTERY_ACTIVE_KWH = 0.05;
const DRIVING_ACTIVE_MI = 0.1;
const FSD_ACTIVE_MI = 0.1;

// "First-time" suppression — if lifetime totals already exceed these,
// the user is clearly not a first-time minter and the L2 should NEVER show.
const SOLAR_FIRSTTIME_MAX_KWH = 5;
const BATTERY_FIRSTTIME_MAX_KWH = 1;
const DRIVING_FIRSTTIME_MAX_MI = 10;
const FSD_FIRSTTIME_MAX_MI = 2;

// Milestones.
const SOLAR_MILESTONE_KWH = 1000;
const BATTERY_MILESTONE_KWH = 5;
const DRIVING_MILESTONE_MI = 1000;
const FSD_MILESTONE_MI = 600;

export function CalmMintingStatus() {
  const { activityData } = useDashboardData();
  if (!activityData) return null;

  const solarKwh = activityData.pendingSolarKwh ?? 0;
  const batteryKwh = activityData.pendingBatteryKwh ?? 0;
  const drivingMi = activityData.pendingEvMiles ?? 0;
  const fsdMi =
    (activityData.pendingFsdSupervisedMiles ?? 0) +
    (activityData.pendingFsdUnsupervisedMiles ?? 0);

  const solarActive = solarKwh > SOLAR_ACTIVE_KWH;
  const batteryActive = batteryKwh > BATTERY_ACTIVE_KWH;
  const drivingActive = drivingMi > DRIVING_ACTIVE_MI;
  const fsdActive = fsdMi > FSD_ACTIVE_MI;

  const solarLifetime = (activityData.solarEnergyProduced ?? 0) + solarKwh;
  const batteryLifetime = (activityData.batteryEnergyExported ?? 0) + batteryKwh;
  const drivingLifetime = (activityData.evMilesDriven ?? 0) + drivingMi;
  const fsdLifetime =
    (activityData.fsdSupervisedMiles ?? 0) +
    (activityData.fsdUnsupervisedMiles ?? 0) +
    fsdMi;

  // L2 eligibility: must be active AND user has no meaningful history.
  const eligibleL2 = [
    solarActive && solarLifetime <= SOLAR_FIRSTTIME_MAX_KWH
      ? { key: 'first:solar:accruing', msg: COPY.solar.l2 }
      : null,
    batteryActive && batteryLifetime <= BATTERY_FIRSTTIME_MAX_KWH
      ? { key: 'first:battery:export', msg: COPY.battery.l2 }
      : null,
    drivingActive && drivingLifetime <= DRIVING_FIRSTTIME_MAX_MI
      ? { key: 'first:driving:earning', msg: COPY.driving.l2 }
      : null,
    fsdActive && fsdLifetime <= FSD_FIRSTTIME_MAX_MI
      ? { key: 'first:fsd:earning', msg: COPY.fsd.l2 }
      : null,
  ].filter(Boolean) as { key: string; msg: string }[];

  // Show at most ONE L2 at a time — the FirstTimeMintBanner's `useUxFirstSeen`
  // will skip any that the user has already seen, so the next-unseen one wins.
  const oneL2 = eligibleL2[0] ?? null;

  return (
    <>
      {oneL2 ? (
        <FirstTimeMintBanner
          key={oneL2.key}
          eventKey={oneL2.key}
          message={oneL2.msg}
          trigger
        />
      ) : null}

      {/* L3 milestone chimes — audio + haptic only, no DOM text. */}
      <MilestoneChime
        milestoneKey="milestone:solar:1000kwh"
        reached={solarLifetime >= SOLAR_MILESTONE_KWH}
      />
      <MilestoneChime
        milestoneKey="milestone:battery:first-5kwh"
        reached={batteryKwh >= BATTERY_MILESTONE_KWH}
      />
      <MilestoneChime
        milestoneKey="milestone:driving:1000mi"
        reached={drivingLifetime >= DRIVING_MILESTONE_MI}
      />
      <MilestoneChime
        milestoneKey="milestone:fsd:10hrs"
        reached={fsdLifetime >= FSD_MILESTONE_MI}
      />
    </>
  );
}
