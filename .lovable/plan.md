## Plan — Data Room PIN removal + One-Pager v3.1 alignment

### Part 1 — `src/pages/InvestorDataRoom.tsx`

Rewrite the file to a thin gate-free version:

- Remove all PIN scaffolding: `useState`, `supabase`, `toast`, `readInvestorUnlocked`, `SESSION_KEY`, `Loader2/KeyRound/Delete/Check/ShieldAlert`, the verify function, the keypad JSX, and the gated Helmet block.
- Keep `DataRoomContent()` exactly as-is (all six DeckCards, diagram embed, stat tiles, group divider, footer).
- Add directly above the existing `Confidential · Investor Data Room` kicker:
  `<p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Confidential — For verified investors only</p>`
- New default export:
  ```tsx
  export default function InvestorDataRoom() {
    useEffect(() => { document.title = "ZenSolar · Investor Data Room"; }, []);
    return <DataRoomContent />;
  }
  ```
- `src/App.tsx` route already has no `ProtectedRoute` wrapper — no change needed.

### Part 2 — `src/pages/InvestorOnePager.tsx`

Five small targeted edits, all copy-only; structure, helpers, and print CSS unchanged:

1. **Helmet description** (L39) → `"ZenSolar one-page investor summary — Proof-of-Genesis™, three revenue engines, $5M seed."`
2. **Hero sub-line** (L97–99) → `"Proof-of-Genesis™ — verified clean-energy minting on Base. Bitcoin-grade integrity at ~0.001% of the energy cost."`
3. **Engine 03** (L139–143) → retitle `"Aggregated Data + VPP (Scale Opportunity)"`; body: `"Anonymized multi-OEM telemetry sold to utilities, ISOs, REC registries + crypto-rewarding VPP settlement. $2B+ U.S. utility-analytics TAM; VPP layer adds $50–150 / household / yr at zero CapEx."`
4. **Phase 2 Unlock strip** (L148–159) → delete (folded into Engine 03).
5. **Moat section heading + lead** (L163–168) → `"The Moat — Proof-of-Genesis™ + multi-OEM monitoring"`. Lead sentence describes PoG (Bitcoin-grade integrity / near-zero overhead) then keeps the existing Tesla+Enphase+SolarEdge+Wallbox sentence as the second moat layer.
6. **Traction tile** (L187) → label `"Patent-pending PoG"` (value unchanged).

Untouched: header, Ask, Founders, footer, screenshots, sticky chrome, print CSS, helper components, existing NDA/PIN gate that protects the One-Pager itself (not part of this task).

### Out of scope

No backend, no new routes, no design-system edits, no other pages.

### Final reply

`Investor Data Room PIN gate removed + One-Pager updated to align with Deck v3.1.`
