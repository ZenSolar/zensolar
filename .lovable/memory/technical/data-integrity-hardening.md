---
name: Data Integrity Hardening (Phase 1.5)
description: Five-step roadmap to harden the cryptographic chain from device → mint → on-chain anchor
type: feature
---

# Data Integrity Hardening — Phase 1.5

The patent claims an unbroken cryptographic chain. The app must enforce it.

## Step 1 — Per-reading device signature verification
Today: `energy_production` rows store `proof_metadata` JSON but no signature validation runs server-side.
Next: edge function `verify-device-signature` rejects insertions whose signature doesn't match the manufacturer-provided public key.

## Step 2 — SHA-256 hash chain enforcement at the database level
Today: chain integrity is convention, not enforced.
Next: trigger on `energy_production` insert that recomputes `SHA-256(device_id + recorded_at + production_wh + prev_hash)` and rejects mismatches.

## Step 3 — Atomic Proof-of-Delta watermark update
Today: `connected_devices.lifetime_totals` is updated by client-side flow.
Next: stored procedure `mint_with_delta(device_id, new_reading)` that:
  1. Reads current watermark with `FOR UPDATE` lock
  2. Computes delta
  3. Rejects if delta ≤ 0
  4. Inserts mint + updates watermark in single transaction

## Step 4 — Proof-of-Permanence™ Merkle snapshot scheduler
Today: nothing.
Next: cron edge function (every 6h) that:
  1. Computes Merkle root over all `connected_devices.lifetime_totals`
  2. Publishes root via on-chain anchor tx on Base L2
  3. Records anchor in new `proof_of_permanence_anchors` table (block_number, merkle_root, snapshot_at, device_count)

## Step 5 — Public verification endpoint
Today: nothing.
Next: public edge function `GET /verify/:poa_hash` returns:
  - The mint tx that produced this PoA hash
  - The device hash it's bound to
  - The most recent Merkle root that includes this watermark
  - Basescan deep links

## Why now
Patent Claim 5 asserts "third-party verification that any claimed activity range for a specific device has not been previously tokenized." Steps 4–5 are the implementation of that claim. Without them, the app's claim of cross-platform auditability is aspirational, not real.
