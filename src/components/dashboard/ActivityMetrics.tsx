import type React from 'react';
import { ActivityData, DeviceLabels } from '@/types/dashboard';
import { getRewardMultiplier } from '@/lib/tokenomics';
import {
  Sun,
  Car,
  Battery,
  Zap,
  Coins,
  Award,
  ChevronRight,
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
import { cn } from '@/lib/utils';

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
  superchargerKwh?: number;
  homeChargerKwh?: number;
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
  const deviceLabels = data.deviceLabels;
  
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

  // "Current Activity" is what is mintable
  const current: CurrentActivity = currentActivity ?? {
    solarKwh: Math.max(0, Math.floor(data.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(data.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(data.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(data.pendingChargingKwh || 0)),
    superchargerKwh: Math.max(0, Math.floor(data.pendingSuperchargerKwh || 0)),
    homeChargerKwh: Math.max(0, Math.floor(data.pendingHomeChargerKwh || 0)),
  };

  const activityUnits = current.solarKwh + current.evMiles + current.batteryKwh + current.chargingKwh;
  // Apply Live Beta multiplier (10x or 1x) then 75% user share
  const rawTokens = activityUnits * getRewardMultiplier();
  const tokensToReceive = Math.floor(rawTokens * 0.75);

  // Filter to only Tesla/Enphase
  const filteredProviders = connectedProviders.filter(p => p === 'tesla' || p === 'enphase');

  // Device-specific labels
  const solarLabel = deviceLabels?.solar 
    ? `${deviceLabels.solar} Energy Produced` 
    : 'Solar Energy Produced';
  const evLabel = deviceLabels?.vehicle 
    ? `${deviceLabels.vehicle} Miles Driven` 
    : 'EV Miles Driven';
  const batteryLabel = deviceLabels?.powerwall 
    ? `${deviceLabels.powerwall} Energy Discharged` 
    : 'Battery Discharged';
  const homeChargerLabel = deviceLabels?.wallConnector 
    ? `${deviceLabels.wallConnector} Home Charging` 
    : 'Home Charging';

  // Separate charging values
  const superchargerKwh = current.superchargerKwh ?? 0;
  const homeChargerKwh = current.homeChargerKwh ?? 0;
  const hasSeparateCharging = superchargerKwh > 0 || homeChargerKwh > 0;

  return (
    <Card className={cn(
      "overflow-hidden transition-all bg-card",
      activityUnits > 0 ? 'border-primary/30 shadow-lg shadow-primary/5' : 'border-border/50'
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            Energy Command Center
          </h2>
          
          {/* Connected Provider Logos */}
          {filteredProviders.length > 0 && (
            <div className="flex items-center gap-1">
              {filteredProviders.map((provider) => (
                <div 
                  key={provider}
                  className="h-6 w-6 rounded-lg bg-muted p-1 flex items-center justify-center"
                  title={provider.charAt(0).toUpperCase() + provider.slice(1)}
                >
                  <img 
                    src={providerLogos[provider]} 
                    alt={provider}
                    className="h-4 w-4 object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Single last updated time */}
        <RefreshIndicators lastUpdatedAt={refreshInfo?.lastUpdatedAt} />

        {/* Activity Fields - Single Column */}
        <div className="space-y-2">
          <ActivityField
            icon={Sun}
            label={solarLabel}
            value={current.solarKwh}
            unit="kWh"
            color="amber"
            active={current.solarKwh > 0}
            onTap={current.solarKwh > 0 && onMintCategory ? () => onMintCategory('solar') : undefined}
          />
          <ActivityField
            icon={Car}
            label={evLabel}
            value={current.evMiles}
            unit="mi"
            color="blue"
            active={current.evMiles > 0}
            onTap={current.evMiles > 0 && onMintCategory ? () => onMintCategory('ev_miles') : undefined}
          />
          <ActivityField
            icon={Battery}
            label={batteryLabel}
            value={current.batteryKwh}
            unit="kWh"
            color="emerald"
            active={current.batteryKwh > 0}
            onTap={current.batteryKwh > 0 && onMintCategory ? () => onMintCategory('battery') : undefined}
          />
          
          {/* Charging - show separate fields if we have granular data */}
          {hasSeparateCharging ? (
            <>
              {superchargerKwh > 0 && (
                <ActivityField
                  icon={Zap}
                  label="Tesla Supercharger"
                  value={superchargerKwh}
                  unit="kWh"
                  color="olive"
                  active={superchargerKwh > 0}
                  onTap={onMintCategory ? () => onMintCategory('supercharger') : undefined}
                />
              )}
              {homeChargerKwh > 0 && (
                <ActivityField
                  icon={Zap}
                  label={homeChargerLabel}
                  value={homeChargerKwh}
                  unit="kWh"
                  color="olive"
                  active={homeChargerKwh > 0}
                  onTap={onMintCategory ? () => onMintCategory('home_charger') : undefined}
                />
              )}
            </>
          ) : current.chargingKwh > 0 ? (
            <ActivityField
              icon={Zap}
              label="EV Charging"
              value={current.chargingKwh}
              unit="kWh"
              color="purple"
              active={current.chargingKwh > 0}
              onTap={onMintCategory ? () => onMintCategory('charging') : undefined}
            />
          ) : null}
        </div>

        {/* Total Available Tokens - Same card style as activity fields */}
        <motion.div 
          onClick={activityUnits > 0 && onMintCategory ? () => onMintCategory('all') : undefined}
          whileTap={activityUnits > 0 && onMintCategory ? { scale: 0.98 } : undefined}
          className={cn(
            "p-3 rounded-xl border flex items-center gap-3 transition-all",
            activityUnits > 0 && onMintCategory
              ? "cursor-pointer border-primary/30 bg-primary/5 hover:bg-primary/10"
              : "border-border/50 bg-muted/30"
          )}
        >
          <div className={cn(
            "p-3 rounded-xl",
            activityUnits > 0 ? "bg-primary" : "bg-muted"
          )}>
            <Coins className={cn(
              "h-5 w-5",
              activityUnits > 0 ? "text-primary-foreground" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Total Available Tokens</p>
            <p className="text-xl font-bold text-foreground">
              {tokensToReceive.toLocaleString()}
              <span className="text-base font-normal text-muted-foreground ml-1">$ZSOLAR</span>
            </p>
            <p className={cn(
              "text-xs",
              activityUnits > 0 ? "text-primary" : "text-muted-foreground"
            )}>
              ≈ ${(tokensToReceive * tokenPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} @ ${tokenPrice.toFixed(2)}
            </p>
          </div>
          {activityUnits > 0 && onMintCategory && (
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}
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

// Color mapping - solid backgrounds with white icons (Tesla-inspired)
const colorStyles = {
  amber: { solidBg: 'bg-amber-500', iconColor: 'text-white' },
  blue: { solidBg: 'bg-blue-500', iconColor: 'text-white' },
  emerald: { solidBg: 'bg-emerald-500', iconColor: 'text-white' },
  purple: { solidBg: 'bg-purple-500', iconColor: 'text-white' },
  olive: { solidBg: 'bg-yellow-600', iconColor: 'text-white' },
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

  return (
    <motion.div
      onClick={onTap}
      whileTap={isTappable ? { scale: 0.98 } : undefined}
      className={cn(
        "p-3 rounded-xl border transition-all flex items-center gap-3",
        isTappable
          ? "cursor-pointer border-border/50 bg-card hover:bg-muted/30"
          : "border-border/50 bg-muted/30"
      )}
    >
      {/* Large rounded icon square */}
      <div className={cn("p-3 rounded-xl", active ? styles.solidBg : "bg-muted")}>
        <Icon className={cn("h-5 w-5", active ? styles.iconColor : "text-muted-foreground")} />
      </div>
      
      {/* Label + Value */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className={cn(
          "text-xl font-bold",
          active ? "text-foreground" : "text-muted-foreground"
        )}>
          {value.toLocaleString()}
          <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>
      
      {/* Tap indicator */}
      {isTappable && (
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
    </motion.div>
  );
}
