import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_TOKEN_SYMBOL, ZSOLAR_TOKEN_DECIMALS, ZSOLAR_NFT_ADDRESS } from './wagmi';

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
          image: `${window.location.origin}/zs-icon-192.png`,
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
 * Checks if the user is on the correct network (Sepolia for testnet)
 * and prompts to switch if needed
 */
export async function ensureSepoliaNetwork(): Promise<boolean> {
  if (!window.ethereum) {
    return false;
  }

  const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId === SEPOLIA_CHAIN_ID) {
      return true;
    }

    // Try to switch to Sepolia
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      return true;
    } catch (switchError: any) {
      // If Sepolia is not added to wallet, add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: 'Sepolia Testnet',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
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
