import { useProfile } from '@/hooks/useProfile';
import { useOnChainHoldings } from '@/hooks/useOnChainHoldings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  TrendingUp,
  Sparkles,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ZSOLAR_TOKEN_ADDRESS, ZSOLAR_NFT_ADDRESS } from '@/lib/wagmi';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getMilestoneForTokenId } from '@/lib/nftTokenMapping';
import { getNftArtwork } from '@/lib/nftArtwork';
import { SEO } from '@/components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

// Live token price (testnet simulation)
const LIVE_TOKEN_PRICE = 0.10;

function getImageForTokenId(tokenId: number): string {
  const milestoneId = getMilestoneForTokenId(tokenId);
  if (milestoneId) {
    const artwork = getNftArtwork(milestoneId);
    if (artwork) return artwork;
  }
  return `/nft-images/welcome.png`;
}

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
  const [balanceHidden, setBalanceHidden] = useState(false);

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
      <div className="max-w-lg mx-auto px-4 py-12">
        <SEO title="Wallet | ZenSolar" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-8">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/20 shadow-xl shadow-primary/10 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-3">Set Up Your Wallet</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Connect a wallet to view your on-chain $ZSOLAR tokens and NFT collection.
          </p>
          <Button size="lg" asChild className="h-12 px-8 gap-2">
            <Link to="/onboarding?step=wallet">
              <WalletIcon className="h-4 w-4" />
              Connect Wallet
            </Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <SEO title="Wallet | ZenSolar" />
      
      {/* ── Hero Balance Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="wallet-card-glass relative overflow-hidden rounded-2xl border border-primary/15 shadow-xl shadow-primary/5 p-5">
          {/* Background effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-eco/[0.04]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/[0.06] blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-eco/[0.06] blur-3xl" />
          </div>

          <div className="relative">
            {/* Top row: logo + network + refresh */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <img src={zenLogo} alt="ZenSolar" className="h-5 w-auto opacity-70 dark:drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
                <div className="flex items-center gap-1.5 text-[11px] text-eco bg-eco/10 px-2 py-0.5 rounded-full border border-eco/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-eco opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-eco" />
                  </span>
                  <span className="font-medium">Live</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setBalanceHidden(!balanceHidden)}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {balanceHidden ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <button 
                  onClick={refetch}
                  disabled={holdingsLoading}
                  className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${holdingsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Wallet address pill */}
            <div className="flex items-center gap-2 mb-5">
              <div className="relative">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/25 to-primary/10 backdrop-blur-sm">
                  <WalletIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-eco border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Connected Wallet</p>
                <p className="font-mono text-sm font-semibold text-foreground">{shortenedAddress}</p>
              </div>
              <div className="flex gap-0.5">
                <button onClick={copyAddress} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <a href={basescanUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-5" />

            {/* Main balance */}
            {holdingsLoading ? (
              <div className="space-y-3 mb-5">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-32" />
              </div>
            ) : (
              <div className="mb-5">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Token Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground tabular-nums tracking-tight">
                    {balanceHidden ? '••••••' : formattedBalance}
                  </span>
                  <span className="text-sm font-semibold text-primary">$ZSOLAR</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm text-muted-foreground tabular-nums font-medium">
                    ≈ ${balanceHidden ? '••••' : formattedUsdValue} USD
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-xs text-muted-foreground tabular-nums">@${LIVE_TOKEN_PRICE.toFixed(2)}/token</span>
                </div>
              </div>
            )}

            {/* On-chain verified badge */}
            {parseFloat(tokenBalance) > 0 && !holdingsLoading && (
              <div className="mb-5 p-3 rounded-xl bg-eco/[0.07] border border-eco/15">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-eco/15">
                    <ShieldCheck className="h-3.5 w-3.5 text-eco" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">On-Chain Verified</p>
                    <p className="text-[11px] text-muted-foreground">{formattedBalance} $ZSOLAR minted to your wallet</p>
                  </div>
                  <Check className="h-3.5 w-3.5 text-eco flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Token & NFT Stats Row */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <a 
                href={tokenContractUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-primary/[0.03] transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-lg bg-primary/10">
                    <Coins className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tokens</span>
                </div>
                <div className="flex items-end justify-between">
                  {holdingsLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    <span className="text-xl font-bold text-foreground tabular-nums">{balanceHidden ? '••••' : formattedBalance}</span>
                  )}
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <Badge variant="outline" className="mt-2 text-[9px] border-primary/30 text-primary px-1.5 py-0">ERC-20</Badge>
              </a>

              <a 
                href={nftContractUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-secondary/30 hover:bg-secondary/[0.03] transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-lg bg-secondary/10">
                    <Images className="h-3 w-3 text-secondary" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">NFTs</span>
                </div>
                <div className="flex items-end justify-between">
                  {holdingsLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    <span className="text-xl font-bold text-foreground tabular-nums">{nftCount}</span>
                  )}
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <Badge variant="outline" className="mt-2 text-[9px] border-secondary/30 text-secondary px-1.5 py-0">ERC-1155</Badge>
              </a>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm" 
                asChild 
                className="flex-1 h-10 text-xs font-semibold gap-1.5"
              >
                <Link to="/">
                  <Sparkles className="h-3.5 w-3.5" />
                  Mint More
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="flex-1 h-10 text-xs font-semibold gap-1.5 border-primary/20 hover:bg-primary/10 hover:border-primary/30"
              >
                <Link to="/nft-collection">
                  <Images className="h-3.5 w-3.5" />
                  NFT Collection
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── NFT Gallery ── */}
      {nftTokenIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 pb-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm">Your NFTs</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Milestone achievements minted on-chain</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs h-8 gap-1 text-primary hover:text-primary hover:bg-primary/10">
                <Link to="/nft-collection">
                  View All
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {nftTokenIds.slice(0, 12).map((tokenId, i) => (
                  <motion.div 
                    key={tokenId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.04 }}
                    className="aspect-square rounded-xl overflow-hidden bg-muted relative group ring-1 ring-border/50 hover:ring-primary/40 transition-all"
                  >
                    <img
                      src={getImageForTokenId(tokenId)}
                      alt={getNameForTokenId(tokenId)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1.5">
                      <span className="text-[10px] text-white font-semibold">
                        #{tokenId}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              {nftTokenIds.length > 12 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  +{nftTokenIds.length - 12} more NFTs
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Footer Info ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <div className="rounded-2xl border border-border/40 bg-muted/20 dark:bg-muted/10 p-4 space-y-3">
          {/* Privacy */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-card/80 border border-border/50">
            <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Privacy Protected</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Only your <span className="font-medium text-foreground">ZenSolar</span> tokens and NFTs are displayed. We cannot see any other assets in your wallet.
              </p>
            </div>
          </div>

          {/* Network */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-eco animate-pulse" />
              <span className="text-muted-foreground">Network</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-medium">Base Sepolia</Badge>
          </div>

          <p className="text-[10px] text-muted-foreground/60 text-center">
            Balances update automatically every 30 seconds
          </p>
        </div>
      </motion.div>
    </div>
  );
}
