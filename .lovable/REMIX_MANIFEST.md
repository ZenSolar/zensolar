# Remix Route Manifest — Zen Solar (Customer Production Build)

**Purpose:** The clean, paying-customer version. No investor decks, no patent labs, no admin tools, no marketing experiments. If a route doesn't help a customer mint $ZSOLAR from their own energy, it does NOT come with.

**Target:** ~15 customer routes. Everything else stays in the original ("lab") project.

---

## 1. Routes to Keep (Customer Surface)

### Public / Auth (4)
| Route | Page | Purpose |
|---|---|---|
| `/` | `Index` (lean marketing landing) | Hero, value prop, "Connect your system" CTA |
| `/auth` | `Auth` | Sign in / sign up (Google + email) |
| `/terms` | `Terms` | Legal |
| `/privacy` | `Privacy` | Legal |

### Onboarding (1)
| `/onboarding` | `Onboarding` | Connect Tesla / Enphase / SolarEdge / Wallbox, claim devices |

### App — Authenticated Customer (10)
| Route | Page | Purpose |
|---|---|---|
| `/app` | `Dashboard` | Clean Energy Center — live flow, today's mint, balance |
| `/app/mint` | `MintHistory` | Tap-to-Mint history + receipts |
| `/app/devices` | `Devices` | Connected systems, add/remove, health |
| `/app/wallet` | `Wallet` | $ZSOLAR balance, embedded Coinbase wallet, send/receive |
| `/app/proof-of-genesis/:mintId` | `ProofOfGenesis` | The unified receipt (SSOT per mint-split memory) |
| `/app/referrals` | `Referrals` | Invite link + status |
| `/app/notifications` | `Notifications` | In-app inbox + push prefs |
| `/app/profile` | `Profile` | Account, wallet address, payout settings |
| `/app/settings` | `Settings` | Theme (dark-only enforced), units, language, danger zone |
| `/app/help` | `HelpCenter` | FAQ + contact support + feedback |

### Subscribe / Upgrade (1)
| `/subscribe` | `Subscribe` | Stripe paywall for pro tier (if pricing ships at launch) |

**Total: 16 customer routes** (vs 219 in the lab). Everything else → archive in original project.

---

## 2. Required Components (carry over)

**Core layout**
- `AppLayout`, `PageLoader`, `ThemeProvider` (forcedTheme="dark")
- `BottomNav` (mobile-first, 5 tabs: Home / Mint / Wallet / Devices / More)

**Energy + Mint**
- `EnergyFlowCard` (real one, not `InvestorEnergyFlowCard`)
- `TapToMintButton` + sheet
- `MintReceiptDrawer` (Quick View) + `ProofOfGenesisPage` (full receipt)
- `tokenomics.ts` (SSOT — 50/25/20/5 split, locked)

**Device connectors (UI shells only)**
- `TeslaConnectCard`, `EnphaseConnectCard`, `SolarEdgeConnectCard`, `WallboxConnectCard`
- `useDataSourceOfTruth` hook (per memory: one OEM per Solar/Battery)

**Wallet / Web3**
- `WalletProvider` (Reown AppKit + Coinbase embedded)
- `useMintOnchain`, `useWalletBalance`
- Network switcher locked to Base

**Auth + guards**
- `AuthGuard`, `useAuth`, `useUserRole` (uses `has_role` security-definer)

**Shared UI**
- Shadcn primitives, `Toaster`, `Sonner`, `ConfettiOverlay`, `SoundFx`

---

## 3. Edge Functions to Keep (~25 of 80)

### Auth & account (5)
- `auth-email-hook`, `delete-account`, `refresh-provider-tokens`, `verify-turnstile`, `get-turnstile-site-key`

### Device connect / data (10)
- `tesla-auth`, `tesla-data`, `tesla-devices`, `tesla-historical`
- `enphase-auth`, `enphase-data`, `enphase-devices`
- `solaredge-auth`, `solaredge-data`
- `wallbox-auth`, `wallbox-data`, `wallbox-refresh-tokens`
- `claim-devices`, `sync-device-names`

### Mint / on-chain (4)
- `mint-onchain`, `verify-mint-receipt`, `calculate-rewards`, `anchor-permanence-snapshot`

### Wallet config (2)
- `get-walletconnect-project-id`, `get-vapid-public-key`

### Notifications (4)
- `send-push-notification`, `flush-pending-push-messages`, `send-transactional-email`, `process-email-queue`
- `handle-email-unsubscribe`, `handle-email-suppression`

### Referrals (1)
- `process-referral`

### Cron / housekeeping (2)
- `send-reminder-notifications`, `verify-user-invariants`

**Drop from remix (~55):**
All `admin-*`, `investor-*`, `founders-*`, `vault-*`, `deck-*`, `deason-*`, `cheetah-*`, `starlink-*`, `notify-vip-*`, `notify-mint-access-request`, `send-demo-attendees-report`, `send-nda-copy`, `generate-energy-insights-report`, `auto-journal`, `tesla-fsd-*`, `tesla-ev-miles-backfill`, `tesla-telemetry-*`, `tesla-charge-monitor`, `enphase-backfill-devices`, `enphase-historical`, `enphase-inverters`, `reset-baselines`, `reset-user-nfts`, `generate-weekly-*`, `analyze-bill`, `onboarding-concierge`, `preview-transactional-email`, `admin-preview-emails`, etc.

---

## 4. DB Schema to Carry

**Keep tables:**
`profiles`, `user_roles`, `connected_devices`, `device_readings`, `mints`, `mint_receipts`, `proof_of_genesis_anchors`, `wallets`, `referrals`, `notifications`, `push_subscriptions`, `email_suppressions`, `subscriptions` (Stripe).

**Drop:** investor_pins, deck_pins, vault_pins, founder_docs, demo_attendees, beta_invites, patent_*, cheetah_*, journal_entries, weekly_digests, all `admin_*` audit tables not needed at launch.

Carry the latest migration set, NOT the full history — fresh DB, clean baseline.

---

## 5. Secrets to Re-add in Remix

Required: `RESEND_API_KEY`, `TURNSTILE_*`, `WALLETCONNECT_PROJECT_ID`, `TESLA_*`, `ENPHASE_*`, `SOLAREDGE_*`, `WALLBOX_*`, `COINBASE_*`, `STRIPE_*`, VAPID keys, mint signer key.

Drop: any investor/admin/patent-specific secrets.

---

## 6. First 5 Minutes Smoke Test (must pass before invite #1)
1. Land on `/` → click "Get started" → Google sign-in works
2. Onboarding → connect Tesla → see panels + Powerwall populate
3. Dashboard → live energy flow renders < 2s
4. Tap-to-Mint → receipt opens → on-chain anchor link works
5. Wallet → balance shows, Proof of Genesis link resolves

---

## On your Sepolia question

**Short answer: yes — same default as today.**

Per the `Mainnet Anchor Switch` memory, PoG anchors are on **Base Sepolia** until production launch. The remix should ship in the same state:

- Mint contract + anchor RPC pointed at **Base Sepolia** (chain 84532)
- `mint-onchain` and `anchor-permanence-snapshot` use the Sepolia signer wallet
- A single env flag (`VITE_CHAIN_ENV=sepolia|mainnet`) flips RPC, basescan links, and contract addresses
- When you're ready to charge real money, flip to mainnet (chain 8453), fund the signer wallet, and smoke-test one mint — that's the launch gate

So test-minting keeps working in the remix from day one; the mainnet switch is a one-flag flip later.
