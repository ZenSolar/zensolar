import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTapGesture, TAP_GESTURE_TIMINGS } from '@/hooks/useTapGesture';
import { recordKpiTapEvent } from '@/lib/kpiTapAnalytics';

// Map internal color tokens used by KPI cards → analytics category names so
// the admin Users page sees stable, human-readable labels.
const analyticsCategoryByColor: Record<string, string> = {
  gold: 'solar',
  teal: 'battery',
  green: 'ev',
  cyan: 'supercharger',
  greenGold: 'home_charger',
};

import { MintEffectButton } from './MintEffectButton';
import { useActiveChargingSession } from '@/hooks/useActiveChargingSession';
import { useMintSound } from '@/hooks/useMintSound';

import { useSoundPreference } from '@/hooks/useSoundPreference';
import { ActivityData, SolarDeviceData, BatteryDeviceData, EVDeviceData, ChargerDeviceData } from '@/types/dashboard';
import { getRewardMultiplier, MINT_RATIO_KWH_PER_TOKEN } from '@/lib/tokenomics';
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
import { KpiActivityLogSheet, type KpiSheetState } from './KpiActivityLogSheet';

// Import brand logos for connected providers display
import enphaseLogo from '@/assets/logos/enphase-e-icon.svg';
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

  

  // Swipe hint for first-time users
  const { shouldShowHint, markHintSeen } = useSwipeHintShown();

  // Active charging session indicator
  const { data: isCharging = false } = useActiveChargingSession();

  // Sound preference — respects global toggle
  const { soundEnabled } = useSoundPreference();


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
  // v2.1 — 10:1 mint ratio: 10 kWh / 10 miles = 1 $ZSOLAR. Live Beta multiplier (10x) applies on top.
  // Then 75% user share. Example mainnet: 1000 kWh → 100 raw → 75 received.
  const rawTokens = (activityUnits * getRewardMultiplier()) / MINT_RATIO_KWH_PER_TOKEN;
  const tokensToReceive = Math.floor(rawTokens * 0.75);
  const tokensEligible = Math.floor(activityUnits / MINT_RATIO_KWH_PER_TOKEN); // headline "X tokens eligible for minting"

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

  // Header device chips — each dot color matches its KPI field color below.
  // ev_miles=green, solar=gold/amber, battery=teal/emerald, supercharger/charging=cyan
  const evChargingLabel = vehicleName ? `${vehicleName} EV Charging kWh` : 'EV Charging kWh';
  const headerSubtitleParts: { label: string; dotClass: string }[] = [
    vehicleName ? { label: vehicleName, dotClass: 'bg-green-400' } : null,
    solarName ? { label: solarName, dotClass: 'bg-amber-400' } : null,
    batteryName ? { label: batteryName, dotClass: 'bg-emerald-400' } : null,
    { label: evChargingLabel, dotClass: 'bg-cyan-400' },
  ].filter(Boolean) as { label: string; dotClass: string }[];
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

  // Bottom-sheet "receipts" log — tapping a KPI opens the log of
  // individual activities that built the pending total. MINT moves into
  // the sheet's sticky footer so users see proof before minting.
  const [sheetState, setSheetState] = useState<KpiSheetState>({
    open: false, category: null, label: '', unit: 'kWh', pending: 0,
  });
  const openSheet = useCallback((s: Omit<KpiSheetState, 'open'>) => {
    setSheetState({ ...s, open: true });
  }, []);

  return (
    <div className="relative">

      {/* Outer ambient glow — lives outside the card */}
      {activityUnits > 0 && (
        <div 
          data-zen-decorative-motion
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
        {/* Header — Clean Energy Center Hero (Technical Glass) */}
        <div 
          id="cec-header"
          className="relative -mx-2.5 px-4 py-2.5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.05) 0%, transparent 50%, hsl(142 76% 36% / 0.03) 100%)',
            borderBottom: '1px solid hsl(142 76% 36% / 0.18)',
            boxShadow: 'inset 0 -1px 8px hsl(142 76% 36% / 0.06), inset 0 1px 8px hsl(142 76% 36% / 0.04)',
          }}
        >
          {/* Soft top-left emerald glow */}
          <div
            aria-hidden="true"
            className="absolute -top-20 -left-16 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: 'hsl(var(--primary) / 0.08)',
              filter: 'blur(48px)',
            }}
          />

          <header className="relative flex flex-col items-center gap-2">
            {/* Title + Gauge */}
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold tracking-tight leading-tight text-foreground/95">
                Clean Energy Center
              </h2>
              <div
                className="h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 border"
                style={{
                  background: 'hsl(var(--primary) / 0.10)',
                  borderColor: 'hsl(var(--primary) / 0.25)',
                  boxShadow: '0 0 15px -3px hsl(var(--primary) / 0.35)',
                }}
              >
                <Gauge className="h-3 w-3 text-primary" />
              </div>
            </div>

            {/* Metadata: timestamp only */}
            <div className="flex items-center gap-2">
              <RefreshIndicators lastUpdatedAt={refreshInfo?.lastUpdatedAt} />
              {isLoading && (
                <span className="flex items-center gap-1 text-[10px] font-normal text-muted-foreground animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating…
                </span>
              )}
            </div>

            {/* Connectivity & device chips */}
            {filteredProviders.length > 0 && (
              <div className="flex flex-col items-center gap-2 w-full">
                {/* Connected status + provider chips */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-primary flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                      style={{ boxShadow: '0 0 6px hsl(var(--primary) / 0.7)' }}
                    />
                    Connected
                  </span>
                  <div className="flex items-center gap-1.5">
                    {filteredProviders.map((provider) => (
                      <div
                        key={provider}
                        className="h-6 w-6 flex items-center justify-center rounded-md bg-background border border-border/60 shadow-md px-1"
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
                </div>

                {/* Your: device chips — colored dot matches KPI field color */}
                {headerSubtitleParts.length > 1 ? (
                  <div className="flex flex-wrap justify-center items-center gap-1 px-2">
                    <span className="text-[9px] font-semibold tracking-wider uppercase text-foreground/60 mr-0.5">
                      Your:
                    </span>
                    {headerSubtitleParts.map((part, i) => (
                      <div
                        key={i}
                        className="px-2 py-0.5 rounded-md flex items-center gap-1 border border-primary/10 bg-primary/5"
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", part.dotClass)} aria-hidden="true" />
                        <span className="text-[9px] font-medium text-foreground/75 whitespace-nowrap">
                          {part.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[9px] font-medium text-foreground/65 px-2 text-center">
                    {headerSubtitle}
                  </span>
                )}
              </div>
            )}
          </header>
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

        {/* Per-source mint instruction — makes it obvious each KPI is its own mint button */}
        {activityUnits > 0 && (
          <div className="flex items-center justify-center gap-1.5 pt-1 pb-0.5">
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              style={{ boxShadow: '0 0 6px hsl(var(--primary) / 0.7)' }}
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/90">
              Double-tap any source to mint it
            </p>
          </div>
        )}

        {/* Activity Fields - Single Column with Swipe-to-Hide */}
        {/* Order: 1. Solar, 2. Battery, 3. EV Miles, 4. Tesla Supercharger, 5. Home Charger */}
        <div className="relative overflow-hidden rounded-lg" data-hint-target="kpi-cards">
          <div className="relative space-y-2">
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
                    onTap={pendingKwh > 0 ? () => openSheet({
                      category: 'solar',
                      deviceId: device.deviceId,
                      deviceName: device.deviceName,
                      label: `${device.deviceName} Solar Production`,
                      unit: 'kWh',
                      pending: pendingKwh,
                      accent: 'solar',
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
                  onTap={current.solarKwh > 0 ? () => openSheet({ category: 'solar', label: solarLabel, unit: 'kWh', pending: current.solarKwh, accent: 'solar' }) : undefined}

                  onTap={current.solarKwh > 0 ? () => openSheet({ category: 'solar', label: solarLabel, unit: 'kWh', pending: current.solarKwh }) : undefined}
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
                    onTap={pendingKwh > 0 ? () => openSheet({
                      category: 'battery',
                      deviceId: device.deviceId,
                      deviceName: device.deviceName,
                      label: `${device.deviceName} Battery Storage Discharged`,
                      unit: 'kWh',
                      pending: pendingKwh,
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
                  onTap={current.batteryKwh > 0 ? () => openSheet({ category: 'battery', label: batteryLabel, unit: 'kWh', pending: current.batteryKwh }) : undefined}
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
                    onTap={pendingMiles > 0 ? () => openSheet({
                      category: 'ev_miles',
                      deviceId: device.deviceId,
                      deviceName: device.deviceName,
                      label: `${device.deviceName} EV Miles`,
                      unit: 'mi',
                      pending: pendingMiles,
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
                  onTap={current.evMiles > 0 ? () => openSheet({ category: 'ev_miles', label: evLabel, unit: 'mi', pending: current.evMiles }) : undefined}
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
                    onTap={superchargerKwh > 0 ? () => openSheet({ category: 'supercharger', label: superchargerLabel, unit: 'kWh', pending: superchargerKwh }) : undefined}
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
                        onTap={pendingKwh > 0 ? () => openSheet({
                          category: 'home_charger',
                          deviceId: device.deviceId,
                          deviceName: device.deviceName,
                          label: `${device.deviceName} Home Charger`,
                          unit: 'kWh',
                          pending: pendingKwh,
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
                      onTap={homeChargerKwh > 0 ? () => openSheet({ category: 'home_charger', label: homeChargerLabel, unit: 'kWh', pending: homeChargerKwh }) : undefined}
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
                onTap={current.chargingKwh > 0 ? () => openSheet({ category: 'charging', label: 'EV Charging', unit: 'kWh', pending: current.chargingKwh }) : undefined}
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
            tokensEligible={tokensEligible}
            activityUnits={activityUnits}
            tokenPrice={tokenPrice}
            onMintRequest={onMintRequest}
          />
        </div>
        </div>

      </CardContent>
    </Card>

    <KpiActivityLogSheet
      state={sheetState}
      onOpenChange={(open) => setSheetState((s) => ({ ...s, open }))}
      onMintRequest={onMintRequest}
    />
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
  // Diamond / gem — token sparkle
  token: 'polygon(50% 0%, 85% 50%, 50% 100%, 15% 50%)',
};

// Haptic intensity per category for distinct feel
const hapticPattern: Record<string, number[]> = {
  gold: [15, 30, 10],        // Solar: warm double-pulse
  teal: [25],                // Battery: solid thump
  green: [8, 20, 8, 20, 8], // EV Miles: rapid road-rumble
  cyan: [30, 15, 30],       // Supercharger: electric zap
  greenGold: [20, 10, 20],  // Home charger: steady pulse
  token: [18, 28, 18],      // Total tokens: majestic triple pulse
};

// Semantic-token color styles — restores original Clean Energy Center palette.
// Matches CleanEnergyCenterShowcase: gold→solar (warm orange/yellow),
// teal→secondary (deep green), green→primary (emerald),
// cyan→energy (electric blue), greenGold→energy + solar blend.
const colorStyles = {
  gold: {
    gradient: 'from-solar to-solar/70',
    textGradient: 'from-solar to-solar/80',
    text: 'text-solar',
    glow: 'shadow-solar/30',
    bg: 'bg-solar/10',
    border: 'border-solar/30',
    leftBorder: 'border-l-solar',
    textGlow: '0 0 8px hsl(var(--solar) / 0.5), 0 0 16px hsl(var(--solar) / 0.25)',
    rgba: 'var(--solar)',
  },
  teal: {
    gradient: 'from-secondary to-secondary/70',
    textGradient: 'from-secondary to-secondary/80',
    text: 'text-secondary',
    glow: 'shadow-secondary/30',
    bg: 'bg-secondary/10',
    border: 'border-secondary/30',
    leftBorder: 'border-l-secondary',
    textGlow: '0 0 8px hsl(var(--secondary) / 0.5), 0 0 16px hsl(var(--secondary) / 0.25)',
    rgba: 'var(--secondary)',
  },
  green: {
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
  cyan: {
    gradient: 'from-energy to-energy/70',
    textGradient: 'from-energy to-energy/80',
    text: 'text-energy',
    glow: 'shadow-energy/30',
    bg: 'bg-energy/10',
    border: 'border-energy/30',
    leftBorder: 'border-l-energy',
    textGlow: '0 0 8px hsl(var(--energy) / 0.5), 0 0 16px hsl(var(--energy) / 0.25)',
    rgba: 'var(--energy)',
  },
  greenGold: {
    gradient: 'from-solar to-energy',
    textGradient: 'from-solar to-energy',
    text: 'text-solar',
    glow: 'shadow-solar/30',
    bg: 'bg-solar/10',
    border: 'border-solar/30',
    leftBorder: 'border-l-solar',
    textGlow: '0 0 8px hsl(var(--solar) / 0.5), 0 0 16px hsl(var(--energy) / 0.25)',
    rgba: 'var(--solar)',
  },
  token: {
    gradient: 'from-token to-token/70',
    textGradient: 'from-token to-token/80',
    text: 'text-token',
    glow: 'shadow-token/30',
    bg: 'bg-token/10',
    border: 'border-token/30',
    leftBorder: 'border-l-token',
    textGlow: '0 0 8px hsl(var(--token) / 0.5), 0 0 16px hsl(var(--token) / 0.25)',
    rgba: 'var(--token)',
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
    /** Timestamp of the first tap that started the current double-tap window — drives the countdown ring. */
    ringStartedAt: number | null;
  }
  const stateRef = React.useRef<FieldState>({
    phase: 'idle', touchPoint: null, showTapAgain: false, isSecondTap: false, burstKey: 0, ringStartedAt: null,
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
  const tapCooldownUntilRef = React.useRef<number>(0);
  // Use shared timing constants so every KPI card behaves identically.
  const DOUBLE_TAP_WINDOW = TAP_GESTURE_TIMINGS.DOUBLE_TAP_WINDOW;
  const BURST_DURATION = 1200;
  const GHOST_CLICK_SUPPRESSION = TAP_GESTURE_TIMINGS.GHOST_CLICK_SUPPRESSION;
  const TAP_DEBOUNCE_MS = TAP_GESTURE_TIMINGS.TAP_DEBOUNCE_MS;
  const HINT_DURATION_MS = TAP_GESTURE_TIMINGS.HINT_DURATION_MS;

  // Resync tap visuals when the app/tab becomes visible again (PWA resume,
  // tab switch, lock-screen wake). Clears any stale phase/timers left over
  // from a backgrounded burst and forces a fresh render so the KPI base
  // colors + tap-driven effects always reflect the latest state.
  useEffect(() => {
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      if (chargeTimerRef.current) { clearTimeout(chargeTimerRef.current); chargeTimerRef.current = null; }
      if (doubleTapTimerRef.current) { clearTimeout(doubleTapTimerRef.current); doubleTapTimerRef.current = null; }
      if (burstTimerRef.current) { clearTimeout(burstTimerRef.current); burstTimerRef.current = null; }
      tapCooldownUntilRef.current = 0;
      ignoreClickUntilRef.current = 0;
      touchStartRef.current = null;
      // Reset transient interaction state so visuals re-mount cleanly.
      Object.assign(stateRef.current, {
        phase: 'idle' as const,
        touchPoint: null,
        showTapAgain: false,
        isSecondTap: false,
        burstKey: stateRef.current.burstKey + 1,
      });
      forceRender();
    };
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('pageshow', resync);
    window.addEventListener('focus', resync);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('pageshow', resync);
      window.removeEventListener('focus', resync);
    };
  }, [forceRender]);

  // Pre-compute particles — stable across renders, only regenerate on new burst.
  // 9 particles (down from 16) — beyond ~8 the eye can't track them individually
  // and each one costs a full composite layer + shadow paint per frame.
  const particles = React.useMemo(() => {
    const N = 9;
    return Array.from({ length: N }, (_, i) => {
      const angle = (i / N) * 360 + ((i * 7 + 3) % 20 - 10); // deterministic jitter
      const rad = (angle * Math.PI) / 180;
      const dist = 50 + ((i * 13 + 7) % 70);
      return {
        tx: Math.cos(rad) * dist,
        ty: Math.sin(rad) * (20 + ((i * 11 + 5) % 30)),
        size: 7 + ((i * 9 + 4) % 6),
        rotation: (i * 37 + 11) % 360,
        delay: i * 35,
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
    // Debounce gate — drop spurious second registrations within TAP_DEBOUNCE_MS.
    if (now < tapCooldownUntilRef.current) return;
    tapCooldownUntilRef.current = now + TAP_DEBOUNCE_MS;

    const timeSinceLastTap = now - lastTapTimeRef.current;
    const analyticsCategory = analyticsCategoryByColor[color] ?? color;

    if (lastTapTimeRef.current > 0 && timeSinceLastTap < DOUBLE_TAP_WINDOW) {
      // ── DOUBLE TAP ── fire the mint confirmation
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = now;
      updateState({ showTapAgain: false });
      triggerDoubleBurst(posX, posY);
      // Analytics: a mint confirmed inside the double-tap window.
      void recordKpiTapEvent(analyticsCategory, 'double_tap', { ms_between_taps: timeSinceLastTap });
      void recordKpiTapEvent(analyticsCategory, 'mint_in_window', { ms_between_taps: timeSinceLastTap });
      // Open the mint confirmation dialog
      onTap?.();
      doubleTapTimerRef.current = setTimeout(() => {
        lastTapTimeRef.current = 0;
      }, DOUBLE_TAP_WINDOW);
    } else {
      // ── FIRST TAP ── visual burst + "tap twice" hint + countdown ring
      lastTapTimeRef.current = now;
      triggerBurst(posX, posY);
      updateState({ showTapAgain: true, ringStartedAt: now });
      // Analytics: a single tap (may or may not become a double-tap later).
      void recordKpiTapEvent(analyticsCategory, 'single_tap');
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      // Reset double-tap window after DOUBLE_TAP_WINDOW so a delayed
      // second tap counts as a fresh single-tap (intentional UX).
      setTimeout(() => {
        if (lastTapTimeRef.current === now) lastTapTimeRef.current = 0;
      }, DOUBLE_TAP_WINDOW);
      doubleTapTimerRef.current = setTimeout(() => {
        updateState({ showTapAgain: false, ringStartedAt: null });
      }, HINT_DURATION_MS);
    }
  }, [primeAudio, triggerBurst, triggerDoubleBurst, updateState, onTap, color, DOUBLE_TAP_WINDOW, TAP_DEBOUNCE_MS, HINT_DURATION_MS]);

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
  const { phase, touchPoint, showTapAgain, isSecondTap, burstKey, ringStartedAt } = stateRef.current;
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
        // box-shadow transitions are paint-heavy on mobile; snap, don't tween.
        // The keyframe burst already provides the visual fade through the rings.
        transition: 'none',
        // Promote each tile to its own GPU compositor layer so bursts, rings,
        // and ripples don't trigger sibling tile repaints. Big win on iOS.
        transform: 'translateZ(0)',
        contain: 'layout paint',
        // Inline touch-action beats the CSS class on iOS Safari — eliminates
        // the ~300ms tap delay heuristic on touch targets reliably.
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
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

      {/* ⏱️ Double-tap countdown ring — expands around the card after the first
          tap, visually counting down the window in which a second tap will mint.
          Keyed on ringStartedAt so it cleanly restarts on every fresh first-tap. */}
      {showTapAgain && ringStartedAt && (
        <svg
          key={`ring-countdown-${ringStartedAt}`}
          className="absolute inset-0 pointer-events-none z-[6]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
          style={{ overflow: 'visible' }}
        >
          <rect
            x="1.5"
            y="1.5"
            width="97"
            height="97"
            rx="8"
            ry="8"
            fill="none"
            stroke={`hsl(${styles.rgba} / 0.85)`}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
            pathLength={100}
            style={{
              filter: `drop-shadow(0 0 6px hsl(${styles.rgba} / 0.55))`,
              strokeDasharray: 100,
              strokeDashoffset: 0,
              animation: `zenTapWindowCountdown ${DOUBLE_TAP_WINDOW}ms linear forwards`,
            }}
          />
        </svg>
      )}

      {/* Press ripple — only during the press, not during burst.
          During burst, the radial-release + pressure-wave + ring stack already
          paint the same region; layering this ripple on top just doubles paint cost. */}
      {isPressing && !isBursting && touchPoint && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${touchPoint.x * 100}%`,
            top: `${touchPoint.y * 100}%`,
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle, hsl(${styles.rgba} / 0.35) 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%) scale(0.3)',
            opacity: 0.4,
            transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
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
          {/* Expanding energy rings — 3 staggered waves (was 4; the 4th overlapped the pressure wave) */}
          {[0, 1, 2].map(i => (
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
                boxShadow: `0 0 14px hsl(${styles.rgba} / 0.85)`,
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
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
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
                )} style={isBursting ? { textShadow: styles.textGlow } : undefined}>
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
          <p className="text-[10px] text-success font-medium tracking-wide">Charging in progress…</p>
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
      
      {/* Per-source Mint pill — visually communicates "this KPI IS the mint button" */}
      {isTappable && !isLoading && (
        <div
          className="shrink-0 relative"
          style={isBursting ? {
            animation: 'zenMintStamp 400ms ease-out',
          } : isPressing ? {
            transform: 'scale(0.92)',
            opacity: 0.85,
            transition: 'all 0.1s ease-out',
          } : {
            transition: 'all 0.2s ease-out',
          }}
        >
          <div
            className={cn(
              "relative flex items-center gap-1 rounded-full px-3 py-1.5 border font-extrabold uppercase tracking-wider text-[11px] overflow-hidden",
              "transition-all duration-300"
            )}
            style={{
              background: showTapAgain
                ? `linear-gradient(90deg, hsl(${styles.rgba} / 0.95), hsl(${styles.rgba} / 0.75))`
                : `linear-gradient(90deg, hsl(${styles.rgba} / 0.18), hsl(${styles.rgba} / 0.10))`,
              borderColor: `hsl(${styles.rgba} / ${showTapAgain ? 0.9 : 0.45})`,
              color: showTapAgain ? '#fff' : `hsl(${styles.rgba} / 1)`,
              boxShadow: showTapAgain
                ? `0 0 14px hsl(${styles.rgba} / 0.6), 0 0 28px hsl(${styles.rgba} / 0.3)`
                : `0 0 10px hsl(${styles.rgba} / 0.18), inset 0 0 6px hsl(${styles.rgba} / 0.08)`,
              animation: showTapAgain
                ? 'zenTapAgainPulse 0.55s ease-in-out infinite'
                : 'zenMintPillBreathe 2.2s ease-in-out infinite',
              minWidth: 92,
              justifyContent: 'center',
            }}
            aria-label={showTapAgain ? 'Tap again to mint this source' : 'Double-tap to mint this source'}
          >
            <span
              aria-hidden
              className="inline-block"
              style={showTapAgain ? { animation: 'zenDoubleTapBounce 0.5s ease-in-out infinite' } : undefined}
            >
              {showTapAgain ? '➕' : <Coins className="h-3 w-3 inline -mt-0.5" />}
            </span>
            <span>{showTapAgain ? 'Tap again' : 'Mint this'}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Touch threshold constants - shared across all tappable elements
const TOUCH_DELTA_THRESHOLD = 15;

interface TotalTokensCardProps {
  tokensToReceive: number;
  tokensEligible?: number;
  activityUnits: number;
  tokenPrice: number;
  onMintRequest?: (request: MintRequest) => void;
}

function TotalTokensCard({ tokensToReceive, tokensEligible, activityUnits, tokenPrice, onMintRequest }: TotalTokensCardProps) {
  const isTappable = activityUnits > 0 && !!onMintRequest;
  const eligible = tokensEligible ?? Math.floor(activityUnits / MINT_RATIO_KWH_PER_TOKEN);
  // Hero number = full cumulative mintable total (100%). The 75% user share is revealed
  // on the confirm-mint screen after double-tap, matching per-source KPI behavior.
  const heroTokens = eligible;
  const usdValue = heroTokens * tokenPrice;
  const active = activityUnits > 0;

  // Mirror ActivityField's tap interaction so visual + audio feedback match.
  const color = 'green' as const;
  const styles = colorStyles[color];
  const shape = particleShapes[color] || '';
  const haptic = hapticPattern[color] || [15];
  const { primeAudio, playMintSound } = useMintSound();

  interface FieldState {
    phase: 'idle' | 'pressing' | 'charging' | 'burst';
    touchPoint: { x: number; y: number } | null;
    showTapAgain: boolean;
    isSecondTap: boolean;
    burstKey: number;
    ringStartedAt: number | null;
  }
  const stateRef = useRef<FieldState>({
    phase: 'idle', touchPoint: null, showTapAgain: false, isSecondTap: false, burstKey: 0, ringStartedAt: null,
  });
  const [, setRenderTick] = useState(0);
  const forceRender = useCallback(() => setRenderTick(t => t + 1), []);
  const updateState = useCallback((patch: Partial<FieldState>) => {
    Object.assign(stateRef.current, patch);
    forceRender();
  }, [forceRender]);

  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignoreClickUntilRef = useRef<number>(0);
  const tapCooldownUntilRef = useRef<number>(0);
  const DOUBLE_TAP_WINDOW = TAP_GESTURE_TIMINGS.DOUBLE_TAP_WINDOW;
  const BURST_DURATION = 1200;
  const GHOST_CLICK_SUPPRESSION = TAP_GESTURE_TIMINGS.GHOST_CLICK_SUPPRESSION;
  const TAP_DEBOUNCE_MS = TAP_GESTURE_TIMINGS.TAP_DEBOUNCE_MS;
  const HINT_DURATION_MS = TAP_GESTURE_TIMINGS.HINT_DURATION_MS;

  useEffect(() => {
    const resync = () => {
      if (document.visibilityState !== 'visible') return;
      if (chargeTimerRef.current) { clearTimeout(chargeTimerRef.current); chargeTimerRef.current = null; }
      if (doubleTapTimerRef.current) { clearTimeout(doubleTapTimerRef.current); doubleTapTimerRef.current = null; }
      if (burstTimerRef.current) { clearTimeout(burstTimerRef.current); burstTimerRef.current = null; }
      tapCooldownUntilRef.current = 0;
      ignoreClickUntilRef.current = 0;
      touchStartRef.current = null;
      Object.assign(stateRef.current, {
        phase: 'idle' as const,
        touchPoint: null,
        showTapAgain: false,
        isSecondTap: false,
        burstKey: stateRef.current.burstKey + 1,
      });
      forceRender();
    };
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('pageshow', resync);
    window.addEventListener('focus', resync);
    return () => {
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('pageshow', resync);
      window.removeEventListener('focus', resync);
    };
  }, [forceRender]);

  const particles = React.useMemo(() => {
    const N = 9;
    return Array.from({ length: N }, (_, i) => {
      const angle = (i / N) * 360 + ((i * 7 + 3) % 20 - 10);
      const rad = (angle * Math.PI) / 180;
      const dist = 50 + ((i * 13 + 7) % 70);
      return {
        tx: Math.cos(rad) * dist,
        ty: Math.sin(rad) * (20 + ((i * 11 + 5) % 30)),
        size: 7 + ((i * 9 + 4) % 6),
        rotation: (i * 37 + 11) % 360,
        delay: i * 35,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateRef.current.burstKey]);

  useEffect(() => {
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
  }, [haptic, playMintSound, updateState]);

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
  }, [playMintSound, updateState]);

  const getTouchRelativePos = (clientX: number, clientY: number) => {
    if (!cardRef.current) return { x: 0.5, y: 0.5 };
    const rect = cardRef.current.getBoundingClientRect();
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  };

  const handleMint = useCallback(() => {
    if (onMintRequest) onMintRequest({ category: 'all' });
  }, [onMintRequest]);

  const processTap = useCallback((posX: number, posY: number) => {
    primeAudio();
    const now = Date.now();
    if (now < tapCooldownUntilRef.current) return;
    tapCooldownUntilRef.current = now + TAP_DEBOUNCE_MS;

    const timeSinceLastTap = now - lastTapTimeRef.current;
    if (lastTapTimeRef.current > 0 && timeSinceLastTap < DOUBLE_TAP_WINDOW) {
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      lastTapTimeRef.current = now;
      updateState({ showTapAgain: false });
      triggerDoubleBurst(posX, posY);
      void recordKpiTapEvent('all', 'double_tap', { ms_between_taps: timeSinceLastTap });
      void recordKpiTapEvent('all', 'mint_in_window', { ms_between_taps: timeSinceLastTap });
      handleMint();
      doubleTapTimerRef.current = setTimeout(() => { lastTapTimeRef.current = 0; }, DOUBLE_TAP_WINDOW);
    } else {
      lastTapTimeRef.current = now;
      triggerBurst(posX, posY);
      updateState({ showTapAgain: true, ringStartedAt: now });
      void recordKpiTapEvent('all', 'single_tap');
      if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
      setTimeout(() => { if (lastTapTimeRef.current === now) lastTapTimeRef.current = 0; }, DOUBLE_TAP_WINDOW);
      doubleTapTimerRef.current = setTimeout(() => {
        updateState({ showTapAgain: false, ringStartedAt: null });
      }, HINT_DURATION_MS);
    }
  }, [primeAudio, triggerBurst, triggerDoubleBurst, updateState, handleMint, DOUBLE_TAP_WINDOW, TAP_DEBOUNCE_MS, HINT_DURATION_MS]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isTappable) return;
    if (Date.now() < ignoreClickUntilRef.current) { e.preventDefault(); e.stopPropagation(); return; }
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

  const { phase, touchPoint, showTapAgain, isSecondTap, burstKey, ringStartedAt } = stateRef.current;
  const isBursting = phase === 'burst';
  const isPressing = phase === 'pressing';
  const isChargingUp = phase === 'charging';

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
        scale: [0.90, 1.06, 1.02, 1], y: [2, -3, -1, 0],
      } : isChargingUp ? {
        scale: [1, 1.015, 1, 1.015, 1], y: 0,
      } : isPressing ? {
        scale: 0.93, y: 2,
      } : isTappable ? {
        y: [0, 2, 0], scale: [1, 0.98, 1],
      } : { scale: 1, y: 0 }}
      transition={isBursting ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] } : isChargingUp ? { duration: 1, repeat: Infinity, ease: 'easeInOut' as const } : isPressing ? { duration: 0.12, ease: 'easeOut' as const } : isTappable ? { duration: 1.6, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' as const } : { duration: 0.12, ease: 'easeOut' as const }}
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
        transition: 'none',
        transform: 'translateZ(0)',
        contain: 'layout paint',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
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
      {active && (
        <div className={cn("absolute inset-0 opacity-[0.03] bg-gradient-to-r", styles.gradient)} />
      )}

      {/* Double-tap countdown ring */}
      {showTapAgain && ringStartedAt && (
        <svg
          key={`ring-countdown-${ringStartedAt}`}
          className="absolute inset-0 pointer-events-none z-[6]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
          style={{ overflow: 'visible' }}
        >
          <rect
            x="1.5" y="1.5" width="97" height="97" rx="8" ry="8"
            fill="none" stroke={`hsl(${styles.rgba} / 0.85)`} strokeWidth="2"
            vectorEffect="non-scaling-stroke" pathLength={100}
            style={{
              filter: `drop-shadow(0 0 6px hsl(${styles.rgba} / 0.55))`,
              strokeDasharray: 100, strokeDashoffset: 0,
              animation: `zenTapWindowCountdown ${DOUBLE_TAP_WINDOW}ms linear forwards`,
            }}
          />
        </svg>
      )}

      {/* Press ripple */}
      {isPressing && !isBursting && touchPoint && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${touchPoint.x * 100}%`, top: `${touchPoint.y * 100}%`,
            width: '200%', height: '200%',
            background: `radial-gradient(circle, hsl(${styles.rgba} / 0.35) 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%) scale(0.3)',
            opacity: 0.4,
            transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* Pressure shockwave ring */}
      {isBursting && touchPoint && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${touchPoint.x * 100}%`, top: `${touchPoint.y * 100}%`,
            width: '300%', height: '300%',
            border: `3px solid hsl(${styles.rgba} / 1)`,
            animation: 'zenPressureWave 800ms ease-out forwards',
            willChange: 'transform, opacity',
          }}
        />
      )}

      {/* Flare rings + particles + energy release */}
      {isBursting && (
        <>
          {[0, 1, 2].map(i => (
            <div
              key={`ring-${burstKey}-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: touchPoint ? `${touchPoint.x * 100}%` : 28,
                top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
                width: 20, height: 20,
                marginLeft: touchPoint ? -10 : 0, marginTop: -10,
                borderRadius: '50%',
                border: `3px solid hsl(${styles.rgba} / ${1 - i * 0.12})`,
                animation: `zenFlareRing 900ms ${i * 120}ms ease-out forwards`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
          {particles.map((p, i) => (
            <div
              key={`particle-${burstKey}-${i}`}
              className="absolute pointer-events-none"
              style={{
                left: touchPoint ? `${touchPoint.x * 100}%` : 28,
                top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
                width: p.size, height: p.size,
                background: `hsl(${styles.rgba} / 1)`,
                boxShadow: `0 0 14px hsl(${styles.rgba} / 0.85)`,
                clipPath: shape,
                transform: `rotate(${p.rotation}deg)`,
                animation: `zenFlareParticle 900ms ${p.delay}ms ease-out forwards`,
                willChange: 'transform, opacity',
                '--tx': `${p.tx}px`, '--ty': `${p.ty}px`,
              } as React.CSSProperties}
            />
          ))}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: touchPoint ? `${touchPoint.x * 100}%` : 28,
              top: touchPoint ? `${touchPoint.y * 100}%` : '50%',
              width: 100, height: 100,
              marginLeft: touchPoint ? -50 : -22, marginTop: -50,
              background: `radial-gradient(circle, hsl(${styles.rgba} / 0.9) 0%, hsl(${styles.rgba} / 0.4) 40%, transparent 70%)`,
              animation: 'zenEnergyRelease 800ms ease-out forwards',
              willChange: 'transform, opacity',
            }}
          />
          {/* Diagonal energy sweep */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl z-[5]"
            style={{
              backgroundImage: `linear-gradient(${isSecondTap ? '-' : ''}135deg, transparent 25%, hsl(${styles.rgba} / 0.3) 42%, hsl(${styles.rgba} / 0.5) 50%, hsl(${styles.rgba} / 0.3) 58%, transparent 75%)`,
              backgroundSize: '300% 300%',
              animation: 'zenGridSweep 800ms ease-out forwards',
              willChange: 'opacity, background-position',
            }}
          />
        </>
      )}

      {/* Charging-up pulse */}
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

      {/* Icon */}
      <div className="relative p-3 rounded-xl" style={(isBursting || isChargingUp) ? {
        filter: `drop-shadow(0 0 ${isBursting ? 8 : 5}px hsl(${styles.rgba} / ${isBursting ? 0.8 : 0.5}))`,
        transition: 'all 200ms ease-out',
      } : isPressing ? {
        filter: `drop-shadow(0 0 4px hsl(${styles.rgba} / 0.4))`,
        transition: 'all 100ms ease-out',
      } : { transition: 'all 200ms ease-out' }}>
        <Coins className={cn(
          "h-5 w-5 transition-all",
          active ? styles.text : "text-muted-foreground",
          isBursting && "scale-125"
        )} />
      </div>

      {/* Label + Value */}
      <div className="flex-1 min-w-0 relative">
        <p className={cn(
          "text-[13px] font-medium leading-tight transition-all duration-300",
          active ? "text-foreground" : "text-muted-foreground"
        )}>
          Total Available Tokens
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xl font-semibold tracking-tight">
            <span
              className={cn(
                "transition-all duration-300 tabular-nums",
                active ? "text-foreground" : "text-muted-foreground"
              )}
              style={isBursting ? { textShadow: styles.textGlow } : undefined}
            >
              {heroTokens.toLocaleString()}
            </span>
            <span className="text-base font-semibold ml-1 text-muted-foreground">
              $ZSOLAR
            </span>
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground/70 tabular-nums">
          ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Mint pill — flips to "Tap again" between first and second tap */}
      {isTappable && (
        <div
          className="shrink-0 relative"
          style={isBursting ? { animation: 'zenMintStamp 400ms ease-out' }
            : isPressing ? { transform: 'scale(0.92)', opacity: 0.85, transition: 'all 0.1s ease-out' }
            : { transition: 'all 0.2s ease-out' }}
        >
          <div
            className={cn(
              "relative flex items-center gap-1 rounded-full px-3 py-1.5 border font-extrabold uppercase tracking-wider text-[11px] overflow-hidden",
              "transition-all duration-300"
            )}
            style={{
              background: showTapAgain
                ? `linear-gradient(90deg, hsl(${styles.rgba} / 0.95), hsl(${styles.rgba} / 0.75))`
                : `linear-gradient(90deg, hsl(${styles.rgba} / 0.18), hsl(${styles.rgba} / 0.10))`,
              borderColor: `hsl(${styles.rgba} / ${showTapAgain ? 0.9 : 0.45})`,
              color: showTapAgain ? '#fff' : `hsl(${styles.rgba} / 1)`,
              boxShadow: showTapAgain
                ? `0 0 14px hsl(${styles.rgba} / 0.6), 0 0 28px hsl(${styles.rgba} / 0.3)`
                : `0 0 10px hsl(${styles.rgba} / 0.18), inset 0 0 6px hsl(${styles.rgba} / 0.08)`,
              animation: showTapAgain
                ? 'zenTapAgainPulse 0.55s ease-in-out infinite'
                : 'zenMintPillBreathe 2.2s ease-in-out infinite',
              minWidth: 92,
              justifyContent: 'center',
            }}
            aria-label={showTapAgain ? 'Tap again to mint all sources' : 'Double-tap to mint all sources'}
          >
            <span
              aria-hidden
              className="inline-block"
              style={showTapAgain ? { animation: 'zenDoubleTapBounce 0.5s ease-in-out infinite' } : undefined}
            >
              {showTapAgain ? '➕' : <Coins className="h-3 w-3 inline -mt-0.5" />}
            </span>
            <span>{showTapAgain ? 'Tap again' : 'Mint All'}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
