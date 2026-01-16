import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_TOKEN_SYMBOL, ZSOLAR_TOKEN_DECIMALS, ZSOLAR_NFT_ADDRESS, ZSOLAR_TOKEN_IMAGE } from './wagmi';

// LocalStorage keys for tracking added assets
const TOKEN_ADDED_KEY = 'zsolar_token_added';
const NFT_ADDED_KEY = 'zsolar_nfts_added';

/**
 * Check if the token has already been added to wallet
 */
export function hasTokenBeenAdded(): boolean {
  try {
    return localStorage.getItem(TOKEN_ADDED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark the token as added to wallet
 */
function markTokenAsAdded(): void {
  try {
    localStorage.setItem(TOKEN_ADDED_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Check if NFTs have been added to wallet for this user
 */
export function hasNFTsBeenAdded(): boolean {
  try {
    return localStorage.getItem(NFT_ADDED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark NFTs as added to wallet
 */
function markNFTsAsAdded(): void {
  try {
    localStorage.setItem(NFT_ADDED_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Prompts the user to add the $ZSOLAR token to their wallet
 * Uses EIP-747 wallet_watchAsset for seamless token addition
 * Only prompts if token hasn't been added before
 */
export async function promptAddZsolarToken(force: boolean = false): Promise<boolean> {
  // Skip if already added (unless forced)
  if (!force && hasTokenBeenAdded()) {
    console.log('$ZSOLAR token already added to wallet');
    return true;
  }

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

    if (wasAdded) {
      markTokenAsAdded();
    }

    return Boolean(wasAdded);
  } catch (error) {
    console.error('Failed to add token to wallet:', error);
    return false;
  }
}

/**
 * Automatically prompts to add ZSOLAR token after wallet connection
 * Only prompts once ever to avoid annoying users
 */
export async function autoPromptAddToken(): Promise<void> {
  if (hasTokenBeenAdded()) return;
  
  // Small delay to let the connection settle
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  try {
    await promptAddZsolarToken();
  } catch (error) {
    // Silently fail - user can add manually later
    console.log('Auto-add token prompt declined or failed');
  }
}

/**
 * Reset the prompt flags (useful for testing or after disconnect)
 */
export function resetAssetPromptFlags(): void {
  try {
    localStorage.removeItem(TOKEN_ADDED_KEY);
    localStorage.removeItem(NFT_ADDED_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Alias for backward compatibility
 */
export const resetTokenPromptFlag = resetAssetPromptFlags;

/**
 * Prompts the user to add a ZenSolar NFT to their wallet
 * Uses EIP-747 wallet_watchAsset for seamless NFT addition
 */
/**
 * Prompts the user to add ZenSolar NFTs to their wallet
 * Uses EIP-747 wallet_watchAsset for ERC-1155 tokens
 * Note: ERC-1155 support is limited in most wallets, so this is best-effort
 */
export async function promptAddZsolarNFT(tokenIds: number[] = []): Promise<boolean> {
  // Skip if already prompted for NFTs
  if (hasNFTsBeenAdded() && tokenIds.length === 0) {
    console.log('ZenSolar NFTs already added/acknowledged');
    return true;
  }

  if (!window.ethereum) {
    console.warn('No ethereum provider found');
    return false;
  }

  try {
    // Try to add NFTs using wallet_watchAsset
    // Note: ERC-1155 support varies by wallet
    // MetaMask has limited ERC-1155 support in wallet_watchAsset
    // We try with ERC721 type as fallback since some wallets handle it
    
    // First try as ERC1155 (newer standard)
    try {
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC1155',
          options: {
            address: ZSOLAR_NFT_ADDRESS,
            tokenId: tokenIds.length > 0 ? String(tokenIds[0]) : '0',
          },
        },
      });
      
      if (wasAdded) {
        markNFTsAsAdded();
        return true;
      }
    } catch (erc1155Error) {
      // ERC1155 not supported, try ERC721
      console.log('ERC1155 watchAsset not supported, trying ERC721...');
    }

    // Fallback: try as ERC721
    const wasAdded = await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC721',
        options: {
          address: ZSOLAR_NFT_ADDRESS,
          tokenId: tokenIds.length > 0 ? String(tokenIds[0]) : '0',
        },
      },
    });

    if (wasAdded) {
      markNFTsAsAdded();
    }

    return Boolean(wasAdded);
  } catch (error) {
    // NFT watchAsset is not widely supported yet
    // Mark as added anyway since wallets usually auto-detect NFTs
    markNFTsAsAdded();
    console.log('NFT watchAsset not fully supported, NFTs should appear automatically in wallet');
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
