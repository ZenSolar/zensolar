import { Button } from '@/components/ui/button';
import { Coins, Award, RefreshCw, Loader2, CheckCircle2, ExternalLink, Trophy, Sparkles, Images, AlertCircle, Sun, Car, Battery, Zap, Copy, Check, Wallet } from 'lucide-react';
import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { useAccount, useWalletClient, useWatchAsset, useChainId, useSwitchChain } from 'wagmi';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_TOKEN_SYMBOL, ZSOLAR_TOKEN_DECIMALS, ZSOLAR_TOKEN_IMAGE, CHAIN_ID } from '@/lib/wagmi';
import { hasTokenBeenAdded, hasNFTsBeenAdded, markTokenAsAdded as markTokenAdded, markNFTsAsAdded as markNFTsAdded, resetAssetPromptFlags } from '@/lib/walletAssets';
import { useNavigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WatchAssetDiagnostics, type WatchAssetAttempt } from './WatchAssetDiagnostics';
import { ManualTokenAddPanel } from './ManualTokenAddPanel';
import { getNftArtwork } from '@/lib/nftArtwork';
import { MILESTONE_TO_TOKEN_ID, TOKEN_ID_TO_MILESTONE } from '@/lib/nftTokenMapping';

// NFT Contract address on Base Sepolia
const NFT_CONTRACT_ADDRESS = '0xD1d509a48CEbB8f9f9aAA462979D7977c30424E3';

export type MintCategory = 'solar' | 'ev_miles' | 'battery' | 'charging' | 'all';

interface PendingRewards {
  solar: number;
  evMiles: number;
  battery: number;
  charging: number;
}

interface RewardActionsProps {
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  walletAddress?: string | null;
  pendingRewards?: PendingRewards;
}

export interface RewardActionsRef {
  openTokenMintDialog: () => void;
  openTokenMintDialogForCategory?: (category: MintCategory) => void;
}

interface MintResult {
  success: boolean;
  txHash?: string;
  message?: string;
  error?: string;
  alreadyRegistered?: boolean;
  mintedCount?: number;
  nftsMinted?: number[];
  nftNames?: string[];
}

interface EligibleNFT {
  tokenId: number;
  category: string;
  name: string;
  threshold: number;
}

interface EligibleCombo {
  tokenId: number;
  name: string;
  comboType: string;
}

interface EligibilityData {
  hasWelcomeNFT: boolean;
  ownedNFTs: number[];
  eligibleMilestoneNFTs: EligibleNFT[];
  eligibleComboNFTs: EligibleCombo[];
  totalEligible: number;
}

