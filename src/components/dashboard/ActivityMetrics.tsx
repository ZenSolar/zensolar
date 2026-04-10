import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MintEffectButton } from './MintEffectButton';
import { useActiveChargingSession } from '@/hooks/useActiveChargingSession';
import { useMintSound } from '@/hooks/useMintSound';
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
import teslaLogo from '@/assets/logos/tesla-t-icon.png';

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

  // First-load shimmer burst → idle transition
  const [shimmerBurstDone, setShimmerBurstDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShimmerBurstDone(true), 1600);
    return () => clearTimeout(t);
  }, []);

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
    ? `${deviceLabels.powerwall} Battery Storage Exported` 
    : 'Battery Storage Exported';
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
    <div className="relative">
      {/* Outer ambient glow — lives outside the card */}
      {activityUnits > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none rounded-xl z-0"
          style={{
            background: 'radial-gradient(ellipse 20% 6% at 50% 6%, hsl(160 100% 10% / 0.006), transparent 35%)',
            animation: 'zenChargeUpPulse 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate',
          }}
        />
      )}
      <Card 
        className={cn(
          "relative z-10 overflow-hidden transition-all bg-card/5",
          activityUnits > 0 ? 'border-primary/40' : 'border-border/50'
        )}
        style={activityUnits > 0 ? { boxShadow: '0 0 2px hsl(160 100% 10% / 0.005), 0 0 1px hsl(158 95% 8% / 0.004)' } : undefined}
      >
      <CardContent className="p-2.5 pt-0 space-y-2">
        {/* Header — Clean Energy Center Hero */}
        <div 
          className="relative -mx-2.5 px-4 py-3.5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, transparent 50%, hsl(142 76% 36% / 0.03) 100%)',
            borderBottom: '1px solid hsl(142 76% 36% / 0.2)',
            boxShadow: 'inset 0 -1px 8px hsl(142 76% 36% / 0.06), inset 0 1px 8px hsl(142 76% 36% / 0.04)',
          }}
        >
          {/* Shimmer sweep */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: shimmerBurstDone
                ? 'linear-gradient(90deg, transparent 0%, hsl(205 85% 45% / 0.25) 30%, hsl(210 90% 50% / 0.45) 50%, hsl(205 85% 45% / 0.25) 70%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, hsl(205 85% 45% / 0.45) 25%, hsl(210 90% 50% / 0.75) 50%, hsl(205 85% 45% / 0.45) 75%, transparent 100%)',
              animation: shimmerBurstDone
                ? 'zenHeaderShimmer 3.5s ease-in-out infinite'
                : 'zenShimmerBurst 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
              animationDelay: shimmerBurstDone ? '1.2s' : '0.3s',
              willChange: 'transform',
            }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div 
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(142 76% 36%))',
                  boxShadow: '0 0 12px hsl(var(--primary) / 0.4), 0 0 24px hsl(var(--primary) / 0.15)',
                }}
              >
                <Gauge className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground tracking-tight leading-tight">
                  Clean Energy Center
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <RefreshIndicators lastUpdatedAt={refreshInfo?.lastUpdatedAt} />
                  {isLoading && (
                    <span className="flex items-center gap-1 text-[10px] font-normal text-muted-foreground animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Updating…
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {filteredProviders.length > 0 && (
                <div className="flex items-center gap-1">
                  {filteredProviders.map((provider) => (
                    <div 
                      key={provider}
                      className="h-6 w-6 rounded-md flex items-center justify-center overflow-hidden"
                      title={provider.charAt(0).toUpperCase() + provider.slice(1)}
                    >
                      <img 
                        src={providerLogos[provider]} 
                        alt={provider}
                        className={cn(
                          "object-contain",
                          provider === 'tesla' ? "h-5 w-5" : "h-3.5 w-3.5"
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
              <span 
                className="text-[9px] font-semibold tracking-[0.15em] uppercase text-primary"
                style={{ textShadow: '0 0 8px hsl(var(--primary) / 0.5), 0 0 16px hsl(var(--primary) / 0.25)' }}
              >
                Tap-to-Mint™
              </span>
            </div>
          </div>
        </div>

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

        {/* Swipe Hint Tooltip - only show for new users with hideable fields */}
        {isNewUserView && hasHideableFields && (
          <SwipeHintTooltip 
            show={shouldShowHint} 
            onDismiss={markHintSeen}
          />
        )}

        {/* Activity Fields - Single Column with Swipe-to-Hide */}
        {/* Order: 1. Solar, 2. Battery, 3. EV Miles, 4. Tesla Supercharger, 5. Home Charger */}
        <div className="relative overflow-hidden rounded-lg">
          {/* KPI area shimmer */}
          <div 
            className="absolute inset-0 pointer-events-none z-10 rounded-lg"
            style={{
              background: shimmerBurstDone
                ? 'linear-gradient(90deg, transparent 0%, hsl(142 76% 50% / 0.08) 30%, hsl(142 76% 65% / 0.18) 50%, hsl(142 76% 50% / 0.08) 70%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, hsl(142 76% 50% / 0.16) 25%, hsl(142 76% 65% / 0.35) 50%, hsl(142 76% 50% / 0.16) 75%, transparent 100%)',
              animation: shimmerBurstDone
                ? 'zenHeaderShimmer 3.5s ease-in-out infinite'
                : 'zenShimmerBurst 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
              animationDelay: shimmerBurstDone ? '2.4s' : '0.6s',
              willChange: 'transform',
            }}
          />
          <div className="space-y-2">
          {/* 1. Solar Fields - Show individual devices if multiple, otherwise single field */}
          {!isHidden('solar') && (
            hasMultipleSolarDevices ? (
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

        {/* Total Available Tokens - Integrated summary row */}
        <div className="pt-1.5 mt-1 border-t border-primary/15">
          <TotalTokensCard 
            tokensToReceive={tokensToReceive}
            activityUnits={activityUnits}
            tokenPrice={tokenPrice}
            onMintRequest={onMintRequest}
          />
        </div>
        </div>

      </CardContent>
    </Card>
    </div>
  );
}

// Color mapping - ZenSolar logo-themed palette (gold, teal, green)
// Particle shape clip-paths per energy category
const particleShapes: Record<string, string> = {
  // Sun ray — 4-pointed starburst
  gold: 'polygon(50% 0%, 60% 35%, 100% 50%, 60% 65%, 50% 100%, 40% 65%, 0% 50%, 40% 35%)',
  // Leaf shape — organic teardrop
  green: 'polygon(50% 0%, 80% 30%, 90% 70%, 50% 100%, 10% 70%, 20% 30%)',
  // Lightning bolt
  cyan: 'polygon(30% 0%, 70% 0%, 55% 40%, 80% 40%, 25% 100%, 40% 55%, 15% 55%)',
  // Battery / energy cell
  teal: 'polygon(20% 10%, 80% 10%, 80% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 20% 0%)',
  // Lightning bolt (charging)
  greenGold: 'polygon(30% 0%, 70% 0%, 55% 40%, 80% 40%, 25% 100%, 40% 55%, 15% 55%)',
};

// Haptic intensity per category for distinct feel
const hapticPattern: Record<string, number[]> = {
  gold: [15, 30, 10],        // Solar: warm double-pulse
  teal: [25],                // Battery: solid thump
  green: [8, 20, 8, 20, 8], // EV Miles: rapid road-rumble
  cyan: [30, 15, 30],       // Supercharger: electric zap
  greenGold: [20, 10, 20],  // Home charger: steady pulse
};

const colorStyles = {
  gold: { 
    gradient: 'from-amber-500 to-yellow-500',
    textGradient: 'from-amber-500 to-yellow-400',
    text: 'text-amber-500',
    glow: 'shadow-amber-500/30',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    leftBorder: 'border-l-amber-500',
    textGlow: '0 0 8px rgba(245, 158, 11, 0.5), 0 0 16px rgba(245, 158, 11, 0.25)',
    rgba: '245, 158, 11',
  },
  teal: { 
    gradient: 'from-cyan-600 to-teal-500',
    textGradient: 'from-cyan-500 to-teal-400',
    text: 'text-teal-500',
    glow: 'shadow-teal-500/30',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/30',
    leftBorder: 'border-l-teal-500',
    textGlow: '0 0 8px rgba(20, 184, 166, 0.5), 0 0 16px rgba(20, 184, 166, 0.25)',
    rgba: '20, 184, 166',
  },
  green: { 
    gradient: 'from-emerald-500 to-green-500',
    textGradient: 'from-emerald-500 to-green-400',
    text: 'text-emerald-500',
    glow: 'shadow-emerald-500/30',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    leftBorder: 'border-l-emerald-500',
    textGlow: '0 0 8px rgba(16, 185, 129, 0.5), 0 0 16px rgba(16, 185, 129, 0.25)',
    rgba: '16, 185, 129',
  },
  cyan: { 
    gradient: 'from-sky-400 to-cyan-500',
    textGradient: 'from-sky-400 to-cyan-400',
    text: 'text-cyan-500',
    glow: 'shadow-cyan-500/30',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    leftBorder: 'border-l-cyan-500',
    textGlow: '0 0 8px rgba(6, 182, 212, 0.5), 0 0 16px rgba(6, 182, 212, 0.25)',
    rgba: '6, 182, 212',
  },
  greenGold: { 
    gradient: 'from-lime-500 to-amber-500',
    textGradient: 'from-lime-500 to-amber-400',
    text: 'text-lime-500',
    glow: 'shadow-lime-500/30',
    bg: 'bg-lime-500/10',
    border: 'border-lime-500/30',
    leftBorder: 'border-l-lime-500',
    textGlow: '0 0 8px rgba(132, 204, 22, 0.5), 0 0 16px rgba(132, 204, 22, 0.25)',
    rgba: '132, 204, 22',
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
  showBadge?: boolean;
}

function ActivityField({ icon: Icon, label, value, unit, color, active, onTap, isLoading = false, historyLink, liveIndicator, showBadge }: ActivityFieldProps) {
  const navigate = useNavigate();
  const styles = colorStyles[color];
  const isTappable = active && onTap && !isLoading;

  // --- Consolidated interaction state via ref + single render tick ---
  interface FieldState {
    phase: 'idle' | 'pressing' | 'charging' | 'burst';
    touchPoint: { x: number; y: number } | null;
    showTapAgain: boolean;
    isSecondTap: boolean;
    burstKey: number;
  }
  const stateRef = React.useRef<FieldState>({
    phase: 'idle', touchPoint: null, showTapAgain: false, isSecondTap: false, burstKey: 0,
  });
  const [, setRenderTick] = useState(0);
  const forceRender = useCallback(() => setRenderTick(t => t + 1), []);
  const updateState = useCallback((patch: Partial<FieldState>) => {
    Object.assign(stateRef.current, patch);
    forceRender();
  }, [forceRender]);

  const shape = particleShapes[color] || '';
  const haptic = hapticPattern[color] || [15];
  const cardRef = React.useRef<HTMLDivElement>(null);
  const { primeAudio, playMintSound } = useMintSound();

  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const chargeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = React.useRef<number>(0);
  const doubleTapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreClickUntilRef = React.useRef<number>(0);
  const DOUBLE_TAP_WINDOW = 500;
  const BURST_DURATION = 1200;
  const GHOST_CLICK_SUPPRESSION = 700;

  // Pre-compute particles — stable across renders, only regenerate on new burst
  const particles = React.useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * 360 + ((i * 7 + 3) % 20 - 10); // deterministic jitter
      const rad = (angle * Math.PI) / 180;
      const dist = 50 + ((i * 13 + 7) % 70);
      return {
        tx: Math.cos(rad) * dist,
        ty: Math.sin(rad) * (20 + ((i * 11 + 5) % 30)),
        size: 7 + ((i * 9 + 4) % 6),
        rotation: (i * 37 + 11) % 360,
        delay: i * 30,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateRef.current.burstKey]);

  // Cleanup all timers
  React.useEffect(() => {
    return () => {
      if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    };
  }, []);

  const triggerBurst = useCallback((relX?: number, relY?: number) => {
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    updateState({
      phase: 'burst',
      burstKey: stateRef.current.burstKey + 1,
      isSecondTap: false,
      ...(relX !== undefined && relY !== undefined ? { touchPoint: { x: relX, y: relY } } : {}),
    });
    playMintSound(color);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(haptic); } catch { /* silent */ }
    }
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}), 120);
    }).catch(() => {});
    burstTimerRef.current = setTimeout(() => {
      updateState({ phase: 'idle', touchPoint: null });
    }, BURST_DURATION);
  }, [haptic, playMintSound, color, updateState]);

  const triggerDoubleBurst = useCallback((relX?: number, relY?: number) => {
    if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    updateState({
      phase: 'burst',
      burstKey: stateRef.current.burstKey + 1,
      isSecondTap: true,
      ...(relX !== undefined && relY !== undefined ? { touchPoint: { x: relX, y: relY } } : {}),
    });
    playMintSound(color);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([20, 50, 30]); } catch { /* silent */ }
    }
    import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {}), 100);
    }).catch(() => {});
    burstTimerRef.current = setTimeout(() => {
      updateState({ phase: 'idle', touchPoint: null, isSecondTap: false });
    }, BURST_DURATION);
  }, [playMintSound, color, updateState]);

  const getTouchRelativePos = (clientX: number, clientY: number) => {
    if (!cardRef.current) return { x: 0.5, y: 0.5 };
    const rect = cardRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  };

  const processTap = useCallback((posX: number, posY: number) => {
    primeAudio();
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (lastTapTimeRef.current > 0 && timeSinceLastTap < DOUBLE_TAP_WINDOW) {
      // ── DOUBLE TAP ── fire the mint confirmation
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = now;
      updateState({ showTapAgain: false });
      triggerDoubleBurst(posX, posY);
      // Open the mint confirmation dialog
      onTap?.();
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
      }, DOUBLE_TAP_WINDOW);
    } else {
      // ── FIRST TAP ── visual burst + "tap twice" hint
      lastTapTimeRef.current = now;
      triggerBurst(posX, posY);
      updateState({ showTapAgain: true });
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
        updateState({ showTapAgain: false });
      }, DOUBLE_TAP_WINDOW);
    }
  }, [primeAudio, triggerBurst, triggerDoubleBurst, updateState, onTap]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isTappable || !onTap) return;
    if (Date.now() < ignoreClickUntilRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const pos = getTouchRelativePos(e.clientX, e.clientY);
    processTap(pos.x, pos.y);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTappable) return;
    primeAudio();
    ignoreClickUntilRef.current = Date.now() + GHOST_CLICK_SUPPRESSION;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    const pos = getTouchRelativePos(touch.clientX, touch.clientY);
    updateState({ phase: 'pressing', touchPoint: pos });

    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    chargeTimerRef.current = setTimeout(() => {
      updateState({ phase: 'charging' });
      import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }).catch(() => {});
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(8); } catch { /* silent */ }
      }
    }, 200);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    ignoreClickUntilRef.current = Date.now() + GHOST_CLICK_SUPPRESSION;
    if (!isTappable || !touchStartRef.current) {
      updateState({ phase: 'idle', touchPoint: null });
      if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
      return;
    }

    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);

    const touch = e.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (deltaX < TOUCH_DELTA_THRESHOLD && deltaY < TOUCH_DELTA_THRESHOLD) {
      e.preventDefault();
      const pos = getTouchRelativePos(touch.clientX, touch.clientY);
      processTap(pos.x, pos.y);
    } else {
      updateState({ phase: 'idle', touchPoint: null });
    }

    touchStartRef.current = null;
  };

  const handleTouchCancel = () => {
    updateState({ phase: 'idle', touchPoint: null, showTapAgain: false });
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    touchStartRef.current = null;
  };

  // Destructure current state for render
  const { phase, touchPoint, showTapAgain, isSecondTap, burstKey } = stateRef.current;
  const isBursting = phase === 'burst';
  const isPressing = phase === 'pressing';
  const isChargingUp = phase === 'charging';


  // CSS custom properties for dynamic shadow based on color
  const shadowRest = `0 1px 3px rgba(0,0,0,0.1)`;
  const shadowGlow = `0 0 20px rgba(${styles.rgba}, 0.4), 0 0 40px rgba(${styles.rgba}, 0.15)`;

  return (
    <motion.div
      ref={cardRef}
      onClick={handleClick}
      onTouchStart={isTappable ? handleTouchStart : undefined}
      onTouchEnd={isTappable ? handleTouchEnd : undefined}
      onTouchCancel={isTappable ? handleTouchCancel : undefined}
      onContextMenu={isTappable ? (e) => e.preventDefault() : undefined}
      animate={isBursting ? { 
        scale: [0.90, 1.06, 1.02, 1],
        y: [2, -3, -1, 0],
      } : isChargingUp ? {
        scale: [1, 1.015, 1, 1.015, 1],
        y: 0,
      } : isPressing ? {
        scale: 0.93,
        y: 2,
      } : {
        scale: 1,
        y: 0,
      }}
      transition={isBursting ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] } : isChargingUp ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.12, ease: 'easeOut' }}
      style={{
        '--zen-shadow-rest': shadowRest,
        '--zen-shadow-glow': shadowGlow,
        boxShadow: isBursting 
          ? `0 0 30px rgba(${styles.rgba}, 0.5), 0 0 60px rgba(${styles.rgba}, 0.25), 0 0 90px rgba(${styles.rgba}, 0.1)` 
          : isChargingUp
            ? `0 0 20px rgba(${styles.rgba}, 0.4), 0 0 40px rgba(${styles.rgba}, 0.2)`
          : isPressing 
            ? `inset 0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(${styles.rgba}, 0.3)` 
            : isTappable
              ? `0 0 12px rgba(${styles.rgba}, 0.18), 0 0 5px rgba(${styles.rgba}, 0.12), 0 0 24px rgba(${styles.rgba}, 0.06), inset 0 0 6px rgba(${styles.rgba}, 0.06)`
              : shadowRest,
        transition: 'box-shadow 0.4s ease-out',
      } as React.CSSProperties}
       className={cn(
        "p-3.5 rounded-xl border-l-[3px] flex items-center gap-3.5 relative overflow-hidden touch-manipulation select-none",
        isTappable ? `border border-[rgba(${styles.rgba},0.2)]` : "border border-border/50",
        styles.leftBorder,
        isTappable
          ? cn("cursor-pointer bg-card/5 hover:bg-card/12 zen-glow-idle", `hover:shadow-lg ${styles.glow}`)
          : "bg-card/3"
      )}
    >
      {/* Subtle gradient overlay for active cards */}
      {active && (
        <div className={cn(
          "absolute inset-0 opacity-[0.03] bg-gradient-to-r",
          styles.gradient
        )} />
      )}

      {/* 🔵 Touch-point ripple — expands from where finger lands */}
      {(isPressing || isBursting) && touchPoint && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${touchPoint.x * 100}%`,
            top: `${touchPoint.y * 100}%`,
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle, rgba(${styles.rgba}, 0.35) 0%, transparent 70%)`,
            animation: isBursting 
              ? 'zenTouchRipple 900ms ease-out forwards' 
              : undefined,
            transform: isPressing && !isBursting 
              ? 'translate(-50%, -50%) scale(0.3)' 
              : undefined,
            opacity: isPressing && !isBursting ? 0.4 : undefined,
            transition: !isBursting ? 'transform 0.15s ease-out, opacity 0.15s ease-out' : undefined,
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* ⚡ Pressure shockwave ring — from touch point on release */}
      {isBursting && touchPoint && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${touchPoint.x * 100}%`,
            top: `${touchPoint.y * 100}%`,
            width: '300%',
            height: '300%',
            border: `3px solid rgba(${styles.rgba}, 1)`,
            animation: 'zenPressureWave 800ms ease-out forwards',
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* ⚡ Solar Flare Burst — radiating rings + particles on tap */}
      {isBursting && (
        <>
          {/* Expanding energy rings — 4 staggered waves */}
          {[0, 1, 2, 3].map(i => (
            <div
              key={`ring-${burstKey}-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: touchPoint ? `${touchPoint.x * 100}%` : 28,
                top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
                width: 20,
                height: 20,
                marginLeft: touchPoint ? -10 : 0,
                marginTop: -10,
                borderRadius: '50%',
                border: `3px solid rgba(${styles.rgba}, ${1 - i * 0.12})`,
                animation: `zenFlareRing 900ms ${i * 120}ms ease-out forwards`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
          {/* Shaped energy particles — 16 particles, pre-computed layout */}
          {particles.map((p, i) => (
            <div
              key={`particle-${burstKey}-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: touchPoint ? `${touchPoint.x * 100}%` : 28,
                top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
                width: p.size,
                height: p.size,
                background: `rgba(${styles.rgba}, 1)`,
                boxShadow: `0 0 16px rgba(${styles.rgba}, 1), 0 0 32px rgba(${styles.rgba}, 0.5)`,
                clipPath: shape,
                transform: `rotate(${p.rotation}deg)`,
                animation: `zenFlareParticle 900ms ${p.delay}ms ease-out forwards`,
                willChange: 'transform, opacity',
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
              } as React.CSSProperties}
            />
          ))}
          {/* Energy release glow — larger, more intense */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: touchPoint ? `${touchPoint.x * 100}%` : 28,
              top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
              width: 100,
              height: 100,
              marginLeft: touchPoint ? -50 : -22,
              marginTop: -50,
              background: `radial-gradient(circle, rgba(${styles.rgba}, 0.9) 0%, rgba(${styles.rgba}, 0.4) 40%, transparent 70%)`,
              animation: 'zenEnergyRelease 800ms ease-out forwards',
              willChange: 'transform, opacity',
            }}
          />
        </>
      )}

      {/* ⚡ Category-specific burst overlay — original on 1st tap, complementary on 2nd */}
      {isBursting && !isSecondTap && (
        <>
          {color === 'gold' && (
            /* Solar — radial sunburst rays */
            <div
              className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
              style={{
                backgroundImage: `repeating-conic-gradient(from 0deg, rgba(${styles.rgba}, 0.35) 0deg, transparent 8deg, transparent 22.5deg)`,
                backgroundPosition: touchPoint ? `${touchPoint.x * 100}% ${touchPoint.y * 100}%` : 'center',
                animation: 'zenGridFlash 1200ms ease-out forwards',
                willChange: 'opacity',
              }}
            />
          )}
          {color === 'teal' && (
            /* Battery — horizontal energy level bars */
            <div
              className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(${styles.rgba}, 0.3) 6px, rgba(${styles.rgba}, 0.3) 8px)`,
                animation: 'zenGridFlash 1200ms ease-out forwards',
                willChange: 'opacity',
              }}
            />
          )}
          {color === 'green' && (
            /* EV Miles — diagonal speed lines (top-left to bottom-right) */
            <div
              className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
              style={{
                backgroundImage: `repeating-linear-gradient(-30deg, transparent, transparent 10px, rgba(${styles.rgba}, 0.3) 10px, rgba(${styles.rgba}, 0.3) 12px)`,
                animation: 'zenGridSweep 800ms ease-out forwards',
                backgroundSize: '300% 300%',
                willChange: 'opacity, background-position',
              }}
            />
          )}
          {color === 'cyan' && (
            /* Supercharger — vertical lightning streaks */
            <>
              {[20, 45, 70].map((xPos, i) => (
                <div
                  key={`bolt-${i}`}
                  className="absolute pointer-events-none z-[5]"
                  style={{
                    left: `${xPos}%`,
                    top: 0,
                    width: 3,
                    height: '100%',
                    background: `linear-gradient(180deg, rgba(${styles.rgba}, 0.8), rgba(${styles.rgba}, 0) 80%)`,
                    boxShadow: `0 0 8px rgba(${styles.rgba}, 0.6)`,
                    animation: `zenGridFlash 700ms ${i * 100}ms ease-out forwards`,
                    willChange: 'opacity',
                  }}
                />
              ))}
            </>
          )}
          {color === 'greenGold' && (
            /* Home Charger — concentric circuit rings */
            <>
              {[1, 2, 3].map((ring) => (
                <div
                  key={`circuit-${ring}`}
                  className="absolute pointer-events-none rounded-full z-[5]"
                  style={{
                    left: touchPoint ? `${touchPoint.x * 100}%` : '50%',
                    top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
                    width: ring * 50,
                    height: ring * 50,
                    marginLeft: -(ring * 25),
                    marginTop: -(ring * 25),
                    border: `1.5px dashed rgba(${styles.rgba}, ${0.7 - ring * 0.15})`,
                    boxShadow: `0 0 6px rgba(${styles.rgba}, 0.3)`,
                    animation: `zenGridFlash 1000ms ${ring * 100}ms ease-out forwards`,
                    willChange: 'opacity',
                  }}
                />
              ))}
            </>
          )}
          {/* Diagonal energy sweep — all categories */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
            style={{
              backgroundImage: `linear-gradient(135deg, transparent 25%, rgba(${styles.rgba}, 0.3) 42%, rgba(${styles.rgba}, 0.5) 50%, rgba(${styles.rgba}, 0.3) 58%, transparent 75%)`,
              backgroundSize: '300% 300%',
              animation: 'zenGridSweep 800ms ease-out forwards',
              willChange: 'opacity, background-position',
            }}
          />
        </>
      )}

      {/* 🔄 Complementary burst overlay — opposite pattern on 2nd tap */}
      {isBursting && isSecondTap && (
        <>
          {color === 'gold' && (
            /* Solar complement — concentric pulsing circles (opposite of radial rays) */
            <>
              {[1, 2, 3, 4].map((ring) => (
                <div
                  key={`sun-ring-${ring}`}
                  className="absolute pointer-events-none rounded-full z-[5]"
                  style={{
                    left: touchPoint ? `${touchPoint.x * 100}%` : '50%',
                    top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
                    width: ring * 40,
                    height: ring * 40,
                    marginLeft: -(ring * 20),
                    marginTop: -(ring * 20),
                    border: `2px solid rgba(${styles.rgba}, ${0.8 - ring * 0.15})`,
                    boxShadow: `0 0 10px rgba(${styles.rgba}, 0.4)`,
                    animation: `zenFlareRing 900ms ${ring * 80}ms ease-out forwards`,
                    willChange: 'transform, opacity',
                  }}
                />
              ))}
            </>
          )}
          {color === 'teal' && (
            /* Battery complement — vertical energy bars (opposite of horizontal) */
            <div
              className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(${styles.rgba}, 0.3) 6px, rgba(${styles.rgba}, 0.3) 8px)`,
                animation: 'zenGridFlash 1200ms ease-out forwards',
                willChange: 'opacity',
              }}
            />
          )}
          {color === 'green' && (
            /* EV complement — opposite diagonal lines (bottom-left to top-right) */
            <div
              className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
              style={{
                backgroundImage: `repeating-linear-gradient(30deg, transparent, transparent 10px, rgba(${styles.rgba}, 0.3) 10px, rgba(${styles.rgba}, 0.3) 12px)`,
                animation: 'zenGridSweep 800ms ease-out forwards',
                backgroundSize: '300% 300%',
                willChange: 'opacity, background-position',
              }}
            />
          )}
          {color === 'cyan' && (
            /* Supercharger complement — horizontal lightning streaks (opposite of vertical) */
            <>
              {[25, 50, 75].map((yPos, i) => (
                <div
                  key={`h-bolt-${i}`}
                  className="absolute pointer-events-none z-[5]"
                  style={{
                    top: `${yPos}%`,
                    left: 0,
                    height: 3,
                    width: '100%',
                    background: `linear-gradient(90deg, rgba(${styles.rgba}, 0.8), rgba(${styles.rgba}, 0) 80%)`,
                    boxShadow: `0 0 8px rgba(${styles.rgba}, 0.6)`,
                    animation: `zenGridFlash 700ms ${i * 100}ms ease-out forwards`,
                    willChange: 'opacity',
                  }}
                />
              ))}
            </>
          )}
          {color === 'greenGold' && (
            /* Home Charger complement — radial spokes (opposite of concentric rings) */
            <div
              className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
              style={{
                backgroundImage: `repeating-conic-gradient(from 0deg at ${touchPoint ? `${touchPoint.x * 100}% ${touchPoint.y * 100}%` : '50% 50%'}, rgba(${styles.rgba}, 0.3) 0deg, transparent 12deg, transparent 30deg)`,
                animation: 'zenGridFlash 1000ms ease-out forwards',
                willChange: 'opacity',
              }}
            />
          )}
          {/* Opposite diagonal sweep — sweeps the other direction */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
            style={{
              backgroundImage: `linear-gradient(-135deg, transparent 25%, rgba(${styles.rgba}, 0.3) 42%, rgba(${styles.rgba}, 0.5) 50%, rgba(${styles.rgba}, 0.3) 58%, transparent 75%)`,
              backgroundSize: '300% 300%',
              animation: 'zenGridSweep 800ms ease-out forwards',
              willChange: 'opacity, background-position',
            }}
          />
        </>
      )}

      {/* ✨ Charging-up phase — pulsing border glow after burst settles */}
      {isChargingUp && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            border: `2px solid rgba(${styles.rgba}, 0.5)`,
            animation: 'zenChargeUpPulse 600ms ease-in-out infinite alternate',
            willChange: 'opacity, box-shadow',
            boxShadow: `inset 0 0 20px rgba(${styles.rgba}, 0.1), 0 0 25px rgba(${styles.rgba}, 0.3)`,
          }}
        />
      )}
      
      {/* Icon with gradient background */}
      <div className="relative p-3 rounded-xl" style={(isBursting || isChargingUp) ? { 
        filter: `drop-shadow(0 0 ${isBursting ? 8 : 5}px rgba(${styles.rgba}, ${isBursting ? 0.8 : 0.5}))`,
        transition: 'all 200ms ease-out',
      } : isPressing ? {
        filter: `drop-shadow(0 0 4px rgba(${styles.rgba}, 0.4))`,
        transition: 'all 100ms ease-out',
      } : { transition: 'all 200ms ease-out' }}>
        <Icon className={cn(
          "h-5 w-5 transition-all",
          active ? styles.text : "text-muted-foreground",
          isBursting && "scale-125"
        )} />
      </div>
      
      {/* Label + Value */}
      <div className="flex-1 min-w-0 relative">
        <div className="flex items-center gap-1.5">
          <p 
            className={cn(
              "text-sm font-medium truncate transition-all duration-300",
              active ? "text-foreground" : "text-muted-foreground"
            )}
          >{label}</p>
          {liveIndicator && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading && value === 0 ? (
            <div className="flex items-center gap-2">
              <Loader2 className={cn("h-5 w-5 animate-spin", styles.text)} />
              <span className="text-sm text-muted-foreground">Syncing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold tracking-tight">
                <span className={cn(
                  "transition-all duration-300",
                  active ? "text-foreground" : "text-muted-foreground"
                )} style={isBursting ? { textShadow: styles.textGlow, transition: 'text-shadow 200ms ease-out' } : { transition: 'text-shadow 200ms ease-out' }}>
                  {value.toLocaleString()}
                </span>
                <span className="text-base font-semibold ml-1 text-muted-foreground">{unit}</span>
              </p>
              {isLoading && value > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating
                </span>
              )}
            </div>
          )}
        </div>
        {liveIndicator && !(isLoading && value === 0) && (
          <p className="text-[10px] text-emerald-500 font-medium tracking-wide">Charging in progress…</p>
        )}
      </div>
      
      {/* History link icon */}
      {historyLink && !(isLoading && value === 0) && (
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
      
      {/* Mint button — stamps on press */}
      {isTappable && !isLoading && (
        <div 
          className={cn("flex items-center gap-1 shrink-0", styles.text)}
          style={isBursting ? {
            animation: 'zenMintStamp 400ms ease-out',
          } : isPressing ? {
            transform: 'scale(0.9)',
            opacity: 0.7,
            transition: 'all 0.1s ease-out',
          } : {
            transition: 'all 0.2s ease-out',
          }}
        >
          <div className="relative h-4 min-w-[52px] flex items-center justify-end">
            {/* Default MINT text */}
            <span 
              className={cn(
                "text-xs font-semibold uppercase tracking-wider transition-all duration-400 ease-out absolute right-0",
                showTapAgain ? "opacity-0 scale-90 blur-[2px]" : "opacity-100 scale-100 blur-0"
              )}
            >
              Mint
            </span>
            {/* "Tap again" hint — fades in */}
            <span 
              className={cn(
                "text-[11px] font-medium tracking-wide absolute right-0 transition-all duration-400 ease-out",
                showTapAgain ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-[2px]"
              )}
              style={showTapAgain ? {
                animation: 'zenTapAgainPulse 1.2s ease-in-out infinite',
              } : undefined}
            >
              tap twice
            </span>
          </div>
          <ChevronRight className={cn(
            "h-4 w-4 transition-all duration-300",
            isBursting && "translate-x-1",
            showTapAgain && "animate-pulse opacity-70"
          )} />
        </div>
      )}
    </motion.div>
  );
}

// Touch threshold constants - shared across all tappable elements
const TOUCH_DELTA_THRESHOLD = 15;

interface TotalTokensCardProps {
  tokensToReceive: number;
  activityUnits: number;
  tokenPrice: number;
  onMintRequest?: (request: MintRequest) => void;
}

function TotalTokensCard({ tokensToReceive, activityUnits, tokenPrice, onMintRequest }: TotalTokensCardProps) {
  const isTappable = activityUnits > 0 && !!onMintRequest;

  const handleMint = () => {
    if (onMintRequest) {
      onMintRequest({ category: 'all' });
    }
  };

  const content = (
    <>
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
    </>
  );

  if (isTappable) {
    return (
      <MintEffectButton
        onClick={handleMint}
        className={cn(
          "p-3 rounded-lg border flex items-center gap-3 transition-all relative overflow-hidden w-full",
          "border-primary/30 bg-primary/5 hover:border-primary/50"
        )}
      >
        {content}
      </MintEffectButton>
    );
  }

  return (
    <div className="p-3 rounded-lg border flex items-center gap-3 transition-all relative overflow-hidden border-border/30 bg-muted/20 w-full">
      {content}
    </div>
  );
}
