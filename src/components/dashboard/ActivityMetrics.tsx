import type React from 'react';
import { useState } from 'react';
import { ActivityData, calculateCO2Offset } from '@/types/dashboard';
import { getRewardMultiplier } from '@/lib/tokenomics';
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
  ChevronRight,
  Sparkles,
  DollarSign,
  Settings2,
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
import { RefreshIndicators, type ProviderKey, type ProviderRefreshState } from './RefreshIndicators';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Import brand logos for connected providers display
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.png';
import wallboxLogo from '@/assets/logos/wallbox-logo.png';

const providerLogos: Record<string, string> = {
  tesla: teslaLogo,
  enphase: enphaseLogo,
  solaredge: solaredgeLogo,
  wallbox: wallboxLogo,
};

type CurrentActivity = {
  solarKwh: number;
  evMiles: number;
  batteryKwh: number;
  chargingKwh: number;
};

type RefreshInfo = {
  lastUpdatedAt?: string | null;
  providers?: Partial<Record<ProviderKey, ProviderRefreshState>>;
};

export type MintCategory = 'solar' | 'ev_miles' | 'battery' | 'charging' | 'supercharger' | 'home_charger' | 'all';

interface ActivityMetricsProps {
  data: ActivityData;
  currentActivity?: CurrentActivity;
  refreshInfo?: RefreshInfo;
  connectedProviders?: string[];
  onMintCategory?: (category: MintCategory) => void;
  onMintSuccess?: () => void;
}

// Default token price in USD ($0.10 launch floor per optimized 10B strategy)
const DEFAULT_TOKEN_PRICE = 0.10;

