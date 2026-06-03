# Outage Mode — Full Reimagination

## Root-cause findings

**1. House diagram battery→home flow looks "awkward"**
`EnergyFlowScene.tsx` currently renders the outage `pw-home` path as a triple-stack of blurred halos (`outerHalo strokeWidth 4 blur(4px)` + `midHalo strokeWidth 2.4 blur(2.2px)` + `coreStroke 1.6`) plus a chevron. That treatment does NOT match the rest of the scene. The active solar flow (`solar-home`, `solar-pw`) uses `DottedFlow`: a *thin crisp guide* (`strokeWidth 0.45`, opacity 0.18) with 3 LED-bright traveling dots (`r=0.6`) that fade in/out. The amber halo stack reads as a fuzzy smear, not as confident "flowing energy."

**2. Deason auto-opens with generic chrome**
`DeasonChat.tsx:332` hardcodes the header subtitle to `"Clean Energy Optimization · saved"` and `DeasonHeader` shows the thread title (`"New conversation"` when freshly created in `useDeasonThreads`). The seeded outage message DOES land (the seed plumbing works — context fires first, suppresses EmptyState, then seedAssistant pushes the message), but the surrounding chrome (subtitle + thread title) still reads "generic." The user is reacting to the *header*, not a missing message.

**3. Fragmented layout**
`LiveEnergyMonitoringCard.tsx:832–851` stacks `OutageModePanel` *above* `EnergyFlowScene` and shrinks the scene to `aspect-[5/3]`. All the critical numbers (backup time, kW from battery, SOC, load progress) live in the panel; the house is reduced to a small secondary visual. The user wants the inverse: house is hero, stats overlay on/around it.

---

## Changes

### A. Battery → Home flow now mirrors active Solar flow style (`EnergyFlowScene.tsx`)

Remove the triple-halo stack. Render `pw-home` during outage using the **same `DottedFlow` language** as solar, tuned amber and amplified:

- Faint guide path: `strokeWidth 0.55`, `strokeOpacity 0.28` (vs solar `0.45 / 0.18` — slightly stronger so dominance reads).
- **6 amber LED particles** (`r 0.75`, `AMBER_LED`) riding the path with `keyTimes 0;0.12;0.88;1` fade — identical animation profile to solar's 3 particles, just denser.
- Particle cadence: `dur = max(1.6, flowDur(|battery|) * 0.55)` — visibly faster than solar's calm 3.6s default, which is what sells "actively powering."
- Single soft **amber halo** under the guide (one layer, `strokeWidth 1.6`, `opacity 0.22`, `blur(2px)`) breathing 0.18↔0.32 over 1400ms — replaces today's 3-layer stack. Keeps a faint glow without smudging.
- Drop the directional chevron (not used elsewhere; adds noise).
- Solar dim opacity stays at `0.35` so the eye still lands on pw-home.

Refactor `OUTAGE_VISUAL.pwHome` constants to the new shape:
```ts
pwHome: {
  guideStrokeWidth: 0.55,
  guideOpacity: 0.28,
  haloStrokeWidth: 1.6,
  haloPulse: { from: 0.18, to: 0.32, durMs: 1400 },
  particleCount: 6,
  particleRadius: 0.75,
  particleMinDurSec: 1.6,
  particleDurFactor: 0.55,
}
```
Update `src/test/EnergyFlowScene.outage.test.ts` snapshot + assertions to the new shape (still verifies hierarchy, particle floor, and that solar dims to 0.35).

### B. House diagram becomes the hero with integrated stats

New layout in `LiveEnergyMonitoringCard.tsx` when `outage.active`:

- Drop the giant `OutageModePanel` from the top of the card.
- Render `EnergyFlowScene` at full `aspect-square w-full` (its native form) inside a wrapper that has:
  - A compact **calm header strip** above the scene: amber dot · `On Battery Backup` · `Since 4:32 PM · 12 min ago`. Single line, no big banner.
  - **Two corner overlays inside the scene** (absolute, z-30, pointer-events-none) replacing two of the existing `FlowLabel` corners during outage:
    - **Top-right hero stat**: `~3h 20m` huge tabular, label `Backup remaining`, sub `Battery 78%`.
    - **Bottom-right**: `0.6 kW` amber, label `From Battery`, sub `Providing backup power`.
  - The existing Solar / Home FlowLabels stay; Grid label is replaced by a muted `Grid Offline` label with red dot. (Done by passing an `isOutage` prop into the label decisions already in `EnergyFlowScene.tsx`.)
