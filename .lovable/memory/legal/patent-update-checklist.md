---
name: Patent Update Checklist (grounded in as-filed disclosure)
description: Three-track filing strategy for App 19/634,402 — Track 1 (Preliminary Amendment by July 2 2026), Track 2 (new Provisional), Track 3 (CIP candidates)
type: feature
---

# Patent Update Checklist

**Source of truth:** `/public/documents/ZenSolar_Utility_Patent_Application.docx` (as-filed non-provisional).

## Filing Facts (locked)
- **Provisional:** No. 63/782,397, filed **April 2, 2025** ("Gamifying and Tokenizing Sustainable Behaviors")
- **Non-Provisional:** App. No. **19/634,402**, Confirmation **#4783**, Attorney Docket ZEN-001
- **Title:** "System and Method for Tokenizing and Gamifying Verified Clean Energy and Real-World Activity Using Blockchain Technology"
- **As-filed claims:** 13 (1 independent system + 1 independent method + 11 dependents)
- **As-filed figures:** FIG. 1–12
- **Preliminary Amendment safe-harbor deadline:** **July 2, 2026** (3-month window under 37 CFR §1.115(b)(3))
- **Hard rule:** Preliminary Amendment **CANNOT add new matter**. Only formal drawings + clarifying claim language supported by the existing disclosure.

---

## Track 1 — Preliminary Amendment (by July 2, 2026)
Items already supported by the as-filed spec/claims. Safe to add as elaborations, dependent claims, or formal drawings.

### 1.1 — Robotaxi / Cybercab fleet miles
- **Disclosure hook:** ¶[0048] explicitly: *"the dual-mode architecture additionally supports future robotaxi fleet telemetry, wherein vehicles operating in commercial autonomous ride-hailing service generate tokenizable miles classified under the unsupervised mode with additional fleet operator metadata."*
- **Claim hook:** Claim 10 already covers *"classification of commercial robotaxi fleet miles under the unsupervised mode with additional fleet operator metadata encoded in the cryptographic proof."*
- **Action:** Add dependent claim drilling Cybercab-specific fleet operator metadata fields (vehicle role, ride session ID, paid-mile vs deadhead-mile classification).

### 1.2 — FSD Supervised vs Unsupervised separation
- **Disclosure hook:** ¶[0045]–[0047] + Claims 9 + 10 already establish dual-watermark architecture (W_supervised, W_unsupervised).
- **Action:** Add formal drawing (FIG. 9 detail) showing the dual hash chains side-by-side. **No new matter.**

### 1.3 — Proof-of-Permanence™ (rename of cumulative Merkle anchoring concept)
- **Disclosure hook:** ¶[0042] *"the Device Watermark Registry additionally implements a Merkle snapshot mechanism: at configurable intervals, the system computes a Merkle root of all device watermarks and publishes this root on-chain"* + Claim 5 *"publish periodic Merkle root snapshots of all device watermarks on-chain."*
- **Action:** Add dependent claim naming the on-chain Merkle anchoring as **Proof-of-Permanence™ ("The Eternal Ledger")** — this is just naming an already-disclosed mechanism. Confirm with attorney whether the rename qualifies as scope-clarifying (Track 1) or new matter (Track 3).
- **Risk:** Low. The mechanism is fully described; only the trademarked label is new.

### 1.4 — Tap-to-Mint™ user-initiated mint trigger
- **Disclosure hook:** ¶[0033] step (e) *"submitting the verified proof and token quantity to the smart contract for atomic minting"* — disclosed but not gated on a user action.
- **Action:** Likely Track 1 if framed as an "embodiment" of the existing minting step. Confirm with attorney.

### 1.5 — Per-device Proof-of-Origin™ public verification page
- **Disclosure hook:** ¶[0042]–[0043] cross-platform auditability via Merkle snapshots + Claim 5(c) *"enable third-party verification."*
- **Action:** No new claim needed. Drawing update only — show user-facing verification UI as one consumer of the on-chain registry.

### 1.6 — Formal drawings for FIG. 1–12
- **Status:** As-filed drawings exist in `/public/documents/ZenSolar_Provisional_Patent_Drawings.pdf` and the embedded images in `ZenSolar_Utility_Patent_Application.docx`.
- **Action:** Convert to USPTO-compliant formal drawings (black-line, no shading, numbered reference labels matching ¶[0027]–[0061]).

---

## Track 2 — New Provisional (genuinely new matter)
Items NOT supported by the April 2 2025 disclosure. Must file as a separate provisional to claim a new priority date.

### 2.1 — Tesla Optimist humanoid robot tokenization
- **Why new:** Disclosure lists tokenizable activity types in ¶[0014], ¶[0029], Claim 6 — none mention humanoid robotics, robot-hours, robot-task-completion, or robot-energy-consumption.
- **What's new:** Robot-task-verified activity (e.g., hours of household labor, factory cycle counts), per-robot device hash, supervised vs autonomous robot operation modes.
- **Action:** Draft fresh provisional spec + at least 3 figures (robot device registry, task-verification flow, robot-hour delta computation).

