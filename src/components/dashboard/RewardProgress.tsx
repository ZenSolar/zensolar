import { useState, useMemo } from 'react';
import { Award, ChevronRight, Sun, Car, Battery, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  calculateEarnedMilestones,
  calculateComboAchievements,
  getNextMilestone,
  getCategoryDisplayName,
  type PriorityMilestone,
} from '@/lib/nftMilestones';
import { getNftArtwork } from '@/lib/nftArtwork';

interface RewardProgressProps {
  tokensEarned: number;
  solarKwh: number;
  evMilesDriven: number;
  evChargingKwh: number;
  batteryDischargedKwh: number;
  nftsEarned: string[];
  lifetimeMinted?: number;
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

const categoryOrder = ['solar', 'battery', 'ev_miles', 'charging'] as const;
type CategoryType = typeof categoryOrder[number];

interface CategoryDotProps {
  icon: React.ElementType;
  label: string;
  count: number;
  total: number;
  color: CategoryType;
  isActive?: boolean;
  onClick?: () => void;
}

function CategoryDot({ icon: Icon, label, count, total, color, isActive, onClick }: CategoryDotProps) {
  const styles = categoryStyles[color];
  
  return (
    <motion.button 
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-full",
        isActive 
          ? cn("bg-gradient-to-br", styles.gradient, "shadow-lg", styles.glow)
          : "bg-muted/50 hover:bg-muted"
      )}
    >
      <span className={cn(
        "text-[9px] font-medium uppercase tracking-wide leading-none",
        isActive ? "text-white/90" : "text-muted-foreground"
      )}>
        {label}
      </span>
      <Icon className={cn("h-4 w-4", isActive ? "text-white" : styles.text)} />
      <span className={cn(
        "text-xs font-bold tabular-nums",
        isActive ? "text-white" : "text-foreground"
      )}>
        {count}/{total}
      </span>
    </motion.button>
  );
}

// Get milestone for a specific category
function getMilestoneForCategory(
  category: CategoryType,
  values: { solar: number; battery: number; evMiles: number; charging: number }
): PriorityMilestone | null {
  const milestoneMap = {
    solar: { milestones: SOLAR_MILESTONES, value: values.solar, unit: 'kWh' },
    battery: { milestones: BATTERY_MILESTONES, value: values.battery, unit: 'kWh' },
    ev_miles: { milestones: EV_MILES_MILESTONES, value: values.evMiles, unit: 'miles' },
    charging: { milestones: EV_CHARGING_MILESTONES, value: values.charging, unit: 'kWh' },
  };
  
  const config = milestoneMap[category];
  const next = getNextMilestone(config.value, config.milestones);
  
  if (next) {
    return { ...next, category, currentValue: config.value, unit: config.unit };
  }
  
  // If category is complete, show the last earned milestone
  const earned = calculateEarnedMilestones(config.value, config.milestones);
  if (earned.length > 0) {
    const last = earned[earned.length - 1];
    return { ...last, category, currentValue: config.value, unit: config.unit };
  }
  
  // No milestones at all - show the first one
  const first = config.milestones[0];
  return { ...first, category, currentValue: config.value, unit: config.unit };
}

