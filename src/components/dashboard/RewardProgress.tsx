import { Award, ChevronRight, Sun, Car, Battery, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  calculateEarnedMilestones,
  calculateComboAchievements,
  getNextPriorityMilestone,
  getCategoryDisplayName,
} from '@/lib/nftMilestones';
import { getNftArtwork } from '@/lib/nftArtwork';

interface RewardProgressProps {
  tokensEarned: number;
  solarKwh: number;
  evMilesDriven: number;
  evChargingKwh: number;
  batteryDischargedKwh: number;
  nftsEarned: string[];
  isNewUser?: boolean;
}

// Color styles matching landing page gradients
const categoryStyles = {
  solar: {
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    glow: 'shadow-amber-500/30',
  },
  battery: {
    gradient: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    glow: 'shadow-emerald-500/30',
  },
  ev_miles: {
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    glow: 'shadow-blue-500/30',
  },
  charging: {
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    glow: 'shadow-purple-500/30',
  },
};

const categoryIcons = {
  solar: Sun,
  battery: Battery,
  ev_miles: Car,
  charging: Zap,
};

interface CategoryDotProps {
  icon: React.ElementType;
  count: number;
  total: number;
  color: 'solar' | 'battery' | 'ev_miles' | 'charging';
  isActive?: boolean;
}

function CategoryDot({ icon: Icon, count, total, color, isActive }: CategoryDotProps) {
  const styles = categoryStyles[color];
  
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all",
        isActive 
          ? cn("bg-gradient-to-br", styles.gradient, "shadow-lg", styles.glow)
          : "bg-muted/50 hover:bg-muted"
      )}
    >
      <Icon className={cn("h-4 w-4", isActive ? "text-white" : styles.text)} />
      <span className={cn(
        "text-xs font-bold tabular-nums",
        isActive ? "text-white" : "text-foreground"
      )}>
        {count}/{total}
      </span>
    </motion.div>
  );
}

export function RewardProgress({ 
  solarKwh, 
  evMilesDriven,
  evChargingKwh,
  batteryDischargedKwh,
}: RewardProgressProps) {
  // Calculate earned milestones for each category
  const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(batteryDischargedKwh, BATTERY_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(evMilesDriven, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  
  // Total NFTs earned (add 1 for welcome NFT)
  const totalEarned = 1 + solarEarned.length + batteryEarned.length + evMilesEarned.length + evChargingEarned.length + comboEarned.length;
  
  // Get next priority milestone
  const nextMilestone = getNextPriorityMilestone(solarKwh, batteryDischargedKwh, evMilesDriven, evChargingKwh);
  
  // Get artwork for next milestone
  const artwork = nextMilestone ? getNftArtwork(nextMilestone.id) : null;
  
  // Calculate progress percentage
  const progressPercent = nextMilestone 
    ? Math.min((nextMilestone.currentValue / nextMilestone.threshold) * 100, 100)
    : 100;
  
  // Get styles for current category
  const currentStyles = nextMilestone ? categoryStyles[nextMilestone.category] : categoryStyles.solar;
  const CurrentIcon = nextMilestone ? categoryIcons[nextMilestone.category] : Sun;

  // Check if all categories are complete
  const isComplete = !nextMilestone;

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header: Badge + View All */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
            <Award className="h-3.5 w-3.5" />
            <span className="font-semibold">{totalEarned} Earned</span>
          </Badge>
          <Link 
            to="/nft-collection" 
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span>View All</span>
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
        
        {/* Hero NFT Image */}
        {isComplete ? (
          // Collection Complete State
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex flex-col items-center justify-center gap-3"
          >
            <div className="p-4 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">Collection Complete!</p>
              <p className="text-sm text-muted-foreground">All milestones achieved 🎉</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted group cursor-pointer"
          >
            {artwork && (
              <img 
                src={artwork} 
                alt={nextMilestone?.name || 'Next NFT'}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* NFT Name overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn(
                  "p-1.5 rounded-lg bg-gradient-to-br shadow-lg",
                  currentStyles.gradient,
                  currentStyles.glow
                )}>
                  <CurrentIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
                  {getCategoryDisplayName(nextMilestone?.category || 'solar')} · Next Unlock
                </span>
              </div>
              <p className="text-xl font-bold text-white">{nextMilestone?.name}</p>
            </div>
            
            {/* Glow effect on hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
              "bg-gradient-to-t from-transparent via-transparent to-white/5"
            )} />
          </motion.div>
        )}
        
        {/* Progress Section */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress to {nextMilestone.name}</span>
              <span className="font-semibold text-foreground tabular-nums">
                {Math.floor(nextMilestone.currentValue).toLocaleString()} / {nextMilestone.threshold.toLocaleString()} {nextMilestone.unit}
              </span>
            </div>
            <div className="relative">
              <Progress value={progressPercent} className="h-2" />
              {/* Animated glow on progress */}
              <motion.div 
                className={cn(
                  "absolute top-0 left-0 h-2 rounded-full blur-sm",
                  `bg-gradient-to-r ${currentStyles.gradient}`
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
        
        {/* Category Summary Dots */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/50">
          <CategoryDot 
            icon={Sun} 
            count={solarEarned.length} 
            total={SOLAR_MILESTONES.length} 
            color="solar"
            isActive={nextMilestone?.category === 'solar'}
          />
          <CategoryDot 
            icon={Battery} 
            count={batteryEarned.length} 
            total={BATTERY_MILESTONES.length} 
            color="battery"
            isActive={nextMilestone?.category === 'battery'}
          />
          <CategoryDot 
            icon={Car} 
            count={evMilesEarned.length} 
            total={EV_MILES_MILESTONES.length} 
            color="ev_miles"
            isActive={nextMilestone?.category === 'ev_miles'}
          />
          <CategoryDot 
            icon={Zap} 
            count={evChargingEarned.length} 
            total={EV_CHARGING_MILESTONES.length} 
            color="charging"
            isActive={nextMilestone?.category === 'charging'}
          />
        </div>
      </CardContent>
    </Card>
  );
}
