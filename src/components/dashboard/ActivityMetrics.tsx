import type React from 'react';
import { ActivityData, calculateCO2Offset } from '@/types/dashboard';
import { getRewardMultiplier } from '@/lib/tokenomics';
import {
  Sun,
  Car,
  Battery,
  Zap,
  Coins,
  Award,
  ChevronRight,
  Sparkles,
  Gauge,
} from 'lucide-react';
import {
  calculateEarnedMilestones,
  calculateComboAchievements,
  SOLAR_MILESTONES,
  BATTERY_MILESTONES,
  EV_CHARGING_MILESTONES,
  EV_MILES_MILESTONES,
  getTotalNftCount,
} from '@/lib/nftMilestones';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshIndicators } from './RefreshIndicators';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// Import brand logos for connected providers display
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';

const providerLogos: Record<string, string> = {
  tesla: teslaLogo,
  enphase: enphaseLogo,
};

type CurrentActivity = {
  solarKwh: number;
  evMiles: number;
  batteryKwh: number;
  chargingKwh: number;
};

type RefreshInfo = {
  lastUpdatedAt?: string | null;
};

export type MintCategory = 'solar' | 'ev_miles' | 'battery' | 'charging' | 'supercharger' | 'home_charger' | 'all';

interface ActivityMetricsProps {
  data: ActivityData;
  currentActivity?: CurrentActivity;
  refreshInfo?: RefreshInfo;
  connectedProviders?: string[];
  onMintCategory?: (category: MintCategory) => void;
  onMintSuccess?: () => void;
  tokenPrice?: number;
}