export function RewardProgress({ 
  solarKwh, 
  evMilesDriven,
  evChargingKwh,
  batteryDischargedKwh,
}: RewardProgressProps) {
  // Haptic feedback hook
  const { lightTap } = useHaptics();
  
  // State for selected category (null = auto priority)
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  
  // Calculate earned milestones for each category
  const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(batteryDischargedKwh, BATTERY_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(evMilesDriven, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  
  // Total NFTs earned (add 1 for welcome NFT)
  const totalEarned = 1 + solarEarned.length + batteryEarned.length + evMilesEarned.length + evChargingEarned.length + comboEarned.length;
  
  // Category values for milestone lookup
  const categoryValues = useMemo(() => ({
    solar: solarKwh,
    battery: batteryDischargedKwh,
    evMiles: evMilesDriven,
    charging: evChargingKwh,
  }), [solarKwh, batteryDischargedKwh, evMilesDriven, evChargingKwh]);
  
  // Get display milestone based on selected category or auto-priority
  const displayMilestone = useMemo(() => {
    if (selectedCategory) {
      return getMilestoneForCategory(selectedCategory, categoryValues);
    }
    // Default priority: Solar → Battery → EV Miles → Charging
    for (const cat of categoryOrder) {
      const milestone = getMilestoneForCategory(cat, categoryValues);
      if (milestone && milestone.currentValue < milestone.threshold) {
        return milestone;
      }
    }
    // All complete - show first category
    return getMilestoneForCategory('solar', categoryValues);
  }, [selectedCategory, categoryValues]);
  
  // Cycle through categories on tap
  const handleCycleCategory = () => {
    lightTap(); // Haptic feedback
    const currentCat = selectedCategory || displayMilestone?.category || 'solar';
    const currentIndex = categoryOrder.indexOf(currentCat as CategoryType);
    const nextIndex = (currentIndex + 1) % categoryOrder.length;
    setSelectedCategory(categoryOrder[nextIndex]);
  };
  
  // Select specific category on dot tap
  const handleSelectCategory = (category: CategoryType) => {
    lightTap(); // Haptic feedback
    setSelectedCategory(category);
  };
  
  // Get artwork for displayed milestone
  const artwork = displayMilestone ? getNftArtwork(displayMilestone.id) : null;
  
  // Calculate progress percentage
  const progressPercent = displayMilestone 
    ? Math.min((displayMilestone.currentValue / displayMilestone.threshold) * 100, 100)
    : 100;
  
  // Get styles for current category
  const currentStyles = displayMilestone ? categoryStyles[displayMilestone.category] : categoryStyles.solar;
  const CurrentIcon = displayMilestone ? categoryIcons[displayMilestone.category] : Sun;

  // Check if current milestone is complete
  const isCurrentComplete = displayMilestone && displayMilestone.currentValue >= displayMilestone.threshold;
  
  // Check if all categories are complete
  const allCategoriesComplete = categoryOrder.every(cat => {
    const milestone = getMilestoneForCategory(cat, categoryValues);
    return milestone && milestone.currentValue >= milestone.threshold;
  });

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header: Title + Earned Badge */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">zensolar NFTs</h3>
          <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
            <Award className="h-3.5 w-3.5" />
            <span className="font-semibold">{totalEarned} Earned</span>
          </Badge>
        </div>
        
        {/* Hero NFT Image - Tap to Cycle */}
        {allCategoriesComplete ? (
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
            onClick={handleCycleCategory}
            whileTap={{ scale: 0.98 }}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted group cursor-pointer"
          >
            <AnimatePresence mode="wait">
              {artwork && (
                <motion.img
                  key={displayMilestone?.id}
                  src={artwork} 
                  alt={displayMilestone?.name || 'Next NFT'}
                  className="object-cover w-full h-full"
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              )}
            </AnimatePresence>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Tap indicator */}
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white/70 text-[10px] font-medium uppercase tracking-wide">
              Tap to Browse
            </div>
            
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
                  {getCategoryDisplayName(displayMilestone?.category || 'solar')} · {isCurrentComplete ? 'Earned' : 'Next Unlock'}
                </span>
              </div>
              <p className="text-xl font-bold text-white">{displayMilestone?.name}</p>
            </div>
            
            {/* Glow effect on hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
              "bg-gradient-to-t from-transparent via-transparent to-white/5"
            )} />
          </motion.div>
        )}
        
        {/* Progress Section */}
        {displayMilestone && !allCategoriesComplete && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isCurrentComplete ? 'Completed' : `Progress to ${displayMilestone.name}`}
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {Math.floor(displayMilestone.currentValue).toLocaleString()} / {displayMilestone.threshold.toLocaleString()} {displayMilestone.unit}
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
        
        {/* Category Summary Dots with Labels */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border/50">
          <CategoryDot 
            icon={Sun} 
            label="Solar"
            count={solarEarned.length} 
            total={SOLAR_MILESTONES.length} 
            color="solar"
            isActive={displayMilestone?.category === 'solar'}
            onClick={() => handleSelectCategory('solar')}
          />
          <CategoryDot 
            icon={Battery}
            label="Battery" 
            count={batteryEarned.length} 
            total={BATTERY_MILESTONES.length} 
            color="battery"
            isActive={displayMilestone?.category === 'battery'}
            onClick={() => handleSelectCategory('battery')}
          />
          <CategoryDot 
            icon={Car}
            label="EV Miles" 
            count={evMilesEarned.length} 
            total={EV_MILES_MILESTONES.length} 
            color="ev_miles"
            isActive={displayMilestone?.category === 'ev_miles'}
            onClick={() => handleSelectCategory('ev_miles')}
          />
          <CategoryDot 
            icon={Zap}
            label="Charging" 
            count={evChargingEarned.length} 
            total={EV_CHARGING_MILESTONES.length} 
            color="charging"
            isActive={displayMilestone?.category === 'charging'}
            onClick={() => handleSelectCategory('charging')}
          />
        </div>
        
        {/* Footer: View Collection */}
        <div className="pt-3 border-t border-border/50">
          <Link 
            to="/nft-collection" 
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Award className="h-4 w-4 text-primary" />
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">View Collection</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
