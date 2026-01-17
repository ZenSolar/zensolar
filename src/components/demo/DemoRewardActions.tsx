import { Button } from '@/components/ui/button';
import { Coins, Award, RefreshCw, Loader2, CheckCircle2, ExternalLink, Trophy, Sparkles, AlertCircle, Sun, Car, Battery, Zap, Wallet } from 'lucide-react';
import { useState, forwardRef, useImperativeHandle } from 'react';
import { useConfetti } from '@/hooks/useConfetti';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { Progress } from '@/components/ui/progress';
import { DemoMintResult } from '@/hooks/useDemoData';

export type MintCategory = 'solar' | 'ev_miles' | 'battery' | 'charging' | 'all';

interface PendingRewards {
  solar: number;
  evMiles: number;
  battery: number;
  charging: number;
}

interface DemoRewardActionsProps {
  onRefresh: () => Promise<void>;
  isLoading: boolean;
  walletAddress?: string | null;
  pendingRewards?: PendingRewards;
  hasWelcomeNFT: boolean;
  eligibleMilestones: number;
  eligibleCombos: number;
  ownedNFTCount: number;
  onMintWelcomeNFT: () => Promise<DemoMintResult>;
  onMintTokens: (category: string) => Promise<DemoMintResult>;
}

export interface DemoRewardActionsRef {
  openMintDialogForCategory?: (category: MintCategory) => void;
}

