# UX Audit — Enhancement Roadmap (Apr 2026)

Captured while shipping the 19-finding fix sweep. Each entry: what was fixed, what we noticed nearby, effort tier (S/M/L), user-impact (cosmetic/meaningful/wow).

---

## Commit 1 — P0 fixes ✅ COMPLETE

### P0-1/2: Routing 404s — DONE
**Fixed:** Added redirects in `src/App.tsx` for `/mint → /mint-history`, `/energy-logs → /energy-log`, `/my-energy-logs → /energy-log`, `/nfts → /nft-collection`, `/referral → /referrals`. (Removed duplicate `/founders` — already registered at line 985.)
**Noticed nearby:**
- `App.tsx` is 1000+ lines of repeated `<ProtectedRoute><AppLayout>...</AppLayout></ProtectedRoute>` boilerplate. **(M, meaningful)** — extract a `<ProtectedAppRoute element={...}/>` wrapper to cut ~400 lines.
- No central route registry. **(S, meaningful)** — define routes once in a typed constants file, derive sitemap + sidebar from it.
- 95+ pages, many admin/founder-only. **(M, wow)** — code-split admin to its own bundle so end users don't pay the cost.

### P0-3: Sidebar trigger stuck focus — DONE
**Fixed:** `src/components/ui/sidebar.tsx` — `focus:outline-none focus-visible:ring-2 focus-visible:ring-ring`. Keyboard users still get a ring; mouse/touch no longer see stuck yellow.
**Noticed nearby:**
- This pattern likely affects every `<Button variant="ghost" size="icon">` in the app. **(M, meaningful)** — apply same fix to base `Button` ghost variant in `button.tsx`.

### P0-4: Profile empty/unlabeled tiles — DONE
**Fixed:** `src/pages/Profile.tsx` — added uppercase labels (Joined / Status / Code / Network) below each stat tile. N/A → em-dash.
**Noticed nearby:**
- Tiles show static data ("Active", "Sepolia"). **(M, wow)** — replace with **live** stats: lifetime $ZSOLAR earned, NFTs owned, day-streak, referral count.
- 4 different tile hues feels arbitrary. **(S, cosmetic)** — see Commit 5: unify on primary opacity steps.

### P0-5: Referrals share UI silent vanish — DONE
**Fixed:** `src/components/dashboard/ReferralCard.tsx` — replaced `return null` early-exit with a proper loading skeleton card AND a "code being generated" empty state. Users will never again see nothing on `/referrals`.
**Noticed nearby:**
- `useProfile()` is called by both `Referrals.tsx` AND `ReferralCard` — duplicate fetch. **(S, meaningful)** — pass `profile` as prop.
- Share text is hardcoded English. **(M, meaningful)** — i18n hook for share copy.
- No analytics on referral share/copy clicks. **(S, wow)** — fire `analytics.track('referral_shared')` to measure viral coefficient.

### P0-6: Founders area routes — VERIFIED, no fix needed
All 9 founder routes registered correctly at App.tsx lines 984-994: `/founders`, `/founder-pack`, `/whitepaper-phase-1/2`, `/founders/spacex`, `/app-overhaul-plan`, `/proof-of-genesis`, `/v2app`, `/deason-v3`, `/seed-ask`. Removed my redundant duplicate `/founders` redirect.
**Noticed nearby:**
- Founder routes are NOT wrapped in `ProtectedRoute` or `AppLayout` — they're public if you know the URL. **(L, meaningful)** — add a `<FounderRoute>` guard that checks the `founder` role before rendering.
- Inconsistent paths: `/founder-pack` (dash) vs `/founders/seed-ask` (slash). **(S, cosmetic)** — normalize to `/founders/*` namespace.

