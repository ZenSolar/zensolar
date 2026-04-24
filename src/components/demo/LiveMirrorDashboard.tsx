import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Images, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminLiveSnapshot } from '@/hooks/useAdminLiveSnapshot';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { ActivityMetrics, MintRequest } from '@/components/dashboard/ActivityMetrics';
import { MintRequestFAB } from '@/components/demo/MintRequestFAB';
import { RewardProgress } from '@/components/dashboard/RewardProgress';
import { TokenPriceCard } from '@/components/dashboard/TokenPriceCard';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { DashboardTopControls } from '@/components/dashboard/DashboardTopControls';
import { DashboardHexBackground } from '@/components/dashboard/DashboardHexBackground';
import { AnimatedEnergyFlow } from '@/components/dashboard/AnimatedEnergyFlow';
import { ApiPartnersCard } from '@/components/dashboard/ApiPartnersCard';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActivityData, ChargerDeviceData, EVDeviceData, BatteryDeviceData, SolarDeviceData } from '@/types/dashboard';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  calculateEarnedMilestones,
  calculateComboAchievements,
} from '@/lib/nftMilestones';

/**
 * Live mirror of the admin's real dashboard for VIP investor demos (Todd, Lyndon, etc).
 * Reads aggregated data from the public `get_admin_live_snapshot` RPC — no auth needed.
 *
 * Layout matches `DemoDashboard` so the experience feels identical, but the numbers
 * are the admin's real-world Tesla / Enphase / Wallbox totals.
 */
