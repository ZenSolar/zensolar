## SSOT Audit Sweep — Final Plan

### Fixes

**1. `/investor/pitch` — drop `$20M` from headline**
- `InvestorPitch.tsx:63` — replace `{ k: '$20M', v: 'Post-money' }` with `{ k: '$7M', v: 'Hard cap' }` (or similar tight stat).
- `InvestorPitch.tsx:136` — change "$5M target · $20M post-money · $7M hard cap" → "$5M target · $7M hard cap · SAFE (post-money)".
- `InvestorPitch.tsx:174` — strip "$20M post-money cap." keep dilution range generalized or remove the sentence.

**2. One-Pager Stat fix**
- `InvestorOnePager.tsx:107` — `<Stat k="SAFE" v="Post-money" />` → `<Stat k="Structure" v="SAFE" />`.

**3. Archive legacy SSOT pages** (per Q2)
- Move `src/pages/FoundersSeedPitch.tsx` → `src/pages/archive/FoundersSeedPitch.tsx`, wrap in `ArchivedPageWrapper`, re-mount at `/admin/archive/founders-seed-pitch`.
- Move `src/pages/FoundersSsotOnePager.tsx` → `src/pages/archive/FoundersSsotOnePager.tsx`, same wrapper + remount.
- Update `App.tsx`: remove original routes, add archive routes + redirects from old paths → `/investor`.
- Remove any nav/link references to these two pages.

**4. Memory update**
- Append to Core: "Legacy `Founders*` SSOT/seed pitch pages archived — `/investor`, `/investor/pitch`, `/investor/one-pager` are the only investor SSOT surfaces. Never resurrect 75/20/3/2 split copy."

### Out of scope (flagged, not touching)
- `tokenomics.ts` MODEL_VERSION 3.1 says `50/20/20/10` but Core memory says `50/25/20/3/2`. This mismatch is explicitly noted in memory as "queued as separate PR" — leaving for that dedicated PR.
- Dashboard hooks omitting Wallbox from solar/battery priority logic — correct, Wallbox is EV charging only.
- Archived pages under `src/pages/archive/*` containing legacy 75/20/3/2 copy — historical record, leave.

### Files touched
- `src/pages/InvestorPitch.tsx`
- `src/pages/InvestorOnePager.tsx`
- `src/pages/FoundersSeedPitch.tsx` → move to archive
- `src/pages/FoundersSsotOnePager.tsx` → move to archive
- `src/App.tsx` (route changes + redirects)
- `.lovable/memory/index.md`
