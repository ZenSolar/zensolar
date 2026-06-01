## Goal

Refresh the math tables in `.lovable/memory/features/tiered-subscriptions-halving-flywheel.md` so every number is consistent with the **v3.1 mint split (50% user / 20% LP / 20% burn / 10% treasury)** instead of the legacy 75/20/3/2. Keep the file's locked 10:1 mint ratio (v2.1) and qualitative conclusions intact — only the share math changes.

## Scope (this file only)

### 1. Header + principles
- §1 line "Mint split unchanged: 75% user / 20% burn / 3% LP / 2% treasury" → **"Mint split (v3.1): 50% user / 20% LP / 20% burn / 10% treasury."**
- Bump description / heading note to mark math refreshed for v3.1 user share.

### 2. §5 baseline assumption
- Replace "1,000 raw tokens minted/user/month → 750 to user (75% of mint)" with **"1,000 raw tokens minted/user/month → 500 to user (50% of mint)"**.

### 3. §5 "Before Genesis Halving" table — recompute (sell-rate × user tokens × $0.10 floor)

| Tier | LP/user/mo | User tokens | Sold tokens | Sell pressure ($) | Net (LP − sells) |
|---|---|---|---|---|---|
| Base (90% sell) | $4.995 | 500 | 450 | $45.00 | **−$40.005** |
| Regular (25% sell) | $9.995 | 500 | 125 | $12.50 | **−$2.505** |
| Power (5% sell) | $24.995 | 500 | 25 | $2.50 | **+$22.495** |

### 4. §5 "After Genesis Halving" table — recompute (500 raw → 250 user tokens)

| Tier | LP/user/mo | User tokens | Sold tokens | Sell pressure ($) | Net (LP − sells) |
|---|---|---|---|---|---|
| Base | $4.995 | 250 | 225 | $22.50 | **−$17.505** |
| Regular | $9.995 | 250 | 62.5 | $6.25 | **+$3.745** |
| Power | $24.995 | 250 | 12.5 | $1.25 | **+$23.745** |

### 5. Key-insight paragraph under §5
- Keep narrative: Regular flips net-positive at halving, Power compounds, Base subsidized. Numbers still support it (Regular: −$2.51 → +$3.75; Power positive both sides; Base less deep underwater than before because user share halved).

### 6. Bottom note
- Rewrite the "Note on §5 illustrative math" paragraph: drop the "modeled at old 1:1 / 75% share" caveat, replace with a one-liner stating tables are now on v3.1 (50% user share) at the locked 10:1 ratio; absolute dollar magnitudes still scale ~10× smaller under real 10:1 throughput, directional conclusions unchanged.

### 7. §12 forbidden phrasings
- Add: **❌ "75% user share" → ✅ "50% user share (v3.1)"**.

## Out of scope

- §2 subscription tier pricing and LP/treasury split (untouched — that's the 50/50 subscription rule, independent of mint split).
- §3 sell-rate assumptions (unchanged).
- §4 Genesis Halving mechanics (unchanged).
- §6–§11 (cohort mix, staking, soft cap, Satoshi-Mirror interaction, open questions, cross-refs) — no edits.
- 10:1 mint ratio (still locked v2.1 per this file).
- No code, no other memory files, no tests.

## Verification

- `rg "75%|750|187\.5|37\.5|67\.50|62\.50|8\.75|21\.25|337\.5|93\.75|18\.75|33\.75|28\.75|0\.62|23\.12"` in this file → 0 hits.
- `rg "50% user|500|450|125|25|225|62\.5|12\.5"` confirms new figures present in §5.
- Manual re-derivation: LP/user is subscription-side and unchanged; user tokens = 0.5 × raw; sold = sell-rate × user tokens; $ = sold × $0.10; net = LP − $.
