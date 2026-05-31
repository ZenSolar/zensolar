# Investor NDA Landing Page (`/investor`)

A public, mobile-first landing page at `zen.solar/investor` that lets prospective investors read the ZenSolar story, sign a mutual NDA, and immediately receive deck + data room links.

## Page structure

```
/investor (public, dark-mode, Tesla-style hub aesthetic)
├── Hero — "Creating Currency From Energy"
│     logo · 1-line pitch · "$0.10 launch · 1T cap · Patent-pending"
│     primary CTA → scrolls to NDA block
├── Why now (3 short stat tiles)
│     • $1.7T clean-energy spend · 75% mint-to-user · Tap-to-Mint™ patent-pending
├── What you unlock after signing (preview list, locked-state icons)
│     • Seed deck (PDF) · Companion deck · One-pager · Tokenomics model · Founder bios · Live demo
├── NDA block (reuses <NdaSignatureStep />)
│     • First/last name + email + type-to-sign + scroll-to-agree
│     • Stores row in nda_signatures with access_code_used = "INVESTOR_LANDING"
│     • Triggers send-nda-copy edge function (existing) for email receipt
└── Post-sign reveal (same page, swaps NDA block for unlocked panel)
      • Big "Thank you, {first name}" + signed timestamp
      • Cards linking to: Seed Pitch Deck, Companion Deck, One-Pager,
        Tokenomics, Live Investor Demo, Schedule a call (mailto founders)
      • "Email me these links again" button (re-fires send-nda-copy)
```

State persists via `localStorage` (`zs_investor_nda_signed:{email}`) **and** a server-side `check_nda_signed(email)` recheck on mount so returning investors skip straight to the unlocked panel.

## NDA content — standard mutual NDA for ZenSolar

Reuses the existing `NDA_TEXT` in `NdaSignatureStep.tsx` (already a clean mutual NDA: 5-yr term, Texas governing law, no-reverse-engineering, IP carve-outs, patent #19/634,402, Tap-to-Mint™ etc.). No new draft needed — that text was approved for the existing demo gate and works for this landing too. NDA version stays at `1.0`.

## Gating posture

- Page itself is fully public — anyone can read hero + preview the unlock list.
- The deck/data-room links live behind the NDA reveal (not behind admin/founder routes), so a signed investor can self-serve.
- Deck links open the existing `/founders/seed-pitch-greg` and `/founders/seed-pitch-companion-deck` routes. **Note:** those currently use `ReviewerOrFounderRoute`. We will add a lightweight `NdaSignedRoute` wrapper that allows access if either (a) the existing reviewer/founder check passes **or** (b) `check_nda_signed(email)` returns true for an email stored in localStorage from the investor flow. Admin one-pager stays admin-only; we will mirror its content into a new public `/investor/one-pager` view rendered from the same source data.
- No Stripe, no paywall, no new payment logic.

## Files to add

- `src/pages/Investor.tsx` — the landing page
- `src/components/investor/InvestorHero.tsx`
- `src/components/investor/InvestorUnlockPreview.tsx`
- `src/components/investor/InvestorUnlockedPanel.tsx` (post-sign reveal)
- `src/components/auth/NdaSignedRoute.tsx` — guard for deck routes
- `src/pages/InvestorOnePager.tsx` — NDA-gated public mirror of admin one-pager content
- Route registration in `src/App.tsx`: `/investor`, `/investor/one-pager`

## Files to touch

- `src/App.tsx` — add the two routes (public, no auth required for `/investor`; `NdaSignedRoute` for `/investor/one-pager` and deck mirrors)
- `src/pages/FoundersSeedPitch.tsx` / `FoundersSeedPitchCompanionDeck.tsx` — swap `ReviewerOrFounderRoute` for `NdaSignedRoute` so NDA-signed investors can view (founders still pass through the same guard)

## Database

No migration needed. `nda_signatures` table, `check_nda_signed(email)`, `get_nda_signer_name(email)`, and `send-nda-copy` edge function already exist and are reused as-is. The new page just inserts rows with `access_code_used = 'INVESTOR_LANDING'` so we can analytics-filter investor signers in `demo_access_log`.

## Design

Matches existing Tesla-dark hub — `bg-background`, semantic tokens only, ZenSolar logo, generous spacing, single hero animation (subtle gradient pulse), no light-mode toggle. Mobile-first at 390×844, scales to desktop.

## SEO

- `<title>` Investor Access — ZenSolar (<60 chars)
- meta description: "Sign our NDA to access the ZenSolar seed deck, tokenomics model, and live demo. Creating currency from energy." (<160 chars)
- Single H1: "Creating Currency From Energy"
- `noindex` on `/investor/one-pager` and the unlocked panel; `/investor` itself is indexable.

## Out of scope (per your earlier directive)

- No Stripe / payment processing
- No new role or paywall logic
- No changes to founder/admin gating beyond letting NDA-signed investors view the deck mirrors
