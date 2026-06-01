## Update Investor One-Pager Screenshots

### Background
The investor one-pager (`/investor/one-pager`) currently references two screenshots in `public/investor/one-pager/`:
- `zen-monitoring.png` — Zen Monitoring live multi-OEM energy cockpit
- `tap-to-mint.png` — Tap-to-Mint™ verified kWh → $ZSOLAR flow

Both screenshots are outdated relative to the current app UI.

### Plan

1. **Capture fresh Zen Monitoring screenshot**
   - Navigate to the dashboard’s live energy monitoring view (the multi-OEM cockpit with solar / Powerwall / Tesla / Wallbox telemetry)
   - Use desktop viewport (~1280×800) so the screenshot is crisp on the one-pager grid
   - Save as `zen-monitoring.png`

2. **Capture fresh Tap-to-Mint screenshot**
   - Navigate to the mint flow (pending-rewards → mint dialog / confirmation)
   - Capture the moment that best communicates “verified kWh becomes $ZSOLAR”
   - Save as `tap-to-mint.png`

3. **Replace assets**
   - Overwrite `public/investor/one-pager/zen-monitoring.png`
   - Overwrite `public/investor/one-pager/tap-to-mint.png`

4. **Verify**
   - Open `/investor/one-pager` in the preview
   - Confirm both images render correctly in the Moat section’s 2-column grid
   - Confirm print styles still work (`break-inside: avoid`)

### Technical note
The `/demo-leonardo` ungated route exists in `App.tsx` but the dashboard chunk was still loading in preview during exploration. If it doesn’t render in the preview environment, we’ll fall back to using any available public preview route (e.g., `/proof-of-genesis-receipt-preview`, `/preview/mint-flow-micro`) or ask you to supply replacement screenshots.