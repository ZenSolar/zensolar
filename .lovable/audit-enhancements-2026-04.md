# UX Audit — Enhancement Roadmap (Apr 2026)

Captured while shipping the 19-finding fix sweep. Each entry: what was fixed, what we noticed nearby, effort tier (S/M/L), user-impact (cosmetic/meaningful/wow).

---

## Commit 1 — P0 fixes (partial — routing + profile + focus shipped)

### P0-1/2: Routing 404s — DONE
**Fixed:** Added redirects in `src/App.tsx` for `/mint → /mint-history`, `/energy-logs → /energy-log`, `/my-energy-logs → /energy-log`, `/nfts → /nft-collection`, `/referral → /referrals`, `/founders → FoundersVault`.
**Noticed nearby:**
- `App.tsx` is 1000+ lines of repeated `<ProtectedRoute><AppLayout>...</AppLayout></ProtectedRoute>` boilerplate. **(M, meaningful)** — extract a `<ProtectedAppRoute element={...}/>` wrapper to cut ~400 lines and make adding routes trivial.
- No `sitemap.ts` or central route registry; we rely on grepping. **(S, meaningful)** — define routes once in a typed constants file, derive sitemap + sidebar from it.
- 95+ pages, many admin/founder-only. Worth a lazy-route audit — some "admin" pages are 100KB+ chunks. **(M, wow)** — code-split admin to its own bundle.

### P0-3: Sidebar trigger stuck focus — DONE
**Fixed:** `src/components/ui/sidebar.tsx` — added `focus:outline-none focus-visible:ring-2 focus-visible:ring-ring` so keyboard users still get a ring, but mouse/touch users no longer see a stuck yellow box after tap.
**Noticed nearby:**
- This pattern likely affects every `<Button variant="ghost" size="icon">` in the app. **(M, meaningful)** — apply the same focus-visible pattern to the base `Button` ghost variant in `button.tsx`.
- The header (`TopNav`) also has the `SidebarTrigger` and may inherit the same issue — verify after ship. **(S)**

### P0-4: Profile empty/unlabeled tiles — DONE
**Fixed:** `src/pages/Profile.tsx` — added uppercase label below each of the 4 stat tiles (Joined / Status / Code / Network). N/A → em-dash for cleaner empty state.
**Noticed nearby:**
- The 4 tiles currently show static or near-static data ("Active", "Sepolia"). **(M, wow)** — replace with **live** stats: lifetime $ZSOLAR earned, NFTs owned, day-streak, referral count. Same visual, dramatically more useful.
- Tile colors are 4 different hues (primary/secondary/accent/purple) — feels arbitrary. **(S, cosmetic)** — see Commit 5: unify on primary opacity steps.
- Wallet pill is clickable to copy but no visual affordance besides Copy icon. **(S)** — add hover state + toast position consistency.

---

## Pending (next turns)

- **P0-5:** Verify ReferralCard renders share UI even mid-load (need to read `ReferralCard.tsx`)
- **P0-6:** Audit founders area routes — `/founders/seed-ask`, `/founders/spacex`, `/founders/app-overhaul-plan`, `/founders/v2app`, `/founders/proof-of-genesis`, `/founders/deason-v3`, `/founder-pack`, `/whitepaper-phase-1`, `/whitepaper-phase-2` — verify each is registered in App.tsx
- **P0-7:** Demo gate QA panel — add `localStorage.zen_hide_qa` toggle for noise-free preview demos
- **Commits 2-6:** Sidebar identity, header cleanup, page polish, color/loading consistency, spacing pass

---

## Cross-cutting strategic enhancements (surfaced during audit)

1. **Route registry refactor** — single source of truth for routes + sidebar + breadcrumbs + sitemap (M)
2. **Button focus pattern globalized** — fix the focus-visible issue at the base component level (S)
3. **Profile tiles → live stats** — replace placeholder data with real engagement numbers (M, wow)
4. **Admin code-split** — `/admin/*` chunks should not load for end users (M)
5. **Color system audit** — kill the rainbow accent pattern across NFT/profile/mint surfaces (M, meaningful)
