---
name: Proof-of-Genesis Verification Stack
description: How ZenSolar verifies real-world clean-energy production before minting $ZSOLAR. 10-layer defense stack already shipping or specified, with 3-phase roadmap (Seed → Series A Chainlink DON → Series B ZK-Proof-of-Genesis). Use this when answering "how do you prevent fraud?" — any investor will ask.
type: feature
---

# Proof-of-Genesis Verification Stack

> **Defers to `mem://CANONICAL_SSOT.md`.** This file documents *how* we verify the kWh that gets minted. The SSoT documents *what* gets minted.

## The reframe (lead with this)

ZenSolar is **not** a Web3 energy app. It is a **verification system that happens to mint a token**. Every fraud-prevention question reduces to: "show me the verification stack." Below is the answer.

---

## The 10-layer stack (shipping or specified)

| # | Layer | Status | What it prevents |
|---|---|---|---|
| 1 | **Multi-OEM OAuth ingestion** (Tesla, SolarEdge, Enphase, Wallbox) | ✅ Shipping | Fake/spoofed production data — provider signs at source |
| 2 | **`DeviceWatermarkRegistry.sol`** — one device → one wallet, on-chain | ✅ Shipping | Sybil attacks (one panel array minting to 100 wallets) |
| 3 | **Server-side mint reconciliation** (edge functions, never client-asserted) | ✅ Shipping | Wallet-side mint inflation |
| 4 | **Weather cross-reference** (`useWeather` + irradiance check) | ✅ Shipping | Solar at midnight, "production" during storms |
| 5 | **Bidirectional EV mint** (charge + discharge + miles + FSD) — separate proofs | ✅ Shipping | Double-counting between EV roles |
| 6 | **Receipt + CO₂ framing** — every mint = verifiable carbon receipt | ✅ Shipping | "Where did this token come from?" auditability |
| 7 | **Subscription dual-gate** — only paying subs can mint | ✅ Shipping | Free-mint Sybil farms (economic gate, not just technical) |
| 8 | **Producer-gated LP rounds** — earn-to-buy, kWh-weighted caps | ✅ Specified | Whale/day-trader capture of supply |
| 9 | **VPP settlement path** — grid-utility cross-confirmation | 🔧 In spec | Off-grid spoofing in regions with VPP coverage |
| 10 | **5-layer Scarcity Stack** (cap + burn + halving + pact-lock + POL) | ✅ Locked | Inflationary attacks at the protocol level (not verification, but downstream of trust) |

**This is what already exists or is locked in spec — before we even touch decentralized oracles or ZK.**

---

## 3-phase verification roadmap

### Phase 1 — Seed (now → mainnet launch)
**Trust model:** ZenSolar edge functions are the trusted oracle. Mints happen server-side after the 10-layer checks above.

**Acknowledged risk:** A successful breach of Supabase service-role credentials could mint fraudulent supply.

**Mitigations:**
- Multisig on contract upgrade authority
- On-chain `DeviceWatermarkRegistry` snapshots (Proof-of-Permanence™) make any anomaly forensically detectable
- Hard cap (1T) limits worst-case blast radius
- 20% burn-per-mint structurally penalizes any inflation event
- Subscription gate means attack scales linearly with attacker's payment graph

**Investor framing:** *"We're a centralized oracle today, the same way Coinbase is a centralized custodian — and we're decentralizing on the same timeline post-Series A. The verification stack is already 10 layers deep before we add decentralization."*

### Phase 2 — Post-seed (Series A)
**Migrate to Chainlink Functions / DON** (Decentralized Oracle Network):
- N independent nodes fetch the OEM API
- Smart contract requires consensus before minting
- Removes ZenSolar as single point of trust
- Pairs with **Energy Price Oracle** (already memo'd at `mem://roadmap/energy-price-oracle`)

### Phase 3 — Series B
**ZK-Proof-of-Genesis** (see Patent Track 4):
- Users prove ≥ X kWh produced **without revealing exact location, time, or consumption curve**
- Solves EU/CA PII compliance (energy data is PII in those jurisdictions)
- Enables enterprise/government participation
- Patent-defensible moat

---

## What Gemini (and competitors) recommend that we don't need now

| Their suggestion | Why we defer |
|---|---|
| Hardware-signed inverters | Tesla/Enphase/SolarEdge won't ship blockchain-ready hardware for 5+ years. We use their OAuth-signed APIs as the bridge. |
| Chainlink at launch | Phase 2. Adds complexity + cost without addressing a current attack vector at our scale. |
| ZK at launch | Phase 3. Patent-file now (Track 4), implement later. |

## What WE have that no comparable project has

Our edge over generic "Web3 energy" answers:
- **OEM OAuth + watermark + weather + dual-gate is unique** — most projects have 1–2 of these, not 4+
- **Bidirectional EV** (most "energy" tokens ignore EV entirely)
- **Producer-gated LP** (no one else inverts the pay-to-buy model)
- **5-layer Scarcity Stack tied to the verification stack** — most tokens have separate stories for "how it's verified" and "why it's scarce." Ours are one story.

## The investor line

> *"Bitcoin spent 15 years building one verification mechanism (PoW) and one scarcity mechanism (halving). ZenSolar ships with 10 verification layers and 5 scarcity layers — and every layer is tied to productive clean energy instead of wasted compute. The decentralization roadmap is on the same timeline as our Series A and B, not a precondition for launch."*

## Why
Established 2026-04-29. Joseph asked a clarifying question to Gemini about Proof-of-Genesis verification; the response was generic Web3 textbook stuff and missed the fact that we already have most of it shipping. Locking the actual stack here so no future pitch / investor Q&A / due diligence response has to reconstruct it from scratch.
