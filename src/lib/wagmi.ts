import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { baseSepolia } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { http } from 'viem';

// WalletConnect Project ID - Get yours free at https://cloud.walletconnect.com
// Note: this is a public identifier (safe to ship to the client).
const envProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const localStorageProjectId = typeof window !== 'undefined' 
  ? window.localStorage.getItem('walletconnect_project_id') 
  : null;

// Use env variable first, then localStorage fallback, then demo ID
const projectId = (envProjectId && envProjectId.trim() !== '') 
  ? envProjectId 
  : (localStorageProjectId && localStorageProjectId.trim() !== '') 
    ? localStorageProjectId 
    : 'demo-project-id';

// Exported for UI diagnostics / fallbacks
export const WALLETCONNECT_PROJECT_ID = projectId;
// Consider it configured if it's not the demo placeholder
export const HAS_WALLETCONNECT_PROJECT_ID = projectId !== 'demo-project-id' && projectId.length > 10;

// Base Sepolia public RPC endpoints (for read-only operations)
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const BASE_SEPOLIA_RPC_FALLBACK = 'https://base-sepolia-rpc.publicnode.com';

// Networks configuration - Base Sepolia as the only chain
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [baseSepolia];

// Base Sepolia Chain ID
export const CHAIN_ID = baseSepolia.id;

// App metadata
export const metadata = {
  name: 'ZenSolar',
  description: 'Earn $ZSOLAR tokens for your green energy production',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://zensolar.lovable.app',
  icons: ['/zs-icon-192.png'],
};

// Create the Wagmi adapter for AppKit with custom transports for read operations
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  transports: {
    // Ensure Base Sepolia has a public RPC for read-only operations
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
});

// Export wagmi config for use with WagmiProvider
export const config = wagmiAdapter.wagmiConfig;

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
