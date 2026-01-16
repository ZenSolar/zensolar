import { Button } from '@/components/ui/button';
import { Coins, Award, RefreshCw, Loader2, CheckCircle2, ExternalLink, Trophy, Sparkles, Images, AlertCircle } from 'lucide-react';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface RewardActionsProps {
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  walletAddress?: string | null;
  pendingTokens?: number;
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

export const RewardActions = forwardRef<RewardActionsRef, RewardActionsProps>(function RewardActions({ onRefresh, isLoading, walletAddress, pendingTokens = 0 }, ref) {
  const navigate = useNavigate();
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
  const [tokenAmountDialog, setTokenAmountDialog] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [maxTokens, setMaxTokens] = useState(0);
  const [loadingMax, setLoadingMax] = useState(false);
  const [mintingProgressDialog, setMintingProgressDialog] = useState(false);
  const [mintingProgress, setMintingProgress] = useState<{
    step: 'preparing' | 'submitting' | 'confirming' | 'complete' | 'error';
    message: string;
  }>({ step: 'preparing', message: 'Preparing transaction...' });

  // Expose openTokenMintDialog to parent via ref
  useImperativeHandle(ref, () => ({
    openTokenMintDialog: () => openTokenAmountDialog(),
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

  const openTokenAmountDialog = async () => {
    if (!walletAddress) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet first to mint tokens.",
        variant: "destructive",
      });
      return;
    }

    // Use pending tokens from dashboard props - this is the accurate value
    const availableTokens = pendingTokens > 0 ? pendingTokens : 0;
    
    setMaxTokens(availableTokens);
    setTokenAmount(availableTokens > 0 ? availableTokens.toString() : '0');
    setTokenAmountDialog(true);
    setLoadingMax(false);
  };

  const handleMintTokens = async () => {
    const amount = parseInt(tokenAmount) || 0;
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid token amount to mint.",
        variant: "destructive",
      });
      return;
    }

    setTokenAmountDialog(false);
    setMintingState({ isLoading: true, type: 'token' });
    setMintingProgressDialog(true);
    setMintingProgress({ step: 'preparing', message: 'Preparing your transaction...' });
    hapticSuccess();

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      setMintingProgress({ step: 'submitting', message: 'Submitting to blockchain...' });

      // Mint tokens with the specified amount
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'mint-rewards',
          walletAddress,
          tokenAmount: amount,
          // Activity deltas proportional to token amount requested
          solarDelta: Math.floor(amount * 0.4),
          evMilesDelta: Math.floor(amount * 0.25),
          batteryDelta: Math.floor(amount * 0.15),
          chargingDelta: Math.floor(amount * 0.2),
        },
      });

      if (error) throw error;

      setMintingProgress({ step: 'confirming', message: 'Waiting for confirmation...' });

      const result = data as MintResult;

      if (result.success) {
        setMintingProgress({ step: 'complete', message: 'Transaction confirmed!' });
        
        // Brief delay to show completion before switching to result
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMintingProgressDialog(false);
        triggerConfetti();
        setResultDialog({
          open: true,
          success: true,
          txHash: result.txHash,
          message: result.message || `${amount} $ZSOLAR tokens minted successfully!`,
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
      
      setMintingProgress({ step: 'error', message: errorMessage });
      
      // Brief delay to show error before switching to result
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

  const handleMaxClick = () => {
    setTokenAmount(maxTokens.toString());
    hapticSuccess();
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
          onClick={openTokenAmountDialog}
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

      {/* Token Amount Selection Dialog */}
      <Dialog open={tokenAmountDialog} onOpenChange={setTokenAmountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Coins className="h-6 w-6 text-primary" />
              Mint $ZSOLAR Tokens
            </DialogTitle>
            <DialogDescription>
              Enter the amount of tokens you want to mint to your wallet.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Zero tokens message */}
            {!loadingMax && maxTokens === 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">No tokens available to mint</p>
                    <p className="text-xs text-muted-foreground">
                      This could be because your energy data hasn't synced yet, or the API rate limit has been reached. 
                      Try refreshing your dashboard or wait a few hours for the API limit to reset.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Slider Control */}
            {!loadingMax && maxTokens > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Select Amount</Label>
                  <span className="text-sm font-semibold text-primary">
                    {parseInt(tokenAmount || '0').toLocaleString()} $ZSOLAR
                  </span>
                </div>
                <Slider
                  value={[parseInt(tokenAmount) || 0]}
                  onValueChange={(value) => setTokenAmount(value[0].toString())}
                  max={maxTokens}
                  min={1}
                  step={Math.max(1, Math.floor(maxTokens / 100))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>{Math.floor(maxTokens / 2).toLocaleString()}</span>
                  <span>{maxTokens.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Input Field */}
            <div className="space-y-2">
              <Label htmlFor="tokenAmount">{maxTokens > 0 ? 'Or enter exact amount' : 'Enter amount'}</Label>
              <div className="flex gap-2">
                <Input
                  id="tokenAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  min="1"
                  max={maxTokens || undefined}
                  className="flex-1"
                  disabled={loadingMax}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleMaxClick}
                  disabled={loadingMax || maxTokens <= 0}
                  className="px-4 font-semibold"
                >
                  {loadingMax ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'MAX'
                  )}
                </Button>
              </div>
              {!loadingMax && (
                <p className="text-sm text-muted-foreground">
                  Available: <span className="font-semibold text-primary">{maxTokens.toLocaleString()}</span> $ZSOLAR
                </p>
              )}
              {loadingMax && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Calculating available tokens...
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setTokenAmountDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMintTokens}
              disabled={!tokenAmount || parseInt(tokenAmount) <= 0 || loadingMax}
              className="bg-primary hover:bg-primary/90"
            >
              <Coins className="mr-2 h-4 w-4" />
              Mint Tokens
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
});