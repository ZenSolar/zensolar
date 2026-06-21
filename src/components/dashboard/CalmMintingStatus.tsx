/**
 * CalmMintingStatus — single integrator for the calm minting UX across
 * Solar, Battery Export, EV Mileage, and FSD. Mirrors the philosophy
 * shipped for Tesla Supercharging + Home / AC Charging:
 *
 *   L1  silent status line (always-on while source is active)
 *   L2  understated first-time banner (once-ever, 8s, no audio)
 *   L3  soft chime + subtle haptic on true milestones (no text)
 *
 * Copy is LOCKED per the calm UX contract — do not edit strings here
 * without product approval. See mem://features/calm-minting-ux.md.
 */
import { useDashboardData } from '@/hooks/useDashboardData';
import { SilentSourceStatus } from './SilentSourceStatus';
import { FirstTimeMintBanner } from './FirstTimeMintBanner';
import { MilestoneChime } from './MilestoneChime';

// LOCKED COPY — do not edit without product approval.
const COPY = {
  solar: {
    l1: '● Solar producing • accruing',
    l2: 'First solar mint accruing.',
  },
  battery: {
    l1: '● Battery contributing • earning',
    l2: 'First battery export earned tokens.',
  },
  driving: {
    l1: '● Driving • earning',
    l2: 'Your driving is now earning $ZSOLAR.',
  },
  fsd: {
    l1: '● FSD active • earning',
    l2: 'First FSD miles now earning.',
  },
} as const;

// Tiny epsilons — don't fire L2/L3 on noise.
const SOLAR_ACTIVE_KWH = 0.05;
const BATTERY_ACTIVE_KWH = 0.05;
const DRIVING_ACTIVE_MI = 0.1;
const FSD_ACTIVE_MI = 0.1;

// Milestones
const SOLAR_MILESTONE_KWH = 1000;
const BATTERY_MILESTONE_KWH = 5;
const DRIVING_MILESTONE_MI = 1000;
const FSD_MILESTONE_MI = 600; // ~10 hours @ 60 mph proxy

export function CalmMintingStatus() {
  const { data } = useDashboardData();
  if (!data) return null;

  const solarKwh = data.pendingSolarKwh ?? 0;
  const batteryKwh = data.pendingBatteryKwh ?? 0;
  const drivingMi = data.pendingEvMiles ?? 0;
  const fsdMi =
    (data.pendingFsdSupervisedMiles ?? 0) +
    (data.pendingFsdUnsupervisedMiles ?? 0);

  const solarActive = solarKwh > SOLAR_ACTIVE_KWH;
  const batteryActive = batteryKwh > BATTERY_ACTIVE_KWH;
  const drivingActive = drivingMi > DRIVING_ACTIVE_MI;
  const fsdActive = fsdMi > FSD_ACTIVE_MI;

  // Lifetime totals for milestones (best-effort: pending is current accrual,
  // earned is lifetime side. Fall back to pending if not present.)
  const solarLifetime =
    (data.solarEnergyKwh ?? 0) + solarKwh;
  const drivingLifetime =
    (data.evMiles ?? 0) + drivingMi;
  const fsdLifetime =
    (data.fsdMiles ?? 0) + fsdMi;

  return (
    <>
      {/* L2 first-time banners — only fire when source becomes active. */}
      <FirstTimeMintBanner
        eventKey="first:solar:accruing"
        message={COPY.solar.l2}
        trigger={solarActive}
      />
      <FirstTimeMintBanner
        eventKey="first:battery:export"
        message={COPY.battery.l2}
        trigger={batteryActive}
      />
      <FirstTimeMintBanner
        eventKey="first:driving:earning"
        message={COPY.driving.l2}
        trigger={drivingActive}
      />
      <FirstTimeMintBanner
        eventKey="first:fsd:earning"
        message={COPY.fsd.l2}
        trigger={fsdActive}
      />

      {/* L1 silent status lines. */}
      <SilentSourceStatus
        label={COPY.solar.l1}
        active={solarActive}
        counter={solarKwh > 0 ? `+${solarKwh.toFixed(1)} kWh` : undefined}
      />
      <SilentSourceStatus
        label={COPY.battery.l1}
        active={batteryActive}
        counter={batteryKwh > 0 ? `+${batteryKwh.toFixed(1)} kWh` : undefined}
      />
      <SilentSourceStatus
        label={COPY.driving.l1}
        active={drivingActive}
        counter={drivingMi > 0 ? `+${drivingMi.toFixed(1)} mi` : undefined}
      />
      {/* FSD: per spec, no live counter line — single quiet "active" line. */}
      <SilentSourceStatus label={COPY.fsd.l1} active={fsdActive} />

      {/* L3 milestone chimes — audio + haptic only, no DOM text. */}
      <MilestoneChime
        milestoneKey="milestone:first-mint"
        reached={solarActive || batteryActive || drivingActive || fsdActive}
      />
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
