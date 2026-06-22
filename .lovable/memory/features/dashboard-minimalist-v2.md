---
name: Dashboard Minimalist v2
description: Dashboard = monitoring only. One device-adaptive Zen Monitoring Card. Earning lives in Clean Energy Center; collecting in NFT Collection.
type: feature
---

The home dashboard (`/index`, `ZenSolarDashboard.tsx`) answers ONE question: "Is my clean energy working right now?"

## Page split (SSOT)

- **Dashboard** = monitoring. Zen Monitoring Card + onboarding + auto-hide signals + quick links. Nothing else.
- **Clean Energy Center** = earning. Today's stats, per-source +$ZSOLAR chips, tap-to-mint, weekly claim, mint receipts, FlywheelContribution, CO2Offset, Subscription status.
- **NFT Collection** = collecting. Milestones, mint NFTs, RewardProgress.

## Zen Monitoring Card (`src/components/dashboard/ZenMonitoringCard.tsx`)

- Unified animated flow diagram (sun → home → battery → car).
- Device-adaptive: nodes for unconnected devices are **hidden entirely** (not greyed out).
- Layout is stable — only edge activity and status lines change between states.
- Composes existing renderers: `LiveEnergyMonitoringCard` (subscribed + solar/battery) or `AnimatedEnergyFlow` (default). Tesla detail via `TeslaStatusCard` + `SuperchargerLiveCard` only when Tesla is connected.
- Auto-hide siblings: `OemDiagnosticsBanner`, `ProviderReauthCallout`, `NewLocationPrompt`, `OutageRecapCard`.

## Tesla car-node state table (canonical)

| State | Car node | Edge | Status line |
|---|---|---|---|
| Supercharging | Full opacity, ⚡ | Electrons into car | `SOC% · +XX kW · ~Xmin to 80%` |
| Home charging | Full opacity | Home → car | `SOC% · +X.X kW · home` |
| Driving | Full opacity, shimmer | None | `SOC% · Driving` |
| Parked / idle | Dimmed 70% | None | `SOC% · Parked` |
| Offline | Dimmed 50% | None | `Tesla offline` |
| Not in account | Hidden | — | — |

**No "solar-powered charging" attribution label.** Home charging is shown neutrally regardless of whether solar is covering it — we can't always prove real-time attribution, and the calm UI doesn't need it. The "Solar-Powered EV" metric tile was removed from `EnergyFlowDiagram.tsx`.

## What was unmounted from the dashboard (kept on disk)

`TodaysCleanEnergyStats`, `RewardSnapshotGrid`, `MintReceiptsHint`, `SubscriptionStatusCard`, `CO2OffsetCard`, `FlywheelContributionCard`, `RewardProgress` + "MINT ZENSOLAR NFTs" CTA, `PrimaryMintAction`, `ActivityMetrics`, `SuperchargerBanner`, `SilentChargingStatus`, `CalmMintingStatus`, `LiveEnergyMonitoringCard` (now wrapped inside ZenMonitoringCard), `ZenDriveLiveCard`. Files still exist — used by other pages or available for prune in a follow-up pass.

## Dashboard render order (new)

1. `DashboardHeader` (when demo)
2. Welcome + tagline
3. `TokenPriceCard` (compact balance)
4. `FirstRunHero` / `CompactWalletPrompt` / `CompactSetupPrompt` (onboarding)
5. `ReadyToMintCard` (one-shot celebration)
6. **`ZenMonitoringCard`** (the hero)
7. Quick links → Clean Energy Center, NFT Collection
8. Admin panels (admin view only)
9. `DashboardFooter`