- A **single slim footer row** below the scene (inside the same card, not a second card):
  - Left: progress bar `Load 0.6 kW / Capacity 5.0 kW`.
  - Right: link `View outage history →`.
  - One inline contextual line ("Solar will recharge when sunlight returns" or "Solar is recharging now" or "Approaching reserve…").

Net effect: one unified, integrated card; the house carries the weight; stats are part of the scene, not a separate panel.

`OutageModePanel.tsx` is reduced to the footer row (or replaced by a small inline `OutageFooter` subcomponent in the card; keep the file for outage-history page reuse but stop using it as the hero).

New compact subcomponents inside `EnergyFlowScene.tsx` (or a sibling `OutageOverlay.tsx` imported by the scene):
- `OutageHeroStat` (top-right): backup time + battery %.
- `OutageDrawStat` (bottom-right): kW from battery.

These read from existing scene props (`data.batteryPercent`, `data.batteryPower`) plus two new optional props on `EnergyFlowScene`: `backupLabel?: string` and `usableCapacityKwh?: number` (passed down by the card so estimator math stays in one place).

### C. Deason: outage-aware chrome + guaranteed first-message context

`DeasonChat.tsx`:
- Accept a new optional prop `contextMeta?: { kind?: string; backupLabel?: string; socPct?: number | null } | null`. When `contextMeta?.kind === 'grid_outage'`:
  - Override `headerSubtitle` → `Grid Outage · backup ~${backupLabel}`.
  - Override `welcomeTitle` / `welcomeBody` (unused once seeded, but defensive).
  - Render a small **amber pill at the top of the transcript** ("⚡ On battery backup · ~3h 20m remaining · 78%") above the seeded assistant message so the outage framing is unmistakable even if the user scrolls.
- Also detect outage context via the existing `deason:context` listener and keep a local `outageContext` state for the same effect — so it works whether the meta arrives via prop or event.

`DeasonFloatingBubble.tsx`:
- When `pendingMeta?.kind === 'grid_outage'`, pass `contextMeta={pendingMeta}` straight into `DeasonChat`. Clear it on close.
- Keep current sequence: dispatch `deason:context` first, then `deason:seed` in same tick (already correct).
- Belt-and-suppliers: if `pendingMeta?.kind === 'grid_outage'` and user is not yet authed/thread not ready, still set `suppressEmptyState`-equivalent local state immediately so the welcome panel cannot flash.

`useOutageLifecycle.ts`:
- No logic change; the seed copy is already strong. Add `backupLabel` and `socPct` to the meta (already there) — DeasonChat now consumes them for the pill.
- Set the thread title when present: on outage start, also dispatch `deason:rename-thread` with title `Grid Outage · 4:32 PM` (best-effort — handled by FloatingBubble if a `threadId` exists, calling existing `renameThread`).

### D. Tests

- Update `src/test/EnergyFlowScene.outage.test.ts` — new `OUTAGE_VISUAL.pwHome` shape, assert `particleCount >= 5`, `solarDimOpacity === 0.35`, grid offline dashed.
- Update `src/test/OutageModePanel.test.tsx` — adjust to new footer-only role (or assert the inline overlay variant the card now renders).
- `src/test/useOutageLifecycle.test.tsx` — keep existing seed-content assertions; add one verifying `meta.backupLabel` and `meta.socPct` are dispatched.

### Out of scope
- No backend / migration changes.
- No new edge functions.
- No changes to Enphase/SolarEdge detection.
- Outage History page stays as-is.

---

## Acceptance

1. During an outage, the card is one unified view: house diagram dominant, backup time + kW from battery + battery % visible as overlays on the scene; a slim footer row carries the load/capacity bar and history link.
2. Battery→Home line during outage looks like a denser, faster, amber version of the active solar dotted-flow — not a blurry halo stack.
3. Opening Deason during an outage shows: amber outage pill at the top of the transcript, header subtitle "Grid Outage · backup ~Xh", and the outage-context seeded assistant message as the first thing — never the generic Clean Energy Optimization welcome.
4. All existing tests pass; outage snapshot/visual regression updated to the new tuning.
