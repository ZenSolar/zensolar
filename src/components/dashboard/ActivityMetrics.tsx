import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ShimmerOverlay } from './ShimmerOverlay';
import { MintEffectButton } from './MintEffectButton';
import { useActiveChargingSession } from '@/hooks/useActiveChargingSession';
import { useMintSound } from '@/hooks/useMintSound';
import { useShimmerSound } from '@/hooks/useShimmerSound';
import { useSoundPreference } from '@/hooks/useSoundPreference';
import { ActivityData, SolarDeviceData, BatteryDeviceData, EVDeviceData, ChargerDeviceData } from '@/types/dashboard';
import { getRewardMultiplier } from '@/lib/tokenomics';
import { Link, useNavigate } from 'react-router-dom';
import { useBasePath } from '@/hooks/useBasePath';
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
import { useDeviceLabels } from '@/hooks/useDeviceLabels';
import type { HideableField } from '@/hooks/useHiddenActivityFields';

// Import brand logos for connected providers display
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import teslaLogo from '@/assets/logos/tesla-t-icon.png';
import teslaWordmark from '@/assets/logos/tesla-wordmark.png';

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
  const basePath = useBasePath();
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

  // shimmerBurstDone removed — ShimmerOverlay handles burst→idle crossfade internally

  // Swipe hint for first-time users
  const { shouldShowHint, markHintSeen } = useSwipeHintShown();

  // Active charging session indicator
  const { data: isCharging = false } = useActiveChargingSession();

  // Sound preference — respects global toggle
  const { soundEnabled } = useSoundPreference();

  // Lightsaber ambient hum — synced with shimmer sweep
  useShimmerSound({ cycleDuration: 5, volume: 0.03, enabled: !isNewUserView && soundEnabled });

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

  // Device-specific labels — pull live names from connected_devices when available.
  // Priority: explicit data.deviceLabels (demo / mirror) > live hook > generic fallback.
  const liveLabels = useDeviceLabels();
  const passedLabels = effectiveData.deviceLabels;
  const solarName = (passedLabels?.solar ?? liveLabels.solar)?.trim();
  const batteryName = (passedLabels?.powerwall ?? liveLabels.powerwall)?.trim();
  const vehicleName = (passedLabels?.vehicle ?? liveLabels.vehicle)?.trim();
  const homeChargerName = (passedLabels?.homeCharger ?? liveLabels.homeCharger)?.trim();

  const solarLabel = solarName ? `${solarName} Solar Production` : 'Solar Production';
  const batteryLabel = batteryName ? `${batteryName} Exported kWh` : 'Battery Exported kWh';
  const evLabel = vehicleName ? `${vehicleName} EV Miles` : 'EV Miles';
  const superchargerLabel = vehicleName ? `${vehicleName} Supercharging` : 'Tesla Supercharging';
  // Home Charging label: prefer dedicated home charger name, otherwise tag the vehicle's home charging
  const homeChargerLabel = homeChargerName
    ? `${homeChargerName} Home Charging`
    : vehicleName
      ? `${vehicleName} Home Charging`
      : 'Home Charging';

  // Header subtitle — "Your <Vehicle> · ☀️ <Solar> · 🔋 <Battery> · <Vehicle> EV Charging kWh"
  // Icons disambiguate when the same device name powers both solar and battery (e.g. ZenCasa).
  const evChargingLabel = vehicleName ? `${vehicleName} EV Charging kWh` : 'EV Charging kWh';
  const headerSubtitleParts: { label: string; icon?: 'sun' | 'battery' }[] = [
    vehicleName ? { label: `Your ${vehicleName}` } : null,
    solarName ? { label: solarName, icon: 'sun' as const } : null,
    batteryName ? { label: batteryName, icon: 'battery' as const } : null,
    { label: evChargingLabel },
  ].filter(Boolean) as { label: string; icon?: 'sun' | 'battery' }[];
  const headerSubtitle = headerSubtitleParts.length > 1
    ? headerSubtitleParts.map(p => p.label).join(' · ')
    : 'Your Connected Energy';

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
          "relative z-10 overflow-hidden transition-all bg-card/95 backdrop-blur-md card-neon-glow",
          activityUnits > 0 ? 'border-primary/40' : 'border-border/50'
        )}
      >
        {/* KPI area rainbow shimmer — moved inside body so it doesn't bleed into the header */}
      <CardContent className="p-2.5 pt-0 space-y-2">
        {/* Header — Clean Energy Center Hero */}
        <div 
          id="cec-header"
          className="relative -mx-2.5 px-4 py-3.5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, transparent 50%, hsl(142 76% 36% / 0.03) 100%)',
            borderBottom: '1px solid hsl(142 76% 36% / 0.2)',
            boxShadow: 'inset 0 -1px 8px hsl(142 76% 36% / 0.06), inset 0 1px 8px hsl(142 76% 36% / 0.04)',
          }}
        >
          {/* Shimmer sweep — vivid electric blue */}
          <ShimmerOverlay
            gradient="linear-gradient(90deg, transparent 0%, hsl(210 100% 62% / 0.55) 15%, hsl(200 100% 55% / 0.7) 35%, hsl(215 100% 60% / 0.75) 50%, hsl(200 100% 55% / 0.65) 65%, hsl(210 100% 62% / 0.5) 85%, transparent 100%)"
            glowColor="hsla(210, 100%, 58%, 0.35)"
            duration="4s"
            idleDelay="0.5s"
          />

          <div className="relative space-y-3">
            {/* Centered title row with Tesla wordmark */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground tracking-tight leading-tight">
                  Clean Energy Center
                </h2>
                <div 
                  className="h-7 w-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(142 76% 36%))',
                    boxShadow: '0 0 10px hsl(var(--primary) / 0.35), 0 0 20px hsl(var(--primary) / 0.12)',
                  }}
                >
                  <Gauge className="h-4 w-4 text-white" />
                </div>
              </div>
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

            {/* Proof badges — 2x2 grid */}
            <div className="grid grid-cols-2 justify-center gap-x-0 gap-y-0 mx-auto w-fit">
              {[
                { label: 'Tap-to-Mint™', color: 'hsl(var(--primary))', glow: 'hsl(var(--primary) / 0.5)', glowFar: 'hsl(var(--primary) / 0.25)', useClass: true },
                { label: 'Proof-of-Mint™', color: 'hsl(142 76% 50% / 0.85)', glow: 'hsl(142 76% 45% / 0.6)', glowFar: 'hsl(142 76% 45% / 0.3)' },
                { label: 'Proof-of-Origin™', color: 'hsl(25 95% 60% / 0.85)', glow: 'hsl(25 95% 55% / 0.6)', glowFar: 'hsl(25 95% 55% / 0.3)' },
                { label: 'Proof-of-Delta™', color: 'hsl(270 80% 68% / 0.85)', glow: 'hsl(270 80% 60% / 0.6)', glowFar: 'hsl(270 80% 60% / 0.3)' },
              ].map((badge, i) => (
                <motion.span
                  key={badge.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.12, duration: 0.4, ease: 'easeOut' }}
                  className={cn(
                    "flex min-w-[105px] justify-center text-center text-[8px] font-semibold tracking-[0.12em] uppercase whitespace-nowrap",
                    badge.useClass && "text-primary"
                  )}
                  style={{
                    ...(badge.useClass ? {} : { color: badge.color }),
                    textShadow: `0 0 10px ${badge.glow}, 0 0 20px ${badge.glowFar}`,
                    animation: `badge-pulse-${i} 3s ease-in-out ${0.3 + i * 0.12 + 0.4}s infinite`,
                  }}
                >
                  {badge.label}
                </motion.span>
              ))}
              <style>{`
                @keyframes badge-pulse-0 { 0%, 100% { text-shadow: 0 0 10px hsl(var(--primary) / 0.5), 0 0 20px hsl(var(--primary) / 0.25); } 50% { text-shadow: 0 0 14px hsl(var(--primary) / 0.7), 0 0 28px hsl(var(--primary) / 0.4); } }
                @keyframes badge-pulse-1 { 0%, 100% { text-shadow: 0 0 10px hsl(142 76% 45% / 0.6), 0 0 20px hsl(142 76% 45% / 0.3); } 50% { text-shadow: 0 0 14px hsl(142 76% 45% / 0.8), 0 0 28px hsl(142 76% 45% / 0.5); } }
                @keyframes badge-pulse-2 { 0%, 100% { text-shadow: 0 0 10px hsl(25 95% 55% / 0.6), 0 0 20px hsl(25 95% 55% / 0.3); } 50% { text-shadow: 0 0 14px hsl(25 95% 55% / 0.8), 0 0 28px hsl(25 95% 55% / 0.5); } }
                @keyframes badge-pulse-3 { 0%, 100% { text-shadow: 0 0 10px hsl(270 80% 60% / 0.6), 0 0 20px hsl(270 80% 60% / 0.3); } 50% { text-shadow: 0 0 14px hsl(270 80% 60% / 0.8), 0 0 28px hsl(270 80% 60% / 0.3); } }
              `}</style>
            </div>

            {/* Connected providers — centered below */}
            {filteredProviders.length > 0 && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-[10px] uppercase tracking-wider font-medium"
                    style={{ 
                      color: 'hsl(var(--primary) / 0.8)',
                      textShadow: '0 0 8px hsl(var(--primary) / 0.5), 0 0 16px hsl(var(--primary) / 0.2)',
                    }}
                  >Connected</span>
                  <div className="flex items-center gap-1.5">
                    {filteredProviders.map((provider) => (
                      provider === 'tesla' ? (
                        <div 
                          key={provider}
                          className="h-6 rounded-md flex items-center justify-center border border-primary/30 bg-primary/5 px-1.5"
                          title="Tesla"
                          style={{ boxShadow: '0 0 8px hsl(var(--primary) / 0.2)' }}
                        >
                          <img 
                            src={teslaWordmark} 
                            alt="Tesla" 
                            className="h-3 object-contain"
                            style={{ filter: 'brightness(2.5) grayscale(0.1)', opacity: 0.85 }}
                          />
                        </div>
                      ) : (
                        <div 
                          key={provider}
                          className="h-6 w-6 rounded-md flex items-center justify-center border border-primary/30 bg-primary/5"
                          title={provider.charAt(0).toUpperCase() + provider.slice(1)}
                          style={{ boxShadow: '0 0 8px hsl(var(--primary) / 0.2)' }}
                        >
                          <img 
                            src={providerLogos[provider]} 
                            alt={provider}
                            className="h-3.5 w-3.5 object-contain"
                          />
                        </div>
                      )
                    ))}
                  </div>
                </div>
                <span 
                  className="text-[9px] font-medium tracking-wide inline-flex flex-wrap justify-center items-baseline gap-x-1 gap-y-0.5 px-1 leading-snug"
                  style={{ 
                    color: 'hsl(38 92% 65% / 0.9)',
                    textShadow: '0 0 8px hsl(38 92% 55% / 0.4)',
                  }}
                >
                  {headerSubtitleParts.length > 1 ? (
                    headerSubtitleParts.map((part, i) => (
                      <span key={i} className="inline-flex items-baseline whitespace-nowrap">
                        {part.icon === 'sun' && (
                          <span className="mr-0.5 no-underline" aria-hidden="true">☀️</span>
                        )}
                        {part.icon === 'battery' && (
                          <span className="mr-0.5 no-underline" aria-hidden="true">🔋</span>
                        )}
                        <span
                          className="underline decoration-[0.5px] underline-offset-[3px]"
                          style={{ textDecorationColor: 'hsl(38 92% 60% / 0.5)' }}
                        >
                          {part.label}
                        </span>
                        {i < headerSubtitleParts.length - 1 && (
                          <span className="ml-1 no-underline opacity-70" aria-hidden="true">·</span>
                        )}
                      </span>
                    ))
                  ) : (
                    headerSubtitle
                  )}
                </span>
              </div>
            )}
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
              to={`${basePath}/profile`} 
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
        <div className="relative overflow-hidden rounded-lg" data-hint-target="kpi-cards">
          {/* Rainbow shimmer — scoped to KPI body only */}
          <ShimmerOverlay
            gradient="linear-gradient(90deg, transparent 0%, hsl(340 85% 58% / 0.25) 8%, hsl(30 90% 55% / 0.35) 22%, hsl(60 85% 50% / 0.3) 36%, hsl(155 90% 50% / 0.45) 52%, hsl(210 85% 55% / 0.4) 68%, hsl(280 70% 58% / 0.3) 84%, transparent 100%)"
            glowColor="hsla(155, 85%, 45%, 0.15)"
            duration="4s"
            idleDelay="1.0s"
            className="z-0 inset-0"
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

