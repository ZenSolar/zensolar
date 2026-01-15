import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  X, 
  CheckCircle2, 
  Lock, 
  ExternalLink, 
  Coins, 
  History, 
  FileText,
  Hash,
  Calendar,
  Sparkles,
  Crown,
  Award
} from 'lucide-react';
import { NFTBadge } from '@/components/ui/nft-badge';
import { getNftArtwork } from '@/lib/nftArtwork';
import { MILESTONE_TO_TOKEN_ID, TOKEN_ID_RANGES } from '@/lib/nftTokenMapping';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { NFTMilestone } from '@/lib/nftMilestones';

interface NFTDetailModalProps {
  milestone: NFTMilestone | null;
  isEarned: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MintTransaction {
  id: string;
  tx_hash: string;
  block_number: string | null;
  created_at: string;
  action: string;
  tokens_minted: number | null;
  nfts_minted: number[] | null;
  nft_names: string[] | null;
}

// Get category from milestone ID
function getCategoryFromMilestoneId(id: string): string {
  if (id === 'welcome') return 'Welcome';
  if (id.startsWith('solar_')) return 'Solar Production';
  if (id.startsWith('battery_')) return 'Battery Discharge';
  if (id.startsWith('charge_')) return 'EV Charging';
  if (id.startsWith('ev_')) return 'EV Miles';
  if (id.startsWith('combo_')) return 'Combo Achievement';
  return 'Unknown';
}

// Get tier number from milestone ID
function getTierFromMilestoneId(id: string): number {
  if (id === 'welcome') return 0;
  const parts = id.split('_');
  return parseInt(parts[1]) || 0;
}

// Get rarity based on tier and category
function getRarity(milestone: NFTMilestone): { label: string; class: string } {
  const tier = getTierFromMilestoneId(milestone.id);
  const isCombo = milestone.id.startsWith('combo_');
  
  if (milestone.id === 'welcome') {
    return { label: 'Genesis', class: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black' };
  }
  
  if (isCombo) {
    if (tier >= 7) return { label: 'Mythic', class: 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 text-white' };
    if (tier >= 5) return { label: 'Legendary', class: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' };
    if (tier >= 3) return { label: 'Epic', class: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' };
    return { label: 'Rare', class: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' };
  }
  
  // Category NFTs
  if (tier >= 8) return { label: 'Legendary', class: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' };
  if (tier >= 6) return { label: 'Epic', class: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' };
  if (tier >= 4) return { label: 'Rare', class: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' };
  if (tier >= 2) return { label: 'Uncommon', class: 'bg-emerald-500 text-white' };
  return { label: 'Common', class: 'bg-slate-500 text-white' };
}

// Get redemption token value for redeemable NFTs
function getRedemptionValue(milestone: NFTMilestone): number | null {
  // Combo NFTs and Welcome NFT are non-redeemable
  if (milestone.id === 'welcome' || milestone.id.startsWith('combo_')) {
    return null;
  }
  // Category NFTs have token value equal to their threshold
  return milestone.threshold;
}

// Check if NFT is redeemable
function isRedeemable(milestone: NFTMilestone): boolean {
  return getRedemptionValue(milestone) !== null;
}

export function NFTDetailModal({ milestone, isEarned, open, onOpenChange }: NFTDetailModalProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<MintTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Fetch transaction history for this NFT when modal opens
  useEffect(() => {
    if (!open || !milestone || !user) {
      setTransactions([]);
      return;
    }

    async function fetchTransactions() {
      setLoadingTx(true);
      try {
        const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
        
        // Fetch all transactions for this user that include this NFT
        const { data, error } = await supabase
          .from('mint_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter to transactions that include this NFT's token ID
        const relevantTx = (data || []).filter((tx: MintTransaction) => {
          if (!tx.nfts_minted) return false;
          return tx.nfts_minted.includes(tokenId);
        });

        setTransactions(relevantTx);
      } catch (err) {
        console.error('Error fetching NFT transactions:', err);
      } finally {
        setLoadingTx(false);
      }
    }

    fetchTransactions();
  }, [open, milestone, user]);

  if (!milestone) return null;

  const artwork = getNftArtwork(milestone.id);
  const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
  const category = getCategoryFromMilestoneId(milestone.id);
  const tier = getTierFromMilestoneId(milestone.id);
  const rarity = getRarity(milestone);
  const redemptionValue = getRedemptionValue(milestone);
  const redeemable = isRedeemable(milestone);

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background/95 backdrop-blur-xl max-h-[90vh]">
        {/* Large Artwork Display */}
        <div className={`relative w-full aspect-square ${!isEarned && 'grayscale opacity-70'}`}>
          {artwork ? (
            <img 
              src={artwork} 
              alt={milestone.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <NFTBadge 
                milestoneId={milestone.id} 
                size="xl" 
                isEarned={isEarned}
                color={milestone.color}
                showGlow={isEarned}
              />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            {isEarned ? (
              <Badge className="bg-primary text-primary-foreground gap-1.5 px-3 py-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Earned
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm opacity-90">
                <Lock className="h-4 w-4" />
                Locked
              </Badge>
            )}
          </div>

          {/* Rarity Badge */}
          <div className="absolute top-4 left-14">
            <Badge className={`${rarity.class} gap-1.5 px-2.5 py-1 text-xs font-bold`}>
              <Crown className="h-3 w-3" />
              {rarity.label}
            </Badge>
          </div>

          {/* Close Button */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 left-4 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{milestone.name}</h2>
            <p className="text-sm text-white/80">{milestone.description}</p>
          </div>
        </div>

        {/* Tabs for Details */}
        <Tabs defaultValue="metadata" className="w-full">
          <TabsList className="w-full grid grid-cols-3 rounded-none bg-muted/50">
            <TabsTrigger value="metadata" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Metadata
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" />
              History
            </TabsTrigger>
            <TabsTrigger value="value" className="gap-1.5 text-xs">
              <Coins className="h-3.5 w-3.5" />
              Value
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="max-h-[280px]">
            {/* Metadata Tab */}
            <TabsContent value="metadata" className="p-4 space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Token ID</p>
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4 text-primary" />
                    <p className="font-mono font-semibold">{tokenId}</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <p className="font-semibold text-sm">{category}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Tier</p>
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-primary" />
                    <p className="font-semibold">{tier === 0 ? 'Genesis' : `Tier ${tier}`}</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Rarity</p>
                  <Badge className={`${rarity.class} text-xs`}>{rarity.label}</Badge>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Requirement</p>
                  <p className="font-semibold">
                    {milestone.threshold > 0 
                      ? `${milestone.threshold.toLocaleString()} ${category.includes('Miles') ? 'miles' : 'kWh'}` 
                      : 'Account Registration'}
                  </p>
                </div>
              </div>
              
              {/* External Links */}
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">External Links</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs gap-1.5"
                    onClick={() => window.open(`https://basescan.org/token/0x...?a=${tokenId}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View on BaseScan
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="p-4 space-y-3 mt-0">
              {loadingTx ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-6">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isEarned ? 'No on-chain transactions yet' : 'NFT not yet earned'}
                  </p>
                  {isEarned && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Mint this NFT to create a transaction record
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      className="bg-muted/50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs capitalize">
                          {tx.action.replace('-', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(tx.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tx Hash:</span>
                        <a 
                          href={`https://basescan.org/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-primary hover:underline flex items-center gap-1"
                        >
                          {truncateHash(tx.tx_hash)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {tx.block_number && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Block:</span>
                          <span className="font-mono">{tx.block_number}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Value Tab */}
            <TabsContent value="value" className="p-4 space-y-4 mt-0">
              {redeemable ? (
                <>
                  <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4 text-center">
                    <Coins className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground mb-1">Redemption Value</p>
                    <p className="text-3xl font-bold text-primary">
                      {redemptionValue?.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">ZSOLAR Tokens</p>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm font-medium mb-1">How Redemption Works</p>
                    <p className="text-xs text-muted-foreground">
                      When you redeem this NFT, it will be burned and you'll receive{' '}
                      <span className="text-primary font-semibold">{redemptionValue?.toLocaleString()} ZSOLAR</span> tokens 
                      directly to your connected wallet. This action is irreversible.
                    </p>
                  </div>
                  
                  {isEarned && (
                    <Button className="w-full gap-2" disabled>
                      <Sparkles className="h-4 w-4" />
                      Redeem for Tokens (Coming Soon)
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-muted/50 rounded-xl p-6">
                    <Award className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-semibold mb-1">Non-Redeemable NFT</p>
                    <p className="text-sm text-muted-foreground">
                      {milestone.id === 'welcome' 
                        ? 'The Welcome NFT is a commemorative token marking your entry into the ZenSolar ecosystem.'
                        : 'Combo NFTs are achievement badges that celebrate your cross-category accomplishments. They cannot be redeemed for tokens but showcase your sustainability mastery!'}
                    </p>
                  </div>
                  
                  <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Pro tip:</span> Keep earning category NFTs (Solar, Battery, Charging, EV Miles) — these are redeemable for ZSOLAR tokens!
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