export const RewardActions = forwardRef<RewardActionsRef, RewardActionsProps>(function RewardActions({ 
  onRefresh, 
  isLoading, 
  walletAddress, 
  pendingRewards = { solar: 0, evMiles: 0, battery: 0, charging: 0 }
}, ref) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { triggerConfetti } = useConfetti();
  const { success: hapticSuccess } = useHaptics();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { watchAssetAsync } = useWatchAsset();
  const { isAdmin } = useAdminCheck();
  const [mintingState, setMintingState] = useState<{
    isLoading: boolean;
    type: 'token' | 'nft' | 'milestone' | 'combo' | null;
    category?: MintCategory;
  }>({ isLoading: false, type: null });
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    success: boolean;
    txHash?: string;
    message: string;
    type: 'token' | 'nft' | 'milestone' | 'combo' | null;
  }>({
    open: false,
    success: false,
    message: '',
    type: null,
  });
  const [showTokenAddPanel, setShowTokenAddPanel] = useState(false);
  const [tokenMintDialog, setTokenMintDialog] = useState(false);
  const [confirmMintDialog, setConfirmMintDialog] = useState(false);
  const [pendingMintCategory, setPendingMintCategory] = useState<MintCategory | null>(null);
  const [mintingProgressDialog, setMintingProgressDialog] = useState(false);
  
  // NFT Selection Dialog state
  const [nftMintDialog, setNftMintDialog] = useState<{
    open: boolean;
    type: 'milestone' | 'combo' | null;
  }>({ open: false, type: null });
  const [selectedNft, setSelectedNft] = useState<EligibleNFT | EligibleCombo | null>(null);
  const [nftMintResult, setNftMintResult] = useState<{
    success: boolean;
    txHash?: string;
    tokenId?: number;
    nftName?: string;
  } | null>(null);
  const [showNftImportPanel, setShowNftImportPanel] = useState(false);
  const [mintingProgress, setMintingProgress] = useState<{
    step: 'preparing' | 'submitting' | 'confirming' | 'complete' | 'error';
    message: string;
  }>({ step: 'preparing', message: 'Preparing transaction...' });
  
  // Diagnostics for wallet_watchAsset
  const [watchAssetAttempts, setWatchAssetAttempts] = useState<WatchAssetAttempt[]>([]);
  
  const logWatchAssetAttempt = useCallback((attempt: Omit<WatchAssetAttempt, 'timestamp'>) => {
    setWatchAssetAttempts((prev) => [...prev, { ...attempt, timestamp: Date.now() }]);
  }, []);
  
  const clearWatchAssetDiagnostics = useCallback(() => {
    setWatchAssetAttempts([]);
    resetAssetPromptFlags();
  }, []);

  // Delayed reveal of token add panel (4 seconds after successful token mint)
  useEffect(() => {
    if (resultDialog.open && resultDialog.success && resultDialog.type === 'token') {
      setShowTokenAddPanel(false);
      const timer = setTimeout(() => {
        setShowTokenAddPanel(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowTokenAddPanel(false);
    }
  }, [resultDialog.open, resultDialog.success, resultDialog.type]);

  // Delayed reveal of NFT import panel (4 seconds after successful NFT mint)
  useEffect(() => {
    if (nftMintResult?.success) {
      setShowNftImportPanel(false);
      const timer = setTimeout(() => {
        setShowNftImportPanel(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowNftImportPanel(false);
    }
  }, [nftMintResult]);

  // Expose openTokenMintDialog to parent via ref
  useImperativeHandle(ref, () => ({
    openTokenMintDialog: () => setTokenMintDialog(true),
    openTokenMintDialogForCategory: (category: MintCategory) => {
      // Pre-select the category and open confirmation dialog directly
      if (walletAddress) {
        setPendingMintCategory(category);
        setConfirmMintDialog(true);
      } else {
        setTokenMintDialog(true);
      }
    },
  }));

  // Check NFT eligibility when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      checkEligibility();
    } else {
      setEligibility(null);
    }
  }, [walletAddress]);

  const checkEligibility = async () => {
    if (!walletAddress) return;
    
    setCheckingEligibility(true);
    try {
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'check-eligible',
          walletAddress,
        },
      });

      if (!error && data) {
        setEligibility(data as EligibilityData);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setCheckingEligibility(false);
    }
  };

  // Total activity units from pending rewards
  const totalActivityUnits = pendingRewards.solar + pendingRewards.evMiles + pendingRewards.battery + pendingRewards.charging;
  
  // User receives 93% of activity units as tokens (5% burn, 1% LP, 1% treasury)
  const totalPendingTokens = Math.floor(totalActivityUnits * 0.93);

  // Get the amount for a specific category (activity units, before fee distribution)
  const getCategoryActivityUnits = (category: MintCategory): number => {
    if (category === 'all') return totalActivityUnits;
    if (category === 'solar') return pendingRewards.solar;
    if (category === 'ev_miles') return pendingRewards.evMiles;
    if (category === 'battery') return pendingRewards.battery;
    if (category === 'charging') return pendingRewards.charging;
    return 0;
  };
  
  // Get tokens user will receive for a category (after 93% distribution)
  const getCategoryTokens = (category: MintCategory): number => {
    return Math.floor(getCategoryActivityUnits(category) * 0.93);
  };

  // Add the ZSOLAR token to the connected wallet using wallet_watchAsset (best-effort)
  const addZsolarToWallet = async (): Promise<boolean> => {
    // Skip if already added
    if (hasTokenBeenAdded()) {
      console.log('$ZSOLAR token already in wallet (flagged)');
      logWatchAssetAttempt({ provider: 'none', success: true, error: 'Already flagged as added' });
      return true;
    }

    const paramsOptions = {
      address: ZSOLAR_TOKEN_ADDRESS,
      symbol: ZSOLAR_TOKEN_SYMBOL,
      decimals: ZSOLAR_TOKEN_DECIMALS,
      image: `${window.location.origin}${ZSOLAR_TOKEN_IMAGE}`,
    };

    const markSuccess = () => {
      markTokenAdded();
      console.log('$ZSOLAR token added to wallet successfully');
    };

    // If the wallet app was just opened (mobile deep-link), wait until user returns
    // so the request can be shown reliably.
    const waitForForeground = async () => {
      if (typeof document === 'undefined') return;
      if (!document.hidden) return;

      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(() => {
          cleanup();
          resolve();
        }, 8000);

        const onVis = () => {
          if (!document.hidden) {
            cleanup();
            resolve();
          }
        };

        const cleanup = () => {
          window.clearTimeout(timeout);
          document.removeEventListener('visibilitychange', onVis);
        };

        document.addEventListener('visibilitychange', onVis);
      });
    };

    // Force MetaMask to switch to Base Sepolia using low-level RPC calls
    // This is more reliable than wagmi's switchChain for WalletConnect sessions
    const forceNetworkSwitch = async (): Promise<boolean> => {
      const baseSepoliaChainIdHex = `0x${CHAIN_ID.toString(16)}`; // 0x14a34 for 84532
      
      // Try wallet_switchEthereumChain first
      const trySwitchChain = async (): Promise<boolean> => {
        try {
          if (walletClient?.request) {
            await walletClient.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: baseSepoliaChainIdHex }],
            });
            console.log('wallet_switchEthereumChain succeeded');
            return true;
          }
          if ((window as any).ethereum?.request) {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: baseSepoliaChainIdHex }],
            });
            console.log('window.ethereum wallet_switchEthereumChain succeeded');
            return true;
          }
          return false;
        } catch (switchError: any) {
          // Error code 4902 means the chain is not added to MetaMask
          if (switchError?.code === 4902 || switchError?.message?.includes('Unrecognized chain')) {
            console.log('Chain not found, attempting wallet_addEthereumChain...');
            return tryAddChain();
          }
          console.log('wallet_switchEthereumChain error:', switchError);
          return false;
        }
      };

      // Add the chain if it doesn't exist
      const tryAddChain = async (): Promise<boolean> => {
        const chainParams = {
          chainId: baseSepoliaChainIdHex,
          chainName: 'Base Sepolia',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://sepolia.base.org'],
          blockExplorerUrls: ['https://sepolia.basescan.org'],
        };

        try {
          if (walletClient?.request) {
            await walletClient.request({
              method: 'wallet_addEthereumChain',
              params: [chainParams],
            });
            console.log('wallet_addEthereumChain succeeded');
            return true;
          }
          if ((window as any).ethereum?.request) {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [chainParams],
            });
            console.log('window.ethereum wallet_addEthereumChain succeeded');
            return true;
          }
          return false;
        } catch (addError) {
          console.log('wallet_addEthereumChain error:', addError);
          return false;
        }
      };

      await waitForForeground();
      return trySwitchChain();
    };

    // Ensure we're on Base Sepolia before watchAsset
    const ensureBaseSepolia = async (): Promise<boolean> => {
      // Always force the network switch for reliability with WalletConnect
      console.log(`Forcing network switch to Base Sepolia (chainId: ${CHAIN_ID}) before watchAsset...`);
      const switched = await forceNetworkSwitch();
      if (!switched) {
        console.log('Network switch failed or was rejected');
        logWatchAssetAttempt({
          provider: 'wagmi',
          success: false,
          error: 'Failed to switch to Base Sepolia network',
          params: paramsOptions,
        });
      }
      // Small delay to let MetaMask stabilize after network switch
      await new Promise(resolve => setTimeout(resolve, 500));
      return switched;
    };

    // 1) Prefer wagmi's useWatchAsset hook - properly routes through connector (works for WalletConnect)
    if (watchAssetAsync && isConnected) {
      console.log('Attempting to add $ZSOLAR token via wagmi watchAssetAsync...');
      try {
        // Token exists on Base Sepolia only; ensure wallet is on the same chain before requesting watchAsset.
        await ensureBaseSepolia();

        await waitForForeground();
        const success = await watchAssetAsync({
          type: 'ERC20',
          options: paramsOptions,
        });
        logWatchAssetAttempt({ provider: 'wagmi', success: Boolean(success), params: paramsOptions });
        if (success) {
          markSuccess();
          return true;
        }
        console.log('wagmi watchAssetAsync returned false');
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.log('wagmi watchAssetAsync threw:', errMsg);
        logWatchAssetAttempt({ provider: 'wagmi', success: false, error: errMsg, params: paramsOptions });
      }
    } else {
      console.warn('wagmi watchAssetAsync not available');
      logWatchAssetAttempt({ provider: 'wagmi', success: false, error: 'watchAssetAsync not available or not connected' });
    }

    // 2) Fallback to viem walletClient (older approach, may not work with WalletConnect)
    if (walletClient) {
      console.log('Attempting to add $ZSOLAR token via walletClient.watchAsset...');
      try {
        await ensureBaseSepolia();
        await waitForForeground();
        const success = await walletClient.watchAsset({
          type: 'ERC20',
          options: paramsOptions,
        });
        logWatchAssetAttempt({ provider: 'walletClient', success: Boolean(success), params: paramsOptions });
        if (success) {
          markSuccess();
          return true;
        }
        console.log('walletClient.watchAsset returned false');
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.log('walletClient.watchAsset threw:', errMsg);
        logWatchAssetAttempt({ provider: 'walletClient', success: false, error: errMsg, params: paramsOptions });
      }
    } else {
      console.warn('No walletClient available for watchAsset');
    }

    // 3) Final fallback to injected provider (desktop MetaMask extension, etc.)
    if (window.ethereum?.request) {
      console.log('Attempting to add $ZSOLAR token via window.ethereum.request(wallet_watchAsset)...');
      try {
        await ensureBaseSepolia();
        await waitForForeground();
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: paramsOptions,
          },
        });
        logWatchAssetAttempt({ provider: 'window.ethereum', success: Boolean(wasAdded), params: paramsOptions });
        if (wasAdded) markSuccess();
        return Boolean(wasAdded);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.log('window.ethereum.request threw:', errMsg);
        logWatchAssetAttempt({ provider: 'window.ethereum', success: false, error: errMsg, params: paramsOptions });
        return false;
      }
    }

    console.warn('No supported provider available for wallet_watchAsset');
    logWatchAssetAttempt({ provider: 'none', success: false, error: 'No provider available' });
    return false;
  };

  // Add NFTs to wallet after minting (only prompt once)
  const addNFTsToWallet = async (tokenIds: number[]): Promise<boolean> => {
    // Skip if already added/acknowledged
    if (hasNFTsBeenAdded()) {
      console.log('ZenSolar NFTs already acknowledged');
      return true;
    }

    // NFT watchAsset is not widely supported, so we just mark as acknowledged
    // Wallets auto-detect NFTs on most platforms
    markNFTsAdded();
    console.log('NFTs acknowledged - they should appear automatically in wallet');
    return true;
  };

  // Get readable label for category
  const getCategoryLabel = (category: MintCategory): string => {
    if (category === 'all') return 'All Categories';
    if (category === 'solar') return 'Solar Production';
    if (category === 'ev_miles') return 'EV Miles Driven';
    if (category === 'battery') return 'Battery Storage';
    if (category === 'charging') return 'EV Charging';
    return category;
  };

  // Show confirmation dialog before minting
  const handleRequestMint = (category: MintCategory) => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first to mint tokens.",
        variant: "destructive",
      });
      return;
    }
    
    setPendingMintCategory(category);
    setTokenMintDialog(false);
    setConfirmMintDialog(true);
  };

  // Actually execute the mint after confirmation
  const handleConfirmMint = async () => {
    if (!pendingMintCategory) return;
    
    setConfirmMintDialog(false);
    const category = pendingMintCategory;
    setPendingMintCategory(null);
    setMintingState({ isLoading: true, type: 'token', category });
    setMintingProgressDialog(true);
    setMintingProgress({ step: 'preparing', message: 'Preparing your transaction...' });
    hapticSuccess();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      const categoryLabel = category === 'all' ? 'all categories' : category.replace('_', ' ');
      setMintingProgress({ step: 'submitting', message: `Minting ${categoryLabel} tokens...` });


      // Call mint-rewards with category parameter
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'mint-rewards',
          walletAddress,
          category, // 'solar', 'ev_miles', 'battery', 'charging', or 'all'
        },
      });

      if (error) {
        const errorDetails = (error as any)?.context?.json || data;
        throw new Error(errorDetails?.message || errorDetails?.error || error.message || 'Minting failed');
      }

      if (data?.requiresRegistration) {
        throw new Error('Wallet not registered. Registration should have happened automatically. Please try again.');
      }

      if (data?.error === 'simulation_failed') {
        throw new Error(data.message || 'Contract simulation failed. Please contact support.');
      }

      setMintingProgress({ step: 'confirming', message: 'Waiting for confirmation...' });

      const result = data as MintResult;

        if (result.success) {
        setMintingProgress({ step: 'complete', message: 'Transaction confirmed!' });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMintingProgressDialog(false);
        triggerConfetti();
        
        // Prompt to add $ZSOLAR token to wallet for seamless UX (best-effort)
        // NOTE: Some WalletConnect sessions do not support wallet_watchAsset.
        if (!hasTokenBeenAdded()) {
          // small delay to ensure UI settles before triggering the wallet prompt
          window.setTimeout(async () => {
            try {
              console.log('Auto-prompting to add $ZSOLAR token to wallet...');
              const added = await addZsolarToWallet();
              if (added) {
                toast({
                  title: 'Token Added',
                  description: '$ZSOLAR token has been added to your wallet.',
                });
              } else {
                console.log('Auto token add not supported or was declined');
              }
            } catch (err) {
              console.log('Auto token add declined or failed:', err);
            }
          }, 750);
        }
        
        // Also auto-add NFTs if any were minted
        if (result.nftsMinted && result.nftsMinted.length > 0) {
          try {
            await addNFTsToWallet(result.nftsMinted);
          } catch (err) {
            console.log('NFT add failed:', err);
          }
        }
        
        let successMessage = result.message || `$ZSOLAR tokens minted successfully!`;
        if ((data as any).breakdown) {
          const b = (data as any).breakdown;
          const parts = [];
          if (b.solarKwh > 0) parts.push(`☀️ Solar: ${b.solarKwh} kWh`);
          if (b.evMiles > 0) parts.push(`🚗 EV Miles: ${b.evMiles}`);
          if (b.batteryKwh > 0) parts.push(`🔋 Battery: ${b.batteryKwh} kWh`);
          if (b.chargingKwh > 0) parts.push(`⚡ Charging: ${b.chargingKwh} kWh`);
          if (parts.length > 0) {
            successMessage += `\n\n${parts.join('\n')}`;
          }
        }
        
        setResultDialog({
          open: true,
          success: true,
          txHash: result.txHash,
          message: successMessage,
          type: 'token',
        });
        
        // Trigger haptic feedback on success
        hapticSuccess();
        
        // Wait for baseline updates to propagate before refreshing
        console.log('Waiting for baseline updates to propagate...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await onRefresh();
        await checkEligibility();
      } else {
        throw new Error(result.error || result.message || 'Minting failed');
      }

    } catch (error) {
      console.error('Token minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      
      setMintingProgress({ step: 'error', message: errorMessage });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMintingProgressDialog(false);
      setResultDialog({
        open: true,
        success: false,
        message: errorMessage,
        type: 'token',
      });
    } finally {
      setMintingState({ isLoading: false, type: null });
    }
  };

  const handleMintWelcomeNFT = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first to mint NFTs.",
        variant: "destructive",
      });
      return;
    }

    setMintingState({ isLoading: true, type: 'nft' });
    hapticSuccess();

    try {
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'register',
          walletAddress,
        },
      });

      if (error) throw error;

      const result = data as MintResult;

      if (result.success) {
        if (!result.alreadyRegistered) {
          triggerConfetti();
        }
        
        setResultDialog({
          open: true,
          success: true,
          txHash: result.txHash,
          message: result.alreadyRegistered 
            ? "You already have your Welcome NFT! Keep earning to unlock milestone NFTs."
            : result.message || 'Welcome NFT minted successfully!',
          type: 'nft',
        });
        
        await onRefresh();
        await checkEligibility();
      } else {
        throw new Error(result.error || result.message || 'Minting failed');
      }

    } catch (error) {
      console.error('NFT minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      
      setResultDialog({
        open: true,
        success: false,
        message: errorMessage,
        type: 'nft',
      });
    } finally {
      setMintingState({ isLoading: false, type: null });
    }
  };

  // Open NFT selection dialog instead of auto-minting
  const handleOpenMilestoneDialog = () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first to mint NFTs.",
        variant: "destructive",
      });
      return;
    }
    setNftMintResult(null);
    setSelectedNft(null);
    setNftMintDialog({ open: true, type: 'milestone' });
  };

  const handleOpenComboDialog = () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first to mint NFTs.",
        variant: "destructive",
      });
      return;
    }
    setNftMintResult(null);
    setSelectedNft(null);
    setNftMintDialog({ open: true, type: 'combo' });
  };

  // Mint a single milestone NFT
  const handleMintSingleMilestone = async (nft: EligibleNFT) => {
    if (!walletAddress) return;

    setMintingState({ isLoading: true, type: 'milestone' });
    setSelectedNft(nft);

    try {
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'claim-milestone-nfts',
          walletAddress,
          specificTokenId: nft.tokenId,
        },
      });

      if (error) throw error;

      const result = data as MintResult;

      if (result.success) {
        // Check if our specific NFT was minted
        const wasMinted = result.nftsMinted?.includes(nft.tokenId);
        
        if (wasMinted) {
          // Only trigger confetti and haptic AFTER confirming the NFT was actually minted
          triggerConfetti();
          hapticSuccess();
          
          setNftMintResult({
            success: true,
            txHash: result.txHash,
            tokenId: nft.tokenId,
            nftName: nft.name,
          });
          
          await onRefresh();
          await checkEligibility();
        } else {
          throw new Error('NFT was not minted. It may already be on-chain.');
        }
      } else {
        throw new Error(result.error || result.message || 'Minting failed');
      }

    } catch (error) {
      console.error('Milestone NFT minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setMintingState({ isLoading: false, type: null });
    }
  };

  // Mint a single combo NFT
  const handleMintSingleCombo = async (combo: EligibleCombo) => {
    if (!walletAddress) return;

    setMintingState({ isLoading: true, type: 'combo' });
    setSelectedNft(combo);

    try {
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'mint-combos',
          walletAddress,
          tokenIds: [combo.tokenId],
          comboTypes: [combo.comboType],
        },
      });

      if (error) throw error;

      const result = data as MintResult;

      if (result.success) {
        // Trigger confetti and haptic on success
        triggerConfetti();
        hapticSuccess();
        setNftMintResult({
          success: true,
          txHash: result.txHash,
          tokenId: combo.tokenId,
          nftName: combo.name,
        });
        
        await onRefresh();
        await checkEligibility();
      } else {
        throw new Error(result.error || result.message || 'Minting failed');
      }

    } catch (error) {
      console.error('Combo NFT minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      toast({
        title: "Minting Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setMintingState({ isLoading: false, type: null });
    }
  };

  // Get milestone ID from token ID for artwork lookup
  const getMilestoneIdFromTokenId = (tokenId: number): string => {
    return TOKEN_ID_TO_MILESTONE[tokenId] || `combo_${tokenId - 33}`;
  };

  // Copy helper for NFT import section
  const handleCopyNftInfo = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const getExplorerUrl = (txHash: string) => {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  const isMinting = mintingState.isLoading;
  const hasWelcomeNFT = eligibility?.hasWelcomeNFT ?? false;
  const eligibleMilestones = eligibility?.eligibleMilestoneNFTs?.length ?? 0;
  const eligibleCombos = eligibility?.eligibleComboNFTs?.length ?? 0;

  return (
    <>
      <div className="space-y-3">
        {/* Mint Tokens Button */}
        <Button
          onClick={() => setTokenMintDialog(true)}
          disabled={isLoading || isMinting || !walletAddress}
          className="w-full bg-primary hover:bg-primary/90 animate-pulse-glow"
          size="lg"
        >
          {mintingState.type === 'token' && mintingState.isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Coins className="mr-2 h-4 w-4" />
          )}
          {mintingState.type === 'token' && mintingState.isLoading 
            ? 'MINTING...' 
            : 'MINT $ZSOLAR TOKENS'}
          {totalPendingTokens > 0 && (
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {totalPendingTokens.toLocaleString()}
            </Badge>
          )}
        </Button>

        {/* NFT Collection Button - shows all eligible NFTs */}
        <Button
          onClick={() => navigate('/nft-collection')}
          disabled={isLoading || isMinting}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Images className="mr-2 h-4 w-4" />
          MINT ZENSOLAR NFTS
          {eligibility && eligibility.totalEligible > 0 && (
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {eligibility.totalEligible} available
            </Badge>
          )}
        </Button>

        {/* Milestone NFTs Button - show if eligible */}
        {eligibleMilestones > 0 && (
          <Button
            onClick={handleOpenMilestoneDialog}
            disabled={isLoading || isMinting || !walletAddress}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            size="lg"
          >
            <Trophy className="mr-2 h-4 w-4" />
            MINT MILESTONE NFTS
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {eligibleMilestones}
            </Badge>
          </Button>
        )}

        {/* Combo NFTs Button - always show as the last CTA (disabled if none eligible) */}
        {walletAddress && hasWelcomeNFT && (
          <Button
            onClick={handleOpenComboDialog}
            disabled={isLoading || isMinting || eligibleCombos === 0}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-60"
            size="lg"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            MINT COMBO NFTS
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {eligibleCombos}
            </Badge>
          </Button>
        )}

        {/* Status message */}
        {walletAddress && hasWelcomeNFT && eligibleMilestones === 0 && eligibleCombos === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            ✅ All available NFTs claimed! Keep earning to unlock more milestones.
          </p>
        )}

        {!walletAddress && (
          <p className="text-xs text-muted-foreground text-center">
            Connect your wallet above to mint tokens and NFTs
          </p>
        )}

        {/* Owned NFTs count */}
        {eligibility && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>Owned: {eligibility.ownedNFTs.length} NFTs</span>
          </div>
        )}

        <Button
          onClick={async () => {
            await onRefresh();
            await checkEligibility();
          }}
          disabled={isLoading || isMinting}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {isLoading || checkingEligibility ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          REFRESH DASHBOARD
        </Button>
      </div>

      {/* Token Category Selection Dialog */}
      <Dialog open={tokenMintDialog} onOpenChange={setTokenMintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20">
                <Coins className="h-5 w-5 text-primary" />
              </span>
              <span className="text-xl">Mint $ZSOLAR Tokens</span>
            </DialogTitle>
            <DialogDescription className="pt-1.5 text-muted-foreground/80">
              Mint your pending rewards by category or all at once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {totalPendingTokens === 0 ? (
              <div className="bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">No tokens available to mint</p>
                    <p className="text-xs text-muted-foreground">
                      Connect devices and generate energy to earn tokens. Try refreshing your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Category breakdown */}
                <div className="space-y-2">
                  {/* Solar Energy */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-gradient-to-r from-muted/40 to-transparent hover:border-solar/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-solar/20 to-solar/10 shadow-sm">
                        <Sun className="h-4 w-4 text-solar" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Solar Energy</p>
                        <p className="text-xs text-muted-foreground">{pendingRewards.solar.toLocaleString()} $ZSOLAR</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestMint('solar')}
                      disabled={pendingRewards.solar === 0 || isMinting}
                      className="rounded-lg h-9 px-4 hover:bg-solar/10 hover:border-solar/30 hover:text-solar transition-colors"
                    >
                      {mintingState.category === 'solar' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mint'
                      )}
                    </Button>
                  </div>

                  {/* Battery Storage */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-gradient-to-r from-muted/40 to-transparent hover:border-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 shadow-sm">
                        <Battery className="h-4 w-4 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Battery Storage</p>
                        <p className="text-xs text-muted-foreground">{pendingRewards.battery.toLocaleString()} $ZSOLAR</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestMint('battery')}
                      disabled={pendingRewards.battery === 0 || isMinting}
                      className="rounded-lg h-9 px-4 hover:bg-secondary/10 hover:border-secondary/30 hover:text-secondary transition-colors"
                    >
                      {mintingState.category === 'battery' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mint'
                      )}
                    </Button>
                  </div>

                  {/* EV Miles */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-gradient-to-r from-muted/40 to-transparent hover:border-energy/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-energy/20 to-energy/10 shadow-sm">
                        <Car className="h-4 w-4 text-energy" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">EV Miles</p>
                        <p className="text-xs text-muted-foreground">{pendingRewards.evMiles.toLocaleString()} $ZSOLAR</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestMint('ev_miles')}
                      disabled={pendingRewards.evMiles === 0 || isMinting}
                      className="rounded-lg h-9 px-4 hover:bg-energy/10 hover:border-energy/30 hover:text-energy transition-colors"
                    >
                      {mintingState.category === 'ev_miles' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mint'
                      )}
                    </Button>
                  </div>

                  {/* EV Charging */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-gradient-to-r from-muted/40 to-transparent hover:border-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 shadow-sm">
                        <Zap className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">EV Charging</p>
                        <p className="text-xs text-muted-foreground">{pendingRewards.charging.toLocaleString()} $ZSOLAR</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequestMint('charging')}
                      disabled={pendingRewards.charging === 0 || isMinting}
                      className="rounded-lg h-9 px-4 hover:bg-accent/10 hover:border-accent/30 hover:text-accent transition-colors"
                    >
                      {mintingState.category === 'charging' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mint'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-3 text-xs text-muted-foreground font-medium">or mint everything</span>
                  </div>
                </div>

                {/* Total & Mint All */}
                <div className="relative p-5 rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                  <div className="relative flex items-center justify-between mb-4">
                    <span className="font-semibold text-foreground">Total Pending</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {totalPendingTokens.toLocaleString()} $ZSOLAR
                    </span>
                  </div>
                  <Button
                    className="relative w-full h-12 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.01] transition-all duration-200"
                    onClick={() => handleRequestMint('all')}
                    disabled={isMinting}
                  >
                    {mintingState.category === 'all' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Coins className="mr-2 h-4 w-4" />
                    )}
                    Mint All Tokens
                  </Button>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTokenMintDialog(false)}
              className="w-full h-11 rounded-xl border-border/60 hover:bg-muted/60"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mint Confirmation Dialog */}
      <Dialog open={confirmMintDialog} onOpenChange={setConfirmMintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20">
                <Coins className="h-5 w-5 text-primary" />
              </span>
              <span className="text-xl">Confirm Minting</span>
            </DialogTitle>
            <DialogDescription className="pt-4">
              <div className="space-y-4">
                <p className="text-base text-foreground">
                  You are about to mint tokens for:
                </p>
                
                {pendingMintCategory && (
                  <div className="relative p-5 rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                    <div className="relative flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{getCategoryLabel(pendingMintCategory)}</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          {getCategoryTokens(pendingMintCategory).toLocaleString()} $ZSOLAR
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You receive 93% of {getCategoryActivityUnits(pendingMintCategory).toLocaleString()} activity units
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 border border-border/60">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Wallet className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This will submit a transaction to the Base Sepolia blockchain. 
                      The tokens will be minted directly to your connected wallet.
                    </p>
                  </div>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmMintDialog(false);
                setPendingMintCategory(null);
              }}
              className="flex-1 h-11 rounded-xl border-border/60 hover:bg-muted/60"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMint}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.01] transition-all duration-200"
            >
              <Coins className="mr-2 h-4 w-4" />
              Confirm Mint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Minting Progress Dialog */}
      <Dialog open={mintingProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <div className="py-10 text-center space-y-6">
            {/* Animated Icon */}
            <div className="relative w-24 h-24 mx-auto">
              {mintingProgress.step === 'error' ? (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/5 flex items-center justify-center ring-2 ring-destructive/20 shadow-xl">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
              ) : mintingProgress.step === 'complete' ? (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-500/25 via-green-500/15 to-green-500/5 flex items-center justify-center ring-2 ring-green-500/20 shadow-xl">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 animate-pulse" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-2 ring-primary/20 shadow-xl">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  </div>
                </>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold">
                {mintingProgress.step === 'preparing' && 'Preparing Transaction'}
                {mintingProgress.step === 'submitting' && 'Submitting to Blockchain'}
                {mintingProgress.step === 'confirming' && 'Confirming Transaction'}
                {mintingProgress.step === 'complete' && 'Transaction Complete!'}
                {mintingProgress.step === 'error' && 'Transaction Failed'}
              </h3>
              <p className="text-sm text-muted-foreground">{mintingProgress.message}</p>
            </div>
            
            {/* Progress bar */}
            {mintingProgress.step !== 'error' && mintingProgress.step !== 'complete' && (
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-5 border border-border/60 max-w-xs mx-auto">
                <div className="h-2.5 bg-muted rounded-full overflow-hidden ring-1 ring-border/50">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-out rounded-full"
                    style={{
                      width: mintingProgress.step === 'preparing' ? '25%' : 
                             mintingProgress.step === 'submitting' ? '50%' : 
                             mintingProgress.step === 'confirming' ? '75%' : '100%'
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Please wait while your transaction is being processed...
                </p>
              </div>
            )}
            
            {/* Success message */}
            {mintingProgress.step === 'complete' && (
              <div className="bg-gradient-to-br from-green-500/15 via-green-500/10 to-green-500/5 rounded-xl p-4 border border-green-500/20 max-w-xs mx-auto">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✨ Your tokens have been minted successfully!
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog({ ...resultDialog, open })}>
        <DialogContent className="max-w-[calc(100vw-24px)] max-h-[calc(100dvh-48px)] overflow-y-auto sm:max-w-md">
          <div className="py-6 space-y-5">
            {/* Success/Error Icon */}
            <div className="relative w-20 h-20 mx-auto">
              {resultDialog.success ? (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-500/25 via-green-500/15 to-green-500/5 flex items-center justify-center ring-2 ring-green-500/20 shadow-xl">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-destructive/20 via-destructive/10 to-destructive/5 flex items-center justify-center ring-2 ring-destructive/20 shadow-xl">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
              )}
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h3 className={`text-xl font-bold ${resultDialog.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                {resultDialog.success ? (
                  <>
                    {resultDialog.type === 'token' && 'Tokens Minted!'}
                    {resultDialog.type === 'nft' && 'Welcome NFT Minted!'}
                    {resultDialog.type === 'milestone' && 'Milestone NFTs Claimed!'}
                    {resultDialog.type === 'combo' && 'Combo NFTs Minted!'}
                  </>
                ) : (
                  'Minting Failed'
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {resultDialog.message}
              </p>
            </div>
            
            {/* Transaction Hash */}
            {resultDialog.success && resultDialog.txHash && (
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 border border-border/60">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Transaction Hash</p>
                <code className="text-xs break-all text-foreground font-mono">{resultDialog.txHash}</code>
                <a
                  href={getExplorerUrl(resultDialog.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 bg-primary/8 hover:bg-primary/12 px-4 py-2 rounded-lg transition-all duration-200"
                >
                  View on BaseScan <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}

            {/* Success message */}
            {resultDialog.success && (
              <div className="bg-gradient-to-br from-green-500/15 via-green-500/10 to-green-500/5 rounded-xl p-4 border border-green-500/20">
                <p className="text-sm text-muted-foreground">
                  {resultDialog.type === 'token' && 'Your $ZSOLAR tokens have been minted to your wallet!'}
                  {resultDialog.type === 'nft' && 'Your Welcome NFT has been minted! Check your wallet or OpenSea to view it.'}
                  {resultDialog.type === 'milestone' && 'Your milestone NFTs have been claimed! View them in your wallet or on OpenSea.'}
                  {resultDialog.type === 'combo' && 'Your combo achievement NFTs have been minted! These celebrate your multi-category progress.'}
                </p>
              </div>
            )}
            
            {/* Manual Token Add Instructions - shows after 4 second delay */}
            {resultDialog.success && resultDialog.type === 'token' && (
              showTokenAddPanel ? (
                <ManualTokenAddPanel />
              ) : (
                <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Preparing wallet instructions...</span>
                </div>
              )
            )}
            
            {/* Diagnostics panel for debugging wallet_watchAsset - Admin only */}
            {isAdmin && (
              <WatchAssetDiagnostics 
                attempts={watchAssetAttempts} 
                onClear={clearWatchAssetDiagnostics} 
              />
            )}
            
            <Button 
              onClick={() => setResultDialog({ ...resultDialog, open: false })}
              className={`w-full h-11 rounded-xl ${resultDialog.success ? 'bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/25' : ''}`}
              variant={resultDialog.success ? "default" : "outline"}
            >
              {resultDialog.success ? 'Awesome!' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NFT Selection Dialog - for Milestone and Combo NFTs */}
      <Dialog 
        open={nftMintDialog.open} 
        onOpenChange={(open) => {
          if (!open && !isMinting) {
            setNftMintDialog({ open: false, type: null });
            setNftMintResult(null);
            setSelectedNft(null);
          }
        }}
      >
        <DialogContent className="max-w-[calc(100vw-24px)] max-h-[calc(100dvh-48px)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {nftMintDialog.type === 'milestone' ? (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-emerald-500/5 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/20">
                  <Trophy className="h-5 w-5 text-emerald-500" />
                </span>
              ) : (
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-purple-500/5 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/20">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                </span>
              )}
              <span className="text-xl">
                {nftMintDialog.type === 'milestone' ? 'Mint Milestone NFTs' : 'Mint Combo NFTs'}
              </span>
            </DialogTitle>
            <DialogDescription className="pt-1.5 text-muted-foreground/80">
              {nftMintResult 
                ? 'NFT minted successfully! Copy the info below to add it to MetaMask.'
                : 'Select an NFT to mint. Each NFT must be minted individually.'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Success state with MetaMask import info */}
          {nftMintResult ? (
            <div className="space-y-5 py-2">
              {/* Success header */}
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-green-500/25 via-green-500/15 to-green-500/5 flex items-center justify-center ring-2 ring-green-500/20 shadow-xl">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              </div>
              
              <div className="text-center">
                <h4 className="font-bold text-lg text-green-600 dark:text-green-400">
                  {nftMintResult.nftName} minted!
                </h4>
              </div>

              {/* Transaction link */}
              {nftMintResult.txHash && (
                <div className="text-center">
                  <a
                    href={`https://sepolia.basescan.org/tx/${nftMintResult.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 bg-primary/8 hover:bg-primary/12 px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    View transaction <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              {/* MetaMask Import Section - shows after 4 second delay */}
              {showNftImportPanel ? (
                <div className="relative p-5 bg-gradient-to-br from-muted/60 via-muted/40 to-muted/20 rounded-2xl border border-border/60 space-y-4 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="relative flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm ring-1 ring-primary/20">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <span className="font-semibold">Add to MetaMask</span>
                      <p className="text-xs text-muted-foreground">Copy these to import your NFT</p>
                    </div>
                  </div>
                  
                  <div className="relative space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Contract Address</label>
                      <button
                        onClick={() => handleCopyNftInfo(NFT_CONTRACT_ADDRESS, 'Contract address')}
                        className="flex items-center justify-between gap-2 px-4 py-3 bg-background/80 rounded-xl border border-border/50 text-sm font-mono hover:bg-muted/50 hover:border-primary/30 transition-all w-full group shadow-sm"
                      >
                        <span className="truncate">{NFT_CONTRACT_ADDRESS}</span>
                        <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                      </button>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Token ID</label>
                      <button
                        onClick={() => handleCopyNftInfo(String(nftMintResult.tokenId), 'Token ID')}
                        className="flex items-center justify-between gap-2 px-4 py-3 bg-background/80 rounded-xl border border-border/50 text-sm font-mono hover:bg-muted/50 hover:border-primary/30 transition-all w-full group shadow-sm"
                      >
                        <span>{nftMintResult.tokenId}</span>
                        <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Preparing wallet instructions...</span>
                </div>
              )}

              {/* Continue minting or close */}
              <div className="flex gap-3 pt-2">
                {((nftMintDialog.type === 'milestone' && eligibility && eligibility.eligibleMilestoneNFTs.length > 0) ||
                  (nftMintDialog.type === 'combo' && eligibility && eligibility.eligibleComboNFTs.length > 0)) ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNftMintResult(null);
                      setSelectedNft(null);
                    }}
                    className="flex-1 h-11 rounded-xl border-border/60 hover:bg-muted/60"
                  >
                    Mint Another
                  </Button>
                ) : null}
                <Button
                  onClick={() => {
                    setNftMintDialog({ open: false, type: null });
                    setNftMintResult(null);
                    setSelectedNft(null);
                  }}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg shadow-primary/25"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            /* NFT Selection list */
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-2 py-2">
                {nftMintDialog.type === 'milestone' && eligibility?.eligibleMilestoneNFTs.map((nft) => {
                  const milestoneId = getMilestoneIdFromTokenId(nft.tokenId);
                  const artwork = getNftArtwork(milestoneId);
                  const isSelected = selectedNft && 'tokenId' in selectedNft && selectedNft.tokenId === nft.tokenId;
                  const isCurrentlyMinting = isMinting && isSelected;
                  
                  return (
                    <div 
                      key={nft.tokenId}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
                        {artwork ? (
                          <img 
                            src={artwork} 
                            alt={nft.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{nft.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{nft.category}</p>
                        <p className="text-xs text-muted-foreground">Token ID: {nft.tokenId}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleMintSingleMilestone(nft)}
                        disabled={isMinting}
                        className="flex-shrink-0"
                      >
                        {isCurrentlyMinting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Mint'
                        )}
                      </Button>
                    </div>
                  );
                })}

                {nftMintDialog.type === 'combo' && eligibility?.eligibleComboNFTs.map((combo) => {
                  const milestoneId = getMilestoneIdFromTokenId(combo.tokenId);
                  const artwork = getNftArtwork(milestoneId);
                  const isSelected = selectedNft && 'tokenId' in selectedNft && selectedNft.tokenId === combo.tokenId;
                  const isCurrentlyMinting = isMinting && isSelected;
                  
                  return (
                    <div 
                      key={combo.tokenId}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/5 flex-shrink-0">
                        {artwork ? (
                          <img 
                            src={artwork} 
                            alt={combo.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{combo.name}</h4>
                        <p className="text-xs text-muted-foreground">{combo.comboType}</p>
                        <p className="text-xs text-muted-foreground">Token ID: {combo.tokenId}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleMintSingleCombo(combo)}
                        disabled={isMinting}
                        className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {isCurrentlyMinting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Mint'
                        )}
                      </Button>
                    </div>
                  );
                })}

                {/* Empty state */}
                {((nftMintDialog.type === 'milestone' && (!eligibility?.eligibleMilestoneNFTs || eligibility.eligibleMilestoneNFTs.length === 0)) ||
                  (nftMintDialog.type === 'combo' && (!eligibility?.eligibleComboNFTs || eligibility.eligibleComboNFTs.length === 0))) && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No eligible NFTs to mint</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {!nftMintResult && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setNftMintDialog({ open: false, type: null });
                  setSelectedNft(null);
                }}
                className="w-full"
                disabled={isMinting}
              >
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});