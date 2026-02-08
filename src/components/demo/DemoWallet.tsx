import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { 
  Wallet as WalletIcon, 
  Coins, 
  Images, 
  RefreshCw, 
  ExternalLink,
  Copy,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { useDemoContext } from '@/contexts/DemoContext';

const DEMO_WALLET_ADDRESS = '0xD3m0...7a8B';
const LIVE_TOKEN_PRICE = 0.10;

export function DemoWallet() {
  const { activityData } = useDemoContext();
  const [copied, setCopied] = useState(false);

  const tokenBalance = activityData.lifetimeMinted;
  const formattedBalance = tokenBalance.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const usdValue = tokenBalance * LIVE_TOKEN_PRICE;
  const formattedUsdValue = usdValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const nftCount = activityData.nftsEarned?.length ?? 0;

  const copyAddress = () => {
    navigator.clipboard.writeText('0xD3m0F4k3W4ll3tAddr3ss0000000000007a8B');
    setCopied(true);
    toast.success('Demo address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <SEO title="Wallet | ZenSolar Demo" />
      
      <AnimatedContainer>
        {/* Header */}
        <AnimatedItem className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold">My Wallet</h1>
            <p className="text-sm text-muted-foreground">
              Simulated on-chain holdings
            </p>
          </div>
          <Badge variant="outline" className="border-primary/50 text-primary">Demo</Badge>
        </AnimatedItem>

        {/* Wallet Address Card */}
        <AnimatedItem>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <WalletIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Connected Wallet</p>
                    <p className="font-mono font-semibold text-foreground">{DEMO_WALLET_ADDRESS}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={copyAddress} className="h-9 w-9">
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Live Token Price */}
        <AnimatedItem>
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">$ZSOLAR Price</p>
                    <p className="font-bold text-lg text-secondary">
                      ${LIVE_TOKEN_PRICE.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">USD</span>
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="border-secondary/50 text-secondary text-xs">
                  Base Sepolia
                </Badge>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Token Balance Card */}
        <AnimatedItem>
          <Card className="border-primary/30 bg-card shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">$ZSOLAR Tokens</span>
                </div>
                <Badge variant="outline" className="border-primary/50 text-primary text-xs">ERC-20</Badge>
              </div>
              
              <div>
                <p className="text-4xl font-bold tracking-tight text-foreground">{formattedBalance}</p>
                <p className="text-lg font-semibold text-primary mt-1">
                  ≈ ${formattedUsdValue} USD
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  In your connected wallet
                </p>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* NFT Count Card */}
        <AnimatedItem>
          <Card className="border-secondary/30 bg-card shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Images className="h-5 w-5 text-secondary" />
                  <span className="font-semibold text-foreground">ZenSolar NFTs</span>
                </div>
                <Badge variant="outline" className="border-secondary/50 text-secondary text-xs">ERC-1155</Badge>
              </div>
              
              <div>
                <p className="text-4xl font-bold tracking-tight text-foreground">{nftCount}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Milestone NFTs earned
                </p>
              </div>

              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link to="/demo/nft-collection">
                  View Collection
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Privacy & Network Info */}
        <AnimatedItem>
          <Card className="border-border bg-muted/20 dark:bg-muted/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Your Privacy is Protected</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    This page only displays your <strong>ZenSolar tokens and NFTs</strong>. We query our specific smart contracts and cannot see any other tokens, NFTs, or assets in your wallet.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm px-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-muted-foreground">Network</span>
                </div>
                <Badge variant="outline" className="font-medium">Base Sepolia</Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Demo mode — balances update when you mint from the dashboard.
              </p>
            </CardContent>
          </Card>
        </AnimatedItem>
      </AnimatedContainer>
    </div>
  );
}
