import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, Layers, Database, Zap, Route, Code, Key, 
  Shield, Users, Coins, Globe, Cpu, Smartphone, BarChart3,
  Rocket, Award, Wallet, Activity
} from "lucide-react";

const SECTIONS = [
  {
    id: "overview",
    icon: Globe,
    title: "What Is ZenSolar?",
    content: `ZenSolar is a **Web3 clean energy rewards platform** that converts verified solar generation, EV driving, battery storage, and EV charging activity into blockchain tokens ($ZSOLAR) and milestone NFTs.

Users connect their energy devices (Tesla, Enphase, SolarEdge, Wallbox), and the platform verifies their real-world energy activity via direct API integrations, then rewards them with on-chain tokens — all within a single app. No external wallets, no seed phrases, no crypto knowledge required.

**Patent-pending IP**: "Gamifying and Tokenizing Sustainable Behaviors By Using Blockchain Technology"
**Pending Trademarks**: Mint-on-Proof™, Mint-on-Delta™, Proof-of-Delta™, SEGI™`
  },
  {
    id: "tech-stack",
    icon: Cpu,
    title: "Tech Stack",
    items: [
      { label: "Frontend", value: "React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui" },
      { label: "Animations", value: "Framer Motion" },
      { label: "State/Data", value: "TanStack React Query, React Context" },
      { label: "Backend", value: "Lovable Cloud (Supabase) — PostgreSQL, Auth, Edge Functions" },
      { label: "Blockchain", value: "Base L2 (Sepolia testnet), Solidity, wagmi v3, viem" },
      { label: "Wallet", value: "Reown AppKit, Coinbase OnchainKit (Smart Wallet), WalletConnect" },
      { label: "Mobile", value: "Capacitor (iOS/Android), VitePWA, Web Push Notifications" },
      { label: "Security", value: "Cloudflare Turnstile, Hexagate (smart contract monitoring)" },
      { label: "Analytics", value: "Google Analytics 4" },
      { label: "Export", value: "xlsx (spreadsheet), html2pdf.js (PDF generation)" },
    ]
  },
  {
    id: "segi",
    icon: Layers,
    title: "SEGI Architecture (Patent-Pending)",
    content: `**Layer 1: API Aggregation** — Direct API connections to Tesla, Enphase, SolarEdge, Wallbox. OAuth2 flows handled via Edge Functions. Device discovery and claiming with 1:1 watermarking.

**Layer 2: Data Normalization** — Heterogeneous device data → unified schema (Wh, miles, sessions). Baseline capture at device claim time. Delta calculation (new activity since last mint).

**Layer 3: Verification Engine (Proof-of-Delta)** — Cryptographic proof that each token maps to verified incremental energy. Anti-gaming: no energy unit tokenized twice. Device Watermark Registry ensures 1:1 device-to-user binding.

**Layer 4: Smart Contract Bridge** — One-tap in-app minting of $ZSOLAR tokens. Milestone NFT minting (e.g., "First 100 kWh", "Solar Pioneer"). All transactions on Base L2 (currently Sepolia testnet).`
  },
  {
    id: "minting",
    icon: Coins,
    title: "Dual Minting Engines",
    content: `**Mint-on-Proof™** — Rewards absolute energy metrics (total kWh produced, total miles driven).

**Mint-on-Delta™** — Rewards incremental daily activity (new energy since last mint). Each token is cryptographically bound to a verified kWh or mile via the Device Watermark Registry.

Both engines ensure 1:1 token-to-energy binding. No energy unit is ever tokenized twice.`
  },
  {
    id: "database",
    icon: Database,
    title: "Database Schema (15 Tables)",
    items: [
      { label: "profiles", value: "User profiles, connected provider flags, wallet addresses, social handles, referral codes" },
      { label: "user_roles", value: "Role-based access (admin/user enum)" },
      { label: "user_rewards", value: "Calculated token rewards with energy basis, claim status" },
      { label: "referrals", value: "Referrer→referred tracking, token rewards" },
      { label: "connected_devices", value: "Claimed devices with provider, baseline_data, lifetime_totals, last_minted_at" },
      { label: "energy_production", value: "Per-device energy readings (production_wh, consumption_wh)" },
      { label: "energy_tokens", value: "OAuth tokens for energy providers" },
      { label: "mint_transactions", value: "On-chain mint records (tx_hash, tokens_minted, nfts_minted)" },
      { label: "push_subscriptions", value: "Web Push subscription data" },
      { label: "notification_logs", value: "Sent notification history" },
      { label: "notification_templates", value: "Admin-managed notification templates" },
      { label: "feedback", value: "User feedback with category, status, admin_notes" },
      { label: "support_requests", value: "Support tickets with admin_response" },
      { label: "tokenomics_framework_responses", value: "Versioned tokenomics framework answers" },
      { label: "yc_application_content", value: "Dynamic YC application content with inline editing" },
    ]
  },
  {
    id: "edge-functions",
    icon: Zap,
    title: "Edge Functions (31)",
    groups: [
      {
        label: "Energy Provider Integrations",
        items: ["tesla-auth", "tesla-devices", "tesla-data", "tesla-register", "enphase-auth", "enphase-devices", "enphase-data", "solaredge-auth", "solaredge-data", "wallbox-auth", "wallbox-data", "wallbox-debug"]
      },
      {
        label: "Blockchain & Rewards",
        items: ["mint-onchain", "calculate-rewards", "claim-devices", "reset-baselines", "reset-user-nfts", "sync-device-names"]
      },
      {
        label: "User Management",
        items: ["admin-users", "admin-get-user-emails", "admin-delete-user", "delete-account", "process-referral"]
      },
      {
        label: "Notifications",
        items: ["send-push-notification", "send-reminder-notifications", "notify-new-user", "notify-account-connected"]
      },
      {
        label: "Security & Config",
        items: ["verify-turnstile", "get-turnstile-site-key", "generate-vapid-keys", "get-vapid-public-key", "get-walletconnect-project-id"]
      }
    ]
  },
  {
    id: "routes",
    icon: Route,
    title: "Routes (60+)",
    content: `**Public**: Landing (/), Auth (/auth), Install (/install), White Paper, YC Application, Terms, Privacy, Onboarding, OAuth Callback

**Demo** (no auth): /demo with full sidebar experience — dashboard, NFTs, store, tokenomics, etc.

**Authenticated User**: Dashboard (/), How It Works, Technology, Tokenomics, Store, NFT Collection, Wallet, Mint History, Profile, Settings, Referrals, Notifications, Feedback, Help, About

**Admin** (30+ pages): Admin Panel, Project Summary, View as User, To-Do, Analytics, Users, Live Beta Economics, FINAL $ZSOLAR, Revenue Flywheel, Flywheel Tracker, Token Estimator, 10B Tokenomics, Tokenomics Framework, YC Application, 10-Year Roadmap, Market Defense, Investment Thesis, Investor One-Pager, Fundraising, Growth Projections, AI Agent Opportunities, Beta Deployment, Wallet Providers, Embedded Wallet Demo, Security Architecture, Smart Contracts, EV API Reference, Competitive Intel, AI Feedback Loop, Live Energy Flow, Glossary, Patent Hub (4 sub-pages)`
  },
  {
    id: "hooks",
    icon: Code,
    title: "Custom Hooks (25)",
    content: `useAuth, useAdminCheck, useProfile, useDashboardData, useDemoData, useBetaMetrics, useEnergyOAuth, useCoinbaseSmartWallet, useOnChainHoldings, useOnChainMetrics, useTokenPrice, useWalletType, usePushNotifications, useHaptics, usePullToRefresh, useConfetti, useGoogleAnalytics, useBotProtection, useIncompleteSetup, useHiddenActivityFields, useSwipeHintShown, useViewAsUserId, useYCContent, use-mobile, use-toast`
  },
  {
    id: "secrets",
    icon: Key,
    title: "Configured Secrets",
    items: [
      { label: "Tesla", value: "TESLA_CLIENT_ID, TESLA_CLIENT_SECRET, TESLA_PRIVATE_KEY" },
      { label: "Enphase", value: "ENPHASE_CLIENT_ID, ENPHASE_CLIENT_SECRET, ENPHASE_API_KEY" },
      { label: "Blockchain", value: "MINTER_PRIVATE_KEY" },
      { label: "Push", value: "VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY" },
      { label: "Security", value: "TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY" },
      { label: "Wallet", value: "VITE_WALLETCONNECT_PROJECT_ID" },
      { label: "Analytics", value: "VITE_GA_MEASUREMENT_ID" },
      { label: "AI", value: "LOVABLE_API_KEY (auto-provisioned)" },
    ]
  },
  {
    id: "status",
    icon: Activity,
    title: "Current Status",
    items: [
      { label: "Network", value: "Base Sepolia testnet" },
      { label: "Beta users", value: "19 active" },
      { label: "Reward rate", value: "10x multiplier (10 $ZSOLAR per 1 kWh)" },
      { label: "LP seed", value: "$5,000 USDC / 50,000 $ZSOLAR" },
      { label: "Price floor", value: "$0.10" },
      { label: "Providers", value: "Tesla, Enphase, SolarEdge, Wallbox" },
      { label: "Wallet", value: "Coinbase Smart Wallet (zero seed phrases)" },
    ]
  },
  {
    id: "moat",
    icon: Shield,
    title: "Competitive Moat (5 Pillars)",
    content: `1. **Patent-pending** energy-to-blockchain verification (SEGI + Proof-of-Delta)
2. **Economic Flywheel**: 50% of subscription revenue auto-injected into liquidity pool
3. **Hardware-neutral** SEGI data aggregation (60-second setup)
4. **Dual minting engines**: Mint-on-Proof™ + Mint-on-Delta™
5. **Unified Command Center**: Replaces siloed manufacturer apps (Tesla, Enphase, etc.)`
  },
  {
    id: "ux-flow",
    icon: Rocket,
    title: "User Experience Flow (Patent IP)",
    content: `**1. SIGN UP** → Email auth → Auto profile + referral code + wallet creation
**2. CONNECT** → One-tap OAuth to Tesla/Enphase/SolarEdge/Wallbox
**3. DISCOVER** → Auto device discovery → Select & claim devices
**4. EARN** → Real-time energy data pull → Delta calculation → Reward preview
**5. MINT** → One-tap on-chain mint → $ZSOLAR + milestone NFTs → Confetti celebration
**6. VIEW** → NFT gallery, wallet holdings, mint history — all in-app
**7. REDEEM** → Store redemptions, future fiat off-ramp via MoonPay/Transak

The entire flow happens WITHIN the app. No MetaMask popups. No seed phrases. No switching between Tesla app → solar app → crypto wallet → exchange. ONE APP. That's the patent IP.`
  },
];

export default function AdminProjectSummary() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Summary</h1>
          <p className="text-muted-foreground mt-1">Living technical document — ZenSolar architecture & status</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Last updated: {new Date().toLocaleDateString()}
        </Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-4 pr-4">
          {SECTIONS.map((section) => (
            <Card key={section.id} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <section.icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.content && (
                  <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                )}
                {section.items && (
                  <div className="space-y-2">
                    {section.items.map((item, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <span className="font-mono text-primary shrink-0 min-w-[140px]">{item.label}</span>
                        <span className="text-muted-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {section.groups && (
                  <div className="space-y-3">
                    {section.groups.map((group, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium text-foreground mb-1">{group.label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.items.map((item, j) => (
                            <Badge key={j} variant="secondary" className="text-xs font-mono">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
