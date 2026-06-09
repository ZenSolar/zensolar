## Plan: Proof-of-Genesis Flow Diagram + Minting UX

### Goal
Insert a clean horizontal flow diagram and a short Minting UX note inside the existing "03 · Technical Foundation" section on `/investor/why-this-round`, directly below the current 5 bullet cards.

### Placement
Inside `src/pages/InvestorWhyThisRound.tsx`, after the closing `</div>` of the bullet-card grid within the Technical Foundation `<Section>` and before the section ends.

### What to build
1. **Inline component: `ProofOfGenesisFlowDiagram`**
   - 4 steps in a horizontal row (stack vertically on mobile / 390×844):
     - **Hardware Telemetry** — "Direct OAuth2 from Tesla, Enphase, SolarEdge, Wallbox"
     - **Cryptographic Verification** — "Proof-of-Delta™ Validation"
     - **On-Chain Anchoring** — "Immutable On-Chain Record"
     - **One-Tap Minting** — "Coinbase Smart Wallet — One Tap"
   - Each step rendered as a rounded card (`border-border/60 bg-card/40`) with a small icon or circle accent using `text-secondary`.
   - Subtle connecting arrows (SVG or simple div with arrow icon) between steps.
   - Small header above the flow: "Proof-of-Genesis Flow" (`text-[11px] uppercase tracking-[0.24em] text-secondary/80` — matching existing kicker style).
   - Framer Motion staggered fade-in for each step, respecting `useReducedMotion()`.
   - On mobile: steps stack vertically with arrows pointing down between them.

2. **Minting UX note**
   - After the diagram, add one supporting line:
     > "This design removes traditional crypto onboarding friction entirely — users never need seed phrases, external wallets, or gas fees to mint."
   - Styled as muted text (`text-sm text-muted-foreground`) with comfortable top margin.

### Styling constraints
- Use existing Tailwind design tokens only (`border-border/60`, `bg-card/40`, `text-secondary`, `text-foreground`, `text-muted-foreground`).
- No bright colors or illustrated icons — keep it minimal and professional.
- Fully responsive: horizontal on desktop, stacked vertical on mobile (390×844).
- Respect `prefers-reduced-motion` via `useReducedMotion()` (already imported in the file).

### File changes
- Only edit `src/pages/InvestorWhyThisRound.tsx`.
- Do not modify, remove, or renumber any existing content, bullets, or other visuals (Use of Funds chart, Flywheel, Timeline).

### Verification
- Preview `/investor/why-this-round` at desktop and 390×844.
- Confirm the flow diagram and UX line render cleanly inside Technical Foundation.
- Confirm no layout breakage or overflow.
- Confirm all other sections remain unchanged.