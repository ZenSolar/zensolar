import { Button } from '@/components/ui/button';
import { Coins, Award, RefreshCw, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
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
}

export function RewardActions({ onRefresh, isLoading, walletAddress }: RewardActionsProps) {
  const { toast } = useToast();
  const { triggerConfetti } = useConfetti();
  const { success: hapticSuccess } = useHaptics();
  const { isConnected } = useAccount();
  const [mintingState, setMintingState] = useState<{
    isLoading: boolean;
    type: 'token' | 'nft' | null;
  }>({ isLoading: false, type: null });
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
      // First, get pending rewards from calculate-rewards
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      // Call claim action to get pending rewards and reset baselines
      const claimResponse = await supabase.functions.invoke('calculate-rewards', {
        body: {},
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      // For now, we'll mint a test amount. In production, this would use real delta values
      // from the calculate-rewards endpoint
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'mint-rewards',
          walletAddress,
          // Test values - in production these come from device data deltas
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
        
        // Refresh dashboard data
        await onRefresh();
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

  const handleMintNFT = async () => {
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
      // Register user (mints Welcome NFT if not already registered)
      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: {
          action: 'register',
          walletAddress,
        },
      });

      if (error) throw error;

      const result = data as MintResult;

      if (result.success) {
        if (result.alreadyRegistered) {
          toast({
            title: "Already Registered",
            description: "You already have your Welcome NFT!",
          });
        } else {
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
        
        // Refresh dashboard data
        await onRefresh();
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

  const getExplorerUrl = (txHash: string) => {
    return `https://sepolia.basescan.org/tx/${txHash}`;
  };

  const isMinting = mintingState.isLoading;

  return (
    <>
      <div className="space-y-3">
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

        <Button
          onClick={handleMintNFT}
          disabled={isLoading || isMinting || !walletAddress}
          className="w-full bg-primary hover:bg-primary/90 animate-pulse-glow"
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

        {!walletAddress && (
          <p className="text-xs text-muted-foreground text-center">
            Connect your wallet above to mint tokens and NFTs
          </p>
        )}

        <Button
          onClick={onRefresh}
          disabled={isLoading || isMinting}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {isLoading ? (
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
                  {resultDialog.type === 'token' ? 'Tokens Minted!' : 'NFT Minted!'}
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
                    {resultDialog.type === 'token' 
                      ? 'Your $ZSOLAR tokens have been minted to your wallet! They should appear automatically.'
                      : 'Your NFT has been minted! Check your wallet or OpenSea to view it.'}
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
