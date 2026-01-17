import { Award, TrendingUp, Sparkles, ChevronRight, Trophy, Zap, Car, Battery, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  COMBO_MILESTONES,
  calculateEarnedMilestones,
  getNextMilestone,
  calculateComboAchievements,
  type NFTMilestone,
} from '@/lib/nftMilestones';
import { NFTBadge, NFTBadgeInline } from '@/components/ui/nft-badge';

interface RewardProgressProps {
  tokensEarned: number;
  solarKwh: number;
  evMilesDriven: number;
  evChargingKwh: number;
  batteryDischargedKwh: number;
  nftsEarned: string[];
  isNewUser?: boolean;
}

interface CategoryProgressProps {
  title: string;
  icon: React.ReactNode;
  value: number;
  unit: string;
  milestones: NFTMilestone[];
  earnedMilestones: NFTMilestone[];
  nextMilestone: NFTMilestone | null;
  accentColor: string;
}

function CategoryProgress({ 
  title, 
  icon, 
  value, 
  unit, 
  milestones, 
  earnedMilestones, 
  nextMilestone,
  accentColor
}: CategoryProgressProps) {
  const progress = nextMilestone
    ? (value / nextMilestone.threshold) * 100
    : 100;
  
  const remaining = nextMilestone
    ? nextMilestone.threshold - value
    : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${accentColor}`}>
            {icon}
          </div>
          <span className="font-medium text-sm">{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {earnedMilestones.length}/{milestones.length} earned
        </span>
      </div>

      {/* Earned NFTs */}
      {earnedMilestones.length > 0 && (
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {earnedMilestones.map((milestone) => (
              <motion.div
                key={milestone.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <NFTBadgeInline
                  milestoneId={milestone.id}
                  name={milestone.name}
                  color={milestone.color}
                  isEarned={true}
                />
              </motion.div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Next milestone progress */}
      {nextMilestone ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              Next: <NFTBadge milestoneId={nextMilestone.id} size="sm" color={nextMilestone.color} /> <strong className="text-foreground">{nextMilestone.name}</strong>
            </span>
            <span className="text-muted-foreground tabular-nums">
              {value.toLocaleString()} / {nextMilestone.threshold.toLocaleString()} {unit}
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-2" />
          <p className="text-[10px] text-muted-foreground">
            {remaining.toLocaleString()} more {unit} to unlock
          </p>
        </div>
      ) : earnedMilestones.length === milestones.length ? (
        <div className="text-center py-2">
          <span className="text-xs text-primary font-medium">🎉 Category Complete!</span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Start tracking to earn NFTs</p>
      )}
    </div>
  );
}

function ComboAchievements({ combos }: { combos: NFTMilestone[] }) {
  if (combos.length === 0) return null;
  
  return (
    <div className="space-y-3 pt-3 border-t border-border/50">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-accent" />
        <span className="font-medium text-sm">Combo Achievements</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {combos.map((combo) => (
          <motion.div
            key={combo.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <NFTBadgeInline
              milestoneId={combo.id}
              name={combo.name}
              color={combo.color}
              isEarned={true}
              className="shadow-lg"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function RewardProgress({ 
  tokensEarned, 
  solarKwh, 
  evMilesDriven,
  evChargingKwh,
  batteryDischargedKwh,
  nftsEarned, 
  isNewUser = true
}: RewardProgressProps) {
  // Calculate earned milestones for each category
  const solarEarned = calculateEarnedMilestones(solarKwh, SOLAR_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(evMilesDriven, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(evChargingKwh, EV_CHARGING_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(batteryDischargedKwh, BATTERY_MILESTONES);
  
  // Calculate combo achievements
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  
  // Get next milestones
  const solarNext = getNextMilestone(solarKwh, SOLAR_MILESTONES);
  const evMilesNext = getNextMilestone(evMilesDriven, EV_MILES_MILESTONES);
  const evChargingNext = getNextMilestone(evChargingKwh, EV_CHARGING_MILESTONES);
  const batteryNext = getNextMilestone(batteryDischargedKwh, BATTERY_MILESTONES);
  
  // Total NFTs earned (add 1 for welcome NFT)
  const totalEarned = 1 + solarEarned.length + evMilesEarned.length + evChargingEarned.length + batteryEarned.length + comboEarned.length;

  return (
    <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent" />
            <CardTitle className="text-base font-semibold">
              NFT Milestones
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <Award className="h-3 w-3" />
              {totalEarned} Earned
            </Badge>
            <Badge variant="secondary" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Beta
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="solar" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="solar" className="text-xs px-2 py-1.5 gap-1 data-[state=active]:bg-solar/15">
              <Sun className="h-3 w-3" />
              <span className="hidden sm:inline">Solar</span>
            </TabsTrigger>
            <TabsTrigger value="ev_miles" className="text-xs px-2 py-1.5 gap-1 data-[state=active]:bg-energy/15">
              <Car className="h-3 w-3" />
              <span className="hidden sm:inline">EV Miles</span>
            </TabsTrigger>
            <TabsTrigger value="charging" className="text-xs px-2 py-1.5 gap-1 data-[state=active]:bg-accent/15">
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">Charging</span>
            </TabsTrigger>
            <TabsTrigger value="battery" className="text-xs px-2 py-1.5 gap-1 data-[state=active]:bg-secondary/15">
              <Battery className="h-3 w-3" />
              <span className="hidden sm:inline">Battery</span>
            </TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <TabsContent value="solar" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
              <CategoryProgress
                  title="Solar Production"
                  icon={<Sun className="h-3.5 w-3.5 text-solar-foreground" />}
                  value={Math.floor(solarKwh)}
                  unit="kWh"
                  milestones={SOLAR_MILESTONES}
                  earnedMilestones={solarEarned}
                  nextMilestone={solarNext}
                  accentColor="bg-solar"
                />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="ev_miles" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
              <CategoryProgress
                  title="EV Miles Driven"
                  icon={<Car className="h-3.5 w-3.5 text-energy-foreground" />}
                  value={Math.floor(evMilesDriven)}
                  unit="miles"
                  milestones={EV_MILES_MILESTONES}
                  earnedMilestones={evMilesEarned}
                  nextMilestone={evMilesNext}
                  accentColor="bg-energy"
                />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="charging" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
              <CategoryProgress
                  title="EV Charging"
                  icon={<Zap className="h-3.5 w-3.5 text-accent-foreground" />}
                  value={Math.floor(evChargingKwh)}
                  unit="kWh"
                  milestones={EV_CHARGING_MILESTONES}
                  earnedMilestones={evChargingEarned}
                  nextMilestone={evChargingNext}
                  accentColor="bg-accent"
                />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="battery" className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
              <CategoryProgress
                  title="Battery Discharge"
                  icon={<Battery className="h-3.5 w-3.5 text-secondary-foreground" />}
                  value={Math.floor(batteryDischargedKwh)}
                  unit="kWh"
                  milestones={BATTERY_MILESTONES}
                  earnedMilestones={batteryEarned}
                  nextMilestone={batteryNext}
                  accentColor="bg-secondary"
                />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
        
        {/* Combo Achievements */}
        <ComboAchievements combos={comboEarned} />

        {/* View Full Collection Link */}
        <div className="pt-2 flex flex-col items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/nft-collection">
              <Award className="h-4 w-4" />
              View Full Collection
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-[10px] text-muted-foreground/60 text-center">
            Earn NFTs across categories to unlock combo achievements! 🎯
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
