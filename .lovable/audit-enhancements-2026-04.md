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
