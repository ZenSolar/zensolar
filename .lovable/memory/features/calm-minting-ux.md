---
name: Calm Minting UX (Solar, Battery Export, EV Mileage, FSD)
description: Locked tone contract + L1/L2/L3 components and copy for passive minting sources. Mirrors Tesla charging calm UX.
type: feature
---
# Calm Minting UX — Locked Contract

Mirror the calm, trustworthy, habit-building philosophy of Tesla Supercharging + Home / AC Charging across the four passive minting sources: **Solar, Battery Export, EV Mileage, FSD**.

## Three layers

- **L1 — silent status line.** Single muted line while source is active. Tabular-nums counter where applicable. No card, no toast.
- **L2 — first-time banner.** Once-ever per user per source. Short, neutral, auto-dismiss after 8s. No audio.
- **L3 — milestone delight.** Extremely rare. **Audio + haptic only.** No text, no banner, no toast, no DOM output.

Weekly tap-to-claim remains the only intentional engagement moment. Receipts and history stay consistent with the Home & AC Charging style — no added noise.

## LOCKED COPY — do NOT edit without product approval

| Source         | L1                                  | L2                                          |
| -------------- | ----------------------------------- | ------------------------------------------- |
| Solar          | `● Solar producing • accruing`      | `First solar mint accruing.`                |
| Battery Export | `● Battery contributing • earning`  | `First battery export earned tokens.`       |
| EV Mileage     | `● Driving • earning`               | `Your driving is now earning $ZSOLAR.`      |
| FSD            | `● FSD active • earning`            | `First FSD miles now earning.`              |

## L3 milestones (chime + haptic only)

- `milestone:first-mint` — first-ever account mint
- `milestone:solar:1000kwh` — 1,000 kWh lifetime solar
- `milestone:battery:first-5kwh` — first battery export ≥ 5 kWh
- `milestone:driving:1000mi` — first 1,000 miles
- `milestone:fsd:10hrs` — first 10 FSD hours (~600 mi proxy)

## Implementation

- Table: `ux_first_seen (user_id, event_key, seen_at)` — RLS scoped to `auth.uid()`.
- Hook: `src/hooks/useUxFirstSeen.ts` — DB-backed with localStorage fast-path.
- Components: `SilentSourceStatus`, `FirstTimeMintBanner`, `MilestoneChime` (audio + haptic only, returns `null`).
- Integrator: `src/components/dashboard/CalmMintingStatus.tsx` — reads `useDashboardData()`, renders all four sources. Mounted in `ZenSolarDashboard` beside `SilentChargingStatus`.

Copy strings live ONLY in `CalmMintingStatus.tsx`. Do not duplicate.
