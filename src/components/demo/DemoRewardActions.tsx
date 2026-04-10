import { Button } from '@/components/ui/button';
import { Coins, Award, RefreshCw, Loader2, CheckCircle2, ExternalLink, Trophy, Sparkles, AlertCircle, Sun, Car, BatteryFull, Zap, Wallet, Image } from 'lucide-react';
import { useState, forwardRef, useImperativeHandle } from 'react';
import { MintEffectButton } from '@/components/dashboard/MintEffectButton';
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
  superchargerKwh?: number;
  homeChargerKwh?: number;
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
  
  // User receives 75% of activity units as tokens (20% burn)
  const totalPendingTokens = Math.floor(totalActivityUnits * 0.75);

  const getCategoryActivityUnits = (category: MintCategory): number => {
    if (category === 'all') return totalActivityUnits;
    if (category === 'solar') return pendingRewards.solar;
    if (category === 'ev_miles') return pendingRewards.evMiles;
    if (category === 'battery') return pendingRewards.battery;
    if (category === 'charging') return pendingRewards.charging;
    return 0;
  };
  
  const getCategoryTokens = (category: MintCategory): number => {
    return Math.floor(getCategoryActivityUnits(category) * 0.75);
  };

  const getCategoryLabel = (category: MintCategory): string => {
    if (category === 'all') return 'All Categories';
    if (category === 'solar') return 'Solar Production';
    if (category === 'ev_miles') return 'EV Miles Driven';
    if (category === 'battery') return 'Battery Storage';
    if (category === 'charging') return 'EV Charging';
    return category;
  };

  const getCategoryLabelWithUnit = (category: MintCategory): string => {
    if (category === 'all') return 'All Clean Energy Activity';
    if (category === 'solar') return 'Solar Energy Produced — kWh';
    if (category === 'ev_miles') return 'EV Miles Driven';
    if (category === 'battery') return 'Battery Storage — kWh';
    if (category === 'charging') return 'EV Charging — kWh';
    return category;
  };

  const getCategoryUnit = (category: MintCategory): string => {
    if (category === 'ev_miles') return 'miles';
    if (category === 'all') return 'units';
    return 'kWh';
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
      case 'battery': return <BatteryFull className="h-5 w-5 text-green-500" />;
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

      {/* Main action buttons - Beta user style */}
      <div className="grid grid-cols-1 gap-3">
        {/* Mint Tokens Button - Light blue gradient */}
        <Button
          size="lg"
          className="w-full gap-3 h-14 text-base font-bold uppercase tracking-wide bg-gradient-to-r from-blue-400 to-blue-300 hover:from-blue-500 hover:to-blue-400 text-white shadow-md"
          disabled={mintingState.isLoading || !walletAddress}
          onClick={() => setTokenMintDialog(true)}
        >
          {mintingState.isLoading && mintingState.type === 'token' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Coins className="h-5 w-5" />
          )}
          MINT $ZSOLAR TOKENS
          <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
            {totalPendingTokens.toLocaleString()}
          </span>
        </Button>

        {/* Mint ZenSolar NFTs Button - Blue gradient */}
        <Button
          size="lg"
          className="w-full gap-3 h-14 text-base font-bold uppercase tracking-wide bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
          disabled={mintingState.isLoading}
          onClick={() => {
            if (!hasWelcomeNFT && walletAddress) {
              handleMintWelcomeNFT();
            } else {
              navigate('/demo/nft-collection');
            }
          }}
        >
          {mintingState.isLoading && mintingState.type === 'nft' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Image className="h-5 w-5" />
          )}
          {!hasWelcomeNFT && walletAddress ? 'CLAIM WELCOME NFT' : 'MINT ZENSOLAR NFTS'}
        </Button>

        {/* Mint Combo NFTs Button - Purple/pink gradient */}
        <Button
          size="lg"
          className="w-full gap-3 h-14 text-base font-bold uppercase tracking-wide bg-gradient-to-r from-purple-400 via-pink-400 to-pink-300 hover:from-purple-500 hover:via-pink-500 hover:to-pink-400 text-white shadow-md"
          disabled={mintingState.isLoading}
          onClick={() => navigate('/demo/nft-collection')}
        >
          <Sparkles className="h-5 w-5" />
          MINT COMBO NFTS
          <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
            {eligibleCombos}
          </span>
        </Button>
      </div>

      {/* Status messages */}
      {walletAddress && hasWelcomeNFT && eligibleMilestones === 0 && eligibleCombos === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          ✅ All available NFTs claimed! Keep earning to unlock more milestones.
        </p>
      )}


      {/* Refresh Button - Outline style */}
      <Button
        variant="outline"
        size="lg"
        className="w-full gap-2 h-12 font-bold uppercase tracking-wide border-2"
        disabled={isLoading}
        onClick={onRefresh}
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        REFRESH DASHBOARD
      </Button>

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

      {/* Confirm Mint Dialog — center-stacked layout */}
      <Dialog open={confirmMintDialog} onOpenChange={setConfirmMintDialog}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-primary/20">
          {pendingMintCategory && (
            <div className="px-4 pt-5 pb-4 space-y-3">
              {/* Header — icon + title centered */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  pendingMintCategory === 'solar' ? 'bg-amber-500/15 text-amber-500' :
                  pendingMintCategory === 'ev_miles' ? 'bg-blue-500/15 text-blue-500' :
                  pendingMintCategory === 'battery' ? 'bg-emerald-500/15 text-emerald-500' :
                  pendingMintCategory === 'charging' ? 'bg-purple-500/15 text-purple-500' :
                  'bg-primary/15 text-primary'
                }`}>
                  {pendingMintCategory === 'solar' && <Sun className="h-4 w-4" />}
                  {pendingMintCategory === 'ev_miles' && <Car className="h-4 w-4" />}
                  {pendingMintCategory === 'battery' && <BatteryFull className="h-4 w-4" />}
                  {pendingMintCategory === 'charging' && <Zap className="h-4 w-4" />}
                  {pendingMintCategory === 'all' && <Coins className="h-4 w-4" />}
                </div>
                <h3 className="text-base font-bold tracking-tight">
                  Mint {getCategoryLabel(pendingMintCategory)}
                </h3>
              </div>

              {/* Subtitle */}
              <p className="text-center text-sm text-muted-foreground">
                You are about to mint
              </p>
              <p className="text-center text-base font-semibold text-primary">
                {getCategoryLabelWithUnit(pendingMintCategory)}
              </p>

              <div className="rounded-xl border border-border/60 p-4 space-y-2">

                {/* Supercharger vs Home Charger breakdown for charging category */}
                {pendingMintCategory === 'charging' && (pendingRewards.superchargerKwh || pendingRewards.homeChargerKwh) ? (
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-1">
                    {(pendingRewards.superchargerKwh ?? 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-purple-500" />
                          Tesla Supercharger
                        </span>
                        <span className="font-medium text-foreground tabular-nums">{(pendingRewards.superchargerKwh ?? 0).toLocaleString()} kWh</span>
                      </div>
                    )}
                    {(pendingRewards.homeChargerKwh ?? 0) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3 text-emerald-500" />
                          Home Charger
                        </span>
                        <span className="font-medium text-foreground tabular-nums">{(pendingRewards.homeChargerKwh ?? 0).toLocaleString()} kWh</span>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Big token amount */}
                <div className="flex items-baseline justify-between py-0.5">
                  <span className="text-xs text-muted-foreground">Tokens to<br />receive:</span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary tabular-nums leading-tight">
                      $ZSOLAR — {getCategoryTokens(pendingMintCategory).toLocaleString()}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center pt-1 border-t border-border/30">
                  You receive 75% of {getCategoryActivityUnits(pendingMintCategory).toLocaleString()} {getCategoryUnit(pendingMintCategory)} (20% burn)
                </p>
              </div>

              {/* Blockchain info note */}
              <div className="rounded-lg bg-muted/40 p-3 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Wallet className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This will submit a transaction to the Base Sepolia blockchain. The tokens will be minted directly to your connected wallet.
                </p>
              </div>

              {/* Stacked buttons */}
              <div className="space-y-2 pt-0.5">
                <Button
                  onClick={handleConfirmMint}
                  className="w-full inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm"
                >
                  <Zap className="h-4 w-4" />
                  Confirm Mint
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setConfirmMintDialog(false)}
                  className="w-full h-10 text-sm text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Minting Progress Dialog */}
      <Dialog open={mintingProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-primary/20">
          <div className="px-6 pt-8 pb-6 text-center">
            {/* Animated icon */}
            <div className="mx-auto mb-5">
              {mintingProgress.step !== 'complete' && mintingProgress.step !== 'error' && (
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary animate-pulse" />
                  </div>
                </div>
              )}
              {mintingProgress.step === 'complete' && (
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-8 w-8 text-white" />
                </div>
              )}
              {mintingProgress.step === 'error' && (
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold tracking-tight mb-1">
              {mintingProgress.step === 'complete' ? 'Transaction Complete' : 
               mintingProgress.step === 'error' ? 'Transaction Failed' : 
               'Minting to Blockchain'}
            </h3>
            <p className="text-sm text-muted-foreground">{mintingProgress.message}</p>
            
            {mintingProgress.step !== 'complete' && mintingProgress.step !== 'error' && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                Securing your rewards on Base Sepolia
              </p>
            )}
          </div>

          <div className="px-6 pb-6">
            <Progress 
              value={
                mintingProgress.step === 'preparing' ? 20 :
                mintingProgress.step === 'submitting' ? 50 :
                mintingProgress.step === 'confirming' ? 80 :
                mintingProgress.step === 'complete' ? 100 : 0
              } 
              className="h-2 rounded-full"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog - Enhanced Success Screen */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden border-primary/20">
          {/* Success/Error header */}
          <div className={`px-6 pt-8 pb-5 text-center ${
            resultDialog.success 
              ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/5' 
              : 'bg-gradient-to-br from-red-500/10 to-rose-500/5'
          }`}>
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
              resultDialog.success 
                ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                : 'bg-gradient-to-br from-red-400 to-rose-500'
            }`}>
              {resultDialog.success ? (
                <CheckCircle2 className="h-8 w-8 text-white" />
              ) : (
                <AlertCircle className="h-8 w-8 text-white" />
              )}
            </div>
            <h3 className="text-lg font-bold tracking-tight">
              {resultDialog.success ? 'Mint Successful' : 'Transaction Failed'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{resultDialog.message}</p>
          </div>
          
          <div className="px-6 pb-6 space-y-4">
            {resultDialog.txHash && resultDialog.success && (
              <div className="rounded-xl border border-border/60 divide-y divide-border/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" />
                    Tx Hash
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px] bg-muted/30">
                    {resultDialog.txHash}
                  </Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Network
                  </span>
                  <Badge className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                    Base Sepolia
                  </Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Status
                  </span>
                  <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    Confirmed
                  </Badge>
                </div>
                {resultDialog.type === 'token' && (
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
                    <span className="text-xs text-muted-foreground">Contract</span>
                    <span className="font-mono text-[10px]">0xZSOLAR...Token</span>
                  </div>
                )}
                {resultDialog.type === 'nft' && (
                  <>
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
                      <span className="text-xs text-muted-foreground">Standard</span>
                      <span className="text-xs font-medium">ERC-1155</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-muted-foreground">Contract</span>
                      <span className="font-mono text-[10px]">0xZenSolar...NFT</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full h-12 font-semibold" 
              onClick={() => setResultDialog(prev => ({ ...prev, open: false }))}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
