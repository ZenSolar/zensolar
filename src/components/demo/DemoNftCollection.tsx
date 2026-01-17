import { useState, useEffect } from 'react';
import { useDemoData } from '@/hooks/useDemoData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrendingUp,
  Target,
  Crown,
  Star, 
  Loader2,
  Wallet,
  Eye,
  Gem,
  Flame,
  AlertCircle
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

// Rarity configuration
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

// Demo NFT Card with minting
function DemoNFTCard({ 
  milestone, 
  isEarned, 
  currentValue,
  unit,
  isNext,
  onMint,
  isMinted,
  isMinting
}: { 
  milestone: NFTMilestone; 
  isEarned: boolean;
  currentValue: number;
  unit: string;
  isNext: boolean;
  onMint: () => void;
  isMinted: boolean;
  isMinting: boolean;
}) {
  const progress = milestone.threshold > 0 
    ? Math.min((currentValue / milestone.threshold) * 100, 100)
    : 100;
  
  const artwork = getNftArtwork(milestone.id);
  const canMint = isEarned && !isMinted;
  const tier = getTierFromId(milestone.id);
  const rarity = getRarityFromTier(tier);
  const rarityConfig = RARITY_CONFIG[rarity];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
        isEarned 
          ? `bg-gradient-to-br ${rarityConfig.bg} ${rarityConfig.border} border-2 shadow-xl ${rarityConfig.glow}` 
          : isNext
          ? 'bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/40'
          : 'bg-card/50 border border-border/40 opacity-60'
      }`}
    >
      {/* NFT Artwork */}
      <div className={`relative w-full aspect-square overflow-hidden ${!isEarned && 'grayscale'}`}>
        {artwork && (
          <img 
            src={artwork} 
            alt={milestone.name}
            className="w-full h-full object-cover"
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
        {canMint && (
          <Button
            size="sm"
            className={`w-full gap-2 bg-gradient-to-r ${rarityConfig.gradient} hover:opacity-90 text-white border-0 shadow-lg`}
            onClick={onMint}
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

export function DemoNftCollection() {
  const { 
    activityData, 
    profile,
    mintedNFTs,
    hasWelcomeNFT,
    simulateMintMilestoneNFT,
    simulateMintWelcomeNFT,
    getEligibility
  } = useDemoData();
  
  const { triggerConfetti, triggerCelebration } = useConfetti();
  const [activeTab, setActiveTab] = useState('all');
  const [mintingId, setMintingId] = useState<string | null>(null);
  
  // Minting dialog state
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [mintingMilestone, setMintingMilestone] = useState<NFTMilestone | null>(null);
  const [mintProgress, setMintProgress] = useState<{
    step: 'confirm' | 'minting' | 'success' | 'error';
    message: string;
  }>({ step: 'confirm', message: '' });

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
  const earnedIds = new Set(allEarned.map(m => m.id));
  
  const totalEarned = (hasWelcomeNFT ? 1 : 0) + allEarned.length;
  const totalMinted = mintedNFTs.length;
  const totalAvailable = 1 + SOLAR_MILESTONES.length + EV_MILES_MILESTONES.length + 
    EV_CHARGING_MILESTONES.length + BATTERY_MILESTONES.length + COMBO_MILESTONES.length;

  // Get next milestones
  const nextSolar = getNextMilestone(solarKwh, SOLAR_MILESTONES);
  const nextEvMiles = getNextMilestone(evMiles, EV_MILES_MILESTONES);
  const nextEvCharging = getNextMilestone(evChargingKwh, EV_CHARGING_MILESTONES);
  const nextBattery = getNextMilestone(batteryKwh, BATTERY_MILESTONES);

  const handleMintClick = (milestone: NFTMilestone) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    setMintingMilestone(milestone);
    setMintProgress({ step: 'confirm', message: '' });
    setMintDialogOpen(true);
  };

  const handleConfirmMint = async () => {
    if (!mintingMilestone) return;
    
    const tokenId = MILESTONE_TO_TOKEN_ID[mintingMilestone.id];
    setMintProgress({ step: 'minting', message: '🔗 Connecting to Base Sepolia...' });
    setMintingId(mintingMilestone.id);

    // Simulate blockchain minting phases
    await new Promise(resolve => setTimeout(resolve, 800));
    setMintProgress({ step: 'minting', message: '⚡ Processing NFT mint to Blockchain...' });
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    setMintProgress({ step: 'minting', message: '🔐 Confirming transaction on-chain...' });

    try {
      const result = await simulateMintMilestoneNFT(tokenId ?? 0, mintingMilestone.name);
      
      if (result.success) {
        setMintProgress({ step: 'success', message: result.message });
        triggerConfetti();
      } else {
        setMintProgress({ step: 'error', message: 'Minting failed' });
      }
    } catch (error) {
      setMintProgress({ step: 'error', message: 'Transaction failed' });
    } finally {
      setMintingId(null);
    }
  };

  const handleMintWelcome = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setMintingMilestone(WELCOME_MILESTONE);
    setMintProgress({ step: 'confirm', message: '' });
    setMintDialogOpen(true);
  };

  const handleConfirmWelcomeMint = async () => {
    setMintProgress({ step: 'minting', message: '🔗 Connecting to Base Sepolia...' });
    setMintingId('welcome');

    await new Promise(resolve => setTimeout(resolve, 800));
    setMintProgress({ step: 'minting', message: '⚡ Processing NFT mint to Blockchain...' });
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    setMintProgress({ step: 'minting', message: '🔐 Confirming transaction on-chain...' });

    try {
      const result = await simulateMintWelcomeNFT();
      
      if (result.success) {
        setMintProgress({ step: 'success', message: result.message });
        if (!result.message.includes('already')) {
          triggerConfetti();
        }
      } else {
        setMintProgress({ step: 'error', message: 'Minting failed' });
      }
    } catch (error) {
      setMintProgress({ step: 'error', message: 'Transaction failed' });
    } finally {
      setMintingId(null);
    }
  };

  const renderCategory = (
    title: string,
    icon: React.ReactNode,
    milestones: NFTMilestone[],
    earned: NFTMilestone[],
    currentValue: number,
    unit: string,
    nextMilestone: NFTMilestone | null,
    gradient: string
  ) => {
    const earnedIds = new Set(earned.map(m => m.id));
    
    return (
      <div className="space-y-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {earned.length} / {milestones.length} earned
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{currentValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{unit}</p>
              </div>
            </div>
            
            {nextMilestone && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Next: <span className="font-medium text-foreground">{nextMilestone.name}</span>
                  </span>
                  <span className="text-muted-foreground">
                    {((currentValue / nextMilestone.threshold) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress value={Math.min((currentValue / nextMilestone.threshold) * 100, 100)} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((milestone) => {
            const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
            const isMinted = tokenId !== undefined && mintedNFTs.includes(tokenId);
            
            return (
              <DemoNFTCard
                key={milestone.id}
                milestone={milestone}
                isEarned={earnedIds.has(milestone.id)}
                currentValue={currentValue}
                unit={unit}
                isNext={nextMilestone?.id === milestone.id}
                onMint={() => handleMintClick(milestone)}
                isMinted={isMinted}
                isMinting={mintingId === milestone.id}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Demo Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
        <p className="text-sm text-primary font-medium">
          🎮 Demo Mode: Test minting NFTs based on your simulated activity data
        </p>
      </div>

      {/* Header Stats */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">NFT Collection</h1>
                <p className="text-muted-foreground">
                  {totalEarned} earned · {totalMinted} minted · {totalAvailable} total
                </p>
              </div>
            </div>
            
            {!walletAddress && (
              <Badge variant="outline" className="gap-2 py-2 px-4">
                <Wallet className="h-4 w-4" />
                Connect wallet to mint
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Welcome NFT Section */}
      <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-background">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-32 h-32 rounded-xl overflow-hidden shadow-xl flex-shrink-0">
              <img 
                src={getNftArtwork('welcome')} 
                alt="Welcome NFT" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                <Star className="h-5 w-5 text-amber-500" />
                Welcome NFT
              </h2>
              <p className="text-muted-foreground mt-1">
                Your first NFT as a ZenSolar member. Claim it to start your collection!
              </p>
              <div className="mt-4">
                {mintedNFTs.includes(0) ? (
                  <Badge className="bg-emerald-600 text-white gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Minted On-Chain
                  </Badge>
                ) : hasWelcomeNFT ? (
                  <Badge className="bg-primary text-primary-foreground gap-2">
                    <Sparkles className="h-4 w-4" />
                    Earned - Ready to Mint
                  </Badge>
                ) : (
                  <Button onClick={handleMintWelcome} disabled={!walletAddress} className="gap-2">
                    <Zap className="h-4 w-4" />
                    Claim Welcome NFT
                  </Button>
                )}
                
                {hasWelcomeNFT && !mintedNFTs.includes(0) && walletAddress && (
                  <Button 
                    onClick={handleMintWelcome} 
                    className="mt-2 gap-2 bg-gradient-to-r from-amber-500 to-orange-500"
                    disabled={mintingId === 'welcome'}
                  >
                    {mintingId === 'welcome' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Mint to Wallet
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all" className="gap-1">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">All</span>
          </TabsTrigger>
          <TabsTrigger value="solar" className="gap-1">
            <Sun className="h-4 w-4" />
            <span className="hidden sm:inline">Solar</span>
          </TabsTrigger>
          <TabsTrigger value="ev" className="gap-1">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">EV</span>
          </TabsTrigger>
          <TabsTrigger value="battery" className="gap-1">
            <Battery className="h-4 w-4" />
            <span className="hidden sm:inline">Battery</span>
          </TabsTrigger>
          <TabsTrigger value="combo" className="gap-1">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Combo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-8">
          {renderCategory('Solar Production', <Sun className="h-5 w-5 text-white" />, SOLAR_MILESTONES, solarEarned, solarKwh, 'kWh', nextSolar, 'from-amber-500 to-orange-500')}
          {renderCategory('EV Miles Driven', <Car className="h-5 w-5 text-white" />, EV_MILES_MILESTONES, evMilesEarned, evMiles, 'miles', nextEvMiles, 'from-blue-500 to-indigo-500')}
          {renderCategory('EV Charging', <Zap className="h-5 w-5 text-white" />, EV_CHARGING_MILESTONES, evChargingEarned, evChargingKwh, 'kWh', nextEvCharging, 'from-purple-500 to-pink-500')}
          {renderCategory('Battery Discharge', <Battery className="h-5 w-5 text-white" />, BATTERY_MILESTONES, batteryEarned, batteryKwh, 'kWh', nextBattery, 'from-green-500 to-emerald-500')}
        </TabsContent>

        <TabsContent value="solar" className="mt-6">
          {renderCategory('Solar Production', <Sun className="h-5 w-5 text-white" />, SOLAR_MILESTONES, solarEarned, solarKwh, 'kWh', nextSolar, 'from-amber-500 to-orange-500')}
        </TabsContent>

        <TabsContent value="ev" className="mt-6 space-y-8">
          {renderCategory('EV Miles Driven', <Car className="h-5 w-5 text-white" />, EV_MILES_MILESTONES, evMilesEarned, evMiles, 'miles', nextEvMiles, 'from-blue-500 to-indigo-500')}
          {renderCategory('EV Charging', <Zap className="h-5 w-5 text-white" />, EV_CHARGING_MILESTONES, evChargingEarned, evChargingKwh, 'kWh', nextEvCharging, 'from-purple-500 to-pink-500')}
        </TabsContent>

        <TabsContent value="battery" className="mt-6">
          {renderCategory('Battery Discharge', <Battery className="h-5 w-5 text-white" />, BATTERY_MILESTONES, batteryEarned, batteryKwh, 'kWh', nextBattery, 'from-green-500 to-emerald-500')}
        </TabsContent>

        <TabsContent value="combo" className="mt-6">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Combo Achievements</h3>
                    <p className="text-sm text-muted-foreground">
                      {comboEarned.length} / {COMBO_MILESTONES.length} earned
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COMBO_MILESTONES.map((milestone) => {
                const tokenId = MILESTONE_TO_TOKEN_ID[milestone.id];
                const isEarned = comboEarned.some(m => m.id === milestone.id);
                const isMinted = tokenId !== undefined && mintedNFTs.includes(tokenId);
                const artwork = getNftArtwork(milestone.id);
                const tier = getTierFromId(milestone.id);
                const rarity = getRarityFromTier(tier, true);
                const rarityConfig = RARITY_CONFIG[rarity];
                
                return (
                  <motion.div
                    key={milestone.id}
                    className={`relative rounded-xl overflow-hidden ${
                      isEarned 
                        ? `${rarityConfig.border} border-2 shadow-xl` 
                        : 'border border-border/50 opacity-50'
                    }`}
                  >
                    <div className={`relative w-full aspect-[2.5/1] overflow-hidden ${!isEarned && 'grayscale'}`}>
                      {artwork && (
                        <img src={artwork} alt={milestone.name} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      
                      <div className="absolute top-3 left-3">
                        <Badge className={`bg-gradient-to-r ${rarityConfig.gradient} text-white border-0`}>
                          <Crown className="h-3 w-3 mr-1" />
                          {rarityConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        {isMinted ? (
                          <Badge className="bg-emerald-600 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Minted
                          </Badge>
                        ) : isEarned ? (
                          <Badge className="bg-primary text-primary-foreground">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Earned
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Lock className="h-3 w-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-end justify-between">
                          <div>
                            <h3 className="font-bold text-white text-lg">{milestone.name}</h3>
                            <p className="text-xs text-white/80">{milestone.description}</p>
                          </div>
                          {isEarned && !isMinted && (
                            <Button
                              size="sm"
                              className={`gap-2 bg-gradient-to-r ${rarityConfig.gradient}`}
                              onClick={() => handleMintClick(milestone)}
                              disabled={mintingId === milestone.id}
                            >
                              {mintingId === milestone.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Zap className="h-3 w-3" />
                              )}
                              Mint
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mint Dialog */}
      <Dialog open={mintDialogOpen} onOpenChange={setMintDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <AnimatePresence mode="wait">
            {mintProgress.step === 'confirm' && mintingMilestone && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DialogHeader>
                  <DialogTitle>Mint NFT</DialogTitle>
                  <DialogDescription>
                    You're about to mint {mintingMilestone.name} to your wallet
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex items-center gap-4 my-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden">
                    <img 
                      src={getNftArtwork(mintingMilestone.id)} 
                      alt={mintingMilestone.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold">{mintingMilestone.name}</h3>
                    <p className="text-sm text-muted-foreground">{mintingMilestone.description}</p>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setMintDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={mintingMilestone.id === 'welcome' ? handleConfirmWelcomeMint : handleConfirmMint}
                    className="gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Mint Now
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {mintProgress.step === 'minting' && (
              <motion.div
                key="minting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="h-14 w-14 animate-spin text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg">Minting to Blockchain...</h3>
                  <p className="text-center text-base font-medium">{mintProgress.message}</p>
                  <p className="text-xs text-muted-foreground text-center">
                    Securing your NFT on Base Sepolia testnet
                  </p>
                  <Progress value={60} className="h-3 w-full max-w-xs" />
                </div>
              </motion.div>
            )}

            {mintProgress.step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8"
              >
                <div className="flex flex-col items-center gap-4">
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                  <h3 className="font-bold text-lg">NFT Minted Successfully!</h3>
                  <p className="text-center text-muted-foreground">{mintProgress.message}</p>
                  <Button onClick={() => setMintDialogOpen(false)} className="mt-4">
                    Close
                  </Button>
                </div>
              </motion.div>
            )}

            {mintProgress.step === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8"
              >
                <div className="flex flex-col items-center gap-4">
                  <AlertCircle className="h-16 w-16 text-destructive" />
                  <h3 className="font-bold text-lg">Minting Failed</h3>
                  <p className="text-center text-muted-foreground">{mintProgress.message}</p>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" onClick={() => setMintDialogOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={() => setMintProgress({ step: 'confirm', message: '' })}>
                      Retry
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
