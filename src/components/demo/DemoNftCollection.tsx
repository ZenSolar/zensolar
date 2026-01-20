import { useState, useCallback } from 'react';
import { useDemoData } from '@/hooks/useDemoData';
import { PullToRefreshWrapper } from '@/components/ui/PullToRefreshWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
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
  Target,
  Crown,
  Star, 
  Loader2,
  Wallet,
  Eye,
  Gem,
  Flame,
  Gift,
  Hexagon
} from 'lucide-react';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  COMBO_MILESTONES,
  WELCOME_MILESTONE,
  calculateEarnedMilestones,
  getNextMilestone,
  calculateComboAchievements,
  type NFTMilestone,
} from '@/lib/nftMilestones';
import { getNftArtwork } from '@/lib/nftArtwork';
import { useConfetti } from '@/hooks/useConfetti';
import { MILESTONE_TO_TOKEN_ID } from '@/lib/nftTokenMapping';
import { toast } from 'sonner';
import { NFTDetailModal } from '@/components/nft/NFTDetailModal';

// Premium rarity configuration - matches NftCollection
const RARITY_CONFIG = {
  common: {
    label: 'Common',
    gradient: 'from-slate-400 to-slate-600',
    glow: 'shadow-slate-500/20',
    border: 'border-slate-500/30',
    bg: 'from-slate-500/10 to-slate-600/5'
  },
  uncommon: {
    label: 'Uncommon',
    gradient: 'from-emerald-400 to-teal-600',
    glow: 'shadow-emerald-500/30',
    border: 'border-emerald-500/40',
    bg: 'from-emerald-500/15 to-teal-600/5'
  },
  rare: {
    label: 'Rare',
    gradient: 'from-blue-400 to-indigo-600',
    glow: 'shadow-blue-500/40',
    border: 'border-blue-500/50',
    bg: 'from-blue-500/15 to-indigo-600/5'
  },
  epic: {
    label: 'Epic',
    gradient: 'from-purple-400 via-pink-500 to-purple-600',
    glow: 'shadow-purple-500/50',
    border: 'border-purple-500/60',
    bg: 'from-purple-500/20 to-pink-600/10'
  },
  legendary: {
    label: 'Legendary',
    gradient: 'from-amber-300 via-yellow-400 to-orange-500',
    glow: 'shadow-amber-500/60',
    border: 'border-amber-500/70',
    bg: 'from-amber-500/25 to-orange-600/15'
  },
  mythic: {
    label: 'Mythic',
    gradient: 'from-rose-400 via-amber-300 to-rose-500',
    glow: 'shadow-rose-500/70',
    border: 'border-rose-500/80',
    bg: 'from-rose-500/30 to-amber-500/20'
  }
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

// Premium NFT Card - matches NftCollection styling
function PremiumNFTCard({ 
  milestone, 
  isEarned, 
  currentValue,
  unit,
  isNext,
  onViewArtwork,
  onMintNFT,
  isMinted,
  isMinting,
  walletAddress
}: { 
  milestone: NFTMilestone; 
  isEarned: boolean;
  currentValue: number;
  unit: string;
  isNext: boolean;
  onViewArtwork: (milestone: NFTMilestone) => void;
  onMintNFT?: (milestone: NFTMilestone) => void;
  isMinted?: boolean;
  isMinting?: boolean;
  walletAddress?: string;
}) {
  const progress = milestone.threshold > 0 
    ? Math.min((currentValue / milestone.threshold) * 100, 100)
    : 100;
  
  const artwork = getNftArtwork(milestone.id);
  const canMint = isEarned && walletAddress && !isMinted;
  const tier = getTierFromId(milestone.id);
  const rarity = getRarityFromTier(tier);
  const rarityConfig = RARITY_CONFIG[rarity];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ 
        scale: 1.03,
        rotateY: 2,
        rotateX: -2,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
        isEarned 
          ? `bg-gradient-to-br ${rarityConfig.bg} ${rarityConfig.border} border-2 shadow-xl ${rarityConfig.glow}` 
          : isNext
          ? 'bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/40 ring-2 ring-accent/20'
          : 'bg-card/50 border border-border/40 opacity-60'
      }`}
    >
      {/* Animated shimmer overlay for earned cards */}
      {isEarned && (
        <motion.div 
          className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['-100% 0', '200% 0'] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        />
      )}
      
      {/* Glowing border effect for high-tier */}
      {isEarned && tier >= 4 && (
        <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${rarityConfig.gradient} opacity-30 blur-sm group-hover:opacity-50 transition-opacity -z-10`} />
      )}
      
      {/* NFT Artwork */}
      <div 
        className={`relative w-full aspect-square overflow-hidden ${!isEarned && 'grayscale'}`}
        onClick={() => onViewArtwork(milestone)}
      >
        {artwork && (
          <motion.img 
            src={artwork} 
            alt={milestone.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Rarity Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className={`bg-gradient-to-r ${rarityConfig.gradient} text-white border-0 gap-1.5 text-[10px] font-bold px-2 py-0.5 shadow-lg`}>
            <Gem className="h-3 w-3" />
            {rarityConfig.label}
          </Badge>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          {isMinted ? (
            <Badge className="bg-emerald-600/90 backdrop-blur-sm text-white gap-1 text-[10px] shadow-lg border-0">
              <CheckCircle2 className="h-3 w-3" />
              Minted
            </Badge>
          ) : isEarned ? (
            <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground gap-1 text-[10px] shadow-lg border-0">
              <Sparkles className="h-3 w-3" />
              Earned
            </Badge>
          ) : isNext ? (
            <Badge className="bg-accent/90 backdrop-blur-sm text-accent-foreground gap-1 text-[10px] shadow-lg border-0">
              <Target className="h-3 w-3" />
              Next
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-[10px] backdrop-blur-sm opacity-80">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          )}
        </div>
        
        {/* View overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 text-white bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">View NFT</span>
          </motion.div>
        </div>
        
        {/* Name overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
          <h3 className="font-bold text-white text-lg drop-shadow-lg">{milestone.name}</h3>
          <p className="text-xs text-white/80 line-clamp-1">{milestone.description}</p>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-4 space-y-3">
        {/* Progress */}
        {milestone.threshold > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className={isEarned ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                {Math.min(currentValue, milestone.threshold).toLocaleString()} / {milestone.threshold.toLocaleString()} {unit}
              </span>
            </div>
            <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div 
                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${isEarned ? rarityConfig.gradient : 'from-muted-foreground/50 to-muted-foreground/30'} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Mint Button */}
        {canMint && onMintNFT && (
          <Button
            size="sm"
            className={`w-full gap-2 bg-gradient-to-r ${rarityConfig.gradient} hover:opacity-90 text-white border-0 shadow-lg`}
            onClick={(e) => {
              e.stopPropagation();
              onMintNFT(milestone);
            }}
            disabled={isMinting}
          >
            {isMinting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {isMinting ? 'Minting...' : 'Mint to Wallet'}
          </Button>
        )}
        
        {isMinted && (
          <div className="flex items-center justify-center gap-2 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-medium">Owned On-Chain</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Premium Combo Card
function PremiumComboCard({ 
  milestone, 
  isEarned,
  isMinted,
  onViewArtwork,
  onMintNFT,
  isMinting,
  walletAddress
}: { 
  milestone: NFTMilestone; 
  isEarned: boolean;
  isMinted?: boolean;
  onViewArtwork: (milestone: NFTMilestone) => void;
  onMintNFT?: (milestone: NFTMilestone) => void;
  isMinting?: boolean;
  walletAddress?: string;
}) {
  const canMint = isEarned && walletAddress && !isMinted;
  const artwork = getNftArtwork(milestone.id);
  const tier = getTierFromId(milestone.id);
  const rarity = getRarityFromTier(tier, true);
  const rarityConfig = RARITY_CONFIG[rarity];
  const isTopTier = tier >= 5;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        scale: 1.02,
        y: -6,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
        isEarned 
          ? `${rarityConfig.border} border-2 shadow-2xl ${rarityConfig.glow}` 
          : 'border border-border/50 bg-card/30 opacity-50'
      }`}
    >
      {/* Animated glow ring for earned combos */}
      {isEarned && (
        <motion.div 
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${rarityConfig.gradient} blur-md opacity-40 group-hover:opacity-60 transition-opacity -z-10`}
          animate={isTopTier ? { opacity: [0.3, 0.6, 0.3] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      {/* Sparkle effects for mythic/legendary */}
      {isEarned && isTopTier && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{ 
                top: `${20 + i * 15}%`, 
                left: `${10 + i * 20}%` 
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0.5, 1.2, 0.5],
                y: [-2, 2, -2]
              }}
              transition={{ 
                duration: 2 + i * 0.3, 
                repeat: Infinity, 
                delay: i * 0.4 
              }}
            />
          ))}
        </div>
      )}
      
      {/* Artwork Section */}
      <div 
        className={`relative w-full aspect-[2.5/1] overflow-hidden ${!isEarned && 'grayscale'}`}
        onClick={() => onViewArtwork(milestone)}
      >
        {artwork && (
          <motion.img 
            src={artwork} 
            alt={milestone.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        {isEarned && (
          <div className={`absolute inset-0 bg-gradient-to-br ${rarityConfig.bg} opacity-60 group-hover:opacity-80 transition-opacity`} />
        )}
        
        {/* Rarity Badge */}
        <div className="absolute top-4 left-4 z-10">
          <motion.div
            animate={isEarned && isTopTier ? { 
              boxShadow: ['0 0 15px rgba(251,191,36,0.5)', '0 0 30px rgba(251,191,36,0.8)', '0 0 15px rgba(251,191,36,0.5)']
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge className={`bg-gradient-to-r ${rarityConfig.gradient} text-white border-0 gap-2 text-xs font-black px-3 py-1.5 shadow-xl tracking-wider`}>
              <Crown className="h-4 w-4" />
              {rarityConfig.label.toUpperCase()}
            </Badge>
          </motion.div>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          {isMinted ? (
            <Badge className="bg-emerald-600/90 backdrop-blur-sm text-white gap-1.5 text-xs shadow-lg border-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Minted
            </Badge>
          ) : isEarned ? (
            <Badge className="bg-primary/90 backdrop-blur-sm text-primary-foreground gap-1.5 text-xs shadow-lg border-0">
              <Flame className="h-3.5 w-3.5" />
              Earned
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5 text-xs backdrop-blur-sm opacity-80">
              <Lock className="h-3.5 w-3.5" />
              Locked
            </Badge>
          )}
        </div>
        
        {/* Name and actions overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <h3 className={`font-bold text-xl drop-shadow-lg ${isEarned ? 'text-white' : 'text-white/70'}`}>
                {milestone.name}
              </h3>
              <p className={`text-sm mt-1 ${isEarned ? 'text-white/90' : 'text-white/50'}`}>
                {milestone.description}
              </p>
            </div>
            
            {canMint && onMintNFT && (
              <Button
                size="sm"
                className={`gap-2 bg-gradient-to-r ${rarityConfig.gradient} hover:opacity-90 text-white border-0 shadow-xl shrink-0`}
                onClick={(e) => {
                  e.stopPropagation();
                  onMintNFT(milestone);
                }}
                disabled={isMinting}
              >
                {isMinting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {isMinting ? 'Minting...' : 'Mint NFT'}
              </Button>
            )}
            
            {isMinted && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-600/30 px-4 py-2 rounded-full backdrop-blur-sm shrink-0">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">On-Chain</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Premium Welcome Card
function PremiumWelcomeCard({ 
  isEarned,
  onViewArtwork,
  walletAddress,
  onMintClick,
  isMinting,
}: { 
  isEarned: boolean;
  onViewArtwork: (milestone: NFTMilestone) => void;
  walletAddress?: string;
  onMintClick?: () => void;
  isMinting?: boolean;
}) {
  const artwork = getNftArtwork('welcome');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -4 }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
        isEarned 
          ? 'bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/15 border-2 border-amber-500/50 shadow-xl shadow-amber-500/20' 
          : 'bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-orange-500/10 border-2 border-amber-500/40 ring-2 ring-amber-500/30'
      }`}
    >
      {/* Animated background */}
      {!isEarned && (
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className="flex flex-col sm:flex-row">
        {/* Artwork */}
        {artwork && (
          <div 
            className="relative w-full sm:w-56 aspect-square sm:aspect-auto overflow-hidden"
            onClick={() => onViewArtwork(WELCOME_MILESTONE)}
          >
            <motion.img 
              src={artwork} 
              alt="Welcome NFT"
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/60 sm:block hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent sm:hidden" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl">
              <Star className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="font-bold text-xl">Welcome NFT</h3>
                <Badge className={`${isEarned ? 'bg-amber-500' : 'bg-amber-500/80 animate-pulse'} text-white gap-1.5 border-0`}>
                  {isEarned ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
                  {isEarned ? 'Claimed' : 'Ready to Claim!'}
                </Badge>
                <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-0 gap-1 text-[10px] font-bold">
                  <Hexagon className="h-3 w-3" />
                  GENESIS
                </Badge>
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
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <span className="font-semibold">No requirements!</span> {walletAddress ? 'Click claim to get your first NFT.' : 'Connect your wallet to claim.'}
                </p>
              </div>
              
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onMintClick?.();
                }}
                disabled={!walletAddress || isMinting}
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-xl border-0"
              >
                {isMinting ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Minting...</>
                ) : !walletAddress ? (
                  <><Wallet className="h-5 w-5 mr-2" /> Connect Wallet to Claim</>
                ) : (
                  <><Gift className="h-5 w-5 mr-2" /> Claim Your Welcome NFT</>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Category Section
function CategorySection({
  title,
  icon,
  description,
  milestones,
  earnedMilestones,
  currentValue,
  unit,
  gradient,
  onViewArtwork,
  onMintNFT,
  mintedTokenIds,
  mintingId,
  walletAddress,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  milestones: NFTMilestone[];
  earnedMilestones: NFTMilestone[];
  currentValue: number;
  unit: string;
  gradient: string;
  onViewArtwork: (milestone: NFTMilestone) => void;
  onMintNFT?: (milestone: NFTMilestone) => void;
  mintedTokenIds?: number[];
  mintingId?: string | null;
  walletAddress?: string;
}) {
  const nextMilestone = getNextMilestone(currentValue, milestones);
  const earnedIds = new Set(earnedMilestones.map(m => m.id));
  const mintedSet = new Set(mintedTokenIds || []);
  
  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="flex items-center gap-4 pb-4 border-b border-border/50">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
          {earnedMilestones.length}/{milestones.length}
        </Badge>
      </div>

      {/* Progress Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">Current Progress</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {currentValue.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
          </div>
          
          {nextMilestone && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4 text-accent" />
                  Next: <span className="font-medium text-foreground">{nextMilestone.name}</span>
                </span>
                <span className="text-muted-foreground">
                  {((currentValue / nextMilestone.threshold) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
                <motion.div 
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradient} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((currentValue / nextMilestone.threshold) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {(nextMilestone.threshold - currentValue).toLocaleString()} {unit} to go
              </p>
            </div>
          )}
          
          {!nextMilestone && earnedMilestones.length === milestones.length && (
            <div className="flex items-center justify-center gap-2 py-2 text-primary">
              <Trophy className="h-5 w-5" />
              <span className="font-bold">Category Complete! 🎉</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NFT Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {milestones.map((milestone, index) => {
          const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
          const isMinted = tokenId !== undefined && mintedSet.has(tokenId);
          
          return (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PremiumNFTCard
                milestone={milestone}
                isEarned={earnedIds.has(milestone.id)}
                currentValue={currentValue}
                unit={unit}
                isNext={nextMilestone?.id === milestone.id}
                onViewArtwork={onViewArtwork}
                onMintNFT={onMintNFT}
                isMinted={isMinted}
                isMinting={mintingId === milestone.id}
                walletAddress={walletAddress}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function DemoNftCollection() {
  const { 
    activityData, 
    profile,
    mintedNFTs,
    hasWelcomeNFT,
    simulateMintMilestoneNFT,
    simulateMintWelcomeNFT,
    refreshDashboard
  } = useDemoData();
  
  const { triggerConfetti, triggerCelebration, triggerGoldBurst } = useConfetti();
  const [selectedNft, setSelectedNft] = useState<NFTMilestone | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mintingId, setMintingId] = useState<string | null>(null);

  const walletAddress = profile?.wallet_address;
  
  // Calculate earned milestones from demo data
  const solarKwh = activityData.solarEnergyProduced;
  const evMiles = activityData.evMilesDriven;
  const evChargingKwh = activityData.teslaSuperchargerKwh + activityData.homeChargerKwh;
  const batteryKwh = activityData.batteryStorageDischarged;

  const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(evMiles, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(batteryKwh, BATTERY_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);

  const allEarned = [...solarEarned, ...evMilesEarned, ...evChargingEarned, ...batteryEarned, ...comboEarned];
  const comboEarnedIds = new Set(comboEarned.map(m => m.id));
  
  const totalEarned = (hasWelcomeNFT ? 1 : 0) + allEarned.length;
  const totalAvailable = 1 + SOLAR_MILESTONES.length + EV_MILES_MILESTONES.length + 
    EV_CHARGING_MILESTONES.length + BATTERY_MILESTONES.length + COMBO_MILESTONES.length;

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await refreshDashboard();
    toast.success('Collection refreshed (Demo)');
  }, [refreshDashboard]);

  const handleViewArtwork = (milestone: NFTMilestone) => {
    setSelectedNft(milestone);
    setDialogOpen(true);
    
    const isEarned = allEarned.some(m => m.id === milestone.id) || (milestone.id === 'welcome' && hasWelcomeNFT);
    if (isEarned && milestone.id.startsWith('combo_')) {
      setTimeout(() => triggerGoldBurst(), 200);
    }
  };

  const handleMintNFT = async (milestone: NFTMilestone) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
    setMintingId(milestone.id);
    
    try {
      const result = await simulateMintMilestoneNFT(tokenId ?? 0, milestone.name);
      
      if (result.success) {
        triggerConfetti();
        triggerCelebration();
        toast.success(result.message);
      } else {
        toast.error('Minting failed');
      }
    } catch (error) {
      toast.error('Transaction failed');
    } finally {
      setMintingId(null);
    }
  };

  const handleMintWelcome = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setMintingId('welcome');
    
    try {
      const result = await simulateMintWelcomeNFT();
      
      if (result.success && !result.message.includes('already')) {
        triggerConfetti();
        triggerCelebration();
      }
      toast.success(result.message);
    } catch (error) {
      toast.error('Transaction failed');
    } finally {
      setMintingId(null);
    }
  };

  const getIsEarned = (milestone: NFTMilestone | null): boolean => {
    if (!milestone) return false;
    if (milestone.id === 'welcome') return hasWelcomeNFT;
    return allEarned.some(m => m.id === milestone.id);
  };

  return (
    <PullToRefreshWrapper onRefresh={handleRefresh} className="h-full">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Demo Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-sm text-primary font-medium">
            🎮 Demo Mode: Test minting NFTs based on simulated activity data
          </p>
        </div>

        {/* NFT Detail Modal */}
        <NFTDetailModal
          milestone={selectedNft}
          isEarned={getIsEarned(selectedNft)}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl">
              <Award className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                NFT Collection
              </h1>
              <Badge variant="outline" className="text-[10px] mt-1">BETA</Badge>
            </div>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Earn unique NFTs by reaching milestones in solar production, EV driving, charging, and battery usage. 
            Each achievement is minted on-chain as proof of your clean energy journey.
          </p>
        </motion.div>

        {/* Welcome NFT */}
        <PremiumWelcomeCard 
          isEarned={hasWelcomeNFT}
          onViewArtwork={handleViewArtwork}
          walletAddress={walletAddress || undefined}
          onMintClick={handleMintWelcome}
          isMinting={mintingId === 'welcome'}
        />

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { icon: Sun, label: 'Solar', count: solarEarned.length, gradient: 'from-amber-500 to-orange-600', bg: 'from-amber-500/15 to-orange-500/5' },
            { icon: Car, label: 'EV Miles', count: evMilesEarned.length, gradient: 'from-blue-500 to-indigo-600', bg: 'from-blue-500/15 to-indigo-500/5' },
            { icon: Zap, label: 'Charging', count: evChargingEarned.length, gradient: 'from-yellow-500 to-amber-600', bg: 'from-yellow-500/15 to-amber-500/5' },
            { icon: Battery, label: 'Battery', count: batteryEarned.length, gradient: 'from-emerald-500 to-teal-600', bg: 'from-emerald-500/15 to-teal-500/5' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className={`bg-gradient-to-br ${stat.bg} border-0 shadow-lg overflow-hidden`}>
                <CardContent className="p-4 text-center relative">
                  <div className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-full opacity-10`} />
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} mb-2 shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label} NFTs</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Total Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20 shadow-xl overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
              <div className="flex items-center justify-between mb-4 relative">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-lg">Collection Progress</span>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 text-sm px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  {totalEarned}/{totalAvailable}
                </Badge>
              </div>
              <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden mb-3">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalEarned / totalAvailable) * 100}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {totalEarned === totalAvailable 
                  ? "🎉 Congratulations! You've collected all NFTs!" 
                  : `${totalAvailable - totalEarned} more NFTs to unlock`
                }
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Tabs */}
        <Tabs defaultValue="solar" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1.5 bg-muted/50 rounded-xl">
            {[
              { value: 'solar', icon: Sun, label: 'Solar' },
              { value: 'ev_miles', icon: Car, label: 'EV Miles' },
              { value: 'charging', icon: Zap, label: 'Charging' },
              { value: 'battery', icon: Battery, label: 'Battery' },
              { value: 'combos', icon: Trophy, label: 'Combos' },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value}
                value={tab.value} 
                className="flex-col sm:flex-row gap-1.5 py-2.5 px-2 data-[state=active]:bg-background data-[state=active]:shadow-lg rounded-lg transition-all"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="solar" className="mt-8">
            <CategorySection
              title="Solar Production"
              icon={<Sun className="h-5 w-5 text-white" />}
              description="Generate clean solar energy to earn these NFTs"
              milestones={SOLAR_MILESTONES}
              earnedMilestones={solarEarned}
              currentValue={Math.floor(solarKwh)}
              unit="kWh"
              gradient="from-amber-500 to-orange-600"
              onViewArtwork={handleViewArtwork}
              onMintNFT={handleMintNFT}
              mintedTokenIds={mintedNFTs}
              mintingId={mintingId}
              walletAddress={walletAddress}
            />
          </TabsContent>

          <TabsContent value="ev_miles" className="mt-8">
            <CategorySection
              title="EV Miles Driven"
              icon={<Car className="h-5 w-5 text-white" />}
              description="Drive electric to earn these milestones"
              milestones={EV_MILES_MILESTONES}
              earnedMilestones={evMilesEarned}
              currentValue={Math.floor(evMiles)}
              unit="miles"
              gradient="from-blue-500 to-indigo-600"
              onViewArtwork={handleViewArtwork}
              onMintNFT={handleMintNFT}
              mintedTokenIds={mintedNFTs}
              mintingId={mintingId}
              walletAddress={walletAddress}
            />
          </TabsContent>

          <TabsContent value="charging" className="mt-8">
            <CategorySection
              title="EV Charging"
              icon={<Zap className="h-5 w-5 text-white" />}
              description="Charge your EV to unlock these achievements"
              milestones={EV_CHARGING_MILESTONES}
              earnedMilestones={evChargingEarned}
              currentValue={Math.floor(evChargingKwh)}
              unit="kWh"
              gradient="from-yellow-500 to-amber-600"
              onViewArtwork={handleViewArtwork}
              onMintNFT={handleMintNFT}
              mintedTokenIds={mintedNFTs}
              mintingId={mintingId}
              walletAddress={walletAddress}
            />
          </TabsContent>

          <TabsContent value="battery" className="mt-8">
            <CategorySection
              title="Battery Discharge"
              icon={<Battery className="h-5 w-5 text-white" />}
              description="Use your home battery storage to earn NFTs"
              milestones={BATTERY_MILESTONES}
              earnedMilestones={batteryEarned}
              currentValue={Math.floor(batteryKwh)}
              unit="kWh"
              gradient="from-emerald-500 to-teal-600"
              onViewArtwork={handleViewArtwork}
              onMintNFT={handleMintNFT}
              mintedTokenIds={mintedNFTs}
              mintingId={mintingId}
              walletAddress={walletAddress}
            />
          </TabsContent>

          <TabsContent value="combos" className="mt-8">
            <div className="space-y-6">
              {/* Combo Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-border/50">
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 shadow-lg">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-xl">Combo Achievements</h2>
                  <p className="text-sm text-muted-foreground">
                    Special NFTs for excelling across multiple categories
                  </p>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-foreground border-amber-500/30 text-sm px-3 py-1">
                  {comboEarned.length}/{COMBO_MILESTONES.length}
                </Badge>
              </div>

              {/* Combo Grid */}
              <div className="grid grid-cols-1 gap-5">
                {COMBO_MILESTONES.map((milestone, index) => {
                  const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
                  const isMinted = tokenId !== undefined && mintedNFTs.includes(tokenId);
                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                    >
                      <PremiumComboCard
                        milestone={milestone}
                        isEarned={comboEarnedIds.has(milestone.id)}
                        isMinted={isMinted}
                        onViewArtwork={handleViewArtwork}
                        onMintNFT={handleMintNFT}
                        isMinting={mintingId === milestone.id}
                        walletAddress={walletAddress}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>
                  NFTs are stored on Base blockchain. Keep tracking your clean energy activities to unlock more achievements!
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PullToRefreshWrapper>
  );
}
