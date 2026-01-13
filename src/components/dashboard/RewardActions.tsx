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
  const [mintDialog, setMintDialog] = useState<{ 
    open: boolean; 
    type: 'token' | 'nft' | null; 
  }>({
    open: false,
    type: null,
  });

  const handleMint = (type: 'token' | 'nft') => {
    // Show the exciting coming soon dialog immediately
    setMintDialog({
      open: true,
      type,
    });
  };

  return (
    <>
      <div className="space-y-3">
        <Button
          onClick={() => handleMint('token')}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Coins className="mr-2 h-4 w-4" />
          MINT $ZSOLAR TOKENS
        </Button>

        <Button
          onClick={() => handleMint('nft')}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Award className="mr-2 h-4 w-4" />
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
            <DialogTitle className="text-primary text-xl">
              🚀 Something Revolutionary is Coming!
            </DialogTitle>
            <DialogDescription className="pt-3 space-y-4">
              <p className="text-base font-medium text-foreground">
                We're building the future of clean energy rewards!
              </p>
              <p className="text-sm text-muted-foreground">
                {mintDialog.type === 'token' 
                  ? 'Soon you\'ll be able to mint $ZSOLAR tokens directly to your wallet based on your real solar production and EV data.'
                  : 'Soon you\'ll be able to mint exclusive ZenSolar NFTs that prove your contribution to clean energy—all gas-free!'
                }
              </p>
              
              <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-token/10 rounded-lg p-4 border border-primary/20">
                <p className="font-semibold text-foreground mb-2">✨ What's Coming:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Gasless minting—we cover all transaction costs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Real kWh data converted to blockchain rewards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>ERC-20 tokens & ERC-721 NFTs on Base L2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>One-click minting experience</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground italic text-center">
                🌟 Stay connected—minting goes live on Base Sepolia testnet very soon!
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => setMintDialog({ open: false, type: null })}
              className="w-full"
            >
              Got It!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
