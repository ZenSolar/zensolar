import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Coins, Images, ExternalLink, ShieldCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDemoContext } from '@/contexts/DemoContext';

const DEMO_TOKEN_PRICE = 0.10;

export function DemoWalletHoldingsCard() {
  const { activityData } = useDemoContext();

  const tokenBalance = activityData.lifetimeMinted;
  const nftCount = activityData.nftsEarned?.length ?? 0;

  const formattedBalance = tokenBalance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const usdValue = tokenBalance * DEMO_TOKEN_PRICE;
  const formattedUsd = usdValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">ZenSolar Holdings</span>
          </div>
          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
            <Link to="/demo/wallet">
              View All
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Token Balance with USD Value */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              <span className="text-xs">$ZSOLAR</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formattedBalance}</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary/70" />
              <span className="text-xs text-muted-foreground">
                ≈ ${formattedUsd}
              </span>
            </div>
          </div>

          {/* NFT Count */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Images className="h-3.5 w-3.5" />
              <span className="text-xs">NFTs Earned</span>
            </div>
            <p className="text-lg font-bold text-foreground">{nftCount}</p>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/70" />
            <span>Only showing your ZenSolar tokens & NFTs. We cannot see your other wallet holdings.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
