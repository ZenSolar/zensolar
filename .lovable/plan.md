# Unified Onboarding + "Quiet Current" Premium UI

Approved flow structure is unchanged. This plan layers the Quiet Current premium visual/motion/copy system across every screen and adds the three signature moments (Live Proof, Secure Account, Dashboard Handoff).

## Final flow (unchanged from prior plan)

```text
/onboarding          → resume router
  ├─ signin          → passwordless email OTP
  ├─ verify          → OTP code
  ├─ home            → device inventory (multi-select)
  ├─ tesla|solar|charger → device connect modules
  ├─ proof   (NEW)   → convergence live-proof moment
  ├─ account (NEW)   → biometric-style account activation
  └─ done    (NEW)   → device + account status, glow handoff to dashboard
```

`/beta/*` legacy routes redirect to `/onboarding/*`. Legacy monolithic `Onboarding.tsx` removed from routing.

## Implementation steps

### A. Foundation — Quiet Current design system

1. **Tokens** (`src/index.css`, `tailwind.config.ts`)
   - Canvas `#0A0C0E`, card `#121417`, elevated `#1B1E22`, text `#E8EAED`, muted `#8B9198`, border `#2A2D31` — as HSL semantic tokens (`--qc-canvas`, `--qc-surface`, `--qc-elevated`, etc.), mapped through Tailwind extensions.
   - Signature gradient token `--qc-current: linear-gradient(135deg, #00E19B, #00C2FF)` — used only for CTA rest glow, live pulse, success fill, activation fill.
   - Ban check: no purple/violet/gold usage in any new onboarding component; audit via grep during build.
2. **Typography** (`index.html` + tokens)
   - Load Inter (UI) and JetBrains Mono (numeric readouts) from Google Fonts.
   - Tailwind extension `font-numeric` for kWh/%/range readouts.
3. **Motion primitives** (`src/components/onboarding/quiet/`)
   - `<QCScreen>` — page wrapper providing 250ms cross-fade + 10px upward drift on mount/exit (framer-motion `AnimatePresence`).
   - `<QCPulse>` — 2.4s opacity+glow-radius loop for live states (ease-in-out, no scale).
   - `<QCCountUp value={n} unit="kWh"/>` — 500ms ease-out count-up, monospace numeric face.
   - `<QCGlyph name="vehicle|solar|battery|charger|signal">` — custom monoline SVGs (2px stroke, 24 grid, rounded caps) with `state="idle|active|live"`; active swaps stroke for signature-gradient fill.
   - `<QCButton variant="primary|ghost">` — primary uses gradient-outline + soft resting glow, hover intensifies glow only (no color swap).
   - `<QCLoader>` — pulse-based, never a spinner.
   - `<QCInput>` — dark surface, gradient focus ring.
   - `<QCSelectCard>` — border + fill-tint on select, no checkbox glyph.

### B. Shell + progress

4. Replace `BetaShell` with `<QCScreen>` using Quiet Current chrome: graphite canvas, minimal logo mark, top progress dots (Home · Devices · Proof · Account · Done) rendered as thin lines that fill with the signature gradient as steps complete.

### C. Screens (structure preserved, UI rebuilt)

5. **signin/verify** — single centered `<QCInput>`, faint drifting gradient background (very low opacity, slow), signature glow only on input focus ring. Copy: "Enter your email." / "We sent you a code."
6. **home** — `<QCSelectCard>` grid: 1-col mobile, 2-col ≥640px. Each card = custom `<QCGlyph>` + label. Selection = gradient border + subtle fill tint. No emoji. Categories: Vehicle, Solar, Battery, Charger, Not sure yet.
7. **tesla/solar/charger pre-consent** — center the category `<QCGlyph state="active">` with idle pulse and one line of copy ("Connecting Tesla…"). Cross-fade into external OAuth, no abrupt jump. On return, snapshot number arrives via `<QCCountUp>`.
8. **proof (NEW `OnboardingProof.tsx`)** — convergence choreography (~2.5s):
   - Connected-category glyphs positioned at screen edges (SVG absolute layout).
   - Animated thin gradient polylines travel from each glyph to a central node using framer-motion `pathLength` 0→1, staggered 150ms apart.
   - Central node fills with signature gradient and enters `<QCPulse>` on arrival.
   - Underneath, per-category `<QCCountUp>` readouts fire in sync with each line arriving (Solar kWh today, Battery %, EV miles, Home charging kWh — only for connected categories, sourced from existing `useDashboardData`/telemetry hooks).
   - Closing line: "Your home is one system now." Primary CTA: "Secure your account".
