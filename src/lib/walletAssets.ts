import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_TOKEN_SYMBOL, ZSOLAR_TOKEN_DECIMALS, ZSOLAR_NFT_ADDRESS, ZSOLAR_TOKEN_IMAGE } from './wagmi';

// Track if we've already prompted to add token (per session)
let hasPromptedTokenAdd = false;

/**
 * Prompts the user to add the $ZSOLAR token to their wallet
 * Uses EIP-747 wallet_watchAsset for seamless token addition
 */
export async function promptAddZsolarToken(): Promise<boolean> {
  if (!window.ethereum) {
    console.warn('No ethereum provider found');
    return false;
  }

  try {
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: ZSOLAR_TOKEN_ADDRESS,
          symbol: ZSOLAR_TOKEN_SYMBOL,
          decimals: ZSOLAR_TOKEN_DECIMALS,
          image: `${window.location.origin}${ZSOLAR_TOKEN_IMAGE}`,
        },
      },
    });

    return Boolean(wasAdded);
  } catch (error) {
    console.error('Failed to add token to wallet:', error);
    return false;
  }
}

/**
 * Automatically prompts to add ZSOLAR token after wallet connection
 * Only prompts once per session to avoid annoying users
 */
export async function autoPromptAddToken(): Promise<void> {
  if (hasPromptedTokenAdd) return;
  
  // Small delay to let the connection settle
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  hasPromptedTokenAdd = true;
  
  try {
    await promptAddZsolarToken();
  } catch (error) {
    // Silently fail - user can add manually later
    console.log('Auto-add token prompt declined or failed');
  }
}

/**
 * Reset the prompt flag (useful for testing or after disconnect)
 */
export function resetTokenPromptFlag(): void {
  hasPromptedTokenAdd = false;
}

/**
 * Prompts the user to add a ZenSolar NFT to their wallet
 * Uses EIP-747 wallet_watchAsset for seamless NFT addition
 */
export async function promptAddZsolarNFT(tokenId: string): Promise<boolean> {
  if (!window.ethereum) {
    console.warn('No ethereum provider found');
    return false;
  }

  try {
    // Note: NFT support via wallet_watchAsset is limited
    // Most wallets auto-detect NFTs, but we provide the prompt for better UX
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC721',
        options: {
          address: ZSOLAR_NFT_ADDRESS,
          tokenId: tokenId,
        },
      },
    });

    return Boolean(wasAdded);
  } catch (error) {
    // ERC721 watchAsset is not widely supported yet
    // Fallback: NFTs are usually auto-detected by wallets
    console.log('NFT watchAsset not supported, NFT should appear automatically');
    return true;
  }
}

/**
 * Checks if the user is on the correct network (Base Sepolia for testnet)
 * and prompts to switch if needed
 */
export async function ensureBaseSepoliaNetwork(): Promise<boolean> {
  if (!window.ethereum) {
    return false;
  }

  const BASE_SEPOLIA_CHAIN_ID = '0x14a34'; // 84532 in hex

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId === BASE_SEPOLIA_CHAIN_ID) {
      return true;
    }

    // Try to switch to Base Sepolia
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
      });
      return true;
    } catch (switchError: any) {
      // If Base Sepolia is not added to wallet, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: BASE_SEPOLIA_CHAIN_ID,
            chainName: 'Base Sepolia',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org'],
          }],
        });
        return true;
      }
      throw switchError;
    }
  } catch (error) {
    console.error('Failed to switch network:', error);
    return false;
  }
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}
