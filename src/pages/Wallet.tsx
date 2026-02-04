import { useProfile } from '@/hooks/useProfile';
import { useOnChainHoldings } from '@/hooks/useOnChainHoldings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_NFT_ADDRESS } from '@/lib/wagmi';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getMilestoneForTokenId } from '@/lib/nftTokenMapping';
import { getNftArtwork } from '@/lib/nftArtwork';
import { SEO } from '@/components/SEO';

// Live token price (testnet simulation)
const LIVE_TOKEN_PRICE = 0.10;

// Helper to get NFT image from token ID
function getImageForTokenId(tokenId: number): string {
  const milestoneId = getMilestoneForTokenId(tokenId);
  if (milestoneId) {
    const artwork = getNftArtwork(milestoneId);
    if (artwork) return artwork;
  }
  // Fallback to public folder
  return `/nft-images/welcome.png`;
}

// Helper to get display name from token ID
function getNameForTokenId(tokenId: number): string {
  const milestoneId = getMilestoneForTokenId(tokenId);
  if (milestoneId) {
    return milestoneId.replace('_', ' #').toUpperCase();
  }
  return `NFT #${tokenId}`;
}

export default function Wallet() {
  const { profile, isLoading: profileLoading } = useProfile();
  const { 
    tokenBalance, 
    nftCount, 
    nftTokenIds, 
    isLoading: holdingsLoading, 
    refetch 
  } = useOnChainHoldings(profile?.wallet_address ?? undefined);
  
  const [copied, setCopied] = useState(false);

  const walletAddress = profile?.wallet_address;
  const shortenedAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedBalance = parseFloat(tokenBalance).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Calculate USD value
  const usdValue = parseFloat(tokenBalance) * LIVE_TOKEN_PRICE;
  const formattedUsdValue = usdValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const basescanUrl = `https://sepolia.basescan.org/address/${walletAddress}`;
  const tokenContractUrl = `https://sepolia.basescan.org/token/${ZSOLAR_TOKEN_ADDRESS}`;
  const nftContractUrl = `https://sepolia.basescan.org/token/${ZSOLAR_NFT_ADDRESS}`;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
      <SEO title="Wallet | ZenSolar" />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Wallet Connected</h2>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your on-chain holdings.
            </p>
            <Button asChild>
              <Link to="/profile">Connect Wallet</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <SEO title="Wallet | ZenSolar" />
      
      <AnimatedContainer>
        {/* Header */}
        <AnimatedItem className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold">My Wallet</h1>
            <p className="text-sm text-muted-foreground">
              Real-time on-chain holdings
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={holdingsLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${holdingsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
                    <p className="font-mono font-semibold text-foreground">{shortenedAddress}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={copyAddress} className="h-9 w-9">
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                    <a href={basescanUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Live Token Price Indicator */}
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

        {/* Token Balance Card - Hero */}
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
              
              {holdingsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-48" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ) : (
                <div>
                  <p className="text-4xl font-bold tracking-tight text-foreground">{formattedBalance}</p>
                  <p className="text-lg font-semibold text-primary mt-1">
                    ≈ ${formattedUsdValue} USD
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    In your connected wallet
                  </p>
                </div>
              )}
              
              <Button variant="link" className="px-0 mt-3 h-auto text-xs text-primary" asChild>
                <a href={tokenContractUrl} target="_blank" rel="noopener noreferrer">
                  View Contract <ArrowUpRight className="h-3 w-3 ml-1" />
                </a>
              </Button>
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
              
              {holdingsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : (
                <div>
                  <p className="text-4xl font-bold tracking-tight text-foreground">{nftCount}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Milestone NFTs owned
                  </p>
                </div>
              )}
              
              <Button variant="link" className="px-0 mt-3 h-auto text-xs text-secondary" asChild>
                <a href={nftContractUrl} target="_blank" rel="noopener noreferrer">
                  View Contract <ArrowUpRight className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* NFT Gallery Preview */}
        {nftTokenIds.length > 0 && (
          <AnimatedItem>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Your NFTs</CardTitle>
                    <CardDescription>Milestone achievements you've minted on-chain</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/nft-collection">
                      View Collection
                      <ExternalLink className="h-3 w-3 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {nftTokenIds.slice(0, 12).map((tokenId) => (
                    <div 
                      key={tokenId}
                      className="aspect-square rounded-lg overflow-hidden bg-muted relative group"
                    >
                      <img
                        src={getImageForTokenId(tokenId)}
                        alt={getNameForTokenId(tokenId)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-white font-medium text-center px-1">
                          #{tokenId}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {nftTokenIds.length > 12 && (
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    +{nftTokenIds.length - 12} more NFTs
                  </p>
                )}
              </CardContent>
            </Card>
          </AnimatedItem>
        )}

        {/* Privacy & Network Info */}
        <AnimatedItem>
          <Card className="border-border bg-muted/20 dark:bg-muted/30">
            <CardContent className="p-4 space-y-4">
              {/* Privacy Notice */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Your Privacy is Protected</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    This page only displays your <strong>ZenSolar tokens and NFTs</strong>. We query our specific smart contracts and cannot see any other tokens, NFTs, or assets in your wallet.
                  </p>
                </div>
              </div>

              {/* Network Info */}
              <div className="flex items-center justify-between text-sm px-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-muted-foreground">Network</span>
                </div>
                <Badge variant="outline" className="font-medium">Base Sepolia</Badge>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Balances update automatically every 30 seconds.
              </p>
            </CardContent>
          </Card>
        </AnimatedItem>
      </AnimatedContainer>
    </div>
  );
}
