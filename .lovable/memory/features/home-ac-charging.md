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

## Coverage rationale (Phase B LIVE)
- Paired chargers (Wallbox, ChargePoint, Wi-Fi Tesla Wall Connector) write to
  `home_charging_sessions` directly.
- `tesla-charge-monitor` now ALSO credits vehicle-reported AC sessions when
  `fast_charger_present = false`, REGARDLESS of whether the session is near
  the user's saved home. Previously it bailed with `ac_not_home`; now it
  classifies via `user_home_locations` and tags `location_kind`. This is the
  fix that credits unpaired Tesla Wall Connectors, friend's houses, hotels,
  work, etc.
- Anti-double-count: `crossSourceOverlap` already prefers wallbox > tesla.

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

## "Is this your new home?" prompt (Phase B LIVE)
First session at an unknown lat/lon → calm L2 banner on dashboard (no sound,
no haptic). Three choices:
- "Yes — Set as Home" → saves to `user_home_locations` as primary (demotes prev).
- "Temporary stay" → saves with a `Temporary stay` label, non-primary.
- "AC away, ignore" → no save; future sessions still credit as `away_unverified`.
Dismissal is keyed by rounded lat/lon (~11 m grid) in localStorage, so the
prompt asks once per location, never per session. Lives in
`src/hooks/useNewLocationPrompt.ts` + `src/components/dashboard/NewLocationPrompt.tsx`.

## Out of scope
- Public L2 networks via their own APIs (ChargePoint public, EVgo L2) — the
  vehicle-side fallback already covers them functionally.
- Renaming the DB table.
- Different mint multiplier by location.
