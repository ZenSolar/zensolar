import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  Sun,
  Car,
  Zap,
  Battery,
  Trophy,
  Lock,
  Gift,
  Gem
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptics } from '@/hooks/useHaptics';
import { NFTMintFlow } from './NFTMintFlow';
import { getNftArtwork } from '@/lib/nftArtwork';
import { MILESTONE_TO_TOKEN_ID } from '@/lib/nftTokenMapping';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  COMBO_MILESTONES,
  WELCOME_MILESTONE,
  calculateEarnedMilestones,
  calculateComboAchievements,
  type NFTMilestone,
} from '@/lib/nftMilestones';
import type { ActivityData } from '@/types/dashboard';

export interface NFTQuickMintDialogRef {
  openDialog: () => void;
}

interface NFTQuickMintDialogProps {
  walletAddress?: string | null;
  activityData: ActivityData;
  onMintSuccess?: () => void;
}

type NFTCategory = 'all' | 'solar' | 'battery' | 'ev' | 'charging' | 'combo';

const CATEGORY_CONFIG = {
  all: { label: 'All', icon: Sparkles },
  solar: { label: 'Solar', icon: Sun },
  battery: { label: 'Battery', icon: Battery },
  ev: { label: 'EV Miles', icon: Car },
  charging: { label: 'Charging', icon: Zap },
  combo: { label: 'Combo', icon: Trophy },
};

// Rarity configuration
const RARITY_CONFIG = {
  common: { label: 'Common', gradient: 'from-slate-400 to-slate-600' },
  uncommon: { label: 'Uncommon', gradient: 'from-emerald-400 to-teal-600' },
  rare: { label: 'Rare', gradient: 'from-blue-400 to-indigo-600' },
  epic: { label: 'Epic', gradient: 'from-purple-400 via-pink-500 to-purple-600' },
  legendary: { label: 'Legendary', gradient: 'from-amber-300 via-yellow-400 to-orange-500' },
  mythic: { label: 'Mythic', gradient: 'from-rose-400 via-amber-300 to-rose-500' }
};

function getRarityFromTier(tier: number, isCombo: boolean = false): keyof typeof RARITY_CONFIG {
  if (isCombo) {
    if (tier >= 7) return 'mythic';
    if (tier >= 5) return 'legendary';
    if (tier >= 3) return 'epic';
    if (tier >= 2) return 'rare';
    return 'uncommon';
  }
  if (tier >= 8) return 'legendary';
  if (tier >= 6) return 'epic';
  if (tier >= 4) return 'rare';
  if (tier >= 2) return 'uncommon';
  return 'common';
}

function getTierFromId(id: string): number {
  if (id === 'welcome') return 0;
  const parts = id.split('_');
  return parseInt(parts[1]) || 1;
}

