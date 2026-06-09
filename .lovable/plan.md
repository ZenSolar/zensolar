## Plan: Build full content for /investor/why-this-round

Replace the placeholder in `src/pages/InvestorWhyThisRound.tsx` with a full investor-grade page. No other files change.

### Sections (in order)

1. **Header** — Back link → /investor. H1 "Why We're Raising $2.5M – $3.5M Now" + provided subtitle.
2. **Where We Are Today** — "De-risked Progress" kicker, intro sentence, then a 4-item check-mark grid (CheckCircle2 icons) covering OAuth integrations, MVP minting, multi-OEM cockpit, Deason AI. Closing line: hardest technical work already working in beta.
3. **Product Capabilities Already Live** — 3-card grid (icons: Activity, Sparkles, Coins): Zen Monitoring, Deason AI, Proof-of-Genesis™ Minting.
4. **What This Round Will Fund** — 5 bullets in a styled list (5 use-of-funds items verbatim).
5. **Round Structure** — Card with Convertible Note (post-money), Token Warrant via side letter, 4-yr vesting / 1-yr cliff, NDA data-room note.
6. **GTM Strategy** — 4 bullets.
7. **How the Flywheel Works** — Numbered/stepped list (6 steps) with subtle arrows.
8. **Runway & Path to Self-Sustainability** — Card highlighting 18–24 mo runway + Round 1 / Round 2 / long-term vision.
9. **Long-Term Opportunity** — 4 bullets, closing tone.

End with CTA row: View Full Deck · Read One-Pager · Enter Data Room.

### Styling

- Match existing investor pages: `bg-background`, `border-border/60`, `bg-card/40`, `rounded-2xl/3xl`, secondary accents, generous spacing.
- Mobile-first (390×844), single-column at base, `md:grid-cols-{2|3}` on larger.
- Use lucide-react icons (CheckCircle2, Activity, Sparkles, Coins, FileText, Shield, TrendingUp, Rocket, ArrowRight, ArrowLeft).
- Helmet title/description updated.
- Dark theme tokens only — no custom colors.

### Verification

- Visit /investor/why-this-round at desktop and 390×844; confirm all 9 sections render, no overflow/clipping, CTA links work.