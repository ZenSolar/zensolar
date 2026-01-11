import { Button } from '@/components/ui/button';
import { Coins, Award, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';
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
}

export function RewardActions({ onRefresh, isLoading }: RewardActionsProps) {
  const [mintDialog, setMintDialog] = useState<{ open: boolean; type: 'token' | 'nft' | null; txHash?: string }>({
    open: false,
    type: null,
  });
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async (type: 'token' | 'nft') => {
    setIsMinting(true);
    // Simulate brief loading
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setMintDialog({
      open: true,
      type,
    });
    setIsMinting(false);
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
            <DialogTitle className="text-primary">🚀 Coming Soon!</DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p className="text-base">
                {mintDialog.type === 'token' 
                  ? 'Testnet blockchain integration for $ZSOLAR token minting is launching soon!'
                  : 'Testnet blockchain integration for ZenSolar NFT minting is launching soon!'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Keep earning rewards — you'll be among the first to mint when we go live! 🌟
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setMintDialog({ open: false, type: null })}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
