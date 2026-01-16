import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
  trustWallet,
  rainbowWallet,
  phantomWallet,
} from '@rainbow-me/rainbowkit/wallets';

// WalletConnect Project ID - Get yours free at https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = getDefaultConfig({
  appName: 'ZenSolar',
  projectId,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        // MetaMask first (extension on desktop, deep-link on mobile)
        metaMaskWallet,
        // Coinbase second
        coinbaseWallet,
        // WalletConnect QR for connecting MetaMask Mobile (and other mobile wallets)
        walletConnectWallet,
      ],
    },
    {
      groupName: 'Other Wallets',
      wallets: [
        // Generic injected wallets (Brave, etc.)
        injectedWallet,
        trustWallet,
        rainbowWallet,
        phantomWallet,
      ],
    },
  ],
  ssr: false,
});

// Base Sepolia Chain ID
export const CHAIN_ID = baseSepolia.id;

// Contract addresses for $ZSOLAR token and NFT (Base Sepolia testnet)
// Deployed 2026-01-16 on Base Sepolia
export const ZSOLAR_TOKEN_ADDRESS = '0x5942F66E2E92e3D371931E6dAC8D8cC648D04dE2' as const;
export const ZSOLAR_NFT_ADDRESS = '0x512DD8Eb48a5e0723851606DB761fA49d5b4412f' as const;
export const ZSOLAR_CONTROLLER_ADDRESS = '0x159C447076BFCc86680Df0e8687543b4362C4eF5' as const;
export const ZSOLAR_TOKEN_SYMBOL = 'ZSOLAR';
export const ZSOLAR_TOKEN_DECIMALS = 18;

// Token metadata for wallet integration
export const ZSOLAR_TOKEN_IMAGE = '/zs-icon-192.png';

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