### P0-7: Demo gate QA panel hide toggle — DONE
**Fixed:** `src/components/demo/DemoAccessGate.tsx` — `iosQaEnabled` now respects `localStorage.zen_hide_qa === '1'`. Set it once in DevTools console for clean investor demos in preview.
**Noticed nearby:**
- No UI to toggle this — must use DevTools. **(S, meaningful)** — add a tiny "Hide QA" link in the diagnostics overlay itself.
- Preview environment leaks debug noise by default. **(M, meaningful)** — flip the default: `zen_show_qa=1` to opt-IN to diagnostics.

---

## Commit 2 — Sidebar identity (started)

### P1-6: Sidebar footer identity — DONE
**Fixed:** `src/components/layout/AppSidebar.tsx` footer:
- Falls back to "ZenSolar User" instead of nothing when display_name is null
- "Loading…" placeholder for email instead of empty
- Added Admin/Beta role badges alongside the existing VIP badge (so every user sees what tier they are)
- Display name truncates at 140px to prevent badge overflow
**Noticed nearby:**
- No login_count surfaced even though we track it. **(S, wow)** — show "Day 47 ⚡" streak badge.
- No quick role-switcher for admins toggling between user/admin views. **(M, meaningful)** — already have `UserViewToggle` component above; could be promoted to footer for one-tap access.
- `getInitials()` doesn't handle multi-word names well (returns all letters). **(S, cosmetic)** — limit to first 2.

---

## Pending (next turn)

- **C2 finish:** active-route 2px primary accent bar, group label typography polish
- **C3:** Header cleanup — weather chip mobile, badge shimmer intensity, h-16 px-5
- **C4:** Page polish — whitepaper layout, dashboard wallet card, settings mobile wrap, help/feedback header standardization, deferred wallet modal
- **C5:** Color & loading consistency — kill rainbow accents, swap Loader2 → BrandedSpinner globally
- **C6:** Spacing & typography pass — page wrapper, h1 sizes, card padding, tracking-tight on numbers

---

## Cross-cutting strategic enhancements

1. **Route registry refactor** — single source of truth for routes + sidebar + breadcrumbs + sitemap (M)
2. **Button focus pattern globalized** — fix focus-visible at base Button level (S)
3. **Profile tiles → live stats** — replace placeholder data with real engagement numbers (M, wow)
4. **Admin code-split** — `/admin/*` chunks should not load for end users (M)
5. **Color system audit** — kill rainbow accent pattern across NFT/profile/mint surfaces (M)
6. **Founder route guard** — `<FounderRoute>` wrapper (L, meaningful)
7. **Login streak badge** — "Day 47 ⚡" sidebar footer (S, wow)
8. **Referral analytics** — track shares/copies for viral coefficient measurement (S, wow)
9. **Demo QA opt-in default** — flip default to clean preview, opt-IN to diagnostics (M)

## Commit 2-3 Notes

### Sidebar accent helpers (P1-7)
**Fixed:** Added `navClass` / `navClassWithExtra` / `founderNavClass` helpers — left accent bar (emerald or amber) on active route, ~120 LOC reduction.
**Noticed:** All 6 admin sub-menus repeat the same Collapsible+map pattern. *Quick win:* extract `<AdminSubMenu icon label items />` component → another ~150 LOC saved. *Strategic:* drive the entire sidebar from a single nav-config array (already half there with `adminMenuGroups`).

### TopNav header (Commit 3)
**Fixed:** Weather widget hidden under 360px; live-beta badge hidden under 480px (xs: breakpoint) to prevent crowding on iPhone SE class devices.
**Noticed:** ThemeToggle + NotificationBell + WeatherWidget all render unconditionally even when user is on /auth /onboarding etc — slight wasted work. *Quick win:* memoize via route-aware HOC. *Strategic:* TopNav could host a global search (Ctrl-K) — tons of pages, no quick way to jump.

### FounderRoute guard (security upgrade)
**Fixed:** All 11 founder/deason routes now require founder role at the route level — defense-in-depth on top of page-level checks.
**Noticed:** `useIsFounder` and `useAdminCheck` both query `user_roles` independently — N+1 queries per page load. *Quick win:* unify into a single `useUserRoles()` hook with React Query caching.

