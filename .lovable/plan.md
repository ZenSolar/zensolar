# PIN gate for `/investor`

Add a 4-digit PIN screen in front of the NDA on `/investor`. Separate from the existing Seed Deck PIN. Unlock persists for 23 days on the device.

## Flow

```
/investor
  ├── [locked] 4-digit PIN keypad   ← NEW (matches DeckPinGated visual)
  │     └── verifies via new edge function `investor-pin-verify`
  └── [unlocked] existing Hero → NDA → Unlocked panel
```

After 4 digits are entered, the page calls `investor-pin-verify`. On success it stores `{ ts, accessCode }` in `localStorage` under `zs_investor_pin_unlocked` and reveals the existing landing page. On failure it shakes, clears, and shows attempts remaining. Throttling and attempt counting are handled inside the edge function exactly like `deck-pin-verify`.

The 23-day expiry is enforced client-side by comparing `Date.now() - ts` to `23 * 24 * 60 * 60 * 1000` on mount; expired entries are deleted and the PIN keypad re-shows.

## What gets added

- **New edge function** `supabase/functions/investor-pin-verify/index.ts` — mirrors `deck-pin-verify`. Reads PIN from a new runtime secret `INVESTOR_ACCESS_PIN`. Same throttle behavior (per-IP attempt counter, lockout after N wrong, returns `{ ok, attempts_remaining, minutes_remaining }`). Adds CORS, no JWT required.
- **New secret** `INVESTOR_ACCESS_PIN` — added via `add_secret`. You'll enter the 4-digit PIN in the secure form.
- **New component** `src/components/investor/InvestorPinGate.tsx` — extracts the keypad UI from `DeckPinGated` (so we don't fork the deck pin page). Props: `onUnlocked(): void`. Handles 23-day localStorage persistence.
- **`src/pages/Investor.tsx`** — wrap the existing return value with the gate. If not unlocked, render `<InvestorPinGate onUnlocked={...} />` instead of the landing. NDA flow itself is unchanged.

## Optional URL bypass

URLs like `zen.solar/investor?pin=1234` will be auto-filled into the keypad and submitted on mount (one attempt; failures fall back to manual entry). This makes shareable links work as "tap and you're in" while keeping the PIN required.

## Out of scope

- No changes to the existing `/deck` PIN, `deck-pin-verify`, NDA text, or unlocked-panel CTAs.
- No new database tables — the edge function uses the same in-memory/Redis throttle pattern as `deck-pin-verify` (will mirror whatever that one uses).
