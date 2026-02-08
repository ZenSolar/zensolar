import { useRef, useCallback, useState } from 'react';
import { useDemoData } from '@/hooks/useDemoData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useConfetti } from '@/hooks/useConfetti';
import { CompactSetupPrompt } from '@/components/dashboard/CompactSetupPrompt';
import { CompactWalletPrompt } from '@/components/dashboard/CompactWalletPrompt';
import { ActivityMetrics, MintRequest } from '@/components/dashboard/ActivityMetrics';
import { RewardActions, RewardActionsRef, MintCategory as RewardMintCategory } from '@/components/dashboard/RewardActions';
import { RewardProgress } from '@/components/dashboard/RewardProgress';
import { TokenPriceCard } from '@/components/dashboard/TokenPriceCard';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Images, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  calculateEarnedMilestones,
  calculateComboAchievements,
} from '@/lib/nftMilestones';

export function DemoDashboard() {
  const { 
    activityData, 
    isLoading, 
    refreshDashboard, 
    connectedAccounts, 
    profile,
    lastUpdatedAt,
  } = useDemoData();
  
  const rewardActionsRef = useRef<RewardActionsRef>(null);
  const { triggerConfetti } = useConfetti();
  const [tokenPrice, setTokenPrice] = useState(0.10);
  
  const { pullDistance, isRefreshing, isReady, containerRef } = usePullToRefresh({
    onRefresh: refreshDashboard,
  });

  const handleMintRequest = (request: MintRequest) => {
    const mappedCategory: RewardMintCategory = 
      request.category === 'supercharger' || request.category === 'home_charger' ? 'charging' : request.category;
    rewardActionsRef.current?.openTokenMintDialogForRequest?.({ 
      category: mappedCategory, 
      deviceId: request.deviceId,
      deviceName: request.deviceName 
    });
  };

  const handleMintSuccess = useCallback(() => {
    triggerConfetti();
  }, [triggerConfetti]);

  const energyAccounts = connectedAccounts;
  const hasEnergyConnected = energyAccounts.some(acc => acc.connected);
  const hasWalletConnected = !!profile.wallet_address;

  const connectedProviders = energyAccounts
    .filter(acc => acc.connected)
    .map(acc => acc.service);

  const firstName = profile.display_name?.trim().split(/\s+/)[0];
  const dashboardTitle = firstName ? `Welcome, ${firstName}!` : 'Dashboard';

  const currentActivity = {
    solarKwh: Math.max(0, Math.floor(activityData.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(activityData.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(activityData.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(activityData.pendingChargingKwh || 0)),
    superchargerKwh: Math.max(0, Math.floor(activityData.pendingSuperchargerKwh || 0)),
    homeChargerKwh: Math.max(0, Math.floor(activityData.pendingHomeChargerKwh || 0)),
  };

  // Calculate total NFTs available (same logic as real dashboard)
  const solarEarned = calculateEarnedMilestones(activityData.solarEnergyProduced, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(activityData.batteryStorageDischarged, BATTERY_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(activityData.evMilesDriven, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(
    activityData.teslaSuperchargerKwh + activityData.homeChargerKwh, 
    EV_CHARGING_MILESTONES
  );
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  const totalNftsAvailable = 1 + solarEarned.length + batteryEarned.length + evMilesEarned.length + evChargingEarned.length + comboEarned.length;

  return (
    <div 
      ref={containerRef}
      className="bg-background min-h-full w-full max-w-full overflow-x-hidden"
    >
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing}
        isReady={isReady}
      />
      
      <AnimatedContainer className="w-full max-w-lg min-w-0 mx-auto px-3 sm:px-4 py-6 space-y-6 box-border overflow-x-hidden">
        {/* Dashboard Header - matches real dashboard exactly */}
        <AnimatedItem className="flex flex-col items-center gap-3 pb-2 text-center">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{dashboardTitle}</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              Real energy. Real Tokens. All on-chain
              <br />
              with{' '}
              <Link 
                to="/demo/technology" 
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2 transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
              >
                Mint-on-Proof™
              </Link>
              .
            </p>
          </div>
        </AnimatedItem>

        {/* Token Price Card */}
        <AnimatedItem>
          <TokenPriceCard 
            tokensHeld={activityData.lifetimeMinted}
            defaultPrice={0.10}
            onPriceChange={setTokenPrice}
          />
        </AnimatedItem>

        {/* Onboarding Cards */}
        {!hasWalletConnected && (
          <AnimatedItem>
            <CompactWalletPrompt />
          </AnimatedItem>
        )}
        
        {!hasEnergyConnected && (
          <AnimatedItem>
            <CompactSetupPrompt onConnectEnergy={() => {
              toast.info('Demo Mode: Navigate to Profile to connect energy accounts');
            }} />
          </AnimatedItem>
        )}

        {/* ENERGY COMMAND CENTER - matches real dashboard */}
        <AnimatedItem>
          <ActivityMetrics
            data={activityData}
            currentActivity={currentActivity}
            refreshInfo={{ lastUpdatedAt }}
            connectedProviders={connectedProviders}
            onMintRequest={profile.wallet_address ? handleMintRequest : undefined}
            onMintSuccess={handleMintSuccess}
            tokenPrice={tokenPrice}
            lifetimeMinted={activityData.lifetimeMinted}
          />
        </AnimatedItem>

        {/* Reward Actions - same component as real dashboard */}
        <AnimatedItem>
          <RewardActions 
            ref={rewardActionsRef}
            onRefresh={refreshDashboard} 
            isLoading={isLoading}
            walletAddress={profile.wallet_address}
            pendingRewards={{
              solar: currentActivity.solarKwh,
              evMiles: currentActivity.evMiles,
              battery: currentActivity.batteryKwh,
              charging: currentActivity.chargingKwh,
            }}
          />
        </AnimatedItem>

        {/* Aesthetic Section Divider */}
        <AnimatedItem className="py-2">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>
            <div className="relative flex items-center gap-2 px-4 bg-background">
              <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
            </div>
          </div>
        </AnimatedItem>
        
        {/* NFT Milestones */}
        <AnimatedItem id="reward-progress">
          <RewardProgress
            tokensEarned={activityData.tokensEarned}
            solarKwh={activityData.solarEnergyProduced}
            evMilesDriven={activityData.evMilesDriven}
            evChargingKwh={activityData.teslaSuperchargerKwh + activityData.homeChargerKwh}
            batteryDischargedKwh={activityData.batteryStorageDischarged}
            nftsEarned={activityData.nftsEarned}
            lifetimeMinted={activityData.lifetimeMinted}
            isNewUser={true}
          />
        </AnimatedItem>

        {/* NFT Mint Button + Refresh - matches real dashboard */}
        <AnimatedItem className="space-y-3">
          <Button
            onClick={() => rewardActionsRef.current?.openTokenMintDialog()}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 animate-pulse-glow"
            size="lg"
          >
            <Images className="mr-2 h-4 w-4" />
            MINT ZENSOLAR NFTs
            <Badge variant="secondary" className="ml-2 bg-white/20 text-white hover:bg-white/30">
              {totalNftsAvailable}
            </Badge>
          </Button>
          
          <Button
            onClick={refreshDashboard}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                REFRESHING...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                REFRESH DASHBOARD
              </>
            )}
          </Button>
        </AnimatedItem>
      </AnimatedContainer>
      
      {/* Dashboard Footer */}
      <DashboardFooter />
    </div>
  );
}
