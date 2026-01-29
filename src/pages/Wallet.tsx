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
  ArrowUpRight
} from 'lucide-react';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_NFT_ADDRESS } from '@/lib/wagmi';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getMilestoneForTokenId, TOKEN_ID_TO_MILESTONE } from '@/lib/nftTokenMapping';
import { getNftArtwork } from '@/lib/nftArtwork';
import { SEO } from '@/components/SEO';

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
    maximumFractionDigits: 4,
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
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <SEO title="Wallet | ZenSolar" />
      
      <AnimatedContainer>
        {/* Header */}
        <AnimatedItem className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Wallet</h1>
            <p className="text-sm text-muted-foreground">
              Real-time on-chain holdings from Base Sepolia
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={holdingsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${holdingsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </AnimatedItem>

        {/* Wallet Address Card */}
        <AnimatedItem>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <WalletIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connected Wallet</p>
                    <p className="font-mono font-medium">{shortenedAddress}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={copyAddress}>
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={basescanUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* Holdings Grid */}
        <AnimatedItem className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Token Balance Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  $ZSOLAR Tokens
                </CardTitle>
                <Badge variant="secondary" className="text-xs">ERC-20</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {holdingsLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div>
                  <p className="text-3xl font-bold">{formattedBalance}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    In your connected wallet
                  </p>
                </div>
              )}
              <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
                <a href={tokenContractUrl} target="_blank" rel="noopener noreferrer">
                  View Contract <ArrowUpRight className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* NFT Count Card */}
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Images className="h-4 w-4 text-secondary" />
                  ZenSolar NFTs
                </CardTitle>
                <Badge variant="secondary" className="text-xs">ERC-1155</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {holdingsLoading ? (
                <Skeleton className="h-10 w-16" />
              ) : (
                <div>
                  <p className="text-3xl font-bold">{nftCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Milestone NFTs owned
                  </p>
                </div>
              )}
              <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
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

        {/* Network Info */}
        <AnimatedItem>
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-muted-foreground">Network</span>
                </div>
                <span className="font-medium">Base Sepolia (Testnet)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Balances update automatically every 30 seconds. Pull to refresh for instant update.
              </p>
            </CardContent>
          </Card>
        </AnimatedItem>
      </AnimatedContainer>
    </div>
  );
}
