Plan to fix the current Mike Tschida View-As monitoring card:

1. Fix the Enphase “Idle / 0.00 kW” display path
   - Update the solar telemetry parsing so Enphase production uses every real field the backend can return, including current power, per-system power, summary power, and recent production intervals when available.
   - If Enphase returns a valid updated sample but current power is zero, keep the UI honest: show Idle only when the selected user’s Enphase payload actually reports zero, not because parsing missed the field.

2. Force View-As refresh at the right layer
   - Ensure the View-As refresh runs for the child card that actually renders (`SolarPlusCard`), not only the parent `LiveEnergyMonitoringCard` render decision.
   - The refresh will invoke Enphase/Wallbox with `X-Target-User-Id` for Mike Tschida, then read the cache for Mike’s user ID.

3. Remove Tesla/Powerwall copy from Mike’s card
   - Update the Solar + Wallbox branch so it does not prompt “Add a Powerwall or your Tesla” for a user who has Enphase + Wallbox only.
   - The card will show only Mike’s connected Enphase system and Wallbox charger, with no Tesla/Powerwall labels or tiles.

4. Tighten device-source gating
   - Keep Tesla out of solar conflict/source detection unless the viewed user has an actual Tesla solar connected-device row.
   - Keep Powerwall UI out unless the viewed user has an actual battery/powerwall connected-device row.

5. Verify after implementation
   - Confirm the hooks crash remains gone.
   - Confirm View-As Michael Tschida shows only Enphase + Wallbox.
   - Confirm exiting View-As returns the admin’s full system.
   - Confirm Mike’s Enphase tile shows real refreshed production data when Enphase reports non-zero current production, and otherwise shows a truthful zero/idle state rather than stale/admin data.