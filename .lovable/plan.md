## Plan: Add three visuals to /investor/why-this-round

Edit only `src/pages/InvestorWhyThisRound.tsx`. Existing copy/sections stay intact.

### 1. Use of Funds chart (Section 4)
- Add a horizontal bar chart below the 5-item list using Recharts (`BarChart` with `layout="vertical"`).
- Categories use shortened labels (Token Launch & LP, Legal & Audits, App & Onboarding, Growth, Runway).
- Allocation percentages (sum = 100): Token Launch & Liquidity 25%, Legal/Compliance/Audits 20%, App Polish & Onboarding 15%, Growth & User Acquisition 15%, Operational Runway 25%.
- Note under chart: "Indicative allocation across the $2.5M – $3.5M range."
- Styled with `hsl(var(--secondary))` bars on `bg-card/30` rounded container; no axis decorations beyond what's needed; labels visible on mobile.

### 2. Flywheel diagram (Section 7)
- Insert an SVG flywheel visual ABOVE the existing numbered steps (keep the steps as explanatory text below).
- Layout: 6 nodes arranged in a circle (300×300 SVG, responsive `viewBox`), connected with curved arrows forming a clockwise loop. Center label: "The Flywheel".
- Short node labels: "Subscriptions → LP", "More Users", "Stronger Liquidity", "Better Token", "More Minting", "Data Revenue".
- Subtle Framer Motion: rotate the connecting ring slowly (one 60s loop) and fade-in nodes on mount. Respect `prefers-reduced-motion`.
- Use `hsl(var(--secondary))` strokes, muted fills.

### 3. Two-Round timeline (Section 8)
- Add horizontal timeline ABOVE the existing 3-block grid inside the runway card.
- 4 markers: Round 1 (Rocket) → Flywheel Activation (Activity) → Round 2 (TrendingUp) → Self-Sustainability (CheckCircle2).
- Connecting line uses border tokens; active markers use `bg-secondary/20` with `border-secondary`.
- On mobile, stays horizontal but scales down icon/label sizes; labels wrap under markers.

### Constraints
- No new dependencies (Recharts + framer-motion already installed).
- Dark theme tokens only.
- Mobile-first; verify at 390×844.

### Verification
- Load /investor/why-this-round on desktop and 390×844, confirm three visuals render without overflow and the rest of the page is unchanged.