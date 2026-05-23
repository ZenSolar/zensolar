# Web App Upgrade Spec

Goal: take the current beta dashboard (which we like) and give it a real **web-app posture** at `lg:`+ breakpoints — without touching the mobile PWA experience, the emerald brand, or any copy.

Mobile (`< lg`) renders **exactly as today**. Every upgrade below is desktop-only and additive.

---

## Sacred — do not touch

- Mobile-first layout, 100svh/100dvh, safe-area insets
- Emerald palette, "Less is More" tone, all current copy
- FirstRunHero, Tokenomics 101, Energy Command Center, Token Price, Flywheel, NFT Milestones, Reward Actions
- `/demo-leonardo` parity (every shared component change mirrors automatically)
- Auth flow, wallet plumbing, mint logic, RLS, edge functions

---

## Phase 1 — Desktop layout container

A single shell wrapper around the dashboard route. Mobile: pass-through. Desktop:

```text
┌─────────────────────────────────────────────────────┐
│ AppSidebar (sticky, enriched)  │  max-w-3xl main   │
│                                │                    │
│  • Wallet pill (status + tier) │  Dashboard content │
│  • Mints ready badge           │  unchanged, just   │
│  • Last sync timestamp         │  centered with     │
│  • Nav (current items)         │  breathing room    │
│                                │                    │
└─────────────────────────────────────────────────────┘
```

- `max-w-3xl mx-auto px-6` on the main column at `lg:`+
- Sidebar uses existing `collapsible="icon"` shadcn pattern
- No reflow of cards, no new tiles — just generous gutters

## Phase 2 — Glanceable sidebar (desktop only)

Add a **status block** above the existing nav items:

- Wallet status pill: `Connected · Tier 2` (or `Connect wallet` CTA)
- Mints ready: `3 mints ready` chip → clicks to mint flow
- Last energy sync: `Synced 2m ago`
- Subtle divider, then current nav

Collapsed (icon-only) state shows just dots/icons with tooltips.

## Phase 3 — Keyboard layer

Global shortcuts, registered once at the dashboard shell:

- `M` → open mint sheet
- `R` → refresh energy sync
- `⌘K` / `Ctrl+K` → command palette (shadcn `Command` component)
  - Jump to: Wallet, Mint, Profile, Referrals, NFT Collection, Settings, Energy Log
  - Quick actions: Connect wallet, Copy address, Sign out

Disabled when typing in inputs. Hint chip in sidebar footer: `⌘K`.

## Phase 4 — Density toggle

User preference, persisted to `profiles.ui_density` (`comfortable` | `compact`).

- Comfortable = current spacing (default)
- Compact = `-2` on card padding, tighter line-height, smaller card titles
- Toggle in Settings + sidebar footer

CSS-only via a `data-density` attribute on the dashboard root.

---

## Files touched

**New**
- `src/components/web/DashboardShell.tsx` — responsive 2-col wrapper
- `src/components/web/SidebarStatus.tsx` — wallet pill, mints ready, sync time
- `src/components/web/CommandPalette.tsx` — ⌘K
- `src/hooks/useKeyboardShortcuts.ts`
- `src/hooks/useDensity.ts`

**Edited**
- `src/components/AppSidebar.tsx` — mount `SidebarStatus` on desktop
- `src/pages/Dashboard.tsx` — wrap in `DashboardShell`, apply `data-density`
- `src/pages/Settings.tsx` — add density toggle row
- `supabase/migrations/*` — add `profiles.ui_density text default 'comfortable'`

**Demo mirror**
- `src/pages/DemoLeonardo.tsx` — same shell wrap (no auth-gated bits)

---

## Out of scope (future passes)

- Bento grid / multi-column main area
- Multi-pane workspaces (split view, side panels)
- Drag-to-reorder cards
- Notification center redesign
- Marketing site changes

---

## Rollout

1. Ship Phase 1 alone, verify on mobile + desktop + `/demo-leonardo`
2. Phase 2 + 3 together (sidebar status + ⌘K — they share the same data hooks)
3. Phase 4 last (needs migration)

Each phase is independently revertable.
