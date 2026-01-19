import { getDefaultConfig, Wallet } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import {
  metaMaskWallet,
  walletConnectWallet,
  injectedWallet,
  trustWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';

// Base Wallet logo (formerly Coinbase Wallet)
import baseWalletIcon from '@/assets/wallets/base-wallet.png';

// WalletConnect Project ID - Get yours free at https://cloud.walletconnect.com
// Note: this is a public identifier (safe to ship to the client).
const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
  (typeof window !== 'undefined' ? window.localStorage.getItem('walletconnect_project_id') : null) ||
  'demo-project-id';

// Exported for UI diagnostics / fallbacks
export const WALLETCONNECT_PROJECT_ID = projectId;
export const HAS_WALLETCONNECT_PROJECT_ID = projectId !== 'demo-project-id';

// Base Wallet uses WalletConnect (reliable on mobile/PWA)
const baseWallet = (params: Parameters<typeof walletConnectWallet>[0]): Wallet => {
  const wallet = walletConnectWallet(params);
  return {
    ...wallet,
    id: 'base',
    name: 'Base Wallet',
    shortName: 'Base',
    iconUrl: baseWalletIcon,
    iconBackground: '#0052FF',
  };
};

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
        // MetaMask first (most popular wallet)
        metaMaskWallet,
        // Base Wallet (formerly Coinbase Wallet) - this is the self-custody wallet
        // Note: The Coinbase exchange app does NOT support WalletConnect/dApp connections
        baseWallet,
        // WalletConnect for connecting other mobile wallets
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
      ],
    },
  ],
  ssr: false,
});

// Base Sepolia Chain ID
export const CHAIN_ID = baseSepolia.id;

// Contract addresses for $ZSOLAR token and NFT (Base Sepolia testnet)
// Deployed 2026-01-16 on Base Sepolia (with setMinter + transferOwnership configured)
export const ZSOLAR_TOKEN_ADDRESS = '0xAb13cc345C8a3e88B876512A3fdD93cE334B20FE' as const;
export const ZSOLAR_NFT_ADDRESS = '0xD1d509a48CEbB8f9f9aAA462979D7977c30424E3' as const;
export const ZSOLAR_CONTROLLER_ADDRESS = '0x54542Ad80FACbedA774465fE9724c281FBaf7437' as const;
export const ZSOLAR_TOKEN_SYMBOL = 'ZSOLAR';
export const ZSOLAR_TOKEN_DECIMALS = 18;

// Token metadata for wallet integration
export const ZSOLAR_TOKEN_IMAGE = '/zs-icon-192.png';

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
