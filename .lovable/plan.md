## Add SolarCoin Comparison card to /investor

The `/investor/solarcoin-comparison` route exists but isn't linked from the investor landing page. Add a card alongside the other materials.

### Changes to `src/pages/Investor.tsx`

1. **Unlocked materials grid (~line 471)** — append a new `<UnlockedCard>` after "Investor Data Room", placed toward the bottom alongside One-Pager / Live Demo / Data Room:
   - icon: `GitCompare` (lucide-react)
   - title: "SolarCoin Comparison"
   - body: "How ZenSolar's consumer UX, AI, and tokenomics outpace legacy SolarCoin."
   - to: `/investor/solarcoin-comparison`

2. **Email unlocks list (`buildUnlocks`, ~line 100)** — append matching entry so the "email me these links again" message includes it:
   - `{ icon: FileText, label: 'SolarCoin Comparison', desc: 'UX, AI, and tokenomics vs legacy SolarCoin', to: '/investor/solarcoin-comparison' }`

3. **Imports** — add `GitCompare` to the existing `lucide-react` import.

No other files touched. Semantic tokens only, mobile-first, no new deps.