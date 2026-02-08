import React from 'react';
import { useActiveChargingSession } from '@/hooks/useActiveChargingSession';
import { ActivityData, SolarDeviceData, BatteryDeviceData, EVDeviceData, ChargerDeviceData } from '@/types/dashboard';
import { getRewardMultiplier } from '@/lib/tokenomics';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun,
  Car,
  Battery,
  Zap,
  Coins,
  ChevronRight,
  Gauge,
  AlertCircle,
  Loader2,
  BarChart3,
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
  isNewUserView?: boolean;
  teslaNeedsReauth?: boolean;
  isLoading?: boolean;
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
  isNewUserView = false,
  teslaNeedsReauth = false,
  isLoading = false,
}: ActivityMetricsProps) {
  // In new user view mode, show empty state
  const effectiveData = isNewUserView ? {
    ...data,
    solarEnergyProduced: 0,
    batteryStorageDischarged: 0,
    evMilesDriven: 0,
    teslaSuperchargerKwh: 0,
    homeChargerKwh: 0,
    pendingSolarKwh: 0,
    pendingEvMiles: 0,
    pendingBatteryKwh: 0,
    pendingChargingKwh: 0,
    pendingSuperchargerKwh: 0,
    pendingHomeChargerKwh: 0,
    tokensEarned: 0,
    nftsEarned: 0,
    lifetimeMinted: 0,
    solarDevices: [],
    batteryDevices: [],
    evDevices: [],
    chargerDevices: [],
    deviceLabels: undefined,
  } : data;
  
  const effectiveCurrentActivity = isNewUserView ? {
    solarKwh: 0,
    evMiles: 0,
    batteryKwh: 0,
    chargingKwh: 0,
    superchargerKwh: 0,
    homeChargerKwh: 0,
  } : currentActivity;
  
  const effectiveLifetimeMinted = isNewUserView ? 0 : lifetimeMinted;
  const effectiveConnectedProviders = isNewUserView ? [] : connectedProviders;
  
  const deviceLabels = effectiveData.deviceLabels;
  const solarDevices = effectiveData.solarDevices || [];
  const batteryDevices = effectiveData.batteryDevices || [];
  const evDevices = effectiveData.evDevices || [];
  const chargerDevices = effectiveData.chargerDevices || [];
  
  const hasMultipleSolarDevices = solarDevices.length > 1;
  const hasMultipleBatteryDevices = batteryDevices.length > 1;
  const hasMultipleEvDevices = evDevices.length > 1;
  const hasMultipleChargerDevices = chargerDevices.length > 1;

  // Swipe hint for first-time users
  const { shouldShowHint, markHintSeen } = useSwipeHintShown();

  // Active charging session indicator
  const { data: isCharging = false } = useActiveChargingSession();

  // Check if provider is connected for each category (locked = cannot hide)
  const hasSolarConnected = effectiveConnectedProviders.some(p => ['tesla', 'enphase', 'solaredge'].includes(p)) && solarDevices.length > 0;
  const hasBatteryConnected = effectiveConnectedProviders.includes('tesla') && batteryDevices.length > 0;
  const hasEvConnected = effectiveConnectedProviders.includes('tesla') && evDevices.length > 0;
  // Supercharger: locked if Tesla EV is connected (vehicle API provides supercharger data)
  const hasSuperchargerConnected = effectiveConnectedProviders.includes('tesla') && evDevices.length > 0;
  
  // Home Charger: locked only if Tesla Wall Connector OR Wallbox charger is connected
  const hasTeslaWallConnector = effectiveConnectedProviders.includes('tesla') && chargerDevices.length > 0;
  const hasWallboxConnected = effectiveConnectedProviders.includes('wallbox') && chargerDevices.length > 0;
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
  const current: CurrentActivity = effectiveCurrentActivity ?? {
    solarKwh: Math.max(0, Math.floor(effectiveData.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(effectiveData.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(effectiveData.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(effectiveData.pendingChargingKwh || 0)),
    superchargerKwh: Math.max(0, Math.floor(effectiveData.pendingSuperchargerKwh || 0)),
    homeChargerKwh: Math.max(0, Math.floor(effectiveData.pendingHomeChargerKwh || 0)),
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
  const filteredProviders = effectiveConnectedProviders.filter(p => p === 'tesla' || p === 'enphase');

  // Device-specific labels (used when single device)
  // Format: (Name of system/device) + Activity Type
  const solarLabel = deviceLabels?.solar 
    ? `${deviceLabels.solar} Solar Energy Produced` 
    : 'Solar Energy Produced';
  const batteryLabel = deviceLabels?.powerwall 
    ? `${deviceLabels.powerwall} Battery Discharged` 
    : 'Battery Discharged';
  const evLabel = deviceLabels?.vehicle 
    ? `${deviceLabels.vehicle} EV Miles Driven` 
    : 'EV Miles Driven';
  const superchargerLabel = deviceLabels?.vehicle
    ? `${deviceLabels.vehicle} Tesla Supercharging`
    : 'Tesla Supercharging';
  const homeChargerLabel = deviceLabels?.wallConnector 
    ? `${deviceLabels.wallConnector} Home Charging` 
    : deviceLabels?.homeCharger
    ? `${deviceLabels.homeCharger} Home Charging`
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
            Clean Energy Center
          </h2>
          <div className="flex items-center gap-2">
          
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
         </div>

        {/* Single last updated time */}
        <RefreshIndicators lastUpdatedAt={refreshInfo?.lastUpdatedAt} />

        {/* Tesla Reconnect CTA - shown when token expired */}
        {teslaNeedsReauth && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/30"
          >
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-foreground font-medium">Tesla connection expired</span>
            </div>
            <Link 
              to="/profile" 
              className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
            >
              Reconnect
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}

        {/* Swipe Hint Tooltip - only show for first-time users with hideable fields */}
        {hasHideableFields && (
          <SwipeHintTooltip 
            show={shouldShowHint} 
            onDismiss={markHintSeen}
          />
        )}

        {/* Activity Fields - Single Column with Swipe-to-Hide */}
        {/* Order: 1. Solar, 2. Battery, 3. EV Miles, 4. Tesla Supercharger, 5. Home Charger */}
        <div className="space-y-2">
          {/* 1. Solar Fields - Show individual devices if multiple, otherwise single field */}
          {!isHidden('solar') && (
            hasMultipleSolarDevices ? (
              // Multiple solar devices - show each independently with per-device minting
              solarDevices.map((device, index) => {
                const pendingKwh = Math.floor(device.pendingKwh);
                const field = (
                  <ActivityField
                    key={device.deviceId}
                    icon={Sun}
                    label={`${device.deviceName} Solar Energy Produced`}
                    value={pendingKwh}
                    unit="kWh"
                    color="gold"
                    active={pendingKwh > 0}
                    isLoading={isLoading}
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
                  color="gold"
                  active={current.solarKwh > 0}
                  isLoading={isLoading}
                  
                  onTap={current.solarKwh > 0 && onMintRequest ? () => onMintRequest({ category: 'solar' }) : undefined}
                />
              </SwipeableActivityField>
            )
          )}
          
          {/* 2. Battery - Show individual Powerwalls if multiple */}
          {!isHidden('battery') && (
            hasMultipleBatteryDevices ? (
              batteryDevices.map((device, index) => {
                const pendingKwh = Math.floor(device.pendingKwh);
                const field = (
                  <ActivityField
                    key={device.deviceId}
                    icon={Battery}
                    label={`${device.deviceName} Battery Storage Discharged`}
                    value={pendingKwh}
                    unit="kWh"
                    color="teal"
                    active={pendingKwh > 0}
                    isLoading={isLoading}
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
                  color="teal"
                  active={current.batteryKwh > 0}
                  isLoading={isLoading}
                  onTap={current.batteryKwh > 0 && onMintRequest ? () => onMintRequest({ category: 'battery' }) : undefined}
                />
              </SwipeableActivityField>
            )
          )}
          
          {/* 3. EV Miles - Show individual vehicles if multiple */}
          {!isHidden('ev_miles') && (
            hasMultipleEvDevices ? (
              evDevices.map((device, index) => {
                const pendingMiles = Math.floor(device.pendingMiles);
                const field = (
                  <ActivityField
                    key={device.deviceId}
                    icon={Car}
                    label={`${device.deviceName} EV Miles`}
                    value={pendingMiles}
                    unit="mi"
                    color="green"
                    active={pendingMiles > 0}
                    isLoading={isLoading}
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
                  color="green"
                  active={current.evMiles > 0}
                  isLoading={isLoading}
                  onTap={current.evMiles > 0 && onMintRequest ? () => onMintRequest({ category: 'ev_miles' }) : undefined}
                />
              </SwipeableActivityField>
            )
          )}
          
          {/* 4. Tesla Supercharger + 5. Home Charger - show separate fields */}
          {hasSeparateCharging ? (
            <>
              {/* 4. Tesla Supercharger */}
              {!isHidden('supercharger') && (
                <SwipeableActivityField 
                  onHide={() => onHideField?.('supercharger')} 
                  disabled={!onHideField}
                  locked={hasSuperchargerConnected}
                >
                  <ActivityField
                    icon={Zap}
                    label={superchargerLabel}
                    value={superchargerKwh}
                    unit="kWh"
                    color="cyan"
                    active={superchargerKwh > 0}
                    isLoading={isLoading}
                    onTap={superchargerKwh > 0 && onMintRequest ? () => onMintRequest({ category: 'supercharger' }) : undefined}
                  />
                </SwipeableActivityField>
              )}
              {/* 5. Home Charger - Show individual home chargers if multiple */}
              {!isHidden('home_charger') && (
                hasMultipleChargerDevices ? (
                  chargerDevices.map((device, index) => {
                    const pendingKwh = Math.floor(device.pendingKwh);
                    const field = (
                      <ActivityField
                        key={device.deviceId}
                        icon={Zap}
                        label={`${device.deviceName} Home Charger`}
                        value={pendingKwh}
                        unit="kWh"
                        color="greenGold"
                        active={pendingKwh > 0}
                        isLoading={isLoading}
                        liveIndicator={isCharging}
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
                      color="greenGold"
                      active={homeChargerKwh > 0}
                      isLoading={isLoading}
                      liveIndicator={isCharging}
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
                color="cyan"
                active={current.chargingKwh > 0}
                isLoading={isLoading}
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
        <TotalTokensCard 
          tokensToReceive={tokensToReceive}
          activityUnits={activityUnits}
          tokenPrice={tokenPrice}
          onMintRequest={onMintRequest}
        />

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
              {effectiveLifetimeMinted?.toLocaleString() || '0'}
              <span className="text-sm font-semibold text-muted-foreground ml-1.5">$ZSOLAR</span>
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

      </CardContent>
    </Card>
  );
}

// Color mapping - ZenSolar logo-themed palette (gold, teal, green)
const colorStyles = {
  gold: { 
    gradient: 'from-amber-500 to-yellow-500',
    text: 'text-amber-500',
    glow: 'shadow-amber-500/30',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    leftBorder: 'border-l-amber-500',
  },
  teal: { 
    gradient: 'from-cyan-600 to-teal-500',
    text: 'text-teal-500',
    glow: 'shadow-teal-500/30',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    leftBorder: 'border-l-teal-500',
  },
  green: { 
    gradient: 'from-emerald-500 to-green-500',
    text: 'text-emerald-500',
    glow: 'shadow-emerald-500/30',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    leftBorder: 'border-l-emerald-500',
  },
  cyan: { 
    gradient: 'from-sky-400 to-cyan-500',
    text: 'text-cyan-500',
    glow: 'shadow-cyan-500/30',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    leftBorder: 'border-l-cyan-500',
  },
  greenGold: { 
    gradient: 'from-lime-500 to-amber-500',
    text: 'text-lime-500',
    glow: 'shadow-lime-500/30',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/30',
    leftBorder: 'border-l-lime-500',
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
  isLoading?: boolean;
  historyLink?: string;
  liveIndicator?: boolean;
}

function ActivityField({ icon: Icon, label, value, unit, color, active, onTap, isLoading = false, historyLink, liveIndicator }: ActivityFieldProps) {
  const navigate = useNavigate();
  const styles = colorStyles[color];
  const isTappable = active && onTap && !isLoading;
  
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
    // - Movement is less than threshold in any direction
    // - Touch duration is less than threshold (not a long press or scroll)
    const isQuickTap = deltaX < TOUCH_DELTA_THRESHOLD && deltaY < TOUCH_DELTA_THRESHOLD && deltaTime < TOUCH_TIME_THRESHOLD;
    
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
        "p-3.5 rounded-xl border-l-[3px] border border-border/50 transition-all flex items-center gap-3.5 relative overflow-hidden touch-manipulation",
        styles.leftBorder,
        isTappable
          ? cn("cursor-pointer bg-card hover:bg-muted/20", `hover:shadow-lg ${styles.glow}`)
          : "bg-muted/30"
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
      <div className="relative p-3 rounded-xl">
        <Icon className={cn(
          "h-5 w-5 transition-all",
          active ? styles.text : "text-muted-foreground"
        )} />
      </div>
      
      {/* Label + Value */}
      <div className="flex-1 min-w-0 relative">
        <div className="flex items-center gap-1.5">
          <p className={cn(
            "text-sm font-medium truncate transition-colors",
            active ? "text-foreground" : "text-muted-foreground"
          )}>{label}</p>
          {liveIndicator && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className={cn("h-5 w-5 animate-spin", styles.text)} />
              <span className="text-sm text-muted-foreground">Syncing...</span>
            </div>
          ) : (
            <p className={cn(
              "text-xl font-bold tracking-tight",
              active ? "text-foreground" : "text-muted-foreground"
            )}>
              {value.toLocaleString()}
              <span className="text-base font-semibold ml-1 text-muted-foreground">{unit}</span>
            </p>
          )}
        </div>
        {liveIndicator && !isLoading && (
          <p className="text-[10px] text-emerald-500 font-medium tracking-wide">Charging in progress…</p>
        )}
      </div>
      
      {/* History link icon */}
      {historyLink && !isLoading && (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(historyLink); }}
          onTouchEnd={(e) => { e.stopPropagation(); }}
          className={cn(
            "p-1.5 rounded-lg hover:bg-muted/50 transition-colors",
            styles.text
          )}
          aria-label="View energy history"
        >
          <BarChart3 className="h-4 w-4" />
        </button>
      )}
      
      {/* Tap indicator - hidden during loading */}
      {isTappable && !isLoading && (
        <div className={cn("flex items-center gap-1", styles.text)}>
          <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">Mint</span>
          <ChevronRight className="h-5 w-5" />
        </div>
      )}
    </motion.div>
  );
}

// Touch threshold constants - shared across all tappable elements
const TOUCH_DELTA_THRESHOLD = 15; // pixels - increased for better scroll detection
const TOUCH_TIME_THRESHOLD = 400; // ms - increased to allow more deliberate taps

interface TotalTokensCardProps {
  tokensToReceive: number;
  activityUnits: number;
  tokenPrice: number;
  onMintRequest?: (request: MintRequest) => void;
}

function TotalTokensCard({ tokensToReceive, activityUnits, tokenPrice, onMintRequest }: TotalTokensCardProps) {
  const isTappable = activityUnits > 0 && onMintRequest;
  
  // Track touch start position to distinguish taps from scrolls
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTap = () => {
    if (isTappable && onMintRequest) {
      onMintRequest({ category: 'all' });
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
    // - Movement is less than threshold in any direction
    // - Touch duration is less than threshold (not a long press or scroll)
    const isQuickTap = deltaX < TOUCH_DELTA_THRESHOLD && deltaY < TOUCH_DELTA_THRESHOLD && deltaTime < TOUCH_TIME_THRESHOLD;
    
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
      whileHover={isTappable ? { scale: 1.01 } : undefined}
      className={cn(
        "p-4 rounded-xl border flex items-center gap-4 transition-all relative overflow-hidden touch-manipulation",
        isTappable
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
      {isTappable && (
        <div className="relative flex items-center gap-1 text-primary">
          <span className="text-xs font-semibold uppercase tracking-wide">Mint</span>
          <ChevronRight className="h-5 w-5" />
        </div>
      )}
    </motion.div>
  );
}
