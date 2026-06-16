---
name: FSD Sampler Cron (HW3)
description: tesla-fsd-sampler runs every 5 min via pg_cron to accumulate FSD miles for HW3 vehicles
type: feature
---

Cron job `tesla-fsd-sampler-every-5min` (`*/5 * * * *`) calls the
`tesla-fsd-sampler` edge function. Required because HW3 vehicles
(e.g. ZenX, Joseph's 2021 Model X) don't report `self_driving_miles_since_reset`
and need adaptive-polling odometer-delta accumulation while autopilot is engaged.

2026-06-16 live-drive fix: if Tesla REST omits autopilot/drive/speed but odometer
advanced, sampler records `InferredDriveMoving` and credits the odometer delta
with proof metadata `autopilot_inferred=true` / `sampler_reason=credited_inferred`.

Depends on `connected_devices.last_known_state JSONB` column (added 2026-06-16).
Without it, sampler silently no-ops.

To pause: `SELECT cron.unschedule('tesla-fsd-sampler-every-5min');`
