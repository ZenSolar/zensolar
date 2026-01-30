import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Zap,
  Gift,
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useConfetti } from '@/hooks/useConfetti';
import { toast } from 'sonner';
import { useHaptics } from '@/hooks/useHaptics';
import { NFTMintFlow } from './NFTMintFlow';
import { getNftArtwork } from '@/lib/nftArtwork';
import { MILESTONE_TO_TOKEN_ID } from '@/lib/nftTokenMapping';
import { promptAddZsolarToken } from '@/lib/walletAssets';
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
import { Link } from 'react-router-dom';

export interface NFTQuickMintDialogRef {
  openDialog: () => void;
}

interface NFTQuickMintDialogProps {
  walletAddress?: string | null;
  activityData: ActivityData;
  onMintSuccess?: () => void;
}

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

// Compact NFT card for mintable items only
function MintableNFTCard({
  milestone,
  onMint,
  isMinting,
}: {
  milestone: NFTMilestone;
  onMint: (milestone: NFTMilestone) => void;
  isMinting: boolean;
}) {
  const artwork = getNftArtwork(milestone.id);
  const tier = getTierFromId(milestone.id);
  const isCombo = milestone.id.startsWith('combo_');
  const rarity = getRarityFromTier(tier, isCombo);
  const rarityConfig = RARITY_CONFIG[rarity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      className="relative flex items-center gap-3 p-3 rounded-xl border bg-primary/5 border-primary/30 hover:border-primary/50 transition-all"
    >
      {/* NFT Image */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
        {artwork && (
          <img src={artwork} alt={milestone.name} className="w-full h-full object-cover" />
        )}
        <div className={`absolute inset-0 bg-gradient-to-tr ${rarityConfig.gradient} opacity-20`} />
      </div>

      {/* NFT Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-sm">{milestone.name}</h4>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 bg-gradient-to-r ${rarityConfig.gradient} text-white border-0`}>
            {rarityConfig.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{milestone.description}</p>
      </div>

      {/* Mint Button */}
      <Button
        size="sm"
        className="gap-1.5 h-9 text-xs flex-shrink-0"
        onClick={() => onMint(milestone)}
        disabled={isMinting}
      >
        {isMinting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Zap className="h-3.5 w-3.5" />
        )}
        Mint
      </Button>
    </motion.div>
  );
}

export const NFTQuickMintDialog = forwardRef<NFTQuickMintDialogRef, NFTQuickMintDialogProps>(
  function NFTQuickMintDialog({ walletAddress, activityData, onMintSuccess }, ref) {
    const [open, setOpen] = useState(false);
    const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);
    const [mintFlowOpen, setMintFlowOpen] = useState(false);
    const [mintingMilestone, setMintingMilestone] = useState<NFTMilestone | null>(null);
    const [isBatchMinting, setIsBatchMinting] = useState(false);
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

    // Get ALL NFTs
    const allNFTs: NFTMilestone[] = [
      WELCOME_MILESTONE,
      ...SOLAR_MILESTONES,
      ...BATTERY_MILESTONES,
      ...EV_MILES_MILESTONES,
      ...EV_CHARGING_MILESTONES,
      ...COMBO_MILESTONES,
    ];

    // Filter to ONLY show NFTs that are earned but NOT on-chain (ready to mint)
    const mintableNFTs = allNFTs.filter(nft => isEarned(nft.id) && !isOnChain(nft.id));

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

    // Batch mint all available NFTs
    const handleBatchMintAll = async () => {
      if (!walletAddress || mintableNFTs.length === 0) return;
      
      setIsBatchMinting(true);
      try {
        const tokenIds = mintableNFTs
          .map(nft => MILESTONE_TO_TOKEN_ID[nft.id])
          .filter((id): id is number => id !== undefined);

        const { data, error } = await supabase.functions.invoke('mint-onchain', {
          body: {
            action: 'batch-mint-nfts',
            walletAddress,
            tokenIds,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        // Success!
        triggerGoldBurst();
        triggerCelebration();
        hapticSuccess();
        toast.success(`Successfully minted ${tokenIds.length} NFTs!`, {
          description: 'Your milestone NFTs are now on-chain in your wallet.',
        });
        
        // Force wallet to refresh ZSOLAR token balance after mint
        promptAddZsolarToken(true).catch(() => {
          // Silently fail - wallet will show updated balance on next sync
        });
        
        await checkOnChainStatus();
        onMintSuccess?.();
      } catch (err) {
        console.error('Batch mint error:', err);
      } finally {
        setIsBatchMinting(false);
      }
    };

    return (
      <>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md max-h-[85vh] p-0 overflow-hidden">
            <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
              <DialogTitle className="flex items-center gap-3 pr-8">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-lg">Mint NFTs</span>
                  {mintableNFTs.length > 0 && (
                    <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                      {mintableNFTs.length} Ready
                    </Badge>
                  )}
                </div>
              </DialogTitle>
              <DialogDescription className="text-sm">
                Claim your earned NFTs to your wallet
              </DialogDescription>
            </DialogHeader>

            {/* NFT List - Only Mintable */}
            <ScrollArea className="flex-1 px-4 pb-4 sm:px-6 sm:pb-6" style={{ maxHeight: 'calc(85vh - 160px)' }}>
              {isCheckingStatus ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : mintableNFTs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm mt-1">No NFTs ready to mint right now.</p>
                  <Link 
                    to="/nft-collection" 
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4"
                  >
                    View full collection
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 py-1">
                  {/* Batch Mint All Button */}
                  {mintableNFTs.length > 1 && (
                    <Button
                      onClick={handleBatchMintAll}
                      disabled={isBatchMinting || !walletAddress}
                      className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      size="lg"
                    >
                      {isBatchMinting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Layers className="h-4 w-4" />
                      )}
                      Mint All ({mintableNFTs.length} NFTs)
                    </Button>
                  )}

                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {mintableNFTs.map((nft, index) => (
                        <MintableNFTCard
                          key={nft.id}
                          milestone={nft}
                          onMint={handleMintNFT}
                          isMinting={(mintingMilestone?.id === nft.id && mintFlowOpen) || isBatchMinting}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  {/* Link to full collection */}
                  <div className="pt-3 text-center border-t border-border/50 mt-3">
                    <Link 
                      to="/nft-collection" 
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      View full collection
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
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
