# Restore and freeze the verified EV1 driveway state

Use Lovable project History to restore the complete project version immediately
after EV2 was removed and `chargePoint` was relocated to the garage's left side,
before EV1 flipping, mirroring, reverse-parking, rotation, or open-garage overlay
work began. Do not recreate that state by patching the current implementation.

## Restore checkpoint

Select the historical version whose rendered behavior visibly matches all of
the following:

- EV1 is flat and grounded on the driveway apron.
- EV1 is parallel to the facade.
- The violet cable is visible only while EV1 is charging.
- The cable is absent while EV1 is parked.
- The away state has an empty driveway.
- EV2 is absent and `chargePoint` remains on the garage's left side.

If the first candidate version does not satisfy every item, inspect adjacent
history versions rather than modifying source code.

## Explicitly accepted limitation

The cable may land on the passenger side. Preserve that exact behavior. Do not
rotate, mirror, flip, reposition, auto-fit differently, alter the transform, or
change `chargePoint`/cable geometry to address port-side accuracy.

## Freeze scope

Once the matching version is restored, make no EV1 presentation changes. Do
not reintroduce any of the later garage-interior, reverse-park, or orientation
experiments. No unrelated scene, conductor, EV2, data, or backend work is part
of this restoration.

## Three-state pixel verification

After restoration, render fresh full-car screenshots for:

1. **Away:** driveway empty; no violet cable.
2. **Parked:** EV1 flat, grounded, and parallel on the apron; no violet cable.
3. **Charging:** the same EV1 placement; violet cable visible.

Review the actual pixels, not coordinate output. Attach all three screenshots
and state plainly if any requirement is not visibly satisfied; do not report
success unless all three match.
