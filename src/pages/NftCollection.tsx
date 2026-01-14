import { useState } from 'react';
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
  X
} from 'lucide-react';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  COMBO_MILESTONES,
  NFT_CATEGORIES,
  calculateEarnedMilestones,
  getNextMilestone,
  calculateComboAchievements,
  type NFTMilestone,
} from '@/lib/nftMilestones';
import { NFTBadge } from '@/components/ui/nft-badge';
import { getNftArtwork } from '@/lib/nftArtwork';

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
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
        isEarned 
          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 shadow-lg shadow-primary/10' 
          : isNext
          ? 'bg-accent/5 border-accent/30 ring-2 ring-accent/20'
          : 'bg-muted/30 border-border/50 opacity-70'
      }`}
    >
      {/* NFT Artwork */}
      {artwork && (
        <div 
          className={`relative w-full aspect-square cursor-pointer group ${!isEarned && 'grayscale opacity-60'}`}
          onClick={() => onViewArtwork(milestone)}
        >
          <img 
            src={artwork} 
            alt={milestone.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
              View NFT
            </span>
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
  isEarned 
}: { 
  milestone: NFTMilestone; 
  isEarned: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`relative rounded-xl border p-4 transition-all duration-300 ${
        isEarned 
          ? `${milestone.color} border-transparent shadow-xl text-white` 
          : 'bg-muted/30 border-border/50 opacity-60'
      }`}
    >
      <div className="flex items-center gap-3">
        <NFTBadge 
          milestoneId={milestone.id} 
          size="md" 
          isEarned={isEarned}
          color={isEarned ? 'bg-white/20' : 'bg-muted'}
          showGlow={false}
        />
        <div className="flex-1">
          <h3 className={`font-semibold text-sm ${isEarned ? 'text-white' : 'text-muted-foreground'}`}>
            {milestone.name}
          </h3>
          <p className={`text-xs ${isEarned ? 'text-white/80' : 'text-muted-foreground'}`}>
            {milestone.description}
          </p>
        </div>
        {isEarned ? (
          <CheckCircle2 className="h-5 w-5 text-white" />
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground/50" />
        )}
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
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  milestones: NFTMilestone[];
  earnedMilestones: NFTMilestone[];
  currentValue: number;
  unit: string;
  accentColor: string;
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
          />
        ))}
      </div>
    </div>
  );
}

export default function NftCollection() {
  const { activityData, isLoading } = useDashboardData();

  // Calculate all earned milestones
  const solarKwh = activityData.solarEnergyProduced;
  const evMiles = activityData.evMilesDriven;
  const evChargingKwh = activityData.teslaSuperchargerKwh + activityData.homeChargerKwh;
  const batteryKwh = activityData.batteryStorageDischarged;

  const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES, true);
  const evMilesEarned = calculateEarnedMilestones(evMiles, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(batteryKwh, BATTERY_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);

  // Total stats
  const totalEarned = solarEarned.length + evMilesEarned.length + evChargingEarned.length + batteryEarned.length + comboEarned.length;
  const totalAvailable = SOLAR_MILESTONES.length + EV_MILES_MILESTONES.length + EV_CHARGING_MILESTONES.length + BATTERY_MILESTONES.length + COMBO_MILESTONES.length;

  const comboEarnedIds = new Set(comboEarned.map(m => m.id));

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Award className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">NFT Collection</h1>
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
              <div className="grid grid-cols-1 gap-3">
                {COMBO_MILESTONES.map((milestone) => (
                  <ComboMilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    isEarned={comboEarnedIds.has(milestone.id)}
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