export function ActivityMetrics({ 
  data, 
  currentActivity, 
  refreshInfo, 
  connectedProviders = [], 
  onMintCategory, 
  onMintSuccess,
  tokenPrice = 0.10,
}: ActivityMetricsProps) {
  // Calculate earned NFTs locally using actual energy data (uses lifetime for NFT progress)
  const solarEarned = calculateEarnedMilestones(data.solarEnergyProduced, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(data.batteryStorageDischarged, BATTERY_MILESTONES);
  const chargingKwhLifetime = data.teslaSuperchargerKwh + data.homeChargerKwh;
  const chargingEarned = calculateEarnedMilestones(chargingKwhLifetime, EV_CHARGING_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(data.evMilesDriven, EV_MILES_MILESTONES);
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, chargingEarned, batteryEarned);

  // Total earned (including Welcome NFT)
  const totalEarned = 1 + solarEarned.length + evMilesEarned.length + chargingEarned.length + batteryEarned.length + comboEarned.length;
  const totalPossible = getTotalNftCount();

  // "Current Activity" is what is mintable: lifetime until first mint, then delta since last mint.
  const current: CurrentActivity = currentActivity ?? {
    solarKwh: Math.max(0, Math.floor(data.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(data.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(data.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(data.pendingChargingKwh || 0)),
  };

  const activityUnits = current.solarKwh + current.evMiles + current.batteryKwh + current.chargingKwh;
  // Apply Live Beta multiplier (10x or 1x) then 75% user share
  const rawTokens = activityUnits * getRewardMultiplier();
  const tokensToReceive = Math.floor(rawTokens * 0.75);

  // Filter to only Tesla/Enphase
  const filteredProviders = connectedProviders.filter(p => p === 'tesla' || p === 'enphase');

  return (
    <Card className={`overflow-hidden transition-all ${activityUnits > 0 ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-border/50'} bg-card`}>
      <CardContent className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Energy Command Center
          </h2>
          
          {/* Connected Provider Logos + Mint All Button */}
          <div className="flex items-center gap-2">
            {filteredProviders.length > 0 && (
              <div className="flex items-center gap-1">
                {filteredProviders.map((provider) => (
                  <div 
                    key={provider}
                    className="h-5 w-5 rounded-md bg-muted p-0.5 flex items-center justify-center"
                    title={provider.charAt(0).toUpperCase() + provider.slice(1)}
                  >
                    <img 
                      src={providerLogos[provider]} 
                      alt={provider}
                      className="h-3.5 w-3.5 object-contain"
                    />
                  </div>
                ))}
              </div>
            )}
            {activityUnits > 0 && onMintCategory && (
              <Button
                size="sm"
                variant="default"
                className="gap-1 h-7 text-xs font-medium"
                onClick={() => onMintCategory('all')}
              >
                <Sparkles className="h-3 w-3" />
                MINT ALL
              </Button>
            )}
          </div>
        </div>

        {/* Single last updated time */}
        <RefreshIndicators lastUpdatedAt={refreshInfo?.lastUpdatedAt} />

        {/* Activity Grid - 2 columns */}
        <div className="grid grid-cols-2 gap-2">
          <ActivityField
            icon={Sun}
            label="Solar Produced"
            value={current.solarKwh}
            unit="kWh"
            color="amber"
            active={current.solarKwh > 0}
            onTap={current.solarKwh > 0 ? () => onMintCategory?.('solar') : undefined}
          />
          <ActivityField
            icon={Car}
            label="EV Miles"
            value={current.evMiles}
            unit="mi"
            color="blue"
            active={current.evMiles > 0}
            onTap={current.evMiles > 0 ? () => onMintCategory?.('ev_miles') : undefined}
          />
          <ActivityField
            icon={Battery}
            label="Battery Discharged"
            value={current.batteryKwh}
            unit="kWh"
            color="emerald"
            active={current.batteryKwh > 0}
            onTap={current.batteryKwh > 0 ? () => onMintCategory?.('battery') : undefined}
          />
          <ActivityField
            icon={Zap}
            label="EV Charging"
            value={current.chargingKwh}
            unit="kWh"
            color="purple"
            active={current.chargingKwh > 0}
            onTap={current.chargingKwh > 0 ? () => onMintCategory?.('charging') : undefined}
          />
        </div>

        {/* Total Available Tokens - Same card style as activity fields */}
        <motion.div 
          className={`p-3 rounded-lg ${activityUnits > 0 ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30 border border-border/50'}`}
          animate={activityUnits > 0 ? { scale: [1, 1.003, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activityUnits > 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                <Coins className={`h-5 w-5 ${activityUnits > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Available Tokens</p>
                <p className="text-xl font-bold text-foreground">
                  {tokensToReceive.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-1">$ZSOLAR</span>
                </p>
                <p className={`text-xs ${activityUnits > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  ≈ ${(tokensToReceive * tokenPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} @ ${tokenPrice.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer: NFTs + Lifetime */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
            <Award className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">NFTs Earned</p>
              <p className="text-sm font-bold text-foreground">{totalEarned} / {totalPossible}</p>
            </div>
          </div>
          
          <div 
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => window.location.href = '/mint-history'}
          >
            <Coins className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-muted-foreground">Lifetime Minted</p>
              <p className="text-sm font-bold text-foreground">{data.lifetimeMinted.toLocaleString()}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Color mapping to match landing page
const colorStyles = {
  amber: { icon: 'text-amber-500', bg: 'bg-amber-500/10', activeBorder: 'border-amber-500/30' },
  blue: { icon: 'text-blue-500', bg: 'bg-blue-500/10', activeBorder: 'border-blue-500/30' },
  emerald: { icon: 'text-emerald-500', bg: 'bg-emerald-500/10', activeBorder: 'border-emerald-500/30' },
  purple: { icon: 'text-purple-500', bg: 'bg-purple-500/10', activeBorder: 'border-purple-500/30' },
};

interface ActivityFieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  unit: string;
  color: keyof typeof colorStyles;
  active: boolean;
  onTap?: () => void;
}

function ActivityField({ icon: Icon, label, value, unit, color, active, onTap }: ActivityFieldProps) {
  const styles = colorStyles[color];
  const isTappable = active && onTap;

  const content = (
    <>
      <div className="flex items-center gap-2 mb-1">
        <div className={`p-1.5 rounded-md ${styles.bg}`}>
          <Icon className={`h-4 w-4 ${styles.icon}`} />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {isTappable && <ChevronRight className="h-3.5 w-3.5 text-primary ml-auto" />}
      </div>
      <p className={`text-xl font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
        {value.toLocaleString()}
        <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
      </p>
    </>
  );

  if (isTappable) {
    return (
      <motion.button
        onClick={onTap}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`p-3 rounded-lg text-left transition-all border ${styles.activeBorder} bg-card/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50`}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <div className={`p-3 rounded-lg border border-border/50 bg-muted/30`}>
      {content}
    </div>
  );
}
