import { Button } from '@/components/ui/button';
import { Coins, Award, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { promptAddZsolarToken, promptAddZsolarNFT } from '@/lib/walletAssets';

interface RewardActionsProps {
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

export function RewardActions({ onRefresh, isLoading }: RewardActionsProps) {
  const { isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const [mintDialog, setMintDialog] = useState<{ 
    open: boolean; 
    type: 'token' | 'nft' | null; 
    success?: boolean;
  }>({
    open: false,
    type: null,
  });
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async (type: 'token' | 'nft') => {
    // Check if wallet is connected
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if on Sepolia network
    if (chain?.id !== sepolia.id) {
      toast.info('Switching to Sepolia testnet...');
      try {
        switchChain({ chainId: sepolia.id });
        // Wait a moment for the switch
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        toast.error('Please switch to Sepolia testnet to mint');
        return;
      }
    }

    setIsMinting(true);
    
    // Simulate minting process (will be replaced with actual contract call)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Show success dialog with option to add token to wallet
    setMintDialog({
      open: true,
      type,
      success: true,
    });
    
    setIsMinting(false);
  };

  const handleAddToWallet = async () => {
    if (mintDialog.type === 'token') {
      const added = await promptAddZsolarToken();
      if (added) {
        toast.success('$ZSOLAR token added to your wallet!');
      }
    } else if (mintDialog.type === 'nft') {
      // In production, this would use the actual token ID from minting
      const added = await promptAddZsolarNFT('1');
      if (added) {
        toast.success('ZenSolar NFT will appear in your wallet!');
      }
    }
    setMintDialog({ open: false, type: null });
  };

  return (
    <>
      <div className="space-y-3">
        <Button
          onClick={() => handleMint('token')}
          disabled={isMinting || isLoading}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          {isMinting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Coins className="mr-2 h-4 w-4" />
          )}
          MINT $ZSOLAR TOKENS
        </Button>

        <Button
          onClick={() => handleMint('nft')}
          disabled={isMinting || isLoading}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          {isMinting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Award className="mr-2 h-4 w-4" />
          )}
          MINT ZENSOLAR NFT
        </Button>

        <Button
          onClick={onRefresh}
          disabled={isLoading}
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

      <Dialog open={mintDialog.open} onOpenChange={(open) => setMintDialog({ ...mintDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">
              {mintDialog.success ? '🎉 Coming Soon!' : '🚀 Minting...'}
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-3">
              <p className="text-base">
                {mintDialog.type === 'token' 
                  ? 'Sepolia testnet integration for $ZSOLAR token minting is launching soon!'
                  : 'Sepolia testnet integration for ZenSolar NFT minting is launching soon!'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                When live, your {mintDialog.type === 'token' ? 'tokens' : 'NFTs'} will automatically appear in your wallet on Sepolia testnet. No manual steps required! 🌟
              </p>
              
              <div className="bg-secondary/50 rounded-lg p-3 text-sm">
                <p className="font-medium mb-1">✨ Seamless Experience:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• Auto network switching to Sepolia</li>
                  <li>• One-click token addition to wallet</li>
                  <li>• No manual contract addresses needed</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setMintDialog({ open: false, type: null })}
              className="flex-1"
            >
              Close
            </Button>
            <Button 
              onClick={handleAddToWallet}
              className="flex-1"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Add to Wallet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
