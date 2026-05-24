---
name: Home Charging Setup (onboarding)
description: Per-vehicle home charging source, brand, setup type, and geofence location captured after Tesla connect
type: feature
---
After a Tesla vehicle is connected during onboarding, the user is routed to `HomeChargingSetupScreen` (3 sub-steps: source → location → setup type) before `energy-success`.

Fields on `connected_devices` (vehicle rows):
- `home_charging_source`: 'tesla_wall_connector' | 'wallbox' | 'vehicle_telemetry' | 'none'
- `home_charger_brand`: free-text display label (e.g. "ChargePoint Home Flex", "Apartment Shared L2")
- `home_setup_type`: 'house' | 'apartment_private' | 'apartment_shared' | 'other'
- `home_location`: jsonb { lat?, lon?, radius_m: 200, source: 'tesla_saved'|'user_entered', address? }

Address is also mirrored into `profiles.home_address` so the existing `tesla-charge-monitor` geofence (0.5mi radius around geocoded profile.home_address) keeps working without change. Paid status does NOT disqualify — apartment shared/paid L2 still mints if inside geofence.

Tesla saved-Home auto-detect is NOT implemented; manual address entry only (with prefill from profile.home_address). Auto-detect is a future enhancement.

Files: `src/components/onboarding/HomeChargingSetupScreen.tsx`, `src/pages/Onboarding.tsx` (step `home-charging-setup`).
