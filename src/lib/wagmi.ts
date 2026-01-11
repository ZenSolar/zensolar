import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  trustWallet,
  rainbowWallet,
  phantomWallet,
} from '@rainbow-me/rainbowkit/wallets';

// WalletConnect Project ID - Get yours free at https://cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = getDefaultConfig({
  appName: 'ZenSolar',
  projectId,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        trustWallet,
      ],
    },
    {
      groupName: 'Other Wallets',
      wallets: [
        walletConnectWallet,
        rainbowWallet,
        phantomWallet,
      ],
    },
  ],
  ssr: false,
});

// Contract addresses for $ZSOLAR token and NFT (Sepolia testnet)
// These will be updated when contracts are deployed
export const ZSOLAR_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const ZSOLAR_NFT_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const ZSOLAR_TOKEN_SYMBOL = 'ZSOLAR';
export const ZSOLAR_TOKEN_DECIMALS = 18;

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
