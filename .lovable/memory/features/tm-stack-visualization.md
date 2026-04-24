---
name: Trademark Stack Visualization (Layer 0–5)
description: Six-layer trademark architecture comparing ZenSolar to Bitcoin; Proof-of-Permanence™ sits in the infrastructure column
type: feature
---

# TM Stack — Layer 0 through Layer 5

The full ZenSolar trademark stack, organized as an infrastructure diagram with Bitcoin parallels.

## Layer 0 — Physical Substrate
- **Bitcoin:** ASIC mining hardware burning electricity
- **ZenSolar:** Solar panels, batteries, EVs, autonomous vehicles producing/consuming verifiable energy
- **TMs:** *(none — physical layer is open)*

## Layer 1 — Data Acquisition
- **Bitcoin:** Block headers + nonce
- **ZenSolar:** OAuth-authenticated manufacturer APIs (Tesla, Enphase, SolarEdge, Wallbox)
- **TMs:** **SEGI™** (Software-Enabled Gateway Interface) — the four-layer architecture

## Layer 2 — Verification Primitives
- **Bitcoin:** SHA-256 proof-of-work
- **ZenSolar:** SHA-256 hash chains binding device + timestamp + value + prevHash
- **TMs:** **Proof-of-Delta™** (incremental verification), **Mint-on-Proof™** (verification-gated issuance)

## Layer 3 — Identity & Provenance
- **Bitcoin:** Public key hashes
- **ZenSolar:** keccak256 device hashes (manufacturer_id + device_id) bound to physical hardware
- **TMs:** **Proof-of-Origin™** (Device Watermark Registry)

## Layer 4 — Permanence / Anchoring **← Proof-of-Permanence™ ("The Eternal Ledger")**
- **Bitcoin:** Longest chain rule + finality
- **ZenSolar:** Periodic Merkle root snapshots of all device watermarks published on Base L2
- **TMs:** **Proof-of-Permanence™** ("The Eternal Ledger") — *the renamed continuity primitive*

## Layer 5 — User Surface
- **Bitcoin:** Wallet addresses
- **ZenSolar:** Embedded Coinbase Wallet + Tap-to-Mint™ trigger + Proof-of-Genesis™ Receipt + per-device Proof-of-Origin™ pages
- **TMs:** **Tap-to-Mint™**, **Proof-of-Genesis™**, **ZPPA** (Zen Power Purchase Agreement)

---

## Frame for investors
"Bitcoin proves *energy was burned*. ZenSolar proves *energy was created* — and gives every joule a permanent, device-bound, on-chain home. Same cryptographic rigor, opposite environmental sign."

## UI surfacing requirement
Every layer 2–5 trademark MUST have a first-class consumer surface in the app. No primitive is allowed to live only in marketing copy.

| TM | Surface | Status |
|----|---------|--------|
| SEGI™ | `/technology` page | ✅ |
| Mint-on-Proof™ | Dashboard mint button | ✅ |
| Proof-of-Delta™ | PoG Receipt drawer | ✅ (Phase 1) |
| Proof-of-Origin™ | `/devices/:id/origin` per-device page | ✅ (Phase 1) |
| Proof-of-Permanence™ | Merkle anchor cycle viz on PoO page | 🚧 (Phase 1.5) |
| Tap-to-Mint™ | Dashboard primary CTA | ✅ |
| Proof-of-Genesis™ | `/proof-of-genesis-receipt-preview` | ✅ |
| ZPPA | Wallet badge | ✅ |
