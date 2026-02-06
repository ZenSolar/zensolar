# ZenSolar — Comprehensive Project Summary
**Generated: February 6, 2026**
**Purpose: Full technical context for cross-tool collaboration**

---

## 1. What Is ZenSolar?

ZenSolar is a **Web3 clean energy rewards platform** that converts verified solar generation, EV driving, battery storage, and EV charging activity into blockchain tokens ($ZSOLAR) and milestone NFTs. Users connect their energy devices (Tesla, Enphase, SolarEdge, Wallbox), and the platform verifies their real-world energy activity via direct API integrations, then rewards them with on-chain tokens — all within a single app. No external wallets, no seed phrases, no crypto knowledge required.

**Patent-pending IP**: "Gamifying and Tokenizing Sustainable Behaviors By Using Blockchain Technology"
**Pending Trademarks**: Mint-on-Proof™, Mint-on-Delta™, Proof-of-Delta™, SEGI™

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **Animations** | Framer Motion |
| **State/Data** | TanStack React Query, React Context |
| **Backend** | Lovable Cloud (Supabase) — PostgreSQL, Auth, Edge Functions |
| **Blockchain** | Base L2 (Sepolia testnet), Solidity, wagmi v3, viem |
| **Wallet** | Reown AppKit, Coinbase OnchainKit (Smart Wallet), WalletConnect |
| **Mobile** | Capacitor (iOS/Android), VitePWA, Web Push Notifications |
| **Security** | Cloudflare Turnstile (bot protection), Hexagate (smart contract monitoring) |
| **Analytics** | Google Analytics 4 |
| **Export** | xlsx (spreadsheet), html2pdf.js (PDF generation) |

---

## 3. Core Architecture — SEGI (Software-Enabled Gateway Interface)

SEGI is the patent-pending, hardware-agnostic architecture that bridges real-world energy data to blockchain rewards. It has **4 layers**:

```
Layer 1: API Aggregation
  └─ Direct API connections to Tesla, Enphase, SolarEdge, Wallbox
  └─ OAuth2 flows handled via Edge Functions
  └─ Device discovery and claiming with 1:1 watermarking

Layer 2: Data Normalization
  └─ Heterogeneous device data → unified schema (Wh, miles, sessions)
  └─ Baseline capture at device claim time
  └─ Delta calculation (new activity since last mint)

Layer 3: Verification Engine (Proof-of-Delta)
  └─ Cryptographic proof that each token maps to verified incremental energy
  └─ Anti-gaming: no energy unit tokenized twice
  └─ Device Watermark Registry ensures 1:1 device-to-user binding

Layer 4: Smart Contract Bridge
  └─ One-tap in-app minting of $ZSOLAR tokens
  └─ Milestone NFT minting (e.g., "First 100 kWh", "Solar Pioneer")
  └─ All transactions on Base L2 (currently Sepolia testnet)
```

---

## 4. Dual Minting Engines

1. **Mint-on-Proof™** — Rewards absolute energy metrics (total kWh produced, total miles driven)
2. **Mint-on-Delta™** — Rewards incremental daily activity (new energy since last mint)

Both engines use the Device Watermark Registry to ensure 1:1 token-to-energy binding.

---

## 5. Database Schema (15 Tables)

### Core User Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profiles, display names, connected provider flags, wallet addresses, social handles, referral codes |
| `user_roles` | Role-based access (admin/user enum) |
| `user_rewards` | Calculated token rewards with energy basis, claim status |
| `referrals` | Referrer→referred tracking, token rewards (1000 $ZSOLAR default) |

### Energy & Device Tables
| Table | Purpose |
|-------|---------|
| `connected_devices` | Claimed devices with provider, device_id, type, baseline_data, lifetime_totals, last_minted_at |
| `energy_production` | Per-device energy readings (production_wh, consumption_wh, recorded_at) |
| `energy_tokens` | OAuth tokens for energy providers (access_token, refresh_token, expires_at) |

### Blockchain Tables
| Table | Purpose |
|-------|---------|
| `mint_transactions` | On-chain mint records (tx_hash, tokens_minted, nfts_minted, nft_names, wallet_address, is_beta_mint) |

### Communication Tables
| Table | Purpose |
|-------|---------|
| `push_subscriptions` | Web Push subscription data (endpoint, p256dh, auth, platform) |
| `notification_logs` | Sent notification history |
| `notification_templates` | Admin-managed notification templates |