### 2.2 — Starlink / SpaceX orbital telemetry tokenization
- **Why new:** Disclosure is earth-bound. No mention of satellites, orbital data, downlink-verified activity, or off-planet device hashing.
- **What's new:** Orbital device hash construction (satellite serial + orbital slot), downlink session telemetry as tokenizable activity, ground-station-relayed proof signatures.
- **Action:** Draft fresh provisional. May warrant its own attorney docket (ZEN-002).

### 2.3 — Tokenizing Optimist robotaxi/Cybercab interaction
- **Note:** If this is *just* Optimist operating a Cybercab (humanoid driver), it's covered under Track 1.1 + Track 2.1 in combination. If it's a novel robot-vehicle interaction protocol, it's Track 2.

---

## Track 3 — CIP Candidates (attorney decision)
Gray area: arguably supported, arguably new. Attorney must rule whether each fits within original disclosure or requires a Continuation-In-Part.

### 3.1 — Producer-gated LP rounds (ZPPA)
- **Disclosure hook (weak):** ¶[0057] mentions *"automated market maker (AMM) liquidity pools wherein token holders may provide liquidity"* — but says nothing about gating LP access by verified energy production.
- **Attorney question:** Is "gating LP purchase rights by verified kWh" a novel mechanism requiring its own claim, or an obvious extension of the existing AMM mention?

### 3.2 — Founder pact-locked allocations + crossover pricing
- **Disclosure hook:** None. Tokenomics is outside the scope of the as-filed application (which is about verification and minting, not allocation).
- **Likely outcome:** Not patentable subject matter (business method / tokenomics ≠ technical invention). Probably no patent action needed.

### 3.3 — Embedded Coinbase Wallet / Reown AppKit integration
- **Disclosure hook:** ¶[0056]–[0057] mentions *"smart wallet abstraction"* and *"embedded wallet interface."*
- **Likely outcome:** Track 1 if framed as "preferred embodiment of the embedded wallet interface."

---

## Drawings to Add or Update

| Fig | Status | Track | Action |
|-----|--------|-------|--------|
| FIG. 1 (SEGI 4-layer) | As-filed | T1 | Convert to formal drawing |
| FIG. 2 (Mint-on-Proof flow) | As-filed | T1 | Convert to formal drawing |
| FIG. 3 (Proof-of-Delta hash chain) | As-filed | T1 | Convert to formal drawing |
| FIG. 4 (Proof-of-Origin registry) | As-filed | T1 | Convert to formal drawing; add Proof-of-Permanence™ Merkle anchor callout |
| FIG. 5 (end-to-end flow) | As-filed | T1 | Convert to formal drawing |
| FIG. 6 (Milestone NFT) | As-filed | T1 | Convert to formal drawing |
| FIG. 7 (multi-provider API) | As-filed | T1 | Convert to formal drawing; ensure Tesla/Enphase/SolarEdge/Wallbox labeled |
| FIG. 8 (cross-platform double-mint prevention) | As-filed | T1 | Convert to formal drawing |
| FIG. 9 (FSD dual-mode) | As-filed | T1 | Convert; add explicit Cybercab/Robotaxi callout (supported by ¶[0048]) |
| FIG. 10 (baseline initialization) | As-filed | T1 | Convert to formal drawing |
| FIG. 11 (token distribution router) | As-filed | T1 | Convert to formal drawing |
| FIG. 12 (organizational hub) | As-filed | T1 | Convert to formal drawing |
| FIG. 13 (Proof-of-Permanence™ Merkle tree) | **NEW** | T1 (probably) | Draft — anchor cycle, snapshot interval, on-chain root publication |
| FIG. 14 (Optimist robot device registry) | **NEW** | **T2** | New provisional only |
| FIG. 15 (Starlink orbital telemetry) | **NEW** | **T2** | New provisional only |

---

## Open Questions for Attorney Session

1. Did we file the non-provisional **on or before April 2, 2026**? (Affects whether the July 2, 2026 safe harbor for Preliminary Amendment is still open.)
2. Is the **Proof-of-Permanence™** rename (item 1.3) Track 1 (naming a disclosed mechanism) or Track 3 (CIP candidate)?
3. Is **Tap-to-Mint™** (item 1.4) safely an "embodiment" or does it need its own provisional?
4. Should Optimist (2.1) and Starlink (2.2) be **one provisional** or **two** (different attorney dockets)?
5. For Track 3 items, what's the cost/timeline tradeoff of CIP vs new provisional?
6. Trademark applications for **Proof-of-Permanence™**, **Genesis Anchor™**, **Proof-of-Custody™** — file alongside or independent of patent track?

---

## Status: Draft, awaiting attorney review.
