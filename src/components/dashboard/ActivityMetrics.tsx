import React from 'react';
import { ActivityData, SolarDeviceData, BatteryDeviceData, EVDeviceData, ChargerDeviceData } from '@/types/dashboard';
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
import { SwipeableActivityField } from './SwipeableActivityField';
import { HiddenFieldsRestore } from './HiddenFieldsRestore';
import { SwipeHintTooltip } from './SwipeHintTooltip';
import { useSwipeHintShown } from '@/hooks/useSwipeHintShown';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { HideableField } from '@/hooks/useHiddenActivityFields';

// Import brand logos for connected providers display
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import teslaLogo from '@/assets/logos/tesla-t-logo.png';

const providerLogos: Record<string, string> = {
  enphase: enphaseLogo,
  tesla: teslaLogo,
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

export interface MintRequest {
  category: MintCategory;
  deviceId?: string;
  deviceName?: string;
}

interface ActivityMetricsProps {
  data: ActivityData;
  currentActivity?: CurrentActivity;
  refreshInfo?: RefreshInfo;
  connectedProviders?: string[];
  onMintRequest?: (request: MintRequest) => void;
  onMintSuccess?: () => void;
  tokenPrice?: number;
  lifetimeMinted?: number;
  hiddenFields?: HideableField[];
  onHideField?: (field: HideableField) => void;
  onShowField?: (field: HideableField) => void;
  onShowAllFields?: () => void;
}

export function ActivityMetrics({ 
  data, 
  currentActivity, 
  refreshInfo, 
  connectedProviders = [], 
  onMintRequest, 
  onMintSuccess,
  tokenPrice = 0.10,
  lifetimeMinted = 0,
  hiddenFields = [],
  onHideField,
  onShowField,
  onShowAllFields,
}: ActivityMetricsProps) {
  const deviceLabels = data.deviceLabels;
  const solarDevices = data.solarDevices || [];
  const batteryDevices = data.batteryDevices || [];
  const evDevices = data.evDevices || [];
  const chargerDevices = data.chargerDevices || [];
  
  const hasMultipleSolarDevices = solarDevices.length > 1;
  const hasMultipleBatteryDevices = batteryDevices.length > 1;
  const hasMultipleEvDevices = evDevices.length > 1;
  const hasMultipleChargerDevices = chargerDevices.length > 1;

  // Swipe hint for first-time users
  const { shouldShowHint, markHintSeen } = useSwipeHintShown();

  // Check if provider is connected for each category (locked = cannot hide)
  const hasSolarConnected = connectedProviders.some(p => ['tesla', 'enphase', 'solaredge'].includes(p)) && solarDevices.length > 0;
  const hasBatteryConnected = connectedProviders.includes('tesla') && batteryDevices.length > 0;
  const hasEvConnected = connectedProviders.includes('tesla') && evDevices.length > 0;
  // Supercharger: locked if Tesla EV is connected (vehicle API provides supercharger data)
  const hasSuperchargerConnected = connectedProviders.includes('tesla') && evDevices.length > 0;
  
  // Home Charger: locked only if Tesla Wall Connector OR Wallbox charger is connected
  const hasTeslaWallConnector = connectedProviders.includes('tesla') && chargerDevices.length > 0;
  const hasWallboxConnected = connectedProviders.includes('wallbox') && chargerDevices.length > 0;
  const hasHomeChargerConnected = hasTeslaWallConnector || hasWallboxConnected;
  
  // Any charging source connected (for visibility logic)
  const hasAnyChargingConnected = hasSuperchargerConnected || hasHomeChargerConnected;
  

  // A field can only be hidden if it's NOT backed by a connected provider.
  // If a user previously hid a field and later connects the provider, the field must re-appear.
  const canHideField = (field: HideableField) => {
    switch (field) {
      case 'solar':
        return !hasSolarConnected;
      case 'battery':
        return !hasBatteryConnected;
      case 'ev_miles':
        return !hasEvConnected;
      case 'charging':
        return !hasAnyChargingConnected;
      case 'supercharger':
        return !hasSuperchargerConnected;
      case 'home_charger':
        return !hasHomeChargerConnected;
      default:
        return true;
    }
  };

  // Check if a field is (effectively) hidden
  const isHidden = (field: HideableField) => hiddenFields.includes(field) && canHideField(field);
  const effectiveHiddenFields = hiddenFields.filter(canHideField);

  // "Current Activity" is what is mintable
  const current: CurrentActivity = currentActivity ?? {
    solarKwh: Math.max(0, Math.floor(data.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(data.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(data.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(data.pendingChargingKwh || 0)),
    superchargerKwh: Math.max(0, Math.floor(data.pendingSuperchargerKwh || 0)),
    homeChargerKwh: Math.max(0, Math.floor(data.pendingHomeChargerKwh || 0)),
  };

  // Calculate total pending solar from individual devices when we have multiple
  const totalPendingSolarFromDevices = hasMultipleSolarDevices
    ? solarDevices.reduce((sum, d) => sum + Math.floor(d.pendingKwh), 0)
    : current.solarKwh;
    
  // Calculate totals from per-device data when available
  const totalPendingBatteryFromDevices = hasMultipleBatteryDevices
    ? batteryDevices.reduce((sum, d) => sum + Math.floor(d.pendingKwh), 0)
    : current.batteryKwh;
    
  const totalPendingEvFromDevices = hasMultipleEvDevices
    ? evDevices.reduce((sum, d) => sum + Math.floor(d.pendingMiles), 0)
    : current.evMiles;

  const activityUnits = totalPendingSolarFromDevices + totalPendingEvFromDevices + totalPendingBatteryFromDevices + current.chargingKwh;
  // Apply Live Beta multiplier (10x or 1x) then 75% user share
  const rawTokens = activityUnits * getRewardMultiplier();
  const tokensToReceive = Math.floor(rawTokens * 0.75);

  // Filter to only Tesla/Enphase
  const filteredProviders = connectedProviders.filter(p => p === 'tesla' || p === 'enphase');

  // Device-specific labels (used when single device)
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
  // Always show separate charging fields - they're core activity metrics
  // Users can swipe to hide Home Charger if not connected, but it should always be available
  const hasSeparateCharging = true;

  // Determine if we should show the swipe hint
  // Only show if there's at least one field that can be hidden (not connected)
  const hasHideableFields = !hasSolarConnected || !hasBatteryConnected || !hasEvConnected || !hasSuperchargerConnected || !hasHomeChargerConnected;

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
                    className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/80 border border-border/50 overflow-hidden"
                    title={provider.charAt(0).toUpperCase() + provider.slice(1)}
                  >
                    <img 
                      src={providerLogos[provider]} 
                      alt={provider}
                      className={cn(
                        "object-contain",
                        provider === 'tesla' ? "h-6 w-6" : "h-4 w-4"
                      )}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Single last updated time */}
        <RefreshIndicators lastUpdatedAt={refreshInfo?.lastUpdatedAt} />

        {/* Swipe Hint Tooltip - only show for first-time users with hideable fields */}
        {hasHideableFields && (
          <SwipeHintTooltip 
            show={shouldShowHint} 
            onDismiss={markHintSeen} 
          />
        )}

        {/* Activity Fields - Single Column with Swipe-to-Hide */}
        <div className="space-y-2">
          {/* Solar Fields - Show individual devices if multiple, otherwise single field */}
          {!isHidden('solar') && (
            hasMultipleSolarDevices ? (
              // Multiple solar devices - show each independently with per-device minting
              solarDevices.map((device, index) => {
                const pendingKwh = Math.floor(device.pendingKwh);
                const field = (
                  <ActivityField
                    key={device.deviceId}
                    icon={Sun}
                    label={`${device.deviceName} Energy Produced`}
                    value={pendingKwh}
                    unit="kWh"
                    color="amber"
                    active={pendingKwh > 0}
                    onTap={pendingKwh > 0 && onMintRequest ? () => onMintRequest({ 
                      category: 'solar', 
                      deviceId: device.deviceId,
                      deviceName: device.deviceName 
                    }) : undefined}
                  />
                );
                // Only first solar device is swipeable (hides all solar)
                return index === 0 && onHideField ? (
                  <SwipeableActivityField 
                    key={device.deviceId} 
                    onHide={() => onHideField('solar')}
                    locked={hasSolarConnected}
                  >
                    {field}
                  </SwipeableActivityField>
                ) : field;
              })
            ) : (
              // Single solar device - use existing logic (no deviceId needed)
              <SwipeableActivityField 
                onHide={() => onHideField?.('solar')} 
                disabled={!onHideField}
                locked={hasSolarConnected}
              >
                <ActivityField
                  icon={Sun}
                  label={solarLabel}
                  value={current.solarKwh}
                  unit="kWh"
                  color="amber"
                  active={current.solarKwh > 0}
                  onTap={current.solarKwh > 0 && onMintRequest ? () => onMintRequest({ category: 'solar' }) : undefined}
                />
              </SwipeableActivityField>
            )
          )}
          
          {/* EV Miles - Show individual vehicles if multiple */}
          {!isHidden('ev_miles') && (
            hasMultipleEvDevices ? (
              evDevices.map((device, index) => {
                const pendingMiles = Math.floor(device.pendingMiles);
                const field = (
                  <ActivityField
                    key={device.deviceId}
                    icon={Car}
                    label={`${device.deviceName} Miles Driven`}
                    value={pendingMiles}
                    unit="mi"
                    color="blue"
                    active={pendingMiles > 0}
                    onTap={pendingMiles > 0 && onMintRequest ? () => onMintRequest({ 
                      category: 'ev_miles', 
                      deviceId: device.deviceId,
                      deviceName: device.deviceName 
                    }) : undefined}
                  />
                );
                return index === 0 && onHideField ? (
                  <SwipeableActivityField 
                    key={device.deviceId} 
                    onHide={() => onHideField('ev_miles')}
                    locked={hasEvConnected}
                  >
                    {field}
                  </SwipeableActivityField>
                ) : field;
              })
            ) : (
              <SwipeableActivityField 
                onHide={() => onHideField?.('ev_miles')} 
                disabled={!onHideField}
                locked={hasEvConnected}
              >
                <ActivityField
                  icon={Car}
                  label={evLabel}
                  value={current.evMiles}
                  unit="mi"
                  color="blue"
                  active={current.evMiles > 0}
                  onTap={current.evMiles > 0 && onMintRequest ? () => onMintRequest({ category: 'ev_miles' }) : undefined}
                />
              </SwipeableActivityField>
            )
          )}
          
          {/* Battery - Show individual Powerwalls if multiple */}
          {!isHidden('battery') && (
            hasMultipleBatteryDevices ? (
              batteryDevices.map((device, index) => {
                const pendingKwh = Math.floor(device.pendingKwh);
                const field = (
                  <ActivityField
                    key={device.deviceId}
                    icon={Battery}
                    label={`${device.deviceName} Discharged`}
                    value={pendingKwh}
                    unit="kWh"
                    color="emerald"
                    active={pendingKwh > 0}
                    onTap={pendingKwh > 0 && onMintRequest ? () => onMintRequest({ 
                      category: 'battery', 
                      deviceId: device.deviceId,
                      deviceName: device.deviceName 
                    }) : undefined}
                  />
                );
                return index === 0 && onHideField ? (
                  <SwipeableActivityField 
                    key={device.deviceId} 
                    onHide={() => onHideField('battery')}
                    locked={hasBatteryConnected}
                  >
                    {field}
                  </SwipeableActivityField>
                ) : field;
              })
            ) : (
              <SwipeableActivityField 
                onHide={() => onHideField?.('battery')} 
                disabled={!onHideField}
                locked={hasBatteryConnected}
              >
                <ActivityField
                  icon={Battery}
                  label={batteryLabel}
                  value={current.batteryKwh}
                  unit="kWh"
                  color="emerald"
                  active={current.batteryKwh > 0}
                  onTap={current.batteryKwh > 0 && onMintRequest ? () => onMintRequest({ category: 'battery' }) : undefined}
                />
              </SwipeableActivityField>
            )
          )}
          
          {/* Charging - show separate fields if we have granular data or multiple chargers */}
          {hasSeparateCharging ? (
            <>
              {!isHidden('supercharger') && (
                <SwipeableActivityField 
                  onHide={() => onHideField?.('supercharger')} 
                  disabled={!onHideField}
                  locked={hasSuperchargerConnected}
                >
                  <ActivityField
                    icon={Zap}
                    label="Tesla Supercharger"
                    value={superchargerKwh}
                    unit="kWh"
                    color="purple"
                    active={superchargerKwh > 0}
                    onTap={superchargerKwh > 0 && onMintRequest ? () => onMintRequest({ category: 'supercharger' }) : undefined}
                  />
                </SwipeableActivityField>
              )}
              {/* Show individual home chargers if multiple */}
              {!isHidden('home_charger') && (
                hasMultipleChargerDevices ? (
                  chargerDevices.map((device, index) => {
                    const pendingKwh = Math.floor(device.pendingKwh);
                    const field = (
                      <ActivityField
                        key={device.deviceId}
                        icon={Zap}
                        label={`${device.deviceName} Charging`}
                        value={pendingKwh}
                        unit="kWh"
                        color="purple"
                        active={pendingKwh > 0}
                        onTap={pendingKwh > 0 && onMintRequest ? () => onMintRequest({ 
                          category: 'home_charger', 
                          deviceId: device.deviceId,
                          deviceName: device.deviceName 
                        }) : undefined}
                      />
                    );
                    return index === 0 && onHideField ? (
                      <SwipeableActivityField 
                        key={device.deviceId} 
                        onHide={() => onHideField('home_charger')}
                        locked={hasHomeChargerConnected}
                      >
                        {field}
                      </SwipeableActivityField>
                    ) : field;
                  })
                ) : (
                  <SwipeableActivityField 
                    onHide={() => onHideField?.('home_charger')} 
                    disabled={!onHideField}
                    locked={hasHomeChargerConnected}
                  >
                    <ActivityField
                      icon={Zap}
                      label={homeChargerLabel}
                      value={homeChargerKwh}
                      unit="kWh"
                      color="purple"
                      active={homeChargerKwh > 0}
                      onTap={homeChargerKwh > 0 && onMintRequest ? () => onMintRequest({ category: 'home_charger' }) : undefined}
                    />
                  </SwipeableActivityField>
                )
              )}
            </>
          ) : current.chargingKwh > 0 && !isHidden('charging') ? (
            <SwipeableActivityField 
              onHide={() => onHideField?.('charging')} 
              disabled={!onHideField}
              locked={hasAnyChargingConnected}
            >
              <ActivityField
                icon={Zap}
                label="EV Charging"
                value={current.chargingKwh}
                unit="kWh"
                color="purple"
                active={current.chargingKwh > 0}
                onTap={onMintRequest ? () => onMintRequest({ category: 'charging' }) : undefined}
              />
            </SwipeableActivityField>
          ) : null}
        </div>
        
        {/* Hidden Fields Restore Link */}
        {effectiveHiddenFields.length > 0 && onShowField && onShowAllFields && (
          <HiddenFieldsRestore 
            hiddenFields={effectiveHiddenFields}
            onShowField={onShowField}
            onShowAll={onShowAllFields}
          />
        )}

        {/* Total Available Tokens - Premium Hero Card */}
        <motion.div 
          onClick={activityUnits > 0 && onMintRequest ? () => onMintRequest({ category: 'all' }) : undefined}
          onTouchEnd={activityUnits > 0 && onMintRequest ? (e) => { e.preventDefault(); onMintRequest({ category: 'all' }); } : undefined}
          whileTap={activityUnits > 0 && onMintRequest ? { scale: 0.98 } : undefined}
          whileHover={activityUnits > 0 && onMintRequest ? { scale: 1.01 } : undefined}
          className={cn(
            "p-4 rounded-xl border flex items-center gap-4 transition-all relative overflow-hidden touch-manipulation",
            activityUnits > 0 && onMintRequest
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
          {activityUnits > 0 && onMintRequest && (
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
  
  // Track touch start position to distinguish taps from scrolls
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTap = () => {
    if (isTappable && onTap) {
      onTap();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTappable) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isTappable || !touchStartRef.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    // Only trigger tap if:
    // - Movement is less than 10px in any direction
    // - Touch duration is less than 300ms (not a long press)
    const isQuickTap = deltaX < 10 && deltaY < 10 && deltaTime < 300;
    
    if (isQuickTap) {
      e.preventDefault();
      handleTap();
    }
    
    touchStartRef.current = null;
  };

  return (
    <motion.div
      onClick={handleTap}
      onTouchStart={isTappable ? handleTouchStart : undefined}
      onTouchEnd={isTappable ? handleTouchEnd : undefined}
      whileTap={isTappable ? { scale: 0.98 } : undefined}
      whileHover={isTappable ? { scale: 1.01, y: -1 } : undefined}
      className={cn(
        "p-3.5 rounded-xl border transition-all flex items-center gap-3.5 relative overflow-hidden touch-manipulation",
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
