# Port /investor content → /seed pages, keep seed ask numbers

## Direction (reversed from before)
The `/investor` one-pager and pitch deck are the richer, canonical versions. Copy their content onto the `/seed` pages, but swap in the seed ask:
- **$1M target / $2M hard cap**
- **Convertible Note + 10% Token Warrant (4-year vesting, 1-year cliff)**
- **Use of funds:** Joseph $250k · LP $200k · Legal $55k · Audits $40k · Ops $15k · Buffer $440k

## Files to rewrite

### `src/pages/SeedOnePager.tsx`
- Replace body with the structure/copy from `InvestorOnePager.tsx` (hero, Three Revenue Engines framing, multi-OEM moat, founder pact, etc.).
- Keep the `/seed` nav/back link, Helmet canonical (`/seed/one-pager`), and PIN-gate flow intact.
- Override only the ask block + use-of-funds table with the seed numbers above.

### `src/pages/SeedDeck.tsx`
- Replace body with the structure/copy from `InvestorPitch.tsx` (hero, Catalyst, `<ThreeRevenueEngines />`, FAQ, footer).
- Keep `/seed` nav, Helmet canonical (`/seed/deck`), PIN-gate flow.
- Override "The Ask" section with the seed numbers + instrument language.

## Not touched
- `/investor/*` pages — unchanged.
- `/seed/ip`, `/seed` index — unchanged.
- PIN gate (`SeedPinGate`) — unchanged.

## Verification
- Read both `/investor` sources + both `/seed` targets before writing.
- After edits, grep `src/pages/Seed*.tsx` for `2.5M` / `3.5M` / `Part 1 of 2` → expect zero hits.
- Confirm `/seed/one-pager` and `/seed/deck` render with seed ask + investor narrative.