## Round 4 — Dashboard polish + EnergyLog resilience (this commit)

**Shipped:**
- `CO2OffsetCard` — prominent emerald-accent card on dashboard, headline in **tons**, lbs + tree-years as context, skeleton loader, matches sidebar `border-l-2` styling.
- `EnergyLogFallback` — per-provider freshness panel with retry buttons. Reads `connected_devices.updated_at`, flags >36h as stale, calls correct edge function per provider (`tesla-data` / `enphase-data` / `solaredge-data` / `wallbox-data`).
- Referral analytics — `trackEvent` on share + copy (code vs link), success/cancel/failure variants. Surface key: `referral_share_click`, `referral_copy`, `referral_share_success`.
- Sidebar footer — "Day N ⚡" streak badge using `profiles.login_count`, solar-tinted to differentiate from role badges.
- TopNav — added `min-w-0 flex-shrink` to right cluster and `whitespace-nowrap` on Beta 10x to prevent overflow on 320–360px.

**Future enhancements to consider:**
1. Track *referral conversions* (signups attributed to a code) — needs `profiles.referred_by` GA pipeline.
2. Streak should compute *consecutive days* (requires `last_login_at` history table), not just total `login_count`.
3. EnergyLog: surface `last_updated` per data type, not just per provider, so users can see solar vs battery vs EV freshness independently.
4. CO2 card: add "vs last month" delta chip to make impact feel alive.
5. Provider retry should debounce + exponential-backoff toast cooldown to prevent rapid re-clicks hammering edge functions.

## Round 5 — MintHistory polish (Commit 4)

**Shipped:**
- Replaced all `Loader2` spinners with `Skeleton` shimmer rows for summary cards, pending activity grid, and transaction list — perceived performance now matches Dashboard.
- Added `border-l-2 border-l-primary/60` accent on summary cards to mirror sidebar/CO2 card identity system.
- Skeletons sized to actual content height (h-16 transactions, h-20 pending tiles, h-6 numbers) — no layout shift on load.

**Noticed nearby:**
1. Lint warns lines 184/187 reference amber-500/emerald-500 directly. *Quick win:* introduce `--accent-warm` and `--accent-cool` tokens in `index.css`, swap globally.
2. `formatDistanceToNow` runs on every render — stable values. *Quick win:* memoize per tx.id.
3. Block explorer URL is hardcoded sepolia. *Strategic:* read from `import.meta.env.VITE_BASE_NETWORK` so mainnet flip is one env var.
4. Pending activity recomputes baseline math client-side — same formula lives in 3+ places. *Strategic:* move to a Postgres view `v_pending_rewards` for single source of truth.
5. Transaction `Collapsible` doesn't preserve open state across pull-to-refresh. *Quick win:* lift `expandedTx` to URL hash for shareable deep links.

## Round 6 — BrandedSpinner introduction (Commit 5)

**Shipped:**
- New `src/components/ui/BrandedSpinner.tsx` — emerald primary ring, transparent top, 3 sizes (sm/md/lg), a11y `role="status" aria-label`. Replaces lucide `Loader2` for full-page loaders.
- Swapped the **5 highest-traffic full-page loaders**: `App.PageLoader` (lazy chunks), `RootRoute`, `ProtectedRoute`, `FounderRoute`, `ZenSolarDashboard.profileLoading`. These are the spinners every user sees during navigation.
- Inline button spinners (`Loader2 mr-2 h-4 w-4`) intentionally **left alone** — they're tightly coupled to button text spacing and a global swap risks visual regressions. Future commit can introduce a `<ButtonSpinner />` variant.

