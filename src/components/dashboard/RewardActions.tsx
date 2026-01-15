import { Button } from '@/components/ui/button';
import { Coins, Award, RefreshCw, Loader2, CheckCircle2, ExternalLink, Trophy, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface RewardActionsProps {
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  walletAddress?: string | null;
}

interface MintResult {
  success: boolean;
  txHash?: string;
  message?: string;
  error?: string;
  alreadyRegistered?: boolean;
  mintedCount?: number;
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

export function RewardActions({ onRefresh, isLoading, walletAddress }: RewardActionsProps) {
  const { toast } = useToast();
  const { triggerConfetti } = useConfetti();
  const { success: hapticSuccess } = useHaptics();
  const { isConnected } = useAccount();
  const [mintingState, setMintingState] = useState<{
    isLoading: boolean;
    type: 'token' | 'nft' | 'milestone' | 'combo' | null;
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

  const handleMintTokens = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first to mint tokens.",
        variant: "destructive",
      });
      return;
    }

    setMintingState({ isLoading: true, type: 'token' });
    hapticSuccess();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      // Call calculate-rewards to get pending rewards
      await supabase.functions.invoke('calculate-rewards', {
        body: {},
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      // Mint tokens with activity deltas
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'mint-rewards',
          walletAddress,
          solarDelta: 10,
          evMilesDelta: 5,
          batteryDelta: 2,
          chargingDelta: 3,
        },
      });

      if (error) throw error;

      const result = data as MintResult;

      if (result.success) {
        triggerConfetti();
        setResultDialog({
          open: true,
          success: true,
          txHash: result.txHash,
          message: result.message || 'Tokens minted successfully!',
          type: 'token',
        });
        
        await onRefresh();
        await checkEligibility();
      } else {
        throw new Error(result.error || result.message || 'Minting failed');
      }

    } catch (error) {
      console.error('Token minting error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Minting failed';
      
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
          onClick={handleMintTokens}
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
        </Button>

        {/* Welcome NFT Button - only show if not already owned */}
        {!hasWelcomeNFT && (
          <Button
            onClick={handleMintWelcomeNFT}
            disabled={isLoading || isMinting || !walletAddress}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
            size="lg"
          >
            {mintingState.type === 'nft' && mintingState.isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Award className="mr-2 h-4 w-4" />
            )}
            {mintingState.type === 'nft' && mintingState.isLoading 
              ? 'MINTING...' 
              : 'MINT WELCOME NFT'}
          </Button>
        )}

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
                    {resultDialog.type === 'token' && 'Your $ZSOLAR tokens have been minted to your wallet! They should appear automatically.'}
                    {resultDialog.type === 'nft' && 'Your Welcome NFT has been minted! Check your wallet or OpenSea to view it.'}
                    {resultDialog.type === 'milestone' && 'Your milestone NFTs have been claimed! View them in your wallet or on OpenSea.'}
                    {resultDialog.type === 'combo' && 'Your combo achievement NFTs have been minted! These celebrate your multi-category progress.'}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
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
}