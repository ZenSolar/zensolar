import type React from 'react';
import { ActivityData } from '@/types/dashboard';
import { getRewardMultiplier } from '@/lib/tokenomics';
import { Link } from 'react-router-dom';
import {
  Sun,
  Car,
  Battery,
  Zap,
  Coins,
  ChevronRight,
  Gauge,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshIndicators } from './RefreshIndicators';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Import brand logos for connected providers display (non-Tesla)
import enphaseLogo from '@/assets/logos/enphase-logo.png';

const providerLogos: Record<string, string> = {
  enphase: enphaseLogo,
};

// Tesla "T" icon as inline SVG for crisp rendering
function TeslaIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="currentColor"
    >
      <path d="M50 5C30.5 5 12.5 10.5 5 17.5L50 95L95 17.5C87.5 10.5 69.5 5 50 5ZM50 12C60 12 70 14 77.5 17.5L50 75L22.5 17.5C30 14 40 12 50 12Z" />
    </svg>
  );
}

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
  lifetimeMinted?: number;
}

export function ActivityMetrics({ 
  data, 
  currentActivity, 
  refreshInfo, 
  connectedProviders = [], 
  onMintCategory, 
  onMintSuccess,
  tokenPrice = 0.10,
  lifetimeMinted = 0,
}: ActivityMetricsProps) {
  const deviceLabels = data.deviceLabels;

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
      activityUnits > 0 ? 'border-primary/30 shadow-lg shadow-primary/10' : 'border-border/50'
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
            <div className="flex items-center gap-1.5">
              {filteredProviders.map((provider) => (
                <div 
                  key={provider}
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    provider === 'tesla' 
                      ? "bg-[#E82127]" 
                      : "bg-muted/80 border border-border/50"
                  )}
                  title={provider.charAt(0).toUpperCase() + provider.slice(1)}
                >
                  {provider === 'tesla' ? (
                    <TeslaIcon className="h-5 w-5 text-white" />
                  ) : (
                    <img 
                      src={providerLogos[provider]} 
                      alt={provider}
                      className="h-4 w-4 object-contain"
                    />
                  )}
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
                  color="purple"
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
                  color="purple"
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

        {/* Total Available Tokens - Premium Hero Card */}
        <motion.div 
          onClick={activityUnits > 0 && onMintCategory ? () => onMintCategory('all') : undefined}
          whileTap={activityUnits > 0 && onMintCategory ? { scale: 0.98 } : undefined}
          whileHover={activityUnits > 0 && onMintCategory ? { scale: 1.01 } : undefined}
          className={cn(
            "p-4 rounded-xl border flex items-center gap-4 transition-all relative overflow-hidden",
            activityUnits > 0 && onMintCategory
              ? "cursor-pointer border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/10 hover:border-primary/60 shadow-lg shadow-primary/10"
              : "border-border/50 bg-muted/30"
          )}
        >
          {/* Animated background glow for active state */}
          {activityUnits > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5 animate-pulse-glow" />
          )}
          
          <div className={cn(
            "relative p-3 rounded-xl transition-all",
            activityUnits > 0 
              ? "bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/30" 
              : "bg-muted"
          )}>
            <Coins className={cn(
              "h-6 w-6",
              activityUnits > 0 ? "text-white" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1 min-w-0 relative">
            <p className="text-sm text-muted-foreground font-medium">Total Available Tokens</p>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {tokensToReceive.toLocaleString()}
              <span className="text-lg font-semibold text-muted-foreground ml-1.5">$ZSOLAR</span>
            </p>
            <p className={cn(
              "text-sm font-medium",
              activityUnits > 0 ? "text-primary" : "text-muted-foreground"
            )}>
              ≈ ${(tokensToReceive * tokenPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} @ ${tokenPrice.toFixed(2)}
            </p>
          </div>
          {activityUnits > 0 && onMintCategory && (
            <div className="relative flex items-center gap-1 text-primary">
              <span className="text-xs font-semibold uppercase tracking-wide">Mint</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          )}
        </motion.div>

        {/* Lifetime Minted Tokens - moved from NFT card */}
        <Link 
          to="/mint-history" 
          className="flex items-center gap-3 p-3.5 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-all group"
        >
          <div className="p-2.5 rounded-xl bg-muted">
            <Coins className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Lifetime Minted Tokens</p>
            <p className="text-xl font-bold text-foreground">
              {lifetimeMinted?.toLocaleString() || '0'}
              <span className="text-sm font-semibold text-muted-foreground ml-1.5">$ZSOLAR</span>
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

      </CardContent>
    </Card>
  );
}

// Color mapping - matching landing page exactly with gradient backgrounds
const colorStyles = {
  amber: { 
    gradient: 'from-amber-500 to-orange-500',
    text: 'text-amber-500',
    glow: 'shadow-amber-500/30',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  blue: { 
    gradient: 'from-blue-500 to-cyan-500',
    text: 'text-blue-500',
    glow: 'shadow-blue-500/30',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  emerald: { 
    gradient: 'from-emerald-500 to-green-500',
    text: 'text-emerald-500',
    glow: 'shadow-emerald-500/30',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  purple: { 
    gradient: 'from-purple-500 to-pink-500',
    text: 'text-purple-500',
    glow: 'shadow-purple-500/30',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
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
      whileHover={isTappable ? { scale: 1.01, y: -1 } : undefined}
      className={cn(
        "p-3.5 rounded-xl border transition-all flex items-center gap-3.5 relative overflow-hidden",
        isTappable
          ? cn("cursor-pointer bg-card hover:bg-muted/20", styles.border, `hover:shadow-lg ${styles.glow}`)
          : "border-border/50 bg-muted/30"
      )}
    >
      {/* Subtle gradient overlay for active cards */}
      {active && (
        <div className={cn(
          "absolute inset-0 opacity-[0.03] bg-gradient-to-r",
          styles.gradient
        )} />
      )}
      
      {/* Icon with gradient background */}
      <div className={cn(
        "relative p-3 rounded-xl transition-all",
        active 
          ? cn("bg-gradient-to-br shadow-lg", styles.gradient, styles.glow)
          : "bg-muted"
      )}>
        <Icon className={cn(
          "h-5 w-5 transition-all",
          active ? "text-white" : "text-muted-foreground"
        )} />
      </div>
      
      {/* Label + Value */}
      <div className="flex-1 min-w-0 relative">
        <p className={cn(
          "text-sm font-medium truncate transition-colors",
          active ? "text-foreground" : "text-muted-foreground"
        )}>{label}</p>
        <p className={cn(
          "text-xl font-bold tracking-tight",
          active ? "text-foreground" : "text-muted-foreground"
        )}>
          {value.toLocaleString()}
          <span className="text-base font-semibold ml-1 text-muted-foreground">{unit}</span>
        </p>
      </div>
      
      {/* Tap indicator */}
      {isTappable && (
        <div className={cn("flex items-center gap-1", styles.text)}>
          <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">Mint</span>
          <ChevronRight className="h-5 w-5" />
        </div>
      )}
    </motion.div>
  );
}
