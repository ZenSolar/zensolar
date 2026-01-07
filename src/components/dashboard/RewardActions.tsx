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
    // Simulate minting delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockTxHash = '0x0659b521e8bc84fc802dcd688e19a380e17a50f562976b0ec493631cf5dc5882';
    
    setMintDialog({
      open: true,
      type,
      txHash: type === 'nft' ? mockTxHash : undefined,
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
            <DialogTitle className="text-secondary">Success</DialogTitle>
            <DialogDescription className="pt-2">
              {mintDialog.type === 'token' ? (
                'Tokens minted to your MetaMask on Sepolia!'
              ) : (
                <>
                  NFT minted to your MetaMask on Sepolia!
                  {mintDialog.txHash && (
                    <span className="mt-2 block break-all text-xs text-muted-foreground">
                      TX: {mintDialog.txHash}
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setMintDialog({ open: false, type: null })}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
