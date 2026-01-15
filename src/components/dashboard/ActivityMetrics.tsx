import { ActivityData } from '@/types/dashboard';
import { MetricCard } from './MetricCard';
import { 
  Sun, 
  Car, 
  Battery, 
  Zap, 
  Coins, 
  Award,
  Leaf,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  calculateEarnedMilestones,
  calculateComboAchievements,
  SOLAR_MILESTONES,
  BATTERY_MILESTONES,
  EV_CHARGING_MILESTONES,
  EV_MILES_MILESTONES,
  WELCOME_MILESTONE,
  type NFTMilestone
} from '@/lib/nftMilestones';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityMetricsProps {
  data: ActivityData;
}

// Category icon mapping
const getCategoryIcon = (id: string) => {
  if (id === 'welcome') return '🌟';
  if (id.startsWith('solar')) return '☀️';
  if (id.startsWith('battery')) return '🔋';
  if (id.startsWith('charge')) return '⚡';
  if (id.startsWith('ev')) return '🚗';
  if (id.startsWith('combo')) return '🏆';
  return '🎯';
};

interface NFTEarnedBadgeProps {
  milestone: NFTMilestone;
  className?: string;
}

function NFTEarnedBadge({ milestone, className }: NFTEarnedBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className={cn(
        "text-xs whitespace-nowrap gap-1 px-2 py-1",
        milestone.color.includes('gradient') 
          ? `${milestone.color} text-white border-0`
          : `${milestone.color} text-white border-0`,
        className
      )}
    >
      <span>{getCategoryIcon(milestone.id)}</span>
      <span>{milestone.name}</span>
    </Badge>
  );
}

export function ActivityMetrics({ data }: ActivityMetricsProps) {
  const [showAllNfts, setShowAllNfts] = useState(false);
  const labels = data.deviceLabels || {};
  
  // Build dynamic labels based on device names
  const evLabel = labels.vehicle 
    ? `${labels.vehicle} Miles Driven` 
    : 'EV Miles Driven';
  
  const batteryLabel = labels.powerwall 
    ? `${labels.powerwall} Discharged kWh` 
    : 'Battery Storage Discharged';
  
  const homeChargerLabel = labels.homeCharger 
    ? `${labels.homeCharger} kWh` 
    : labels.wallConnector
      ? `${labels.wallConnector} kWh`
      : 'Home Charger kWh';

  // Build solar label from Enphase system name or default
  const solarLabel = labels.solar 
    ? `${labels.solar} Solar Energy Produced` 
    : 'Solar Energy Produced';

  // Calculate earned NFTs locally using actual energy data
  const solarEarned = calculateEarnedMilestones(data.solarEnergyProduced, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(data.batteryStorageDischarged, BATTERY_MILESTONES);
  const chargingKwh = data.teslaSuperchargerKwh + data.homeChargerKwh;
  const chargingEarned = calculateEarnedMilestones(chargingKwh, EV_CHARGING_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(data.evMilesDriven, EV_MILES_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, chargingEarned, batteryEarned);
  
  // Build complete list of earned NFTs with Welcome NFT first
  const allEarnedNfts: NFTMilestone[] = [
    WELCOME_MILESTONE, // Always show welcome NFT for registered users
    ...solarEarned,
    ...evMilesEarned,
    ...chargingEarned,
    ...batteryEarned,
    ...comboEarned,
  ];

  const totalNftCount = allEarnedNfts.length;
  const previewCount = 4; // Show first N NFTs before expanding
  const hasMore = totalNftCount > previewCount;
  const displayedNfts = showAllNfts ? allEarnedNfts : allEarnedNfts.slice(0, previewCount);

  return (
    <div className="space-y-6">
      {/* Rewards Section - Tokens & NFTs */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Rewards</h2>
        
        <div className="grid gap-3">
          <MetricCard
            icon={Coins}
            label="Tokens Earned"
            value={data.tokensEarned}
            unit="$ZSOLAR"
            colorClass="bg-token"
          />
          
          <MetricCard
            icon={Users}
            label="Referral Tokens"
            value={data.referralTokens}
            unit="$ZSOLAR"
            colorClass="bg-accent"
          />
          
          {/* Enhanced NFTs Earned Display */}
          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary">
                  <Award className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-medium text-sm">NFTs Earned</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {totalNftCount} Total
              </Badge>
            </div>
            
            {/* NFT Badges Grid */}
            <div className="space-y-2">
              <AnimatePresence mode="sync">
                <motion.div 
                  className="flex flex-wrap gap-1.5"
                  layout
                >
                  {displayedNfts.map((nft, index) => (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <NFTEarnedBadge milestone={nft} />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
              
              {/* Show More/Less Button */}
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAllNfts(!showAllNfts)}
                >
                  {showAllNfts ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show {totalNftCount - previewCount} More
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Category Summary */}
            <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
              {solarEarned.length > 0 && (
                <span>☀️ {solarEarned.length} Solar</span>
              )}
              {evMilesEarned.length > 0 && (
                <span>🚗 {evMilesEarned.length} EV</span>
              )}
              {chargingEarned.length > 0 && (
                <span>⚡ {chargingEarned.length} Charging</span>
              )}
              {batteryEarned.length > 0 && (
                <span>🔋 {batteryEarned.length} Battery</span>
              )}
              {comboEarned.length > 0 && (
                <span>🏆 {comboEarned.length} Combo</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground uppercase tracking-wider">
            Energy Activity
          </span>
        </div>
      </div>

      {/* Energy Data Section - API Data */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Activity Data</h2>
        
        <div className="grid gap-3">
          <MetricCard
            icon={Sun}
            label={solarLabel}
            value={data.solarEnergyProduced}
            unit="kWh"
            colorClass="bg-solar"
          />
          
          <MetricCard
            icon={Car}
            label={evLabel}
            value={data.evMilesDriven}
            unit="miles"
            colorClass="bg-energy"
          />
          
          <MetricCard
            icon={Battery}
            label={batteryLabel}
            value={data.batteryStorageDischarged}
            unit="kWh"
            colorClass="bg-secondary"
          />
          
          <MetricCard
            icon={Zap}
            label="Tesla Supercharger kWh"
            value={data.teslaSuperchargerKwh}
            unit="kWh"
            colorClass="bg-accent"
          />
          
          <MetricCard
            icon={Zap}
            label={homeChargerLabel}
            value={data.homeChargerKwh}
            unit="kWh"
            colorClass="bg-secondary"
          />
          
          <MetricCard
            icon={Leaf}
            label="CO2 Offset"
            value={data.co2OffsetPounds}
            unit="lbs"
            colorClass="bg-eco"
          />
        </div>
      </div>
    </div>
  );
}
