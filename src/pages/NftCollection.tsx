import { useState, useEffect, useRef } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  TrendingUp,
  Target,
  X,
  Crown
} from 'lucide-react';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  NFT_CATEGORIES,
  calculateEarnedMilestones,
  getNextMilestone,
  type NFTMilestone,
} from '@/lib/nftMilestones';
import { NFTBadge } from '@/components/ui/nft-badge';
import { getNftArtwork } from '@/lib/nftArtwork';
import { useConfetti } from '@/hooks/useConfetti';

function MilestoneCard({ 
  milestone, 
  isEarned, 
  currentValue,
  unit,
  isNext,
  onViewArtwork
}: { 
  milestone: NFTMilestone; 
  isEarned: boolean;
  currentValue: number;
  unit: string;
  isNext: boolean;
  onViewArtwork: (milestone: NFTMilestone) => void;
}) {
  const progress = milestone.threshold > 0 
    ? Math.min((currentValue / milestone.threshold) * 100, 100)
    : 100;
  
  const artwork = getNftArtwork(milestone.id);
  
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
            {isEarned ? (
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
                {currentValue.toLocaleString()} / {milestone.threshold.toLocaleString()} {unit}
              </span>
            </div>
            <Progress 
              value={progress} 
              className={`h-1.5 ${isEarned ? '' : 'opacity-60'}`}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ComboMilestoneCard({ 
  milestone, 
  isEarned,
  onViewArtwork
}: { 
  milestone: NFTMilestone; 
  isEarned: boolean;
  onViewArtwork: (milestone: NFTMilestone) => void;
}) {
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
          {isEarned && (
            <motion.div 
              className={`absolute inset-0 bg-gradient-to-br ${rarity.bgGlow} opacity-40 group-hover:opacity-60 transition-opacity duration-300`}
            />
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
            {isEarned ? (
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
            <h3 className={`font-bold text-lg drop-shadow-lg ${isEarned ? 'text-white' : 'text-white/70'}`}>
              {milestone.name}
            </h3>
            <p className={`text-xs ${isEarned ? 'text-white/90' : 'text-white/50'}`}>
              {milestone.description}
            </p>
          </div>
        </div>
      )}
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
}) {
  const nextMilestone = getNextMilestone(currentValue, milestones);
  const earnedIds = new Set(earnedMilestones.map(m => m.id));
  
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
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            isEarned={earnedIds.has(milestone.id)}
            currentValue={currentValue}
            unit={unit}
            isNext={nextMilestone?.id === milestone.id}
            onViewArtwork={onViewArtwork}
          />
        ))}
      </div>
    </div>
  );
}

export default function NftCollection() {
  const { activityData, isLoading } = useDashboardData();
  const [selectedNft, setSelectedNft] = useState<NFTMilestone | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [celebratedNfts, setCelebratedNfts] = useState<Set<string>>(new Set());
  const { triggerCelebration, triggerGoldBurst } = useConfetti();
  const prevEarnedRef = useRef<Set<string>>(new Set());

  // Calculate all earned milestones
  const solarKwh = activityData.solarEnergyProduced;
  const evMiles = activityData.evMilesDriven;
  const evChargingKwh = activityData.teslaSuperchargerKwh + activityData.homeChargerKwh;
  const batteryKwh = activityData.batteryStorageDischarged;

  const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(evMiles, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(batteryKwh, BATTERY_MILESTONES);

  // Total stats (add 1 for welcome NFT)
  const totalEarned = 1 + solarEarned.length + evMilesEarned.length + evChargingEarned.length + batteryEarned.length;
  const totalAvailable = 1 + SOLAR_MILESTONES.length + EV_MILES_MILESTONES.length + EV_CHARGING_MILESTONES.length + BATTERY_MILESTONES.length;
  
  // Get all current earned IDs
  const allEarned = [...solarEarned, ...evMilesEarned, ...evChargingEarned, ...batteryEarned];
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

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* NFT Artwork Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
          {selectedNft && (
            <>
              {/* Large Artwork Display */}
              <div className={`relative w-full aspect-square ${!getIsEarned(selectedNft) && 'grayscale opacity-70'}`}>
                {getNftArtwork(selectedNft.id) ? (
                  <img 
                    src={getNftArtwork(selectedNft.id)!} 
                    alt={selectedNft.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <NFTBadge 
                      milestoneId={selectedNft.id} 
                      size="xl" 
                      isEarned={getIsEarned(selectedNft)}
                      color={selectedNft.color}
                      showGlow={getIsEarned(selectedNft)}
                    />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {getIsEarned(selectedNft) ? (
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

                {/* Close Button */}
                <button 
                  onClick={() => setDialogOpen(false)}
                  className="absolute top-4 left-4 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* NFT Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <NFTBadge 
                    milestoneId={selectedNft.id} 
                    size="lg" 
                    isEarned={getIsEarned(selectedNft)}
                    color={selectedNft.color}
                    showGlow={getIsEarned(selectedNft)}
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{selectedNft.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedNft.description}
                    </p>
                  </div>
                </div>

                {/* Achievement Details */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Requirement</p>
                    <p className="font-semibold">
                      {selectedNft.threshold > 0 
                        ? `${selectedNft.threshold.toLocaleString()}` 
                        : 'Welcome NFT'}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Rarity</p>
                    <p className="font-semibold capitalize">
                      {selectedNft.threshold === 0 ? 'Common' :
                       selectedNft.threshold <= 100 ? 'Uncommon' :
                       selectedNft.threshold <= 1000 ? 'Rare' :
                       selectedNft.threshold <= 10000 ? 'Epic' : 'Legendary'}
                    </p>
                  </div>
                </div>

                {/* Mint Status */}
                {getIsEarned(selectedNft) && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                    <Sparkles className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium">Ready to Mint</p>
                    <p className="text-xs text-muted-foreground">
                      This NFT can be minted to your connected wallet
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Page Header */}
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

        <AnimatePresence mode="wait">
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
                {COMBO_MILESTONES.map((milestone) => (
                  <ComboMilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    isEarned={comboEarnedIds.has(milestone.id)}
                    onViewArtwork={handleViewArtwork}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </AnimatePresence>
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