// Semantic-token color styles — maps category → design system tokens
// gold→accent-warm (solar), teal→primary (battery, brand emerald),
// green→accent-cool (EV miles), cyan→accent-rare (supercharger),
// greenGold→accent-warm (home charger, warm energy)
const colorStyles = {
  gold: {
    gradient: 'from-accent-warm to-accent-warm/70',
    textGradient: 'from-accent-warm to-accent-warm/80',
    text: 'text-accent-warm',
    glow: 'shadow-accent-warm/30',
    bg: 'bg-accent-warm/10',
    border: 'border-accent-warm/30',
    leftBorder: 'border-l-accent-warm',
    textGlow: '0 0 8px hsl(var(--accent-warm) / 0.5), 0 0 16px hsl(var(--accent-warm) / 0.25)',
    rgba: 'var(--accent-warm)',
  },
  teal: {
    gradient: 'from-primary to-primary/70',
    textGradient: 'from-primary to-primary/80',
    text: 'text-primary',
    glow: 'shadow-primary/30',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    leftBorder: 'border-l-primary',
    textGlow: '0 0 8px hsl(var(--primary) / 0.5), 0 0 16px hsl(var(--primary) / 0.25)',
    rgba: 'var(--primary)',
  },
  green: {
    gradient: 'from-accent-cool to-accent-cool/70',
    textGradient: 'from-accent-cool to-accent-cool/80',
    text: 'text-accent-cool',
    glow: 'shadow-accent-cool/30',
    bg: 'bg-accent-cool/10',
    border: 'border-accent-cool/30',
    leftBorder: 'border-l-accent-cool',
    textGlow: '0 0 8px hsl(var(--accent-cool) / 0.5), 0 0 16px hsl(var(--accent-cool) / 0.25)',
    rgba: 'var(--accent-cool)',
  },
  cyan: {
    gradient: 'from-accent-rare to-accent-rare/70',
    textGradient: 'from-accent-rare to-accent-rare/80',
    text: 'text-accent-rare',
    glow: 'shadow-accent-rare/30',
    bg: 'bg-accent-rare/10',
    border: 'border-accent-rare/30',
    leftBorder: 'border-l-accent-rare',
    textGlow: '0 0 8px hsl(var(--accent-rare) / 0.5), 0 0 16px hsl(var(--accent-rare) / 0.25)',
    rgba: 'var(--accent-rare)',
  },
  greenGold: {
    gradient: 'from-accent-warm to-primary',
    textGradient: 'from-accent-warm to-primary',
    text: 'text-accent-warm',
    glow: 'shadow-accent-warm/30',
    bg: 'bg-accent-warm/10',
    border: 'border-accent-warm/30',
    leftBorder: 'border-l-accent-warm',
    textGlow: '0 0 8px hsl(var(--accent-warm) / 0.5), 0 0 16px hsl(var(--primary) / 0.25)',
    rgba: 'var(--accent-warm)',
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
  const colorIndex = Object.keys(colorStyles).indexOf(color);
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
  const shadowGlow = `0 0 20px hsl(${styles.rgba} / 0.4), 0 0 40px hsl(${styles.rgba} / 0.15)`;

  return (
    <motion.div
      ref={cardRef}
      data-kpi-field
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
      } : isTappable ? {
        y: [0, 2, 0],
        scale: [1, 0.98, 1],
      } : {
        scale: 1,
        y: 0,
      }}
      transition={isBursting ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] } : isChargingUp ? { duration: 1, repeat: Infinity, ease: 'easeInOut' as const } : isPressing ? { duration: 0.12, ease: 'easeOut' as const } : isTappable ? { duration: 1.6, repeat: Infinity, repeatDelay: colorIndex * 0.5 + 0.8, ease: 'easeInOut' as const } : { duration: 0.12, ease: 'easeOut' as const }}
      style={{
        '--zen-shadow-rest': shadowRest,
        '--zen-shadow-glow': shadowGlow,
        boxShadow: isBursting 
          ? `0 0 30px hsl(${styles.rgba} / 0.5), 0 0 60px hsl(${styles.rgba} / 0.25), 0 0 90px hsl(${styles.rgba} / 0.1)` 
          : isChargingUp
            ? `0 0 20px hsl(${styles.rgba} / 0.4), 0 0 40px hsl(${styles.rgba} / 0.2)`
          : isPressing 
            ? `inset 0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px hsl(${styles.rgba} / 0.3)` 
            : isTappable
              ? `0 0 12px hsl(${styles.rgba} / 0.18), 0 0 5px hsl(${styles.rgba} / 0.12), 0 0 24px hsl(${styles.rgba} / 0.06), inset 0 0 6px hsl(${styles.rgba} / 0.06)`
              : shadowRest,
        transition: 'box-shadow 0.4s ease-out',
      } as React.CSSProperties}
       className={cn(
        "p-3.5 rounded-xl border-l-[3px] flex items-center gap-3.5 relative overflow-hidden touch-manipulation select-none",
        isTappable ? `border border-[hsl(${styles.rgba} / 0.2)]` : "border border-border/50",
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
            background: `radial-gradient(circle, hsl(${styles.rgba} / 0.35) 0%, transparent 70%)`,
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
            border: `3px solid hsl(${styles.rgba} / 1)`,
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
                border: `3px solid hsl(${styles.rgba} / ${1 - i * 0.12})`,
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
                background: `hsl(${styles.rgba} / 1)`,
                boxShadow: `0 0 16px hsl(${styles.rgba} / 1), 0 0 32px hsl(${styles.rgba} / 0.5)`,
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
              background: `radial-gradient(circle, hsl(${styles.rgba} / 0.9) 0%, hsl(${styles.rgba} / 0.4) 40%, transparent 70%)`,
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
                backgroundImage: `repeating-conic-gradient(from 0deg, hsl(${styles.rgba} / 0.35) 0deg, transparent 8deg, transparent 22.5deg)`,
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
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 6px, hsl(${styles.rgba} / 0.3) 6px, hsl(${styles.rgba} / 0.3) 8px)`,
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
                backgroundImage: `repeating-linear-gradient(-30deg, transparent, transparent 10px, hsl(${styles.rgba} / 0.3) 10px, hsl(${styles.rgba} / 0.3) 12px)`,
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
                    background: `linear-gradient(180deg, hsl(${styles.rgba} / 0.8), hsl(${styles.rgba} / 0) 80%)`,
                    boxShadow: `0 0 8px hsl(${styles.rgba} / 0.6)`,
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
                    border: `1.5px dashed hsl(${styles.rgba} / ${0.7 - ring * 0.15})`,
                    boxShadow: `0 0 6px hsl(${styles.rgba} / 0.3)`,
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
              backgroundImage: `linear-gradient(135deg, transparent 25%, hsl(${styles.rgba} / 0.3) 42%, hsl(${styles.rgba} / 0.5) 50%, hsl(${styles.rgba} / 0.3) 58%, transparent 75%)`,
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
                    border: `2px solid hsl(${styles.rgba} / ${0.8 - ring * 0.15})`,
                    boxShadow: `0 0 10px hsl(${styles.rgba} / 0.4)`,
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
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 6px, hsl(${styles.rgba} / 0.3) 6px, hsl(${styles.rgba} / 0.3) 8px)`,
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
                backgroundImage: `repeating-linear-gradient(30deg, transparent, transparent 10px, hsl(${styles.rgba} / 0.3) 10px, hsl(${styles.rgba} / 0.3) 12px)`,
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
                    background: `linear-gradient(90deg, hsl(${styles.rgba} / 0.8), hsl(${styles.rgba} / 0) 80%)`,
                    boxShadow: `0 0 8px hsl(${styles.rgba} / 0.6)`,
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
                backgroundImage: `repeating-conic-gradient(from 0deg at ${touchPoint ? `${touchPoint.x * 100}% ${touchPoint.y * 100}%` : '50% 50%'}, hsl(${styles.rgba} / 0.3) 0deg, transparent 12deg, transparent 30deg)`,
                animation: 'zenGridFlash 1000ms ease-out forwards',
                willChange: 'opacity',
              }}
            />
          )}
          {/* Opposite diagonal sweep — sweeps the other direction */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
            style={{
              backgroundImage: `linear-gradient(-135deg, transparent 25%, hsl(${styles.rgba} / 0.3) 42%, hsl(${styles.rgba} / 0.5) 50%, hsl(${styles.rgba} / 0.3) 58%, transparent 75%)`,
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
            border: `2px solid hsl(${styles.rgba} / 0.5)`,
            animation: 'zenChargeUpPulse 600ms ease-in-out infinite alternate',
            willChange: 'opacity, box-shadow',
            boxShadow: `inset 0 0 20px hsl(${styles.rgba} / 0.1), 0 0 25px hsl(${styles.rgba} / 0.3)`,
          }}
        />
      )}
      
      {/* Icon with gradient background */}
      <div className="relative p-3 rounded-xl" style={(isBursting || isChargingUp) ? { 
        filter: `drop-shadow(0 0 ${isBursting ? 8 : 5}px hsl(${styles.rgba} / ${isBursting ? 0.8 : 0.5}))`,
        transition: 'all 200ms ease-out',
      } : isPressing ? {
        filter: `drop-shadow(0 0 4px hsl(${styles.rgba} / 0.4))`,
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
              "text-[13px] font-medium leading-tight transition-all duration-300",
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
            {/* "Tap again" hint — fades in with strong pulse */}
            <span 
              className={cn(
                "text-[11px] font-bold tracking-wide absolute right-0 transition-all duration-300 ease-out text-primary",
                showTapAgain ? "opacity-100 scale-105 blur-0" : "opacity-0 scale-95 blur-[2px]"
              )}
              style={showTapAgain ? {
                animation: 'zenTapAgainPulse 0.8s ease-in-out infinite',
                textShadow: '0 0 8px hsl(var(--primary) / 0.5)',
              } : undefined}
            >
              ⚡ tap again
            </span>
          </div>
          <ChevronRight className={cn(
            "h-4 w-4 transition-all duration-300",
            isBursting && "translate-x-1",
            showTapAgain && "text-primary animate-bounce"
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