// Compact NFT card for the dialog
function CompactNFTCard({
  milestone,
  isEarned,
  isOnChain,
  onMint,
  isMinting,
}: {
  milestone: NFTMilestone;
  isEarned: boolean;
  isOnChain: boolean;
  onMint: (milestone: NFTMilestone) => void;
  isMinting: boolean;
}) {
  const artwork = getNftArtwork(milestone.id);
  const canMint = isEarned && !isOnChain;
  const tier = getTierFromId(milestone.id);
  const isCombo = milestone.id.startsWith('combo_');
  const rarity = getRarityFromTier(tier, isCombo);
  const rarityConfig = RARITY_CONFIG[rarity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isOnChain
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : canMint
          ? 'bg-primary/5 border-primary/30 hover:border-primary/50'
          : isEarned
          ? 'bg-muted/50 border-border/50'
          : 'bg-muted/20 border-border/30 opacity-50'
      }`}
    >
      {/* NFT Image */}
      <div className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 ${!isEarned && 'grayscale'}`}>
        {artwork && (
          <img src={artwork} alt={milestone.name} className="w-full h-full object-cover" />
        )}
        {/* Rarity indicator */}
        <div className={`absolute inset-0 bg-gradient-to-tr ${rarityConfig.gradient} opacity-20`} />
      </div>

      {/* NFT Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm truncate">{milestone.name}</h4>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 bg-gradient-to-r ${rarityConfig.gradient} text-white border-0`}>
            {rarityConfig.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{milestone.description}</p>
      </div>

      {/* Status / Action */}
      <div className="flex-shrink-0">
        {isOnChain ? (
          <Badge className="bg-emerald-600/90 text-white gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Minted
          </Badge>
        ) : canMint ? (
          <Button
            size="sm"
            className="gap-1.5 h-8 text-xs"
            onClick={() => onMint(milestone)}
            disabled={isMinting}
          >
            {isMinting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            Mint
          </Button>
        ) : isEarned ? (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Sparkles className="h-3 w-3" />
            Earned
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-xs opacity-50">
            <Lock className="h-3 w-3" />
            Locked
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

export const NFTQuickMintDialog = forwardRef<NFTQuickMintDialogRef, NFTQuickMintDialogProps>(
  function NFTQuickMintDialog({ walletAddress, activityData, onMintSuccess }, ref) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<NFTCategory>('all');
    const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [mintFlowOpen, setMintFlowOpen] = useState(false);
    const [mintingMilestone, setMintingMilestone] = useState<NFTMilestone | null>(null);
    const { triggerCelebration, triggerGoldBurst } = useConfetti();
    const { success: hapticSuccess } = useHaptics();

    // Expose openDialog to parent
    useImperativeHandle(ref, () => ({
      openDialog: () => setOpen(true),
    }));

    // Check on-chain status when dialog opens
    useEffect(() => {
      if (open && walletAddress) {
        checkOnChainStatus();
      }
    }, [open, walletAddress]);

    const checkOnChainStatus = async () => {
      if (!walletAddress) return;
      setIsCheckingStatus(true);
      try {
        const { data, error } = await supabase.functions.invoke('mint-onchain', {
          body: { action: 'status', walletAddress },
        });
        if (!error && data?.ownedNFTTokenIds) {
          setOwnedTokenIds(data.ownedNFTTokenIds);
        }
      } catch (err) {
        console.error('Error checking on-chain status:', err);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    // Calculate earned milestones
    const solarKwh = activityData.solarEnergyProduced;
    const evMiles = activityData.evMilesDriven;
    const evChargingKwh = activityData.teslaSuperchargerKwh + activityData.homeChargerKwh;
    const batteryKwh = activityData.batteryStorageDischarged;

    const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES);
    const evMilesEarned = calculateEarnedMilestones(evMiles, EV_MILES_MILESTONES);
    const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
    const batteryEarned = calculateEarnedMilestones(batteryKwh, BATTERY_MILESTONES);
    const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);

    const allEarnedIds = new Set([
      'welcome',
      ...solarEarned.map(m => m.id),
      ...evMilesEarned.map(m => m.id),
      ...evChargingEarned.map(m => m.id),
      ...batteryEarned.map(m => m.id),
      ...comboEarned.map(m => m.id),
    ]);

    const isOnChain = (milestoneId: string) => {
      const tokenId = MILESTONE_TO_TOKEN_ID[milestoneId];
      return tokenId !== undefined && ownedTokenIds.includes(tokenId);
    };

    const isEarned = (milestoneId: string) => allEarnedIds.has(milestoneId);

    // Get NFTs for current tab
    const getNFTsForTab = (): NFTMilestone[] => {
      switch (activeTab) {
        case 'solar':
          return SOLAR_MILESTONES;
        case 'battery':
          return BATTERY_MILESTONES;
        case 'ev':
          return EV_MILES_MILESTONES;
        case 'charging':
          return EV_CHARGING_MILESTONES;
        case 'combo':
          return COMBO_MILESTONES;
        case 'all':
        default:
          return [
            WELCOME_MILESTONE,
            ...SOLAR_MILESTONES,
            ...BATTERY_MILESTONES,
            ...EV_MILES_MILESTONES,
            ...EV_CHARGING_MILESTONES,
            ...COMBO_MILESTONES,
          ];
      }
    };

    // Filter to show mintable first, then earned, then locked
    const sortedNFTs = getNFTsForTab().sort((a, b) => {
      const aOnChain = isOnChain(a.id);
      const bOnChain = isOnChain(b.id);
      const aEarned = isEarned(a.id);
      const bEarned = isEarned(b.id);
      const aCanMint = aEarned && !aOnChain;
      const bCanMint = bEarned && !bOnChain;

      // Mintable first
      if (aCanMint && !bCanMint) return -1;
      if (!aCanMint && bCanMint) return 1;
      // Then minted (on-chain)
      if (aOnChain && !bOnChain) return -1;
      if (!aOnChain && bOnChain) return 1;
      // Then earned
      if (aEarned && !bEarned) return -1;
      if (!aEarned && bEarned) return 1;
      return 0;
    });

    const mintableCount = sortedNFTs.filter(nft => isEarned(nft.id) && !isOnChain(nft.id)).length;
    const mintedCount = sortedNFTs.filter(nft => isOnChain(nft.id)).length;

    const handleMintNFT = (milestone: NFTMilestone) => {
      setMintingMilestone(milestone);
      setMintFlowOpen(true);
    };

    const handleMintSuccess = async () => {
      triggerGoldBurst();
      triggerCelebration();
      hapticSuccess();
      
      // Refresh on-chain status
      await checkOnChainStatus();
      onMintSuccess?.();
    };

    return (
      <>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 overflow-hidden">
            <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
              <DialogTitle className="flex items-center gap-3 pr-8">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-lg">Mint ZenSolar NFTs</span>
                  <div className="flex items-center gap-2 mt-1">
                    {mintableCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        {mintableCount} Ready to Mint
                      </Badge>
                    )}
                    {mintedCount > 0 && (
                      <Badge variant="outline" className="text-xs text-emerald-600">
                        {mintedCount} Minted
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription className="text-sm">
                Claim your earned NFTs to your wallet on Base Sepolia
              </DialogDescription>
            </DialogHeader>

            {/* Category Tabs */}
            <div className="px-4 sm:px-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NFTCategory)}>
                <TabsList className="w-full grid grid-cols-6 h-9">
                  {Object.entries(CATEGORY_CONFIG).map(([key, { label, icon: Icon }]) => (
                    <TabsTrigger key={key} value={key} className="text-xs px-1 gap-1">
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* NFT List */}
            <ScrollArea className="flex-1 px-4 pb-4 sm:px-6 sm:pb-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              {isCheckingStatus ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sortedNFTs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Gem className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No NFTs in this category yet</p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <AnimatePresence mode="popLayout">
                    {sortedNFTs.map((nft) => (
                      <CompactNFTCard
                        key={nft.id}
                        milestone={nft}
                        isEarned={isEarned(nft.id)}
                        isOnChain={isOnChain(nft.id)}
                        onMint={handleMintNFT}
                        isMinting={mintingMilestone?.id === nft.id && mintFlowOpen}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* NFT Mint Flow Dialog */}
        {mintingMilestone && walletAddress && (
          <NFTMintFlow
            milestone={mintingMilestone}
            walletAddress={walletAddress}
            open={mintFlowOpen}
            onOpenChange={setMintFlowOpen}
            onMintSuccess={handleMintSuccess}
          />
        )}
      </>
    );
  }
);
