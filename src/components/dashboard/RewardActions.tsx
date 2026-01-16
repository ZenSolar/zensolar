import { Button } from '@/components/ui/button';
import { Coins, Award, RefreshCw, Loader2, CheckCircle2, ExternalLink, Trophy, Sparkles, Images, AlertCircle, Sun, Car, Battery, Zap } from 'lucide-react';
import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { useAccount, useWalletClient } from 'wagmi';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_TOKEN_SYMBOL, ZSOLAR_TOKEN_DECIMALS, ZSOLAR_TOKEN_IMAGE } from '@/lib/wagmi';
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
import { WatchAssetDiagnostics, type WatchAssetAttempt } from './WatchAssetDiagnostics';

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
  const { data: walletClient } = useWalletClient();
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
  const [tokenMintDialog, setTokenMintDialog] = useState(false);
  const [confirmMintDialog, setConfirmMintDialog] = useState(false);
  const [pendingMintCategory, setPendingMintCategory] = useState<MintCategory | null>(null);
  const [mintingProgressDialog, setMintingProgressDialog] = useState(false);
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

  // Expose openTokenMintDialog to parent via ref
  useImperativeHandle(ref, () => ({
    openTokenMintDialog: () => setTokenMintDialog(true),
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

    const params = {
      type: 'ERC20' as const,
      options: paramsOptions,
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

    const markSuccess = () => {
      markTokenAdded();
      console.log('$ZSOLAR token added to wallet successfully');
    };

    // 1) Prefer wagmi/viem wallet client (works for many injected + some WC wallets)
    if (walletClient) {
      console.log('Attempting to add $ZSOLAR token via walletClient.watchAsset...');
      try {
        await waitForForeground();
        const success = await walletClient.watchAsset(params);
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
      logWatchAssetAttempt({ provider: 'walletClient', success: false, error: 'walletClient is null/undefined' });
    }

    // 2) Fallback to injected provider (desktop MetaMask, etc.)
    if (window.ethereum?.request) {
      console.log('Attempting to add $ZSOLAR token via window.ethereum.request(wallet_watchAsset)...');
      try {
        await waitForForeground();
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params,
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
    logWatchAssetAttempt({ provider: 'none', success: false, error: 'No provider available (no walletClient, no window.ethereum)' });
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

  const handleMintMilestoneNFTs = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first to mint NFTs.",
        variant: "destructive",
      });
      return;
    }

    setMintingState({ isLoading: true, type: 'milestone' });
    hapticSuccess();

    try {
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'claim-milestone-nfts',
          walletAddress,
        },
      });

      if (error) throw error;

      const result = data as MintResult;

      if (result.success) {
        triggerConfetti();
        
        // Prompt to add NFTs to wallet (only once ever)
        if (result.nftsMinted && result.nftsMinted.length > 0) {
          setTimeout(() => addNFTsToWallet(result.nftsMinted!), 1500);
        }
        
        setResultDialog({
          open: true,
          success: true,
          txHash: result.txHash,
          message: result.message || 'Milestone NFTs claimed!',
          type: 'milestone',
        });
        
        await onRefresh();
        await checkEligibility();
      } else {
        throw new Error(result.error || result.message || 'Minting failed');
      }

    } catch (error) {
      console.error('Milestone NFT minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      
      setResultDialog({
        open: true,
        success: false,
        message: errorMessage,
        type: 'milestone',
      });
    } finally {
      setMintingState({ isLoading: false, type: null });
    }
  };

  const handleMintComboNFTs = async () => {
    if (!walletAddress || !eligibility?.eligibleComboNFTs.length) {
      toast({
        title: "No Eligible Combos",
        description: "You don't have any combo NFTs to claim yet.",
        variant: "destructive",
      });
      return;
    }

    setMintingState({ isLoading: true, type: 'combo' });
    hapticSuccess();

    try {
      const tokenIds = eligibility.eligibleComboNFTs.map(c => c.tokenId);
      const comboTypes = eligibility.eligibleComboNFTs.map(c => c.comboType);

      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'mint-combos',
          walletAddress,
          tokenIds,
          comboTypes,
        },
      });

      if (error) throw error;

      const result = data as MintResult;

      if (result.success) {
        triggerConfetti();
        
        // Prompt to add NFTs to wallet (only once ever)
        if (result.nftsMinted && result.nftsMinted.length > 0) {
          setTimeout(() => addNFTsToWallet(result.nftsMinted!), 1500);
        }
        
        setResultDialog({
          open: true,
          success: true,
          txHash: result.txHash,
          message: result.message || `Minted ${result.mintedCount} combo NFT(s)!`,
          type: 'combo',
        });
        
        await onRefresh();
        await checkEligibility();
      } else {
        throw new Error(result.error || result.message || 'Minting failed');
      }

    } catch (error) {
      console.error('Combo NFT minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      
      setResultDialog({
        open: true,
        success: false,
        message: errorMessage,
        type: 'combo',
      });
    } finally {
      setMintingState({ isLoading: false, type: null });
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
            onClick={handleMintMilestoneNFTs}
            disabled={isLoading || isMinting || !walletAddress}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            size="lg"
          >
            {mintingState.type === 'milestone' && mintingState.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trophy className="mr-2 h-4 w-4" />
            )}
            {mintingState.type === 'milestone' && mintingState.isLoading 
              ? 'MINTING...' 
              : (
                <>
                  MINT MILESTONE NFTS
                  <Badge variant="secondary" className="ml-2 bg-white/20">
                    {eligibleMilestones}
                  </Badge>
                </>
              )}
          </Button>
        )}

        {/* Combo NFTs Button - show if eligible */}
        {eligibleCombos > 0 && (
          <Button
            onClick={handleMintComboNFTs}
            disabled={isLoading || isMinting || !walletAddress}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            size="lg"
          >
            {mintingState.type === 'combo' && mintingState.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {mintingState.type === 'combo' && mintingState.isLoading 
              ? 'MINTING...' 
              : (
                <>
                  MINT COMBO NFTS
                  <Badge variant="secondary" className="ml-2 bg-white/20">
                    {eligibleCombos}
                  </Badge>
                </>
              )}
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
            <DialogTitle className="text-xl flex items-center gap-2">
              <Coins className="h-6 w-6 text-primary" />
              Mint $ZSOLAR Tokens
            </DialogTitle>
            <DialogDescription>
              Mint your pending rewards by category or all at once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {totalPendingTokens === 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
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
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-solar/10">
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
                    >
                      {mintingState.category === 'solar' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mint'
                      )}
                    </Button>
                  </div>

                  {/* Battery Storage */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-secondary/10">
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
                    >
                      {mintingState.category === 'battery' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mint'
                      )}
                    </Button>
                  </div>

                  {/* EV Miles */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-energy/10">
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
                    >
                      {mintingState.category === 'ev_miles' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Mint'
                      )}
                    </Button>
                  </div>

                  {/* EV Charging */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-accent/10">
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
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-xs text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Total & Mint All */}
                <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold">Total Pending</span>
                    <span className="text-xl font-bold text-primary">{totalPendingTokens.toLocaleString()} $ZSOLAR</span>
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
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
              className="w-full"
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
            <DialogTitle className="text-xl flex items-center gap-2">
              <Coins className="h-6 w-6 text-primary" />
              Confirm Minting
            </DialogTitle>
            <DialogDescription className="pt-4">
              <div className="space-y-4">
                <p className="text-base text-foreground">
                  You are about to mint tokens for:
                </p>
                
                {pendingMintCategory && (
                  <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getCategoryLabel(pendingMintCategory)}</span>
                        <span className="text-xl font-bold text-primary">
                          {getCategoryTokens(pendingMintCategory).toLocaleString()} $ZSOLAR
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        You receive 93% of {getCategoryActivityUnits(pendingMintCategory).toLocaleString()} activity units
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="bg-muted/50 rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">
                    This will submit a transaction to the Base Sepolia blockchain. 
                    The tokens will be minted directly to your connected wallet.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmMintDialog(false);
                setPendingMintCategory(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmMint}
              className="flex-1 bg-primary hover:bg-primary/90"
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
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {mintingProgress.step === 'error' ? (
                <AlertCircle className="h-6 w-6 text-destructive" />
              ) : mintingProgress.step === 'complete' ? (
                <CheckCircle2 className="h-6 w-6 text-primary" />
              ) : (
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              )}
              {mintingProgress.step === 'preparing' && 'Preparing Transaction'}
              {mintingProgress.step === 'submitting' && 'Submitting to Blockchain'}
              {mintingProgress.step === 'confirming' && 'Confirming Transaction'}
              {mintingProgress.step === 'complete' && 'Transaction Complete!'}
              {mintingProgress.step === 'error' && 'Transaction Failed'}
            </DialogTitle>
            <DialogDescription className="pt-4">
              <div className="space-y-4">
                <p className="text-base text-foreground">{mintingProgress.message}</p>
                
                {mintingProgress.step !== 'error' && mintingProgress.step !== 'complete' && (
                  <div className="bg-muted/50 rounded-lg p-4 border">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{
                              width: mintingProgress.step === 'preparing' ? '25%' : 
                                     mintingProgress.step === 'submitting' ? '50%' : 
                                     mintingProgress.step === 'confirming' ? '75%' : '100%'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Please wait while your transaction is being processed...
                    </p>
                  </div>
                )}
                
                {mintingProgress.step === 'complete' && (
                  <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                    <p className="text-sm text-primary font-medium">
                      ✨ Your tokens have been minted successfully!
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog({ ...resultDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`text-xl flex items-center gap-2 ${resultDialog.success ? 'text-primary' : 'text-destructive'}`}>
              {resultDialog.success ? (
                <>
                  <CheckCircle2 className="h-6 w-6" />
                  {resultDialog.type === 'token' && 'Tokens Minted!'}
                  {resultDialog.type === 'nft' && 'Welcome NFT Minted!'}
                  {resultDialog.type === 'milestone' && 'Milestone NFTs Claimed!'}
                  {resultDialog.type === 'combo' && 'Combo NFTs Minted!'}
                </>
              ) : (
                'Minting Failed'
              )}
            </DialogTitle>
            <DialogDescription className="pt-3 space-y-4">
              <p className="text-base text-foreground">
                {resultDialog.message}
              </p>
              
              {resultDialog.success && resultDialog.txHash && (
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground mb-2">Transaction Hash:</p>
                  <code className="text-xs break-all text-foreground">{resultDialog.txHash}</code>
                  <a
                    href={getExplorerUrl(resultDialog.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on BaseScan
                  </a>
                </div>
              )}

              {resultDialog.success && (
                <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-token/10 rounded-lg p-4 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    {resultDialog.type === 'token' && 'Your $ZSOLAR tokens have been minted to your wallet!'}
                    {resultDialog.type === 'nft' && 'Your Welcome NFT has been minted! Check your wallet or OpenSea to view it.'}
                    {resultDialog.type === 'milestone' && 'Your milestone NFTs have been claimed! View them in your wallet or on OpenSea.'}
                    {resultDialog.type === 'combo' && 'Your combo achievement NFTs have been minted! These celebrate your multi-category progress.'}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            {resultDialog.success && resultDialog.type === 'token' && (
              <Button 
                onClick={async () => {
                  try {
                    const added = await addZsolarToWallet();
                    if (added) {
                      toast({
                        title: 'Token Added',
                        description: '$ZSOLAR token added to your wallet!',
                      });
                    } else {
                      toast({
                        title: 'Could Not Add Token',
                        description:
                          'Your wallet may not support automatic token adding in this connection mode. Your tokens are still in your wallet—try switching networks, then retry.',
                      });
                    }
                  } catch (err) {
                    console.error('Error adding token:', err);
                    toast({
                      title: 'Could Not Add Token',
                      description:
                        'The request may have been rejected or your wallet does not support this feature. Your tokens are still safely in your wallet!',
                    });
                  }
                }}
                variant="outline"
                className="w-full"
              >
                <Coins className="h-4 w-4 mr-2" />
                Add $ZSOLAR to Wallet
              </Button>
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
              className="w-full"
              variant={resultDialog.success ? "default" : "outline"}
            >
              {resultDialog.success ? 'Awesome!' : 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});