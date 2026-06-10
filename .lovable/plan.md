# Settings — Deason AI Integration (additive only)

## Heads up
I searched the codebase and the rows referenced in the screenshots (Phone Pairing, Operational Mode, Storm Watch, Utility Rate Plan, Powerwall, Vehicle Charging, Wi-Fi) do **not** exist in `src/pages/Settings.tsx` or anywhere else in the project. The live `/settings` page currently shows: Wallet Setup, Security, Density, Notifications, Privacy & Preferences, Blockchain Network.

So the rename/badge items in the original task can't apply. I'll do the two purely additive pieces, which work regardless of the surrounding rows, and match Tesla-style row chrome (icon left, title + subtitle, chevron right).

## Changes (only `src/pages/Settings.tsx`)

1. **New section: "Deason AI Insights"**
   - Inserted near the top of the two-column grid (first card), so it's prominent on mobile.
   - Single row:
     - Icon: `Sparkles` (amber)
     - Title: **Energy Optimization**
     - Subtitle: *Your personal AI Energy CFO — monthly reports, bill analysis, contract review, and proactive tips*
     - Chevron right
     - Wrapped in `<Link to="/deason">`

2. **New row: "Utility Bill Analysis"**
   - Added as a second row in the same Deason AI Insights card (keeps both Deason entries grouped).
   - Icon: `FileText`
   - Title: **Utility Bill Analysis**
   - Subtitle: *Upload your latest bill — Deason will analyze your rate plan and find savings opportunities*
   - Chevron right
   - Wrapped in `<Link to="/deason?intent=bill-upload">` (Deason can read the `intent` query param later to auto-open the upload flow; no Deason-side changes in this task)

3. **Row styling**
   - Reuses the existing `SettingRow`-style markup pattern (border-b, py-3, icon + title/subtitle), with a small `ChevronRight` on the right to match Tesla list rows.
   - No changes to existing rows, density toggle, notifications, privacy, blockchain, or wallet cards.

## Out of scope (explicitly skipped)
- No rename of non-existent "Storm Watch" row.
- No badge on non-existent "Operational Mode" row.
- No new pages, no Live Energy card changes, no other sections.

## Final reply
After implementation I will reply exactly with:
> Settings menu polished — Tesla-inspired layout + Deason AI integration added to existing page.
