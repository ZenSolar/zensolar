---
name: Proof-of-Genesis unified receipt + action
description: "Proof of Genesis" is the canonical name for BOTH the minting action (formerly Tap-to-Mint™) and the receipt page. PoG (owner) and PoA (public) receipts are one URL with two render modes.
type: feature
---

# Proof of Genesis (unified)

## Naming (Jun 2026)
**"Proof of Genesis"** is the single canonical name for two things:
1. The **minting action** — what was previously called "Tap-to-Mint™". The user taps the device tile, the protocol verifies kWh and writes a hash-chained record on-chain.
2. The **receipt page** at `/proof-of-genesis` (owner) and `/verify/:chain_hash` (public) that displays the result.

Copy should read naturally as one concept: "Tap your device → Proof of Genesis receipt minted on-chain." Never re-introduce "Tap-to-Mint™" outside the legal patent filing and archived pages.

## Receipt unification (unchanged from prior)
The Proof-of-Genesis™ receipt (owner view) and the Proof-of-Authenticity™ public verify page are ONE receipt with two render modes.

**Canonical public share URL:** `/verify/:chain_hash` — no auth, wallet masked, brand-matched to the owner page.

**Owner-only preview:** `/proof-of-genesis-receipt-preview` — still exists, shows latest mint with full owner context.

**Single source of truth for verification UI:** `src/components/proof/TamperEvidentProofPanel.tsx` — embedded inside BOTH pages so the hash-chain / Merkle / inclusion-proof UI is identical and impossible-to-miss.

**Key rules:**
- Quick View mint receipt drawer (`ReceiptDrawer`) "Open the full receipt" CTA links to `/verify/:chain_hash` when present, falling back to the preview page only for legacy mints without a chain hash.
- `useLatestMintReceipt` selects `chain_hash` and exposes it on `LiveMintReceipt`.
- The `ProofOfAuthenticityStamp` (embossed corner seal) stays as a brand watermark on both views, but real verification lives in the panel.
- CO₂ headline + brand shell are the same on both views; public view masks wallet with `0x••…`.
- Receipt line items must reflect the actual mint attribution, not every telemetry row in the settlement window. Legacy `mint-rewards` rows with no explicit `source_breakdown` are Tesla Supercharging-only; do not infer Home Charging, Solar, or Battery just because rows exist nearby.
- Never re-introduce a separate "Proof of Authenticity" page with different chrome — that's the redundancy this consolidation removed.
