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
// UPDATE THESE with your deployed contract addresses from Remix
export const ZSOLAR_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const ZSOLAR_NFT_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const ZSOLAR_TOKEN_SYMBOL = 'ZSOLAR';
export const ZSOLAR_TOKEN_DECIMALS = 18;

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