**Rainbow gradient audit:**
Surveyed 21 files using `from-purple-500 / from-pink / from-blue-500 to-indigo / from-amber-500 to-orange`. Categorized:
- **Intentional artwork** (keep): `SEGIArchitectureDiagram`, `MintOnProofInfographic`, `SEGIProofOfDeltaDiagram`, `MintOnProofFlowDiagram`, all `whitepaper/*`, all `Admin*` pages — these are diagrams/decks.
- **Decorative legitimate** (keep): NFT rarity tiers (`NFTGallery`, `NFTDetailModal`) — gradients encode rarity, removing them destroys signal.
- **Worth refactoring next pass**: `MintHistory` action gradients (4 colors for 4 action types), `RewardActions`, `Profile` tile hues. *Strategic:* introduce `--accent-warm` (amber), `--accent-cool` (indigo), `--accent-rare` (purple) as named semantic tokens so the palette is intentional, not arbitrary. Defer to Commit 6.

**Future enhancements:**
1. `<ButtonSpinner inline label="Saving..." />` — drop-in for the ~50 inline `Loader2 mr-2 h-4 w-4` patterns.
2. Admin pages all share the same full-page `Loader2` pattern — extract `<AdminPageLoader />` for one-shot swap of remaining 25+ files.
3. `BrandedSpinner` could grow a `withLabel` prop ("Loading dashboard…") for screen readers + low-bandwidth UX.
4. Consider replacing the spinning ring with the ZenSolar sun-mark SVG rotating — ~200 bytes more, infinite brand value on first paint.

## Round 7 — Typography + semantic accent tokens (Commit 6)

**Shipped:**
- 3 new semantic tokens in `src/index.css` (light + dark variants): `--accent-warm` (amber), `--accent-cool` (indigo), `--accent-rare` (purple). Each ships with `*-foreground`. Wired into `tailwind.config.ts` so `bg-accent-warm`, `text-accent-cool`, `border-accent-rare` all work as first-class utilities.
- MintHistory typography pass: `tracking-tight tabular-nums` on all numeric displays (summary cards, pending tiles), `min-w-0` on header text wrapper to prevent overflow on narrow viewports, container padding now responsive (`py-6 sm:py-8`).
- Spacing rhythm: section gap normalized to `space-y-6 sm:space-y-8` matching dashboard convention.

**Audit completion summary (7 rounds, ~22 findings shipped):**
| Round | Focus | Files touched |
|-------|-------|---------------|
| 1 | P0 routing/focus/profile/referrals/founders/demo-gate | 7 |
| 2 | Sidebar identity + active accent | 2 |
| 3 | Header mobile + FounderRoute guard | 3 |
| 4 | Dashboard CO₂ + EnergyLog resilience + streak + analytics | 8 |
| 5 | MintHistory skeletons + accent | 2 |
| 6 | BrandedSpinner + rainbow audit | 6 |
| 7 | Accent tokens + typography | 3 |

**Highest-leverage follow-ups (post-audit):**
1. **Migrate rainbow gradients → semantic tokens.** MintHistory `ACTION_LABELS` and Profile tile hues are obvious first targets — replace `from-amber-500 to-orange-600` with `from-accent-warm to-accent-warm/80`. Single-file PRs, big consistency win.
2. **Route registry refactor.** `App.tsx` is 1015 lines, ~80% boilerplate. Extract a typed `routes.config.ts` → derive sidebar, breadcrumbs, sitemap, protected/founder route wrapping. Saves ~400 LOC and eliminates entire 404-misregistration class of bugs.
3. **Unify role hooks.** `useIsFounder` + `useAdminCheck` + `useIsViewer` each query `user_roles` independently. One `useUserRoles()` with React Query → 3x fewer requests on every protected page mount.
4. **`<ButtonSpinner />` + `<AdminPageLoader />`.** Finish the BrandedSpinner story by covering the inline button case and the 25+ admin full-page loaders.
5. **`v_pending_rewards` Postgres view.** Same baseline-delta math lives in MintHistory + Dashboard + RewardActions. One view, three less drift sources.
6. **Live profile tiles.** Replace static "Active / Sepolia" with lifetime $ZSOLAR, NFTs owned, day-streak, referral count — turns Profile from status page into engagement loop.
7. **Streak v2.** `login_count` shows total — for true "Day N ⚡" needs a `login_history` table or a `last_streak_date + current_streak` pair on profile.
