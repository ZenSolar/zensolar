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

          {/* Activity breakdown - original MetricCard style with tap-to-mint */}
          <div className="grid grid-cols-1 gap-3">
            <MetricCardWithMint
              icon={Sun}
              value={current.solarKwh.toLocaleString()}
              label="Solar Energy"
              sublabel={solarLabel}
              unit="kWh"
              colorClass="text-solar"
              bgClass="bg-solar/10"
              active={current.solarKwh > 0}
              onTap={current.solarKwh > 0 ? () => onMintCategory?.('solar') : undefined}
            />

            <MetricCardWithMint
              icon={Car}
              value={current.evMiles.toLocaleString()}
              label="EV Miles"
              sublabel={evLabel}
              unit="mi"
              colorClass="text-energy"
              bgClass="bg-energy/10"
              active={current.evMiles > 0}
              onTap={current.evMiles > 0 ? () => onMintCategory?.('ev_miles') : undefined}
            />

            <MetricCardWithMint
              icon={Battery}
              value={current.batteryKwh.toLocaleString()}
              label="Battery Storage"
              sublabel={batteryLabel}
              unit="kWh"
              colorClass="text-secondary"
              bgClass="bg-secondary/10"
              active={current.batteryKwh > 0}
              onTap={current.batteryKwh > 0 ? () => onMintCategory?.('battery') : undefined}
            />

            <MetricCardWithMint
              icon={Zap}
              value={superchargerKwh.toLocaleString()}
              label="Supercharger"
              sublabel={superchargerLabel}
              unit="kWh"
              colorClass="text-accent-foreground"
              bgClass="bg-accent/10"
              active={superchargerKwh > 0}
              onTap={superchargerKwh > 0 ? () => onMintCategory?.('supercharger') : undefined}
            />

            <MetricCardWithMint
              icon={Zap}
              value={homeChargerKwh.toLocaleString()}
              label="Home Charger"
              sublabel={homeChargerLabel}
              unit="kWh"
              colorClass="text-accent-foreground"
              bgClass="bg-accent/10"
              active={homeChargerKwh > 0}
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

// Original MetricCard-style component with tap-to-mint functionality
interface MetricCardWithMintProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  sublabel: string;
  unit: string;
  colorClass: string;
  bgClass: string;
  active: boolean;
  onTap?: () => void;
}

function MetricCardWithMint({ 
  icon: Icon, 
  value, 
  label, 
  sublabel, 
  unit, 
  colorClass, 
  bgClass, 
  active, 
  onTap 
}: MetricCardWithMintProps) {
  const isTappable = active && onTap;

  const content = (
    <div className="flex items-center gap-4 w-full">
      <div className={`p-3 rounded-xl ${bgClass} relative shrink-0`}>
        <Icon className={`h-6 w-6 ${colorClass}`} />
        {/* Pulse indicator for tappable cards */}
        {isTappable && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold ${active ? colorClass : 'text-muted-foreground'}`}>
            {value}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{sublabel}</p>
      </div>
      {isTappable && (
        <div className="shrink-0 flex flex-col items-center gap-1">
          <ChevronRight className="h-5 w-5 text-primary" />
          <span className="text-[10px] text-primary font-medium">Mint</span>
        </div>
      )}
    </div>
  );

  if (isTappable) {
    return (
      <motion.button
        onClick={onTap}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`p-4 rounded-xl transition-all border-2 ${active ? 'border-primary/30 bg-card/80 shadow-md shadow-primary/5' : 'border-border/50 bg-muted/30'} cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 text-left w-full`}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <div className={`p-4 rounded-xl transition-all border ${active ? 'border-border bg-card/50' : 'border-border/50 bg-muted/30'}`}>
      {content}
    </div>
  );
}
