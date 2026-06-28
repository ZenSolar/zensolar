---
name: Charging-in-progress indicator — Supercharger parity + Tesla vehicle card visual upgrade (REMIX)
description: Green LIVE pill must light up for Supercharger sessions too, not just home/Wallbox. Vehicle/Wall Connector card needs a hero car image/animation in Remix v1.
type: feature
---

## Observed behavior (2026-06-28, ZenX live)
- User charging at NEW home (Tesla Wall Connector) — home address NOT updated in Tesla app or ZenSolar profile.
- Clean Energy Center still correctly shows green "Charging in progress" indicator + "Charging from the grid · 11.0 kW · +36 mi/hr". 
- This confirms our session detection is location-agnostic (driven by `charge_state.charging_state === 'Charging'` from Fleet API, not geofence). Geofence is only used for home-vs-away classification for the 7d Super/Home split.

## Gap #1 — Supercharger sessions don't light the same indicator
- When `fast_charger_present === true` (Supercharger / DC fast charge), `tesla-charge-monitor` should set the same green LIVE pill state as AC home charging.
- Today the pill logic likely keys off home-charger session classification; needs to additionally trip on ANY active Tesla charge session regardless of charger_type.
- Copy variant: "Charging from Supercharger · {kW} kW · +{mi}/hr" with the same green dot + bolt icon.
- Lifetime/today totals already track Super separately ("Super 7d") so no double-count.

## Gap #2 — Vehicle/Wall Connector card is visually flat
- Current card (IMG_0966) shows great data (11.0 kW, 59% SOC, +2.6 kWh, 115 min to full) but no car image, no animation, no flowing energy.
- Tesla's own app uses a rendered vehicle image + animated charge arc — that's the bar.
- **Remix v1 Tier 2 Vehicle card** must include:
  - Hero 3/4 rendered Tesla vehicle image (model-aware: Model X for ZenX), color-matched if possible
  - Animated charge flow line from Wall Connector → vehicle charge port (yellow-blue gradient, particles)
  - SOC ring around the vehicle silhouette (fills as % climbs)
  - Subtle pulse on the Wall Connector icon while session is live
- For Supercharger sessions, swap the Wall Connector node for a Supercharger stall icon and use red/Tesla-red accent for the flow line.

## Status
- ⏳ Both gaps deferred to Remix v1 (do NOT bolt onto legacy app per `remix-transition.md`)
- ✅ Decision locked: session detection stays location-agnostic — never gate the LIVE pill on geofence/home_address presence.
