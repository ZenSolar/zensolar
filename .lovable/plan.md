# ZenSolar Implementation Roadmap

## Current Priority: Embedded Wallet Integration

### Strategic Decision: Coinbase Smart Wallet (Recommended)

After comprehensive research comparing Privy, Thirdweb, Dynamic, Web3Auth, Magic, and Coinbase Smart Wallet, the recommended approach for ZenSolar is:

**Phase 1 (MVP): Coinbase Smart Wallet**
- **Cost**: FREE forever (no monthly fees)
- **Why**: Native Base L2 support, gasless transactions built-in, passkey-based security
- **Timeline**: 1-2 weeks integration

**Phase 2 (Scale): Consider Privy/Thirdweb**
- If we need email-only login, advanced customization, or white-labeling
- Privy: $299/mo at 2,500 MAU
- Thirdweb: $99/mo (more generous free tier)

---

## User Experience Vision (Embedded Wallet)

### The 5-Step Frictionless Journey

1. **Sign Up** - Email/Google/Apple login → wallet auto-created (no seed phrases, no MetaMask)
2. **Connect Solar** - OAuth to Enphase/Tesla/SolarEdge (same as today)
3. **Earn Automatically** - $ZSOLAR mints gaslessly to embedded wallet
4. **Claim NFTs** - One-tap milestone claims, no wallet popups
5. **Cash Out** - In-app conversion: ZSOLAR → ETH → USD → bank account

### Key Principle: Users NEVER Leave ZenSolar
- MoonPay/Transak provide embedded widget SDKs
- Off-ramp appears as modal inside our app
- Bank linking happens within the widget
- Same experience as Venmo/Cash App

---

## Technical Implementation

### Coinbase Smart Wallet Integration

Using OnchainKit SDK for React:

```typescript
// Provider setup with OnchainKit
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base, baseSepolia } from 'viem/chains';

<OnchainKitProvider
  apiKey={process.env.VITE_COINBASE_API_KEY}
  chain={baseSepolia} // or base for mainnet
>
  <App />
</OnchainKitProvider>

// Wallet component
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';

<Wallet>
  <ConnectWallet>
    <Avatar />
    <Name />
  </ConnectWallet>
</Wallet>
```

### Required Dependencies
- `@coinbase/onchainkit` - Main SDK
- `@coinbase/wallet-sdk` - Wallet connectivity

### Configuration
- Set `walletConfig.options: "smartWalletOnly"` for embedded wallet only
- Configure passkey authentication
- Set up gasless transaction sponsorship via Coinbase Paymaster

---

## Off-Ramp Integration (Future)

### MoonPay Widget Integration
```typescript
import { MoonPayProvider } from '@moonpay/moonpay-react';

// Embed sell widget in ZenSolar
<MoonPaySellWidget
  variant="embedded"
  baseCurrencyCode="eth"
  quoteCurrencyCode="usd"
  onTransactionCompleted={handleCashOut}
/>
```

### Flow: ZSOLAR → Bank
1. User taps "Cash Out" in ZenSolar
2. ZSOLAR swapped to ETH via Uniswap (embedded)
3. ETH sold to USD via MoonPay widget (embedded)
4. USD deposited to linked bank (1-2 business days)

---

## File References

- `/admin/wallet-providers` - Full comparison research page
- `src/pages/AdminWalletProviders.tsx` - Provider comparison, UX flows, build-vs-buy analysis

---

---

## Tech Stack Summary (YC Application Reference)

**Frontend:** React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Framer Motion, Recharts, TanStack Query, react-router-dom v7.

**Mobile:** Capacitor (iOS/Android native builds), VitePWA (installable web app with push notifications).

**Backend:** Supabase (PostgreSQL, auth, edge functions, realtime subscriptions).

**Blockchain:** Solidity smart contracts on Base L2 (Sepolia testnet), wagmi + viem for frontend interactions, Reown AppKit (WalletConnect) for wallet connectivity, Coinbase OnchainKit for embedded wallets.

**Energy APIs:** Tesla Fleet API, Enphase Monitoring API, SolarEdge Monitoring API, Wallbox API.

**AI Development Tools:** Lovable (primary AI coding platform with Claude), Grok (xAI) for strategy/tokenomics/debugging, Claude 3.5 Sonnet for code reviews.

---

## Previous Plan: Dashboard Visual Enhancements

### Completed Items
1. ✅ Tesla "T" logo update in ActivityMetrics
2. ✅ Aesthetic page break between sections
3. ✅ REFRESH DASHBOARD button
4. ✅ Pulse-glow animation on MINT buttons
