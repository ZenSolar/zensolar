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
// Deployed 2026-01-16 on Base Sepolia (fresh deployment)
export const ZSOLAR_TOKEN_ADDRESS = '0x9bcf687eee0AF5f8C81F69812E3d7aC2cfCe410E' as const;
export const ZSOLAR_NFT_ADDRESS = '0x63ef4BEF238a1E91740dA5aB11Ae1E7D319EFC4C' as const;
export const ZSOLAR_CONTROLLER_ADDRESS = '0x3763B402b7f3Bd407B5141C55C94a1076f220cE7' as const;
export const ZSOLAR_TOKEN_SYMBOL = 'ZSOLAR';
export const ZSOLAR_TOKEN_DECIMALS = 18;

// Token metadata for wallet integration
export const ZSOLAR_TOKEN_IMAGE = '/zs-icon-192.png';

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