export const DemoRewardActions = forwardRef<DemoRewardActionsRef, DemoRewardActionsProps>(function DemoRewardActions({ 
  onRefresh, 
  isLoading, 
  walletAddress, 
  pendingRewards = { solar: 0, evMiles: 0, battery: 0, charging: 0 },
  hasWelcomeNFT,
  eligibleMilestones,
  eligibleCombos,
  ownedNFTCount,
  onMintWelcomeNFT,
  onMintTokens,
}, ref) {
  const navigate = useNavigate();
  const { triggerConfetti } = useConfetti();
  
  const [mintingState, setMintingState] = useState<{
    isLoading: boolean;
    type: 'token' | 'nft' | null;
    category?: MintCategory;
  }>({ isLoading: false, type: null });
  
  const [tokenMintDialog, setTokenMintDialog] = useState(false);
  const [confirmMintDialog, setConfirmMintDialog] = useState(false);
  const [pendingMintCategory, setPendingMintCategory] = useState<MintCategory | null>(null);
  const [mintingProgressDialog, setMintingProgressDialog] = useState(false);
  const [mintingProgress, setMintingProgress] = useState<{
    step: 'preparing' | 'submitting' | 'confirming' | 'complete' | 'error';
    message: string;
  }>({ step: 'preparing', message: 'Preparing transaction...' });
  
  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    success: boolean;
    txHash?: string;
    message: string;
    type: 'token' | 'nft' | null;
  }>({
    open: false,
    success: false,
    message: '',
    type: null,
  });

  // Expose openMintDialogForCategory to parent via ref
  useImperativeHandle(ref, () => ({
    openMintDialogForCategory: (category: MintCategory) => {
      if (walletAddress) {
        setPendingMintCategory(category);
        setConfirmMintDialog(true);
      } else {
        setTokenMintDialog(true);
      }
    },
  }));

  // Total activity units from pending rewards
  const totalActivityUnits = pendingRewards.solar + pendingRewards.evMiles + pendingRewards.battery + pendingRewards.charging;
  
  // User receives 93% of activity units as tokens
  const totalPendingTokens = Math.floor(totalActivityUnits * 0.93);

  const getCategoryActivityUnits = (category: MintCategory): number => {
    if (category === 'all') return totalActivityUnits;
    if (category === 'solar') return pendingRewards.solar;
    if (category === 'ev_miles') return pendingRewards.evMiles;
    if (category === 'battery') return pendingRewards.battery;
    if (category === 'charging') return pendingRewards.charging;
    return 0;
  };
  
  const getCategoryTokens = (category: MintCategory): number => {
    return Math.floor(getCategoryActivityUnits(category) * 0.93);
  };

  const getCategoryLabel = (category: MintCategory): string => {
    if (category === 'all') return 'All Categories';
    if (category === 'solar') return 'Solar Production';
    if (category === 'ev_miles') return 'EV Miles Driven';
    if (category === 'battery') return 'Battery Storage';
    if (category === 'charging') return 'EV Charging';
    return category;
  };

  const handleRequestMint = (category: MintCategory) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first to mint tokens.");
      return;
    }
    setPendingMintCategory(category);
    setTokenMintDialog(false);
    setConfirmMintDialog(true);
  };

  const handleConfirmMint = async () => {
    if (!pendingMintCategory) return;
    
    setConfirmMintDialog(false);
    const category = pendingMintCategory;
    setPendingMintCategory(null);
    setMintingState({ isLoading: true, type: 'token', category });
    setMintingProgressDialog(true);
    setMintingProgress({ step: 'preparing', message: '🔗 Connecting to Base Sepolia...' });

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setMintingProgress({ step: 'submitting', message: '⚡ Processing $ZSOLAR tokens mint to Blockchain...' });
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      setMintingProgress({ step: 'confirming', message: '🔐 Confirming transaction on-chain...' });
      
      const result = await onMintTokens(category);
      
      if (result.success) {
        setMintingProgress({ step: 'complete', message: '✅ Transaction confirmed on Base Sepolia!' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMintingProgressDialog(false);
        triggerConfetti();
        
        setResultDialog({
          open: true,
          success: true,
          txHash: result.txHash,
          message: result.message,
          type: 'token',
        });
        
        await onRefresh();
      }
    } catch (error) {
      setMintingProgress({ step: 'error', message: '❌ Transaction failed' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMintingProgressDialog(false);
      
      setResultDialog({
        open: true,
        success: false,
        message: 'Minting failed. Please try again.',
        type: 'token',
      });
    } finally {
      setMintingState({ isLoading: false, type: null });
    }
  };

  const handleMintWelcomeNFT = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first to mint NFTs.");
      return;
    }

    setMintingState({ isLoading: true, type: 'nft' });
    setMintingProgressDialog(true);
    setMintingProgress({ step: 'preparing', message: '🔗 Connecting to Base Sepolia...' });

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setMintingProgress({ step: 'submitting', message: '⚡ Processing NFT mint to Blockchain...' });
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      setMintingProgress({ step: 'confirming', message: '🔐 Confirming transaction on-chain...' });
      
      const result = await onMintWelcomeNFT();
      
      if (result.success) {
        setMintingProgress({ step: 'complete', message: '✅ NFT minted to Base Sepolia!' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMintingProgressDialog(false);
        if (!result.message.includes('already')) {
          triggerConfetti();
        }
        
        setResultDialog({
          open: true,
          success: true,
          txHash: result.txHash,
          message: result.message,
          type: 'nft',
        });
        
        await onRefresh();
      }
    } catch (error) {
      setMintingProgress({ step: 'error', message: '❌ Transaction failed' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMintingProgressDialog(false);
      
      setResultDialog({
        open: true,
        success: false,
        message: 'NFT minting failed. Please try again.',
        type: 'nft',
      });
    } finally {
      setMintingState({ isLoading: false, type: null });
    }
  };

  const getCategoryIcon = (category: MintCategory) => {
    switch (category) {
      case 'solar': return <Sun className="h-5 w-5 text-amber-500" />;
      case 'ev_miles': return <Car className="h-5 w-5 text-blue-500" />;
      case 'battery': return <Battery className="h-5 w-5 text-green-500" />;
      case 'charging': return <Zap className="h-5 w-5 text-purple-500" />;
      default: return <Coins className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Demo Mode Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
        <p className="text-sm text-primary font-medium">
          🎮 Demo Mode: Experience the full minting flow without real transactions
        </p>
      </div>

      {/* Main action buttons */}
      <div className="grid grid-cols-1 gap-3">
        {/* Mint Tokens Button */}
        <Button
          size="lg"
          className="w-full gap-3 h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          disabled={mintingState.isLoading || !walletAddress || totalPendingTokens === 0}
          onClick={() => setTokenMintDialog(true)}
        >
          {mintingState.isLoading && mintingState.type === 'token' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Coins className="h-5 w-5" />
          )}
          Mint {totalPendingTokens.toLocaleString()} $ZSOLAR
        </Button>

        {/* Welcome NFT / NFT Collection */}
        {!hasWelcomeNFT && walletAddress ? (
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-3 h-14 text-base font-semibold border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
            disabled={mintingState.isLoading}
            onClick={handleMintWelcomeNFT}
          >
            {mintingState.isLoading && mintingState.type === 'nft' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            Claim Welcome NFT
          </Button>
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-3 h-14 text-base font-semibold"
            onClick={() => navigate('/demo/nft-collection')}
          >
            <Award className="h-5 w-5" />
            View NFT Collection
            {(eligibleMilestones > 0 || eligibleCombos > 0) && (
              <Badge variant="secondary" className="ml-2">
                {eligibleMilestones + eligibleCombos} to mint
              </Badge>
            )}
          </Button>
        )}

        {/* Refresh Button */}
        <Button
          variant="ghost"
          size="lg"
          className="w-full gap-2"
          disabled={isLoading}
          onClick={onRefresh}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Dashboard
        </Button>
      </div>

      {/* Status messages */}
      {walletAddress && hasWelcomeNFT && eligibleMilestones === 0 && eligibleCombos === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          ✅ All available NFTs claimed! Keep earning to unlock more milestones.
        </p>
      )}

      {walletAddress && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Award className="h-4 w-4" />
          <span>Owned: {ownedNFTCount} NFTs</span>
        </div>
      )}

      {/* Token Mint Category Dialog */}
      <Dialog open={tokenMintDialog} onOpenChange={setTokenMintDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Mint $ZSOLAR Tokens
            </DialogTitle>
            <DialogDescription>
              Choose which activity to mint tokens for. Each category can be minted separately or all at once.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-3 p-1">
              {/* All Categories */}
              <Button
                variant="outline"
                className="w-full justify-between h-auto py-4 px-4"
                onClick={() => handleRequestMint('all')}
                disabled={totalPendingTokens === 0}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">All Categories</div>
                    <div className="text-xs text-muted-foreground">Mint everything at once</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {totalPendingTokens.toLocaleString()} tokens
                </Badge>
              </Button>

              {/* Individual categories */}
              {(['solar', 'ev_miles', 'battery', 'charging'] as MintCategory[]).map(category => {
                const tokens = getCategoryTokens(category);
                return (
                  <Button
                    key={category}
                    variant="outline"
                    className="w-full justify-between h-auto py-4 px-4"
                    onClick={() => handleRequestMint(category)}
                    disabled={tokens === 0}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {getCategoryIcon(category)}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{getCategoryLabel(category)}</div>
                        <div className="text-xs text-muted-foreground">
                          {getCategoryActivityUnits(category).toLocaleString()} activity units
                        </div>
                      </div>
                    </div>
                    <Badge variant={tokens > 0 ? "secondary" : "outline"} className="text-sm">
                      {tokens.toLocaleString()} tokens
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirm Mint Dialog */}
      <Dialog open={confirmMintDialog} onOpenChange={setConfirmMintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Mint</DialogTitle>
            <DialogDescription>
              You're about to mint {pendingMintCategory && getCategoryTokens(pendingMintCategory).toLocaleString()} $ZSOLAR tokens
              for {pendingMintCategory && getCategoryLabel(pendingMintCategory)}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Activity Units</span>
              <span>{pendingMintCategory && getCategoryActivityUnits(pendingMintCategory).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>You Receive (93%)</span>
              <span className="font-medium text-primary">
                {pendingMintCategory && getCategoryTokens(pendingMintCategory).toLocaleString()} $ZSOLAR
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Burn (5%) + LP (1%) + Treasury (1%)</span>
              <span>{pendingMintCategory && Math.floor(getCategoryActivityUnits(pendingMintCategory) * 0.07).toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmMintDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMint} className="gap-2">
              <Zap className="h-4 w-4" />
              Mint Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Minting Progress Dialog */}
      <Dialog open={mintingProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">
              {mintingProgress.step === 'complete' ? '🎉 Transaction Complete!' : 
               mintingProgress.step === 'error' ? '❌ Transaction Failed' : 
               '⛓️ Minting to Blockchain...'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              {mintingProgress.step !== 'complete' && mintingProgress.step !== 'error' && (
                <div className="relative">
                  <Loader2 className="h-14 w-14 animate-spin text-primary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                </div>
              )}
              {mintingProgress.step === 'complete' && (
                <CheckCircle2 className="h-14 w-14 text-green-500" />
              )}
              {mintingProgress.step === 'error' && (
                <AlertCircle className="h-14 w-14 text-destructive" />
              )}
              <p className="text-center text-base font-medium">{mintingProgress.message}</p>
              {mintingProgress.step !== 'complete' && mintingProgress.step !== 'error' && (
                <p className="text-xs text-muted-foreground text-center">
                  Securing your rewards on Base Sepolia testnet
                </p>
              )}
            </div>
            
            <Progress 
              value={
                mintingProgress.step === 'preparing' ? 20 :
                mintingProgress.step === 'submitting' ? 50 :
                mintingProgress.step === 'confirming' ? 80 :
                mintingProgress.step === 'complete' ? 100 : 0
              } 
              className="h-3"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resultDialog.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              {resultDialog.success ? 'Success!' : 'Error'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground whitespace-pre-line">{resultDialog.message}</p>
            
            {resultDialog.txHash && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Transaction Hash (Demo)</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {resultDialog.txHash}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setResultDialog(prev => ({ ...prev, open: false }))}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
