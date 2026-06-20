---
name: Minting Loudness Levels
description: Calm-by-default rule for any minting surface — silent L1, light L2, delight L3
type: preference
---

## Rule (applies to every mint surface)

| Level | When | Surface |
|---|---|---|
| **L1 Silent** *(default)* | All normal sessions — home, solar, FSD, repeat Supercharger. | No banner, no toast, no celebration. KPI cards animate value changes only. |
| **L2 Light Awareness** | First-ever Supercharger session, first-ever home charging session, paused / resumed, classifier error. | Thin top banner, 8s auto-dismiss, no sound. Subtle glow on relevant KPI. |
| **L3 Delight** | First-ever mint, 1 000 kWh lifetime, 10 000 $ZSOLAR lifetime. | Scale-in only — no confetti, no audio. Optional Share PoG prompt. |

## How to apply
- Use `classifyLoudness(event)` from `src/hooks/useMintLoudness.ts`. Don't branch on level inside components — call the helper.
- First-time gating uses `profiles.first_supercharger_at` and `profiles.first_home_charge_at`. After the timestamp is set, every subsequent session is strict L1 forever.
- "Strengthening the LP for all holders" is the only framing — no crypto jargon, no exclamation marks.

## Why
User wants a quiet, trustworthy, premium habit: "whenever I plug in my Tesla, ZenSolar is silently minting in the background." Default = silent. Light awareness only when genuinely new or wrong. Delight is rare.