9. **account (NEW `OnboardingAccount.tsx`)** — biometric activation, not wallet setup:
   - Centered custom "signal seal" glyph (unique mark, not a wallet icon), idle state.
   - Primary CTA `Activate account` triggers passkey ceremony via existing `useCoinbaseSmartWallet`. During ceremony: glyph enters slow pulse.
   - On success: glyph fills with signature gradient and holds (activated). Copy: "Account activated."
   - Secondary link "I already have a wallet" opens a visually distinct, more technical panel that reuses existing Reown/AppKit connect (address, network) — permitted to look technical per brief.
   - Tertiary text link "Skip for now" sets `beta_status.account = { state: 'skipped' }`.
   - Copy avoids wallet/mint/chain/gas/sign/seed.
10. **done (rebuild `OnboardingDone.tsx`)** — 5 rows (Vehicle, Solar, Battery, Charger, Account). Status expressed via glyph state (outline / gradient-filled / soft pulse). No checkmark badges. Primary CTA `Enter dashboard` triggers the handoff (step D).

### D. Dashboard glow handoff

11. On `Enter dashboard` press:
    - Overlay a full-bleed 500ms signature-gradient sweep (linear-gradient translate X 0→100%, then fade), then navigate to `/`.
    - Wrap dashboard tile grid in a staggered enter (`framer-motion` stagger 80ms, fastest first, ease-out fade + 8px drift).
    - Tiles whose telemetry is live carry `<QCPulse>` on their status indicator, continuing the Proof screen's motif.
    - Implemented as a small `DashboardEnterEffect` component mounted once and keyed by a `?fromOnboarding=1` query param so it only fires on the handoff, not on regular visits.

### E. State + routing

12. Extend `useBetaFlow` step union with `'proof' | 'account' | 'done'`; extend `beta_status` with `account: { state: 'pending'|'secured'|'skipped' }`. Update `computeNextStep` to route through proof → account (unless secured/skipped) → done.
13. `src/App.tsx` — add `/onboarding/*` routes pointing at the new screens; convert `/beta/*` to `<Navigate replace>` to `/onboarding/*` (preserve `/beta/i/:token`). Old `/onboarding` monolithic component removed from routing.
14. Non-blocking dashboard reminder — small dismissible pill "Secure your ZenSolar account" appears when `profiles.wallet_address` is null AND onboarding complete. Uses the same monoline glyph + subtle border, no exclamation copy. Mint/claim UI stays gated on wallet address; nothing else is blocked.

### F. Copy pass (Quiet Current tone)

15. Rewrite every string in the flow to the microcopy table: short declarative, no exclamations, no "Awesome/Woohoo/Let's go", no crypto vocabulary. Explicit rewrites: "Connected." / "Secure your account." / "Account activated." / "That didn't go through. Try again." / "3 devices connected." / "One step left."

## Guardrails (enforced during implementation)

- No emoji, cartoon mascot, confetti, coin/rocket/moon, purple/gold, stock photo, Material shadow, or spinner in any new or edited onboarding file.
- No `wallet`, `mint`, `chain`, `gas`, `sign`, `seed phrase` in primary-path copy (secondary "I already have a wallet" path exempted per brief).
- No scale-bounce or elastic easing. All motion physics-based ease-out.
- Reuse existing Coinbase Smart Wallet, Reown/AppKit, Tesla/Enphase/SolarEdge OAuth, Base config — no new SDK work.

## Verification (before shipping message)

1. Fresh user: signin → home → device modules → proof → account (passkey) → done → dashboard handoff.
2. Same flow, Skip account → done shows Account = Pending → dashboard shows dismissible reminder.
3. Secondary "I already have a wallet" path connects via Reown and marks Account = secured.
4. Resume mid-flow after sign-out at each step, including proof/account.
5. `/beta/*` legacy URLs redirect to `/onboarding/*`.
6. Grep audit: no emoji, no banned color hexes, no banned copy tokens in `src/pages/onboarding/**` and `src/components/onboarding/quiet/**`.
7. Motion audit: no `animate-spin`, no `bounce`/`elastic` easing in new files.

## Out of scope

Tokenomics, mint amounts, subscription billing, Proof-of-Genesis, dashboard redesign beyond the handoff sweep + tile stagger + live-pulse indicator reuse.

## Deliverable message after ship

`Unified onboarding implemented with Quiet Current premium UI — device-first flow, deferred account setup, no generic emoji treatment.`