### Support & Feedback
| Table | Purpose |
|-------|---------|
| `feedback` | User feedback with category, status, admin_notes |
| `support_requests` | Support tickets with admin_response |

### Admin/Internal
| Table | Purpose |
|-------|---------|
| `tokenomics_framework_responses` | Versioned tokenomics framework answers |
| `yc_application_content` | Dynamic YC application content with inline editing |

### Key Database Functions
- `is_admin()` / `has_role()` — RBAC checks
- `is_device_claimed()` — Device watermark validation
- `handle_new_user()` — Auto-creates profile on signup
- `generate_referral_code()` — Auto-generates referral codes
- `lookup_referral_code()` — Resolves referral codes to user IDs
- `notify_admin_new_user()` — Triggers edge function on new signups

All tables have **Row-Level Security (RLS)** with per-user isolation and admin overrides.

---

## 6. Edge Functions (31 Functions)

### Energy Provider Integrations
| Function | Purpose |
|----------|---------|
| `tesla-auth` | Tesla OAuth2 flow |
| `tesla-devices` | Discover Tesla vehicles/Powerwalls |
| `tesla-data` | Pull Tesla energy/driving data |
| `tesla-register` | Register Tesla partner integration |
| `enphase-auth` | Enphase OAuth2 flow |
| `enphase-devices` | Discover Enphase microinverters |
| `enphase-data` | Pull Enphase solar production data |
| `solaredge-auth` | SolarEdge API key auth |
| `solaredge-data` | Pull SolarEdge solar data |
| `wallbox-auth` | Wallbox OAuth2 flow |
| `wallbox-data` | Pull Wallbox charging session data |
| `wallbox-debug` | Wallbox API debugging |

### Blockchain & Rewards
| Function | Purpose |
|----------|---------|
| `mint-onchain` | Execute on-chain $ZSOLAR token + NFT minting on Base Sepolia |
| `calculate-rewards` | Calculate token rewards from energy deltas |
| `claim-devices` | Claim and watermark devices |
| `reset-baselines` | Reset device baselines for re-calculation |
| `reset-user-nfts` | Admin: reset user NFT state |
| `sync-device-names` | Sync device display names from providers |

### User Management
| Function | Purpose |
|----------|---------|
| `admin-users` | Admin user management |
| `admin-get-user-emails` | Fetch user emails (admin) |
| `admin-delete-user` | Delete user accounts (admin) |
| `delete-account` | Self-service account deletion |
| `process-referral` | Process referral rewards |

### Notifications
| Function | Purpose |
|----------|---------|
| `send-push-notification` | Send web push notifications |
| `send-reminder-notifications` | Scheduled reminder notifications |
| `notify-new-user` | Admin notification on new signup |
| `notify-account-connected` | Notification when energy account connected |

### Security & Config
| Function | Purpose |
|----------|---------|
| `verify-turnstile` | Cloudflare Turnstile verification |
| `get-turnstile-site-key` | Fetch Turnstile public key |
| `generate-vapid-keys` | Generate VAPID keys for push |
| `get-vapid-public-key` | Fetch VAPID public key |
| `get-walletconnect-project-id` | Fetch WalletConnect project ID |

---

## 7. Route Architecture (60+ Routes)

### Public Routes
| Route | Page |
|-------|------|
| `/` | Landing page (guests) / Dashboard (authenticated) |
| `/auth` | Login/Signup with email |
| `/install` | PWA install instructions |
| `/white-paper` | White paper (conditionally wrapped) |
| `/yc-application` | Public YC application viewer |
| `/terms`, `/privacy` | Legal pages |
| `/onboarding` | New user onboarding flow |
| `/oauth/callback` | Energy provider OAuth callback |

### Demo Routes (no auth required)
| Route | Page |
|-------|------|
| `/demo` | Demo dashboard with simulated data |
| `/demo/nft-collection` | Demo NFT gallery |
| `/demo/how-it-works` | How It Works (demo context) |
| `/demo/store`, `/demo/tokenomics`, etc. | Full demo experience |

