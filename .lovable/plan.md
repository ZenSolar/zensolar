# Tesla-style vehicle labels above the roofline

Adopt Tesla's labelling convention in the cockpit scene, drop the chip-on-car
treatment, and revert the Powerwall caret to Tesla's meaning.

## 1. Roofline label with leader line (replaces the vehicle chip)

Today each rendered car carries a rounded pill anchored to the sprite
("ZenX · Charging · 11.7 kW · 72% · 214 mi"). That pill is replaced by a
Tesla-style stacked label placed above the roofline:

```text
        ZenX                <- grey, small, vehicle name
   11.7 kW ▲ 31%            <- white, tabular, kW + green caret + SOC
        │                   <- hairline leader dropping to the car anchor
        │
      [car]
```

- Name in muted grey, metrics line in foreground white, green caret only when
  the pack is filling.
- Hairline leader (1px, ~25% foreground opacity) from the label's bottom edge
  down to the vehicle's roof/anchor point in the same 0-100 scene space the
  chip uses today.
- Not charging: label shows `Parked · 72%` with no caret and a dimmer leader.
- Multi-vehicle: labels stack in a column above the roofline in vehicle order,
  each with its own leader down to its own car, so two cars never fight over
  one driveway anchor. Stacking spacing is fixed; leaders may cross the roof
  but never each other's text.
- The existing standalone "AC Charging" violet pill stays only for the
  no-sprite case (unchanged); the Supercharging pill stays as-is (car is away,
  no roofline anchor exists).

## 2. Revert the Powerwall caret to Tesla's convention

`▲` means the battery is filling. The Powerwall readout currently renders `▼`
for charging and `▲` for discharging — this flips back: charging `▲`,
discharging `▼`. The generic arrow helper used by the other readouts already
follows the sign convention and is left alone.

## 3. Car position: stay in the driveway

Tesla parks the car inside the garage and hides its front half behind the door
frame. Our scene is a baked PNG with no depth buffer, so occlusion would need a
hand-cut foreground plate per house plate — fragile, and it re-opens the garage
alignment work we just closed. Recommendation, and what this plan implements:
the car stays on the driveway pad where occlusion never arises. No foreground
plate. If you want the in-garage look later it is a separate art task.

## 4. Colour restraint — noted, not changed here

Amber solar / emerald battery / cyan grid / violet EV stay for now. We show
four flows where Tesla shows one, so a single accent cannot carry the meaning.
Flagged as a deliberate follow-up review rather than folded into this change.

## 5. Not touched

The ZenDrive metrics row (`11 kW · +0.1 kWh · 47/48 A · 245 V · 72% → 93%`)
already matches Tesla's and is left exactly as-is. Conductor routing,
chargePoint, cable, anchors and house plate are untouched.

## Technical notes

- `src/components/dashboard/EnergyFlowScene.tsx`: replace `VehicleChip` with a
  `VehicleRoofLabel` component (name + metrics + leader line), rendered in the
  same HTML overlay layer and coordinate space; add roofline Y derivation and
  stacked placement for the multi-vehicle case; flip the Powerwall caret at the
  Powerwall `FlowLabel`.
- Leader line drawn as an absolutely positioned 1px div (or an SVG line in the
  existing overlay `svg`) so it scales with the camera transform like the
  anchors do.
- Verify with a Playwright capture in both single-vehicle charging and
  two-vehicle states, plus a parked (non-charging) state.
