
# Lock 50 / 20 / 20 / 10 Mint Split — Sequenced Rollout

**Execution order is sequential per your note:** ship Step 1 first, verify, then move to Steps 2–4.

---

## Step 1 — Trim `/investor` cards (ship first, verify, then continue)

Edit `src/pages/Investor.tsx` and its `buildUnlocks()`:
- **Keep:** Live Investor Demo (`/demo`), Full Pitch Deck (`/deck`)
- **Remove:** Investor Pitch · v2, Tokenomics & LP Model
- Sync the locked-state preview grid to match (2 cards, not 4)

**Verify:** `/investor` shows exactly 2 unlock cards at 393×587 + 1920×1080.

---

## Step 2 — Global split SSOT reset (50 / 20 / 20 / 10)

`src/lib/tokenomics.ts`:
```ts
export const MINT_DISTRIBUTION = { user: 50, lp: 20, burn: 20, treasury: 10 } as const;
```
- Bump `MODEL_VERSION` → `3.1`
- Update inline comments
- `useLatestMintReceipt.ts`: `USER_SHARE = 0.5` (keep "do NOT back-calc" comment; legacy rows still use stored deltas)
- Verify `RecentMintProofs.tsx` stays 1:1 to user
- Admin pie charts → 4 slices (50/20/20/10)
- Update test fixtures: `mintReconciliation.test.ts`, `chargingSplitInvariants.test.ts`

**Investor narrative surfaces:**
- `Slide07ValueMechanism.tsx` — middle card: "20% of every mint flows straight into the USDC liquidity pool — plus 50% of every sub dollar."
- `Slide09Revenue.tsx` + `ThreeRevenueEngines.tsx` — Engine 02 chip: `1T cap · 50 user · 20 LP · 20 burn · 10 treasury`

**Docs:** `BOOTSTRAP_TOKENOMICS.md`, `TOKENOMICS_OPTIMIZATION_FRAMEWORK.md` — find/replace split numbers.

**Out of scope:** smart contract, archive files, VPP split, subscription split, staking, Genesis Halving.

---

## Step 3 — "Matching contribution" UX copy

Frame the protocol mint as a **401(k)-style match**, never a haircut. UI stays 1:1.

- **Wallet first-mint tooltip** (one-shot, localStorage-persisted) in `WalletBalanceCard.tsx`:
  > **Where does the matching half go?**
  > Every kWh you verify mints **1 $ZSOLAR straight to your wallet**. The protocol mints an equal amount in the background:
  > · 20% liquidity pool — keeps your token redeemable
  > · 20% burn — keeps $ZSOLAR scarce forever
  > · 10% treasury — funds the mission
  > Think of it as a **401(k) match for clean energy**.

- **Cashout/swap screen** — inline subcopy under USDC quote:
  > *Quote based on your wallet balance × current pool price. No hidden splits — what you see is what swaps.*

- **Proof-of-Genesis receipt** — chevron link below mint amount: `[How the protocol matches →]` opens sheet with 4-slice chart + match framing.

- **Tokenomics explainer / Slide 07 hero:**
  > **Every kWh mints 1 $ZSOLAR to you. The protocol matches it 1-for-1 — burned, pooled, and reserved to make sure your token holds its value.**

---

## Step 4 — Memory + docs

- `mem://features/mint-split-v3-locked.md` → flip to **v3.1 (LIVE)**: 50/20/20/10, document matching-contribution framing, mark `tokenomics.ts` migration as shipped.
- `mem://index.md` Core line → "Mint split v3.1 (LOCKED): 50% user · 20% LP · 20% burn · 10% treasury. UI shows 1 kWh = 1 $ZSOLAR; protocol matches 1-for-1 in background (401(k)-match framing). Supersedes 50/25/20/3/2 and legacy 75/20/3/2."
- `mem://features/tokenomics.md` + `mem://features/mint-ratio-ssot.md` → sync example: 10 kWh → 10 user, 4 LP, 4 burn, 2 treasury.

---

## Verification (run after each step)

- `rg "75/20/3/2|50/25/20/3/2|user: 75|user: 25|lpFee" src/ --glob '!**/archive/**'` → 0 hits
- `rg "50/20/20/10" src/` → present in tokenomics.ts, deck slides, ThreeRevenueEngines, memory
- `/investor` shows 2 cards
- `/demo` tap-to-mint still 1:1
- Admin pie chart sums to 100% across 4 slices
- Tests green