export function ActivityMetrics({ data, currentActivity, refreshInfo, connectedProviders = [], onMintCategory, onMintSuccess }: ActivityMetricsProps) {
  const [tokenPrice, setTokenPrice] = useState<number>(DEFAULT_TOKEN_PRICE);
  const [priceInput, setPriceInput] = useState<string>(DEFAULT_TOKEN_PRICE.toString());
  const labels = data.deviceLabels || {};

  // Build dynamic labels with full activity descriptions
  const evLabel = labels.vehicle 
    ? `${labels.vehicle} Miles Driven` 
    : 'EV Miles Driven';

  const batteryLabel = labels.powerwall 
    ? `${labels.powerwall} Energy Discharged` 
    : 'Battery Energy Discharged';

  const superchargerLabel = 'Tesla Supercharger';
  
  const homeChargerLabel = labels.homeCharger 
    ? `${labels.homeCharger} Home Charging` 
    : labels.wallConnector
      ? `${labels.wallConnector} Home Charging`
      : 'Home Charger';

  // Build solar label from Enphase system name or default
  const solarLabel = labels.solar 
    ? `${labels.solar} Solar Energy Produced` 
    : 'Solar Energy Produced';

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

  // Separate charging values
  const superchargerKwh = Math.max(0, Math.floor(data.pendingSuperchargerKwh || 0));
  const homeChargerKwh = Math.max(0, Math.floor(data.pendingHomeChargerKwh || 0));

  const activityUnits = current.solarKwh + current.evMiles + current.batteryKwh + current.chargingKwh;
  // Apply Live Beta multiplier (10x or 1x) then 75% user share
  const rawTokens = activityUnits * getRewardMultiplier();
  const tokensToReceive = Math.floor(rawTokens * 0.75);

  // CO2 should reflect the same "current activity" basis shown in the UI
  const currentCo2Offset = Math.floor(
    calculateCO2Offset({
      ...data,
      solarEnergyProduced: current.solarKwh,
      evMilesDriven: current.evMiles,
      batteryStorageDischarged: current.batteryKwh,
    })
  );

  return (
    <div className="space-y-6">
      {/* ENERGY COMMAND CENTER - THE HERO SECTION */}
      <Card className={`overflow-hidden transition-all ${activityUnits > 0 ? 'border-primary/40 shadow-xl shadow-primary/10 ring-1 ring-primary/20' : 'border-eco/20'} bg-gradient-to-br from-eco/5 via-card to-card`}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {activityUnits > 0 && (
                <motion.span 
                  className="relative flex h-3 w-3"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </motion.span>
              )}
              <Gauge className="h-5 w-5 text-eco" />
              Energy Command Center
            </h2>
            
            {/* Connected Provider Logos + Mint All Button */}
            <div className="flex items-center gap-2">
              {connectedProviders.length > 0 && (
                <div className="flex items-center gap-1">
                  {connectedProviders.map((provider) => (
                    <div 
                      key={provider}
                      className="h-5 w-5 rounded-md bg-eco/10 p-0.5 flex items-center justify-center"
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
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    size="sm"
                    variant="default"
                    className="gap-1.5 h-8 text-xs font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
                    onClick={() => onMintCategory('all')}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    MINT ALL
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          <RefreshIndicators lastUpdatedAt={refreshInfo?.lastUpdatedAt} providers={refreshInfo?.providers} />

          {/* Activity breakdown - compact grid with tap-to-mint */}
          <div className="grid grid-cols-2 gap-2">
            <ActivityCard
              icon={Sun}
              value={current.solarKwh}
              unit="kWh"
              label={solarLabel}
              active={current.solarKwh > 0}
              colorClass="solar"
              onTap={current.solarKwh > 0 ? () => onMintCategory?.('solar') : undefined}
            />

            <ActivityCard
              icon={Car}
              value={current.evMiles}
              unit="mi"
              label={evLabel}
              active={current.evMiles > 0}
              colorClass="energy"
              onTap={current.evMiles > 0 ? () => onMintCategory?.('ev_miles') : undefined}
            />

            <ActivityCard
              icon={Battery}
              value={current.batteryKwh}
              unit="kWh"
              label={batteryLabel}
              active={current.batteryKwh > 0}
              colorClass="secondary"
              onTap={current.batteryKwh > 0 ? () => onMintCategory?.('battery') : undefined}
            />

            <ActivityCard
              icon={Zap}
              value={superchargerKwh}
              unit="kWh"
              label={superchargerLabel}
              active={superchargerKwh > 0}
              colorClass="accent"
              onTap={superchargerKwh > 0 ? () => onMintCategory?.('supercharger') : undefined}
            />

            <ActivityCard
              icon={Zap}
              value={homeChargerKwh}
              unit="kWh"
              label={homeChargerLabel}
              active={homeChargerKwh > 0}
              colorClass="accent"
              onTap={homeChargerKwh > 0 ? () => onMintCategory?.('home_charger') : undefined}
            />
          </div>

          {/* Tokens to receive - prominent display with USD value */}
          <motion.div 
            className={`p-5 rounded-2xl ${activityUnits > 0 ? 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border-2 border-primary/30' : 'bg-muted/50 border border-border'}`}
            animate={activityUnits > 0 ? { scale: [1, 1.005, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-4">
              <motion.div 
                className={`p-3.5 rounded-2xl ${activityUnits > 0 ? 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30' : 'bg-muted'}`}
                animate={activityUnits > 0 ? { rotate: [0, 5, 0, -5, 0] } : {}}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Coins className={`h-7 w-7 ${activityUnits > 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              </motion.div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium">Total Available Tokens</p>
                <motion.p 
                  className="text-3xl font-bold text-foreground"
                  animate={activityUnits > 0 ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  {tokensToReceive.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground ml-2">$ZSOLAR</span>
                </motion.p>
                {/* USD Value Estimate - Enhanced */}
                <div className="flex items-center gap-2 mt-2 p-2.5 bg-eco/10 rounded-lg w-fit">
                  <DollarSign className="h-4 w-4 text-eco" />
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-eco">
                      ≈ ${(tokensToReceive * tokenPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </span>
                    <span className="text-[10px] text-eco/70">
                      @ ${tokenPrice.toFixed(2)} per token
                    </span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="p-1 hover:bg-eco/20 rounded transition-colors">
                        <Settings2 className="h-3.5 w-3.5 text-eco/70 hover:text-eco" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-3" align="start">
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground">Token Price (USD)</p>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              value={priceInput}
                              onChange={(e) => setPriceInput(e.target.value)}
                              className="pl-6 h-8 text-sm"
                              placeholder="0.23"
                            />
                          </div>
                          <Button 
                            size="sm" 
                            className="h-8"
                            onClick={() => {
                              const parsed = parseFloat(priceInput);
                              if (!isNaN(parsed) && parsed >= 0) {
                                setTokenPrice(parsed);
                              }
                            }}
                          >
                            Set
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Default: $0.10 (launch floor)
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Summary row: NFTs + Lifetime Minted */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
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

    </div>
  );
}

// Compact activity card component with tap-to-mint
interface ActivityCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  unit: string;
  label: string;
  active: boolean;
  colorClass: 'solar' | 'energy' | 'secondary' | 'accent';
  onTap?: () => void;
}

function ActivityCard({ icon: Icon, value, unit, label, active, colorClass, onTap }: ActivityCardProps) {
  // Map color classes to actual Tailwind classes (can't use dynamic class names)
  const colorStyles = {
    solar: {
      bg: active ? 'bg-solar/10' : 'bg-muted/30',
      border: active ? 'border-solar/30' : 'border-border/50',
      iconBg: active ? 'bg-solar/20' : 'bg-muted',
      iconColor: active ? 'text-solar' : 'text-muted-foreground',
    },
    energy: {
      bg: active ? 'bg-energy/10' : 'bg-muted/30',
      border: active ? 'border-energy/30' : 'border-border/50',
      iconBg: active ? 'bg-energy/20' : 'bg-muted',
      iconColor: active ? 'text-energy' : 'text-muted-foreground',
    },
    secondary: {
      bg: active ? 'bg-secondary/10' : 'bg-muted/30',
      border: active ? 'border-secondary/30' : 'border-border/50',
      iconBg: active ? 'bg-secondary/20' : 'bg-muted',
      iconColor: active ? 'text-secondary' : 'text-muted-foreground',
    },
    accent: {
      bg: active ? 'bg-accent/10' : 'bg-muted/30',
      border: active ? 'border-accent/30' : 'border-border/50',
      iconBg: active ? 'bg-accent/20' : 'bg-muted',
      iconColor: active ? 'text-accent-foreground' : 'text-muted-foreground',
    },
  };

  const styles = colorStyles[colorClass];
  const isTappable = active && onTap;

  const content = (
    <>
      <div className={`p-2 rounded-lg ${styles.iconBg} relative`}>
        <Icon className={`h-4 w-4 ${styles.iconColor}`} />
        {/* Pulse indicator for tappable cards */}
        {isTappable && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
        )}
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-base font-semibold text-foreground leading-tight">
          {value.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{unit}</span>
        </span>
        <span className="text-[10px] text-muted-foreground truncate">{label}</span>
        {/* Tap to mint hint */}
        {isTappable && (
          <span className="text-[9px] text-primary font-medium mt-0.5">Tap to mint</span>
        )}
      </div>
    </>
  );

  if (isTappable) {
    return (
      <motion.button
        onClick={onTap}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-2.5 p-3 rounded-xl transition-all border ${styles.bg} ${styles.border} cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 text-left w-full`}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-xl transition-all border ${styles.bg} ${styles.border}`}>
      {content}
    </div>
  );
}