export function LiveMirrorDashboard() {
  const { snapshot, isLoading, lastUpdatedAt, refresh } = useAdminLiveSnapshot();
  const [tokenPrice, setTokenPrice] = useState(0.10);

  const { pullDistance, isRefreshing, isReady, containerRef } = usePullToRefresh({
    onRefresh: refresh,
  });

  const activityData: ActivityData = useMemo(() => {
    const s = snapshot;
    const solarKwh = s ? Number(s.solar_kwh ?? 0) : 0;
    const battKwh = s ? Number(s.battery_discharged_kwh ?? 0) : 0;
    const evMiles = s ? Number(s.ev_miles ?? 0) : 0;
    const superKwh = s ? Number(s.supercharger_kwh ?? 0) : 0;
    const homeKwh = s ? Number(s.home_charger_kwh ?? 0) : 0;
    const minted = s ? Number(s.lifetime_minted ?? 0) : 0;
    const nftCount = s ? Number(s.nft_count ?? 0) : 0;

    const solarDevices: SolarDeviceData[] = (s?.devices ?? [])
      .filter(d => d.device_type === 'solar_system')
      .map(d => ({
        deviceId: d.device_id,
        deviceName: d.device_name ?? 'Solar',
        provider: (d.provider as SolarDeviceData['provider']) ?? 'enphase',
        lifetimeKwh: solarKwh,
        pendingKwh: 0,
      }));

    const batteryDevices: BatteryDeviceData[] = (s?.devices ?? [])
      .filter(d => d.device_type === 'powerwall')
      .map(d => ({
        deviceId: d.device_id,
        deviceName: d.device_name ?? 'Powerwall',
        provider: 'tesla',
        lifetimeKwh: battKwh,
        pendingKwh: 0,
      }));

    const evDevices: EVDeviceData[] = (s?.devices ?? [])
      .filter(d => d.device_type === 'vehicle' || d.device_type === 'ev' || d.device_type === 'tesla_vehicle')
      .map(d => ({
        deviceId: d.device_id,
        deviceName: d.device_name ?? 'Vehicle',
        provider: 'tesla',
        lifetimeMiles: evMiles,
        pendingMiles: 0,
        lifetimeChargingKwh: homeKwh,
        pendingChargingKwh: 0,
        lifetimeSuperchargerKwh: superKwh,
        pendingSuperchargerKwh: 0,
      }));

    // Synthesize a charger device so the Home Charging KPI renders interactively
    // (mirrors Joe's ChargePoint Home Flex via Tesla telemetry detection)
    const chargerDevices: ChargerDeviceData[] = homeKwh > 0
      ? [{
          deviceId: 'admin-home-charger',
          deviceName: 'Home Charger',
          provider: 'tesla',
          lifetimeKwh: homeKwh,
          pendingKwh: Math.max(1, Math.floor(homeKwh * 0.02)), // small "pending" so the KPI is tappable
        }]
      : [];

    return {
      lifetimeMinted: minted,
      solarEnergyProduced: solarKwh,
      evMilesDriven: evMiles,
      batteryStorageDischarged: battKwh,
      teslaSuperchargerKwh: superKwh,
      homeChargerKwh: homeKwh,
      fsdSupervisedMiles: 0,
      fsdUnsupervisedMiles: 0,
      // Pending rewards — small representative values so KPI taps work + show "current activity"
      pendingSolarKwh: Math.max(1, Math.floor(solarKwh * 0.001)),
      pendingEvMiles: Math.max(1, Math.floor(evMiles * 0.005)),
      pendingBatteryKwh: Math.max(1, Math.floor(battKwh * 0.01)),
      pendingChargingKwh: Math.max(1, Math.floor((superKwh + homeKwh) * 0.02)),
      pendingSuperchargerKwh: Math.max(1, Math.floor(superKwh * 0.02)),
      pendingHomeChargerKwh: Math.max(1, Math.floor(homeKwh * 0.05)),
      pendingFsdSupervisedMiles: 0,
      pendingFsdUnsupervisedMiles: 0,
      tokensEarned: minted,
      pendingTokens: 0,
      referralTokens: 0,
      nftsEarned: Array.from({ length: nftCount }, (_, i) => `nft-${i}`),
      co2OffsetPounds: solarKwh * 0.92,
      deviceLabels: undefined,
      solarDevices,
      batteryDevices,
      evDevices,
      chargerDevices,
    };
  }, [snapshot]);

  const connectedAccounts = useMemo(() => {
    const c = snapshot?.connections;
    return [
      { service: 'tesla' as const, connected: !!c?.tesla_connected, label: 'Tesla' },
      { service: 'enphase' as const, connected: !!c?.enphase_connected, label: 'Enphase' },
      { service: 'solaredge' as const, connected: !!c?.solaredge_connected, label: 'SolarEdge' },
      { service: 'wallbox' as const, connected: !!c?.wallbox_connected, label: 'Wallbox' },
    ];
  }, [snapshot?.connections]);

  const connectedProviders = connectedAccounts.filter(a => a.connected).map(a => a.service);
  const dashboardTitle = 'Joe\u2019s Live Clean Energy Center';

  const currentActivity = {
    solarKwh: Math.max(0, Math.floor(activityData.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(activityData.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(activityData.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(activityData.pendingChargingKwh || 0)),
    superchargerKwh: Math.max(0, Math.floor(activityData.pendingSuperchargerKwh || 0)),
    homeChargerKwh: Math.max(0, Math.floor(activityData.pendingHomeChargerKwh || 0)),
  };

  // Tap on any KPI shows a friendly demo-info toast (read-only mirror)
  const handleMintRequest = (_req: MintRequest) => {
    toast.info('Live mirror — tap to mint is disabled', {
      description: 'You\u2019re viewing Joe\u2019s real-time energy data. Minting is reserved for connected users.',
    });
  };

  // NFT availability
  const solarEarned = calculateEarnedMilestones(activityData.solarEnergyProduced, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(activityData.batteryStorageDischarged, BATTERY_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(activityData.evMilesDriven, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(
    activityData.teslaSuperchargerKwh + activityData.homeChargerKwh,
    EV_CHARGING_MILESTONES,
  );
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  const totalNftsAvailable = 1 + solarEarned.length + batteryEarned.length + evMilesEarned.length + evChargingEarned.length + comboEarned.length;

  if (isLoading && !snapshot) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-background min-h-full w-full relative overflow-x-hidden">
      <DashboardHexBackground />
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} isReady={isReady} />

      <AnimatedContainer className="relative z-10 w-full max-w-lg min-w-0 mx-auto px-3 sm:px-4 py-6 space-y-6 box-border">
        {/* Header — matches DemoDashboard */}
        <AnimatedItem className="flex flex-col items-center gap-3 pb-2 text-center relative">
          <div className="absolute top-0 right-0">
            <DashboardTopControls />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{dashboardTitle}</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              Real energy. Real Tokens.
              <br />
              All on-chain with{' '}
              <Link
                to="/demo/technology"
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2 transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
              >
                Proof-of-Genesis™
              </Link>
              .
            </p>
            <p className="text-[10px] uppercase tracking-widest text-primary/70">
              Live Mirror · Updated every 60s
            </p>
          </div>
        </AnimatedItem>

        {/* Token Price Card */}
        <AnimatedItem>
          <div className="emerald-glow-card overflow-hidden">
            <TokenPriceCard
              tokensHeld={activityData.lifetimeMinted}
              defaultPrice={0.10}
              onPriceChange={setTokenPrice}
              nftCount={activityData.nftsEarned?.length ?? 0}
              walletLink="/demo/wallet"
            />
          </div>
        </AnimatedItem>

        {/* Energy Command Center — same component, with Joe's live numbers */}
        <AnimatedItem>
          <div className="emerald-glow-card overflow-hidden">
            <ActivityMetrics
              data={activityData}
              currentActivity={currentActivity}
              refreshInfo={{ lastUpdatedAt }}
              connectedProviders={connectedProviders}
              onMintRequest={handleMintRequest}
              tokenPrice={tokenPrice}
              lifetimeMinted={activityData.lifetimeMinted}
            />
          </div>
        </AnimatedItem>

        {/* API Partners */}
        <AnimatedItem>
          <div className="emerald-glow-card overflow-hidden">
            <ApiPartnersCard />
          </div>
        </AnimatedItem>

        {/* Energy Flow */}
        <AnimatedItem>
          <EnergyFlowGlowCard />
        </AnimatedItem>

        {/* NFT Milestones */}
        <AnimatedItem>
          <div className="emerald-glow-card overflow-hidden">
            <RewardProgress
              tokensEarned={activityData.tokensEarned}
              solarKwh={activityData.solarEnergyProduced}
              evMilesDriven={activityData.evMilesDriven}
              evChargingKwh={activityData.teslaSuperchargerKwh + activityData.homeChargerKwh}
              batteryDischargedKwh={activityData.batteryStorageDischarged}
              nftsEarned={activityData.nftsEarned}
              lifetimeMinted={activityData.lifetimeMinted}
              isNewUser={false}
            />
          </div>
        </AnimatedItem>

        {/* Refresh button */}
        <AnimatedItem className="space-y-3">
          <Button
            onClick={refresh}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                REFRESHING…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                REFRESH LIVE DATA
              </>
            )}
          </Button>
          <Badge variant="outline" className="w-full justify-center py-2 text-[11px] tracking-widest uppercase">
            <Images className="h-3 w-3 mr-2" /> {totalNftsAvailable} NFTs Earned · Read-Only Mirror
          </Badge>
        </AnimatedItem>
      </AnimatedContainer>

      <DashboardFooter />

      {/* Floating "Want to mint?" CTA — opens SMS to Joe + logs request */}
      <MintRequestFAB accessCode={typeof window !== 'undefined' ? localStorage.getItem('zen_vip_mirror_active') : null} />
    </div>
  );
}

function EnergyFlowGlowCard() {
  const [burstDone, setBurstDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBurstDone(true), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="rounded-xl overflow-hidden bg-card/5"
      style={{
        border: '1px solid hsla(170, 80%, 40%, 0.3)',
        boxShadow: '0 0 8px 1px hsla(170, 80%, 40%, 0.15), 0 0 20px 3px hsla(170, 80%, 40%, 0.07)',
      }}
    >
      <AnimatedEnergyFlow className="w-full" />
    </div>
  );
}
