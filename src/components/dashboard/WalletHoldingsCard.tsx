import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOnChainHoldings } from '@/hooks/useOnChainHoldings';
import { Wallet, Coins, Images, ExternalLink, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CHAIN_ID } from '@/lib/wagmi';

interface WalletHoldingsCardProps {
  walletAddress?: string;
}

export function WalletHoldingsCard({ walletAddress }: WalletHoldingsCardProps) {
  const { tokenBalance, nftCount, isLoading, refetch } = useOnChainHoldings(walletAddress);

  if (!walletAddress) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Wallet className="h-5 w-5" />
            <span className="text-sm">Connect wallet to view on-chain holdings</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formattedBalance = parseFloat(tokenBalance).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">On-Chain Holdings</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={refetch}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
              <Link to="/wallet">
                View All
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Token Balance */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              <span className="text-xs">$ZSOLAR</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <p className="text-lg font-bold text-foreground">{formattedBalance}</p>
            )}
          </div>

          {/* NFT Count */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Images className="h-3.5 w-3.5" />
              <span className="text-xs">NFTs Owned</span>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-12" />
            ) : (
              <p className="text-lg font-bold text-foreground">{nftCount}</p>
            )}
          </div>
        </div>

        {/* Network indicator */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>Base Sepolia • Live</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
