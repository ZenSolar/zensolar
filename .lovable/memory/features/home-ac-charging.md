---
name: Home & AC Charging (renamed + multi-home)
description: Renamed "Home Charging" KPI to "Home & AC Charging" everywhere; added multi-home addresses and location_kind classification. Vehicle-side AC fallback is Phase B.
type: feature
---

## Label (LOCKED)
- All user-facing surfaces say **"Home & AC Charging"** (KPI tile, Clean Energy
  Center header, receipts, mint history filter, blog copy, onboarding).
- DB key `home_charger_kwh` and table `home_charging_sessions` are unchanged
  (rename was too invasive). Display label only.
- `SilentChargingStatus` says **"AC charging"** (not "Home charging") so it's
  accurate at a friend's house too.

## Coverage rationale
- Today only paired chargers (Wallbox, ChargePoint, Wi-Fi-linked Tesla Wall
  Connector) produce `home_charging_sessions` rows.
- Phase B will add `tesla-vehicle-ac-session` edge function: when vehicle
  reports `charge_state.charging_state = "Charging"` AND
  `fast_charger_present = false` AND no paired-charger session covers the
  window, open a vehicle-sourced session keyed on VIN. This is what credits
  unpaired Tesla Wall Connectors, friend's houses, public L2, hotels, etc.
- Anti-double-count: `crossSourceOverlap` extended so paired charger > vehicle.

## location_kind enum (Phase A — schema in place)
`home_primary` · `home_secondary` · `away_known` · `away_unverified`.
Computed by `src/lib/locationClassifier.ts` using Haversine + each location's
`radius_m` (default 150 m). No mint-rate difference between kinds — kWh is kWh.

## user_home_locations table (Phase A)
`label, lat, lon, radius_m, is_primary, is_active, archived_at`.
- Partial unique index enforces at most one primary per user.
- Profile → "Home Addresses" section lists, adds, marks primary, archives.
- During a move: add new home → mark primary → old auto-demotes, stays active
  30 days so straggler sessions classify as `home_secondary`, not `away`.

## "Is this your new home?" prompt (Phase B)
First session at an unknown lat/lon → L2 banner (no sound, no haptic, calm):
- "Yes — Set as my Home" → saves + makes primary, demotes previous.
- "Temporary stay" → saves as `kind: away_known`.
- "Just AC away, ignore" → no save; future sessions tagged `away_unverified`.
Suppressed entirely when user has silent default; session still credits.

## Out of scope
- Public L2 networks via their own APIs (ChargePoint public, EVgo L2) — the
  vehicle-side fallback already covers them functionally.
- Renaming the DB table.
- Different mint multiplier by location.
