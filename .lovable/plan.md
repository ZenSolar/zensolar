## Bump NDA TTL from 24 hours to 23 days

### Goal
After an investor enters their PIN and signs the NDA on `/investor`, both the PIN unlock and the NDA signature should remain valid for the same 23-day window. Currently the PIN lasts 23 days but the NDA expires after 24 hours, causing a re-auth loop on reload.

### Changes
1. **`src/lib/reviewerAccess.ts`**
   - Line 42: change `24 * 60 * 60 * 1000` (24h) to `23 * 24 * 60 * 60 * 1000` (23d).

2. **`src/pages/DwightPreview.tsx`**
   - Line 25: update the inline comment from "24h TTL" to "23-day TTL".

No other logic changes needed.