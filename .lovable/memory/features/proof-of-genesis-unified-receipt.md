---
name: Proof-of-Genesis unified receipt
description: PoG (owner) and PoA (public) receipts are unified — one URL, one share link, TamperEvidentProofPanel everywhere
type: feature
---
The Proof-of-Genesis™ receipt (owner view) and the Proof-of-Authenticity™ public verify page are now ONE receipt with two render modes.

**Canonical public share URL:** `/verify/:chain_hash` — no auth, wallet masked, brand-matched to the owner page.

**Owner-only preview:** `/proof-of-genesis-receipt-preview` — still exists, shows latest mint with full owner context.

**Single source of truth for verification UI:** `src/components/proof/TamperEvidentProofPanel.tsx` — embedded inside BOTH pages so the hash-chain / Merkle / inclusion-proof UI is identical and impossible-to-miss.

**Key rules:**
- Quick View mint receipt drawer (`ReceiptDrawer`) "Open the full receipt" CTA links to `/verify/:chain_hash` when present, falling back to the preview page only for legacy mints without a chain hash.
- `useLatestMintReceipt` selects `chain_hash` and exposes it on `LiveMintReceipt`.
- The `ProofOfAuthenticityStamp` (embossed corner seal) stays as a brand watermark on both views, but real verification lives in the panel.
- CO₂ headline + brand shell are the same on both views; public view masks wallet with `0x••…`.
- Never re-introduce a separate "Proof of Authenticity" page with different chrome — that's the redundancy this consolidation removed.
