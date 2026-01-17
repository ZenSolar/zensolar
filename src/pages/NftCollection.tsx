import { useState, useEffect, useRef } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { NFTDetailModal } from '@/components/nft/NFTDetailModal';
import { BatchMintButton } from '@/components/nft/BatchMintButton';
import { NFTMintFlow } from '@/components/nft/NFTMintFlow';
import { 
  Award, 
  Trophy, 
  Sun, 
  Car, 
  Zap, 
  Battery, 
  Sparkles, 
  Lock,
  CheckCircle2,
  TrendingUp,
  Target,
  Crown,
  Star, 
  Gift,
  Loader2,
  Wallet
} from 'lucide-react';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  COMBO_MILESTONES,
  WELCOME_MILESTONE,
  NFT_CATEGORIES,
  calculateEarnedMilestones,
  getNextMilestone,
  calculateComboAchievements,
  type NFTMilestone,
} from '@/lib/nftMilestones';
import { NFTBadge } from '@/components/ui/nft-badge';
import { getNftArtwork } from '@/lib/nftArtwork';
import { useConfetti } from '@/hooks/useConfetti';
import { supabase } from '@/integrations/supabase/client';
import { MILESTONE_TO_TOKEN_ID } from '@/lib/nftTokenMapping';
import { toast } from 'sonner';
function MilestoneCard({ 
  milestone, 
  isEarned, 
  currentValue,
  unit,
  isNext,
  onViewArtwork,
  onMintNFT,
  isOnChain,
  walletAddress
}: { 
  milestone: NFTMilestone; 
  isEarned: boolean;
  currentValue: number;
  unit: string;
  isNext: boolean;
  onViewArtwork: (milestone: NFTMilestone) => void;
  onMintNFT?: (milestone: NFTMilestone) => void;
  isOnChain?: boolean;
  walletAddress?: string;
}) {
  const progress = milestone.threshold > 0 
    ? Math.min((currentValue / milestone.threshold) * 100, 100)
    : 100;
  
  const artwork = getNftArtwork(milestone.id);
  const canMint = isEarned && walletAddress && !isOnChain;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer group ${
        isEarned 
          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50' 
          : isNext
          ? 'bg-accent/5 border-accent/30 ring-2 ring-accent/20 hover:ring-accent/40 hover:shadow-lg'
          : 'bg-muted/30 border-border/50 opacity-70 hover:opacity-90 hover:border-border'
      }`}
    >
      {/* Animated glow effect for earned cards */}
      {isEarned && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
          initial={false}
        />
      )}
      
      {/* NFT Artwork */}
      {artwork && (
        <div 
          className={`relative w-full aspect-square overflow-hidden ${!isEarned && 'grayscale opacity-60'}`}
          onClick={() => onViewArtwork(milestone)}
        >
          <motion.img 
            src={artwork} 
            alt={milestone.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          
          {/* Already Minted Overlay */}
          {isOnChain && (
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/30 via-green-500/20 to-emerald-600/30 flex items-center justify-center">
              <div className="bg-green-600/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-green-400/50 transform -rotate-12">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>ALREADY MINTED</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <motion.span 
              className="text-white text-sm font-medium px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full"
              initial={{ opacity: 0, y: 10 }}
              whileHover={{ opacity: 1, y: 0 }}
            >
              View NFT
            </motion.span>
          </div>
          {/* Status Badge on image */}
          <div className="absolute top-2 right-2">
            {isOnChain ? (
              <Badge className="bg-green-600 text-white gap-1 text-[10px] shadow-md">
                <CheckCircle2 className="h-3 w-3" />
                On-Chain
              </Badge>
            ) : isEarned ? (
              <Badge className="bg-primary text-primary-foreground gap-1 text-[10px]">
                <CheckCircle2 className="h-3 w-3" />
                Earned
              </Badge>
            ) : isNext ? (
              <Badge variant="outline" className="gap-1 border-accent text-accent bg-background/80 text-[10px]">
                <Target className="h-3 w-3" />
                Next
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 opacity-80 text-[10px]">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Name and Description */}
        <div className="flex items-start gap-2 mb-3">
          <NFTBadge 
            milestoneId={milestone.id} 
            size="md" 
            isEarned={isEarned}
            color={milestone.color}
            showGlow={isEarned}
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
              {milestone.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {milestone.description}
            </p>
          </div>
        </div>

        {/* Progress */}
        {milestone.threshold > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Progress</span>
              <span className={isEarned ? 'text-primary font-medium' : 'text-muted-foreground'}>
                {Math.min(currentValue, milestone.threshold).toLocaleString()} / {milestone.threshold.toLocaleString()} {unit}
              </span>
            </div>
            <Progress 
              value={progress} 
              className={`h-1.5 ${isEarned ? '' : 'opacity-60'}`}
            />
          </div>
        )}

        {/* Mint Button for earned NFTs */}
        {canMint && onMintNFT && (
          <Button
            size="sm"
            className="w-full mt-3 gap-2"
            onClick={(e) => {
              e.stopPropagation();
              onMintNFT(milestone);
            }}
          >
            <Zap className="h-3.5 w-3.5" />
            Mint NFT
          </Button>
        )}
        
        {isOnChain && (
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>On-Chain</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ComboMilestoneCard({ 
  milestone, 
  isEarned,
  isOnChain,
  onViewArtwork,
  onMintNFT,
  walletAddress
}: { 
  milestone: NFTMilestone; 
  isEarned: boolean;
  isOnChain?: boolean;
  onViewArtwork: (milestone: NFTMilestone) => void;
  onMintNFT?: (milestone: NFTMilestone) => void;
  walletAddress?: string;
}) {
  const canMint = isEarned && walletAddress && !isOnChain;
  const artwork = getNftArtwork(milestone.id);
  
  // Determine rarity tier based on milestone with enhanced styling
  const getRarityTier = (id: string) => {
    if (id === 'combo_7') return { 
      label: 'ZENITH', 
      class: 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-400 text-black animate-shimmer bg-[length:200%_100%]', 
      glow: 'shadow-[0_0_30px_rgba(251,191,36,0.5)]',
      borderGlow: 'border-amber-400/60',
      bgGlow: 'from-amber-500/30 via-yellow-400/20 to-amber-500/30'
    };
    if (id === 'combo_6') return { 
      label: 'APEX', 
      class: 'bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500 text-white animate-shimmer bg-[length:200%_100%]', 
      glow: 'shadow-[0_0_25px_rgba(244,63,94,0.5)]',
      borderGlow: 'border-rose-500/60',
      bgGlow: 'from-rose-500/25 via-orange-400/15 to-rose-500/25'
    };
    if (id === 'combo_5') return { 
      label: 'ECOSYSTEM', 
      class: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-white', 
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.5)]',
      borderGlow: 'border-emerald-500/60',
      bgGlow: 'from-emerald-500/25 via-teal-400/15 to-emerald-500/25'
    };
    if (id === 'combo_4') return { 
      label: 'CONSTELLATION', 
      class: 'bg-gradient-to-r from-violet-500 via-purple-400 to-violet-500 text-white', 
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.5)]',
      borderGlow: 'border-violet-500/50',
      bgGlow: 'from-violet-500/20 via-purple-400/10 to-violet-500/20'
    };
    if (id === 'combo_3') return { 
      label: 'QUADRANT', 
      class: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white', 
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.4)]',
      borderGlow: 'border-indigo-500/50',
      bgGlow: 'from-indigo-500/20 via-blue-400/10 to-indigo-500/20'
    };
    if (id === 'combo_2') return { 
      label: 'TRIFECTA', 
      class: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white', 
      glow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      borderGlow: 'border-cyan-500/40',
      bgGlow: 'from-cyan-500/15 via-blue-400/10 to-cyan-500/15'
    };
    return { 
      label: 'DUALITY', 
      class: 'bg-gradient-to-r from-slate-500 to-zinc-600 text-white', 
      glow: 'shadow-[0_0_12px_rgba(100,116,139,0.3)]',
      borderGlow: 'border-slate-500/30',
      bgGlow: 'from-slate-500/10 via-zinc-400/5 to-slate-500/10'
    };
  };
  
  const rarity = getRarityTier(milestone.id);
  const isTopTier = ['combo_6', 'combo_7'].includes(milestone.id);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        scale: 1.03,
        y: -8,
        transition: { duration: 0.25, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl overflow-hidden cursor-pointer group ${
        isEarned 
          ? `border-2 ${rarity.borderGlow} ${rarity.glow} ${isTopTier ? 'animate-float' : ''}` 
          : 'border border-border/50 bg-muted/30 opacity-50 hover:opacity-70'
      }`}
    >
      {/* Animated shimmer border for earned combos */}
      {isEarned && (
        <>
          {/* Outer glow ring */}
          <div className={`absolute -inset-[2px] rounded-xl bg-gradient-to-r ${rarity.bgGlow} animate-pulse-glow opacity-60 blur-sm pointer-events-none`} />
          
          {/* Shimmer overlay */}
          <motion.div 
            className="absolute inset-0 rounded-xl pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['-100% 0', '200% 0'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut"
            }}
          />
        </>
      )}
      
      {/* Artwork Section */}
      {artwork && (
        <div 
          className={`relative w-full aspect-[2/1] overflow-hidden ${!isEarned && 'grayscale'}`}
          onClick={() => onViewArtwork(milestone)}
        >
          <motion.img 
            src={artwork} 
            alt={milestone.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {isEarned && !isOnChain && (
            <motion.div 
              className={`absolute inset-0 bg-gradient-to-br ${rarity.bgGlow} opacity-40 group-hover:opacity-60 transition-opacity duration-300`}
            />
          )}
          
          {/* Already Minted Overlay for Combo */}
          {isOnChain && (
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/40 via-green-500/30 to-emerald-600/40 flex items-center justify-center z-20">
              <div className="bg-green-600/90 backdrop-blur-sm px-5 py-2.5 rounded-lg shadow-lg border border-green-400/50 transform -rotate-6">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>ALREADY MINTED</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Rarity Badge - Enhanced with glow */}
          <div className="absolute top-3 left-3 z-10">
            <motion.div
              animate={isEarned && isTopTier ? { 
                boxShadow: ['0 0 10px rgba(251,191,36,0.5)', '0 0 20px rgba(251,191,36,0.8)', '0 0 10px rgba(251,191,36,0.5)']
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Badge className={`${rarity.class} gap-1.5 text-[11px] font-black px-2.5 py-1 shadow-xl tracking-wider`}>
                <Crown className="h-3.5 w-3.5" />
                {rarity.label}
              </Badge>
            </motion.div>
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-10">
            {isOnChain ? (
              <Badge className="bg-green-600 text-white gap-1 text-[10px] backdrop-blur-sm shadow-lg">
                <CheckCircle2 className="h-3 w-3" />
                On-Chain
              </Badge>
            ) : isEarned ? (
              <Badge className="bg-primary/90 text-primary-foreground gap-1 text-[10px] backdrop-blur-sm shadow-lg">
                <CheckCircle2 className="h-3 w-3" />
                Earned
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 opacity-90 text-[10px] backdrop-blur-sm">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
          </div>
          
          {/* Sparkle effects for top tiers */}
          {isEarned && isTopTier && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{ top: '20%', left: '15%' }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="absolute w-1.5 h-1.5 bg-amber-200 rounded-full"
                style={{ top: '30%', right: '20%' }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{ bottom: '40%', left: '25%' }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
              />
            </div>
          )}
          
          {/* Name overlay with enhanced styling */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <div className="flex items-end justify-between gap-3">
              <div className="flex-1">
                <h3 className={`font-bold text-lg drop-shadow-lg ${isEarned ? 'text-white' : 'text-white/70'}`}>
                  {milestone.name}
                </h3>
                <p className={`text-xs ${isEarned ? 'text-white/90' : 'text-white/50'}`}>
                  {milestone.description}
                </p>
              </div>
              {/* Mint Button for earned combos */}
              {canMint && onMintNFT && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-primary hover:bg-primary/90 shadow-lg shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMintNFT(milestone);
                  }}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Mint NFT
                </Button>
              )}
              {isOnChain && (
                <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-600/30 px-2 py-1 rounded-full backdrop-blur-sm shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>On-Chain</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Welcome NFT Card - Special prominent display for new users
function WelcomeNftCard({ 
  isEarned,
  onViewArtwork,
  walletAddress,
  onMintSuccess
}: { 
  isEarned: boolean;
  onViewArtwork: (milestone: NFTMilestone) => void;
  walletAddress?: string;
  onMintSuccess?: () => void;
}) {
  const [isMinting, setIsMinting] = useState(false);
  const artwork = getNftArtwork('welcome');
  
  const handleClaimWelcomeNft = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsMinting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to claim');
        return;
      }

      const { data, error } = await supabase.functions.invoke('mint-onchain', {
        body: { 
          action: 'mint-specific-nft', 
          walletAddress,
          tokenId: 0 // Welcome NFT token ID
        },
      });

      if (error) throw error;

      if (data.alreadyOwned) {
        toast.info(data.message || 'You already own this NFT');
      } else if (data.success) {
        toast.success(data.message || 'Welcome NFT claimed successfully!');
        onMintSuccess?.();
      } else {
        toast.error(data.message || 'Claiming failed');
      }
    } catch (err) {
      console.error('Claim error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim Welcome NFT';
      toast.error(errorMessage);
    } finally {
      setIsMinting(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl border overflow-hidden transition-all duration-300 cursor-pointer group ${
        isEarned 
          ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/40 shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:border-amber-500/60' 
          : 'bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/30 ring-2 ring-amber-500/30 hover:ring-amber-500/50 hover:shadow-lg animate-pulse-glow'
      }`}
    >
      {/* Animated glow effect */}
      {!isEarned && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-amber-500/30 via-transparent to-yellow-500/20 opacity-50 pointer-events-none z-10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {isEarned && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
          initial={false}
        />
      )}
      
      <div className="flex flex-col sm:flex-row">
        {/* NFT Artwork */}
        {artwork && (
          <div 
            className={`relative w-full sm:w-48 aspect-square sm:aspect-auto overflow-hidden ${isEarned ? '' : 'opacity-90'}`}
            onClick={() => onViewArtwork(WELCOME_MILESTONE)}
          >
            <motion.img 
              src={artwork} 
              alt="Welcome NFT"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/50 sm:block hidden" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg">Welcome NFT</h3>
                {isEarned ? (
                  <Badge className="bg-amber-500 text-white gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Claimed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 gap-1 animate-pulse">
                    <Gift className="h-3 w-3" />
                    Ready to Claim!
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {isEarned 
                  ? "You've claimed your Welcome NFT! Start earning more by connecting your energy devices."
                  : "Congratulations on joining ZenSolar! Claim your Welcome NFT to begin your clean energy journey."
                }
              </p>
            </div>
          </div>
          
          {!isEarned && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <span className="font-medium">No requirements!</span> {walletAddress ? 'Click claim to get your first NFT.' : 'Connect your wallet to claim.'}
                </p>
              </div>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClaimWelcomeNft();
                }}
                disabled={isMinting || !walletAddress}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold shadow-lg"
              >
                {isMinting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : !walletAddress ? (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet to Claim
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Claim Welcome NFT
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CategorySection({
  title,
  icon,
  description,
  milestones,
  earnedMilestones,
  currentValue,
  unit,
  accentColor,
  onViewArtwork,
  onMintNFT,
  ownedTokenIds,
  walletAddress,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  milestones: NFTMilestone[];
  earnedMilestones: NFTMilestone[];
  currentValue: number;
  unit: string;
  accentColor: string;
  onViewArtwork: (milestone: NFTMilestone) => void;
  onMintNFT?: (milestone: NFTMilestone) => void;
  ownedTokenIds?: number[];
  walletAddress?: string;
}) {
  const nextMilestone = getNextMilestone(currentValue, milestones);
  const earnedIds = new Set(earnedMilestones.map(m => m.id));
  const ownedSet = new Set(ownedTokenIds || []);
  
  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/50">
        <div className={`p-2 rounded-lg ${accentColor}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-lg">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {earnedMilestones.length}/{milestones.length} Earned
        </Badge>
      </div>

      {/* Current Progress Summary */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Current Progress</span>
            <span className="text-2xl font-bold text-primary">
              {currentValue.toLocaleString()} <span className="text-sm text-muted-foreground font-normal">{unit}</span>
            </span>
          </div>
          {nextMilestone && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">Next: <NFTBadge milestoneId={nextMilestone.id} size="sm" color={nextMilestone.color} /> {nextMilestone.name}</span>
                <span>{nextMilestone.threshold.toLocaleString()} {unit}</span>
              </div>
              <Progress 
                value={(currentValue / nextMilestone.threshold) * 100} 
                className="h-2"
              />
            </div>
          )}
          {!nextMilestone && earnedMilestones.length === milestones.length && (
            <p className="text-sm text-primary font-medium text-center">
              🎉 Category Complete!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {milestones.map((milestone) => {
          const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
          const isOnChain = tokenId !== undefined && ownedSet.has(tokenId);
          
          return (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              isEarned={earnedIds.has(milestone.id)}
              currentValue={currentValue}
              unit={unit}
              isNext={nextMilestone?.id === milestone.id}
              onViewArtwork={onViewArtwork}
              onMintNFT={onMintNFT}
              isOnChain={isOnChain}
              walletAddress={walletAddress}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function NftCollection() {
  const { activityData, isLoading } = useDashboardData();
  const { profile, refetch: refetchProfile } = useProfile();
  const [selectedNft, setSelectedNft] = useState<NFTMilestone | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [celebratedNfts, setCelebratedNfts] = useState<Set<string>>(new Set());
  const [welcomeNftClaimed, setWelcomeNftClaimed] = useState(false);
  const { triggerCelebration, triggerGoldBurst } = useConfetti();
  const prevEarnedRef = useRef<Set<string>>(new Set());

  // NFT Mint Flow state
  const [mintFlowOpen, setMintFlowOpen] = useState(false);
  const [mintingMilestone, setMintingMilestone] = useState<NFTMilestone | null>(null);
  const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);
  const [isCheckingOnChain, setIsCheckingOnChain] = useState(false);

  const walletAddress = profile?.wallet_address;

  // Check on-chain status
  useEffect(() => {
    if (!walletAddress) return;

    const checkOnChainStatus = async () => {
      setIsCheckingOnChain(true);
      try {
        const { data, error } = await supabase.functions.invoke('mint-onchain', {
          body: { action: 'status', walletAddress },
        });

        if (!error && data?.ownedNFTTokenIds) {
          setOwnedTokenIds(data.ownedNFTTokenIds);
          // Check if welcome NFT is owned
          if (data.ownedNFTTokenIds.includes(0)) {
            setWelcomeNftClaimed(true);
          }
        }
      } catch (err) {
        console.error('Error checking on-chain status:', err);
      } finally {
        setIsCheckingOnChain(false);
      }
    };

    checkOnChainStatus();
  }, [walletAddress]);

  // Calculate all earned milestones
  const solarKwh = activityData.solarEnergyProduced;
  const evMiles = activityData.evMilesDriven;
  const evChargingKwh = activityData.teslaSuperchargerKwh + activityData.homeChargerKwh;
  const batteryKwh = activityData.batteryStorageDischarged;

  const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(evMiles, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(batteryKwh, BATTERY_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);

  // Total stats (add 1 for welcome NFT)
  const totalEarned = 1 + solarEarned.length + evMilesEarned.length + evChargingEarned.length + batteryEarned.length + comboEarned.length;
  const totalAvailable = 1 + SOLAR_MILESTONES.length + EV_MILES_MILESTONES.length + EV_CHARGING_MILESTONES.length + BATTERY_MILESTONES.length + COMBO_MILESTONES.length;

  const comboEarnedIds = new Set(comboEarned.map(m => m.id));
  
  // Get all current earned IDs
  const allEarned = [...solarEarned, ...evMilesEarned, ...evChargingEarned, ...batteryEarned, ...comboEarned];
  const currentEarnedIds = new Set(allEarned.map(m => m.id));

  // Check for newly earned NFTs and trigger celebration
  useEffect(() => {
    const storedCelebrated = localStorage.getItem('celebratedNfts');
    if (storedCelebrated) {
      setCelebratedNfts(new Set(JSON.parse(storedCelebrated)));
    }
  }, []);

  useEffect(() => {
    // Find newly earned NFTs that haven't been celebrated
    const newlyEarned = allEarned.filter(m => !celebratedNfts.has(m.id));
    
    if (newlyEarned.length > 0 && !isLoading) {
      // Trigger celebration for new NFTs
      const isCombo = newlyEarned.some(m => m.id.startsWith('combo_'));
      if (isCombo) {
        triggerGoldBurst();
        setTimeout(() => triggerCelebration(), 300);
      } else {
        triggerCelebration();
      }
      
      // Mark these as celebrated
      const updatedCelebrated = new Set([...celebratedNfts, ...newlyEarned.map(m => m.id)]);
      setCelebratedNfts(updatedCelebrated);
      localStorage.setItem('celebratedNfts', JSON.stringify([...updatedCelebrated]));
    }
  }, [currentEarnedIds.size, isLoading]);

  // Get earned state for selected NFT
  const getIsEarned = (milestone: NFTMilestone | null): boolean => {
    if (!milestone) return false;
    return allEarned.some(m => m.id === milestone.id);
  };

  const handleViewArtwork = (milestone: NFTMilestone) => {
    setSelectedNft(milestone);
    setDialogOpen(true);
    
    // If it's earned, trigger a small celebration
    if (getIsEarned(milestone)) {
      const isCombo = milestone.id.startsWith('combo_');
      if (isCombo) {
        setTimeout(() => triggerGoldBurst(), 200);
      }
    }
  };

  const handleMintNFT = (milestone: NFTMilestone) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    setMintingMilestone(milestone);
    setMintFlowOpen(true);
  };

  const handleMintSuccess = async () => {
    // Refresh on-chain status
    if (walletAddress) {
      try {
        const { data, error } = await supabase.functions.invoke('mint-onchain', {
          body: { action: 'status', walletAddress },
        });

        if (!error && data?.ownedNFTTokenIds) {
          setOwnedTokenIds(data.ownedNFTTokenIds);
        }
      } catch (err) {
        console.error('Error refreshing on-chain status:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* NFT Detail Modal */}
      <NFTDetailModal
        milestone={selectedNft}
        isEarned={getIsEarned(selectedNft)}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

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
      <div className="text-center space-y-2">
        <div className="flex flex-col items-center justify-center gap-1 mb-4">
          <div className="flex items-center justify-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">NFT Collection</h1>
          </div>
          <span className="text-xs text-muted-foreground tracking-wide uppercase">(beta)</span>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Earn unique NFTs by reaching milestones in solar production, EV driving, charging, and battery usage. 
          Unlock combo achievements by excelling across multiple categories!
        </p>
      </div>

      {/* Welcome NFT - Prominent Display for New Users */}
      <WelcomeNftCard 
        isEarned={welcomeNftClaimed}
        onViewArtwork={handleViewArtwork}
        walletAddress={profile?.wallet_address || undefined}
        onMintSuccess={() => {
          setWelcomeNftClaimed(true);
          triggerGoldBurst();
          triggerCelebration();
        }}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <Sun className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{solarEarned.length}</p>
            <p className="text-xs text-muted-foreground">Solar NFTs</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Car className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{evMilesEarned.length}</p>
            <p className="text-xs text-muted-foreground">EV Miles NFTs</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{evChargingEarned.length}</p>
            <p className="text-xs text-muted-foreground">Charging NFTs</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <Battery className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{batteryEarned.length}</p>
            <p className="text-xs text-muted-foreground">Battery NFTs</p>
          </CardContent>
        </Card>
      </div>

      {/* Total Progress */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-semibold">Total Collection Progress</span>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {totalEarned}/{totalAvailable} NFTs
            </Badge>
          </div>
          <Progress value={(totalEarned / totalAvailable) * 100} className="h-3" />
          <p className="text-sm text-muted-foreground text-center mt-2">
            {totalEarned === totalAvailable 
              ? "🎉 Congratulations! You've collected all NFTs!" 
              : `${totalAvailable - totalEarned} more NFTs to collect`
            }
          </p>
        </CardContent>
      </Card>

      {/* Batch Mint Button */}
      <BatchMintButton 
        earnedMilestones={[
          { id: 'welcome', name: 'Welcome', description: 'Welcome NFT', threshold: 0, color: 'zinc', icon: 'award' },
          ...allEarned
        ]} 
      />

      {/* Category Tabs */}
      <Tabs defaultValue="solar" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="solar" className="text-xs px-2 py-2 gap-1 flex-col sm:flex-row">
            <Sun className="h-4 w-4" />
            <span className="hidden sm:inline">Solar</span>
          </TabsTrigger>
          <TabsTrigger value="ev_miles" className="text-xs px-2 py-2 gap-1 flex-col sm:flex-row">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">EV Miles</span>
          </TabsTrigger>
          <TabsTrigger value="charging" className="text-xs px-2 py-2 gap-1 flex-col sm:flex-row">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Charging</span>
          </TabsTrigger>
          <TabsTrigger value="battery" className="text-xs px-2 py-2 gap-1 flex-col sm:flex-row">
            <Battery className="h-4 w-4" />
            <span className="hidden sm:inline">Battery</span>
          </TabsTrigger>
          <TabsTrigger value="combos" className="text-xs px-2 py-2 gap-1 flex-col sm:flex-row">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Combos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="solar" className="mt-6">
          <CategorySection
            title="Solar Production"
            icon={<Sun className="h-5 w-5 text-white" />}
            description="Generate clean solar energy to earn these NFTs"
            milestones={SOLAR_MILESTONES}
            earnedMilestones={solarEarned}
            currentValue={Math.floor(solarKwh)}
            unit="kWh"
            accentColor="bg-amber-500"
            onViewArtwork={handleViewArtwork}
            onMintNFT={handleMintNFT}
            ownedTokenIds={ownedTokenIds}
            walletAddress={walletAddress}
          />
        </TabsContent>

        <TabsContent value="ev_miles" className="mt-6">
          <CategorySection
            title="EV Miles Driven"
            icon={<Car className="h-5 w-5 text-white" />}
            description="Drive electric to earn these milestones"
            milestones={EV_MILES_MILESTONES}
            earnedMilestones={evMilesEarned}
            currentValue={Math.floor(evMiles)}
            unit="miles"
            accentColor="bg-blue-500"
            onViewArtwork={handleViewArtwork}
            onMintNFT={handleMintNFT}
            ownedTokenIds={ownedTokenIds}
            walletAddress={walletAddress}
          />
        </TabsContent>

        <TabsContent value="charging" className="mt-6">
          <CategorySection
            title="EV Charging"
            icon={<Zap className="h-5 w-5 text-white" />}
            description="Charge your EV to unlock these achievements"
            milestones={EV_CHARGING_MILESTONES}
            earnedMilestones={evChargingEarned}
            currentValue={Math.floor(evChargingKwh)}
            unit="kWh"
            accentColor="bg-yellow-500"
            onViewArtwork={handleViewArtwork}
            onMintNFT={handleMintNFT}
            ownedTokenIds={ownedTokenIds}
            walletAddress={walletAddress}
          />
        </TabsContent>

        <TabsContent value="battery" className="mt-6">
          <CategorySection
            title="Battery Discharge"
            icon={<Battery className="h-5 w-5 text-white" />}
            description="Use your home battery storage to earn NFTs"
            milestones={BATTERY_MILESTONES}
            earnedMilestones={batteryEarned}
            currentValue={Math.floor(batteryKwh)}
            unit="kWh"
            accentColor="bg-green-500"
            onViewArtwork={handleViewArtwork}
            onMintNFT={handleMintNFT}
            ownedTokenIds={ownedTokenIds}
            walletAddress={walletAddress}
          />
        </TabsContent>

        <TabsContent value="combos" className="mt-6">
          <div className="space-y-4">
            {/* Combo Header */}
            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
              <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg">Combo Achievements</h2>
                <p className="text-sm text-muted-foreground">
                  Special NFTs for excelling across multiple categories
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {comboEarned.length}/{COMBO_MILESTONES.length} Earned
              </Badge>
            </div>

            {/* Combo Grid */}
            <div className="grid grid-cols-1 gap-4">
              {COMBO_MILESTONES.map((milestone) => {
                const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
                const isComboOnChain = tokenId !== undefined && ownedTokenIds.includes(tokenId);
                return (
                  <ComboMilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    isEarned={comboEarnedIds.has(milestone.id)}
                    isOnChain={isComboOnChain}
                    onViewArtwork={handleViewArtwork}
                    onMintNFT={handleMintNFT}
                    walletAddress={walletAddress}
                  />
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Footer */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 inline mr-1" />
            NFTs are stored on the blockchain once you mint your rewards. 
            Keep tracking your clean energy activities to unlock more achievements!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