### Authenticated User Routes
| Route | Page |
|-------|------|
| `/` (authenticated) | Main dashboard with energy metrics, rewards, minting |
| `/how-it-works` | How It Works explainer |
| `/technology` | Patent technology / SEGI architecture |
| `/tokenomics` | Tokenomics overview |
| `/store` | Redeem tokens (testnet) |
| `/nft-collection` | User's minted NFT gallery |
| `/wallet` | Wallet management & on-chain holdings |
| `/mint-history` | Mint transaction history |
| `/profile` | User profile management |
| `/settings` | App settings |
| `/referrals` | Referral program |
| `/notifications` | Notification center |
| `/feedback` | Submit feedback |
| `/help` | Help center |
| `/about` | About ZenSolar |

### Admin Routes (30+ pages)
| Route | Page |
|-------|------|
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/analytics` | Platform analytics |
| `/admin/contracts` | Smart contract management |
| `/admin/revenue-flywheel` | Revenue flywheel tracker |
| `/admin/tokenomics-10b` | 10B supply tokenomics model |
| `/admin/tokenomics-framework` | Interactive tokenomics framework |
| `/admin/final-tokenomics` | Final tokenomics parameters |
| `/admin/live-beta-economics` | Live beta economics dashboard |
| `/admin/growth-projections` | Growth projection models |
| `/admin/bootstrap-calculator` | Bootstrap calculator |
| `/admin/flywheel-tracker` | Flywheel metrics tracking |
| `/admin/patent/*` | Patent documentation hub (4 sub-pages) |
| `/admin/fundraising` | Fundraising tracker |
| `/admin/investor-one-pager` | Investor one-pager |
| `/admin/investment-thesis` | Investment thesis |
| `/admin/yc-application` | YC application editor |
| `/admin/competitive-intel` | Competitive intelligence |
| `/admin/security` | Security architecture |
| `/admin/wallet-providers` | Wallet provider comparison |
| `/admin/beta-deployment` | Beta deployment tracker |
| `/admin/live-energy-flow` | Real-time energy flow visualization |
| `/admin/view-as-user` | View app as specific user |
| `/admin/todo` | Admin task management |
| `/admin/glossary` | Protocol glossary |
| `/admin/future-roadmap` | Future roadmap |
| `/admin/market-defense` | Market defense mechanisms |
| `/admin/ai-feedback-loop` | AI feedback loop |
| `/admin/ai-agent-opportunities` | AI agent opportunities |
| `/admin/ev-api-reference` | EV API reference |
| `/admin/embedded-wallet-demo` | Embedded wallet demo |

---

## 8. Custom Hooks (25 Hooks)

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state, login/logout, session management |
| `useAdminCheck` | Check if current user is admin |
| `useProfile` | Fetch/update user profile |
| `useDashboardData` | Aggregate dashboard metrics (devices, rewards, production) |
| `useDemoData` | Simulated data for demo mode |
| `useBetaMetrics` | Beta program metrics |
| `useEnergyOAuth` | Energy provider OAuth flow management |
| `useCoinbaseSmartWallet` | Coinbase Smart Wallet integration |
| `useOnChainHoldings` | Read on-chain $ZSOLAR balance |
| `useOnChainMetrics` | On-chain token metrics |
| `useTokenPrice` | $ZSOLAR price tracking |
| `useWalletType` | Detect wallet type (MetaMask, Coinbase, etc.) |
| `usePushNotifications` | Web Push subscription management |
| `useHaptics` | Capacitor haptic feedback |
| `usePullToRefresh` | Pull-to-refresh gesture |
| `useConfetti` | Confetti celebration animations |
| `useGoogleAnalytics` | GA4 event tracking |
| `useBotProtection` | Cloudflare Turnstile integration |
| `useIncompleteSetup` | Detect incomplete onboarding |
| `useHiddenActivityFields` | Dashboard field visibility |
| `useSwipeHintShown` | Swipeable UI hint state |
| `useViewAsUserId` | Admin "view as user" context |
| `useYCContent` | YC application content CRUD |

---

## 9. Component Architecture

### Landing Page (6 components)
`HeroSection` → `SEGISection` → `CompetitiveEdge` → `FeaturesGrid` → `BenefitsAndCTA` → `LandingFooter`

### Dashboard (35+ components)
Core: `ZenSolarDashboard`, `DashboardHeader`, `ActivityMetrics`, `MetricCard`, `AnimatedEnergyFlow`
Connections: `ConnectAccounts`, `ConnectAccountButton`, `DeviceSelectionDialog`, `EnphaseCodeDialog`, `SolarEdgeConnectDialog`, `WallboxConnectDialog`
Wallet: `ConnectWallet`, `WalletHoldingsCard`, `WalletSetupModal`, `ManualTokenAddPanel`, `WalletDeepLinks`
Rewards: `RewardActions`, `RewardProgress`, `TokenPriceCard`, `ReferralCard`
UX: `GettingStartedGuide`, `QuickStartChecklist`, `SwipeableActivityField`, `PullToRefresh`, `RefreshIndicators`

### Admin (12+ components)
`EditableYCCard`, `ExportButtons`, `FeedbackCard`, `HexagateMonitoringPanel`, `NFTResetPanel`, `NotificationTemplatesTab`, `OnboardingFunnelCard`, `ProviderResyncPanel`, `SupportRequestsTab`, `VersionHistoryPanel`, `ViewAsUserBanner`

### Layout
`AppLayout` (sidebar + main), `ProtectedRoute`, `RootRoute`, `ErrorBoundary`, `BotProtection`

---

## 10. Key Libraries & Utilities

| File | Purpose |
|------|---------|
| `lib/wagmi.ts` | wagmi config for Base/Base Sepolia, Reown AppKit |
| `lib/nftMilestones.ts` | NFT milestone definitions and thresholds |
| `lib/nftArtwork.ts` | NFT artwork/metadata |
| `lib/nftTokenMapping.ts` | NFT token ID mappings |
| `lib/tokenomics.ts` | Tokenomics calculation formulas |
| `lib/deviceTypeNormalizer.ts` | Normalize device types across providers |
| `lib/serviceWorker.ts` | Service worker registration for PWA/push |
| `lib/walletStorage.ts` | Wallet connection persistence |
| `lib/walletAssets.ts` | ERC-20 token asset definitions |
| `lib/onboardingAnalytics.ts` | Onboarding funnel analytics |
| `lib/userViewMode.ts` | Admin view-as-user utilities |

---

## 11. Secrets & API Keys Configured

| Secret | Purpose |
|--------|---------|
| `TESLA_CLIENT_ID`, `TESLA_CLIENT_SECRET`, `TESLA_PRIVATE_KEY` | Tesla Fleet API |
| `ENPHASE_CLIENT_ID`, `ENPHASE_CLIENT_SECRET`, `ENPHASE_API_KEY` | Enphase API |
| `MINTER_PRIVATE_KEY` | Server-side blockchain minting wallet |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Web Push notifications |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect/Reown |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 |
| `LOVABLE_API_KEY` | AI gateway (auto-provisioned) |

---

## 12. Current Status

- **Network**: Base Sepolia testnet
- **Beta users**: 19 active
- **Reward rate**: 10x multiplier (10 $ZSOLAR per 1 kWh)
- **LP seed**: $5,000 USDC / 50,000 $ZSOLAR
- **Target price floor**: $0.10
- **Supported providers**: Tesla, Enphase, SolarEdge, Wallbox
- **Embedded wallet**: Coinbase Smart Wallet (zero seed phrases)

---

## 13. Competitive Moat (5 Pillars)

1. **Patent-pending** energy-to-blockchain verification (SEGI + Proof-of-Delta)
2. **Economic Flywheel**: 50% of subscription revenue auto-injected into liquidity pool
3. **Hardware-neutral** SEGI data aggregation (60-second setup)
4. **Dual minting engines**: Mint-on-Proof™ + Mint-on-Delta™
5. **Unified Command Center**: Replaces siloed manufacturer apps (Tesla, Enphase, etc.)

---

## 14. User Experience Flow (Patent IP)

```
1. SIGN UP → Email auth → Auto profile + referral code + wallet creation
2. CONNECT → One-tap OAuth to Tesla/Enphase/SolarEdge/Wallbox
3. DISCOVER → Auto device discovery → Select & claim devices
4. EARN → Real-time energy data pull → Delta calculation → Reward preview
5. MINT → One-tap on-chain mint → $ZSOLAR + milestone NFTs → Confetti celebration
6. VIEW → NFT gallery, wallet holdings, mint history — all in-app
7. REDEEM → Store redemptions, future fiat off-ramp via MoonPay/Transak

The entire flow happens WITHIN the app. No MetaMask popups. No seed phrases.
No switching between Tesla app → solar app → crypto wallet → exchange.
ONE APP. That's the patent IP.
```

---

*This document covers the complete ZenSolar architecture as of February 2026. Paste it into Grok for full project context.*
