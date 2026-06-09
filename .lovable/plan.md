# Plan: Major Final Polish Pass on /investor/why-this-round

Only file edited: `src/pages/InvestorWhyThisRound.tsx`.

## 1. Tighten copy throughout
Trim verbose bullets and paragraphs across sections 01, 03, 05, 06, 07, 09. Shorter hero subtitle. Remove duplication between section 03's bullet list and the Proof-of-Genesis flow diagram below it (drop the bullet list, let the flow diagram + a single intro line do the work). Bump section vertical spacing: `Section` mt from `mt-14 md:mt-16` → `mt-16 md:mt-20` for breathing room.

## 2. Use of Funds (Section 04) — real dollar ranges
Replace `USE_OF_FUNDS` data:

```text
Token Launch & Liquidity Seeding   $625K – $875K   25%
Legal, Compliance & Audits         $500K – $700K   20%
App Polish & Onboarding            $375K – $525K   15%
Growth & User Acquisition          $375K – $525K   15%
Operational Runway (18–24 mo)      $625K – $875K   25%
```

- Replace the prose bullet list above the chart with a compact 5-row list showing bucket name + dollar range (and small % chip).
- `UseOfFundsChart`: label each bar with `$XXX–$YYYK` instead of `%`; widen YAxis (`width={170}`) and bump bar container padding so labels never clip on 390px. Keep "Indicative allocation across the $2.5M – $3.5M range." footnote.

## 3. Flywheel (Section 07) — fix cutoff + tighten
- Reduce nodes from 6 → 5: `Subs → LP`, `More Users`, `Stronger Liquidity`, `Token Demand`, `Data Revenue`.
- Increase outer card padding (`p-6 md:p-8`) and diagram `max-w-[360px]` → `max-w-[400px]`.
- Pull node chips inward: position radius from `42%` → `36%` so chips stay well inside the card.
- Allow 2-line chip wrap: remove `whitespace-nowrap`, add `text-center leading-tight max-w-[92px]`.
- Tighten supporting list from 4 bullets → 3 short ones; remove anything already shown as a node label.

## 4. Add Milestones + Revenue Projections (Section 08)
New sub-block inside Section 08 titled **Milestones & Trajectory**, rendered as two stacked cards (mobile) / 2-col grid (desktop):

```text
End of Year 1   2,000–4,000 paying users
                Meaningful monthly LP inflows from subs begin

End of Year 2   8,000–12,000 paying users
                Compounding LP inflows + early data-revenue pilots
```

One-line caveat below: "Conservative ranges, not a forecast."

## 5. Two-Round Seed Strategy (Section 08)
New sub-block at the top of Section 08 titled **A two-part seed, not a Series A treadmill** — three short lines or three small cards:
- **Now (Part 1):** $2.5M – $3.5M to launch the token and ignite the flywheel.
- **Follow-on (Part 2):** $5M – $7M once early traction is proven.
- **Goal:** Combined raises carry the business to self-sustainability — reducing or eliminating the need for a traditional Series A.

Keep `TwoRoundTimeline` below for the visual.

## 6. Proof-of-Genesis Flow Diagram polish
Already in good shape — minor touch-ups only:
- Add a subtle connecting glow on the desktop horizontal line (`shadow-[0_0_8px_hsl(var(--secondary)/0.25)]` on the line div).
- Mobile: increase the gradient line opacity slightly and ensure step body text has `pr-1` so it doesn't crowd the right edge.

## 7. Spacing & quality pass
- Verify nothing overflows at 390×844 (Flywheel chips, Use of Funds bar labels, milestone cards).
- Use only existing semantic tokens (`secondary`, `border`, `card`, `foreground`, `muted-foreground`).
- No structural section reordering, no new files, no new dependencies.

## Out of scope
Any other file, design tokens, route changes, or backend work.
