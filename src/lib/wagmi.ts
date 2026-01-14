import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import {
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
  rainbowWallet,
  phantomWallet,
  injectedWallet,
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
        // WalletConnect first - works on mobile with QR code to connect MetaMask mobile app
        walletConnectWallet,
        // Injected wallet for browser extensions (MetaMask, etc.)
        injectedWallet,
        coinbaseWallet,
      ],
    },
    {
      groupName: 'Other Wallets',
      wallets: [
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
