## Status check (most of this is already done)

I ran the checks against the live code — here's the actual state vs. what the task asks for:

| Item from task | Status |
|---|---|
| Slide01Title founder line ("Co-founded by Joseph Maushart & Michael Tschida · clean-tech users & best friends") | ✅ **already live** (line 39 of `Slide01Title.tsx` matches the SSOT rule exactly) |
| 7 slides/components with v3.1 flywheel language (Slide07ValueMechanism, Slide09Revenue, ThreeRevenueEngines, ReceiptDrawer, CashOutExplainer, AdminContracts pie, MintHistory) | ✅ **already shipped** in the earlier v3.1 SSOT pass |
| Backend SSOT = 50/20/20/10 (`MINT_DISTRIBUTION` + `MODEL_VERSION = 3.1`) | ✅ **already live** in `src/lib/tokenomics.ts` |
| `mem://features/mint-split-v3-locked.md` | ❌ **MISSING** — earlier turn reported it as created but `ls` confirms the file is not on disk. This is the only real open item. |

Also worth flagging: this prompt asks me to reply with a fixed canned sentence and ship "the exact plan you just proposed." I didn't propose a plan this turn — looks like a stale template paste. I'd rather surface what's actually open than blindly echo "complete."

## Proposed scope (tiny — just close the one real gap)

### 1. Create `mem://features/mint-split-v3-locked.md`

Content (mirrors what other v3.1 memory files reference back to):

```markdown
---
name: Mint Split v3.1 (LOCKED · LIVE)
description: SSOT for the v3.1 mint distribution — 50% user / 20% LP / 20% burn / 10% treasury. UI always shows 1 kWh = 1 $ZSOLAR; backend reconciles on raw 100% mint. Supersedes 50/25/20/3/2 (proposed, never live) and legacy 75/20/3/2.
type: feature
---

# Mint Split v3.1 (LOCKED · LIVE)

## The split (LOCKED)
- 50% user
- 20% LP (direct add)
- 20% burn (continuous deflation — supersedes the deprecated Genesis Halving)
- 10% treasury (runway, ops, future buyback)

## UI rule (1:1 display)
- UI ALWAYS shows 1 kWh = 1 $ZSOLAR.
- `tokens_minted` written to the DB = the user's 50% share.
- Any "full mint" / pie visualization back-derives the gross: `gross = tokens_minted / 0.5`.
- Never multiply user balances by 2 or by `1 / USER_SHARE` outside the explicit pie/visualization path.

## Code anchors
- `src/lib/tokenomics.ts` — `MINT_DISTRIBUTION = { user: 50, lp: 20, burn: 20, treasury: 10 }`, `MODEL_VERSION = 3.1`.
- `src/hooks/useLatestMintReceipt.ts` — `USER_SHARE = 0.5`.
- `src/lib/__tests__/mintReconciliation.test.ts` — fixture asserts 50/100 invariant.

## "Matching contribution" UX framing
- Protocol's 50% share is framed as a 401(k)-style match (20% LP + 20% burn + 10% treasury), never as a haircut.
- Cashout explainer: "No hidden splits — what you see is what swaps."

## Supersedes
- 75/20/3/2 (legacy)
- 50/25/20/3/2 (proposed v3.0, never live)

## Cross-references
- `mem://features/tiered-subscriptions-flywheel.md` — steady-state flywheel math under v3.1
- `mem://features/tokenomics.md`
- `mem://index.md` Core block
```

### 2. Update `mem://index.md` Memories list

The current entry points to `mem://features/mint-split-v3-locked.md` with description "50/25/20/3/2 split, UI 1:1 rule, supersedes 75/20/3/2" — both the description AND the actual link target match the new file we'd create. Update the description to **"v3.1 LIVE: 50/20/20/10 split, UI 1:1, 401(k)-match framing. Supersedes 50/25/20/3/2 and 75/20/3/2."** so it matches the file contents.

## Out of scope (already done — do not re-touch)

- Slide01Title founder line.
- Slide07ValueMechanism, Slide09Revenue, ThreeRevenueEngines, ReceiptDrawer, CashOutExplainer, AdminContracts, MintHistory copy.
- `src/lib/tokenomics.ts` SSOT.
- The `/deck` page itself.

## Closing line

If you want me to ship just this gap, approve and I'll execute. After that I can reply with the exact canned sentence you requested — but I want you to know what was actually shipped vs. what was already done, rather than rubber-stamp it.
