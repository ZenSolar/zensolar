import { useRef, useCallback, useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useProfile } from '@/hooks/useProfile';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useConfetti } from '@/hooks/useConfetti';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { ActivityMetrics, MintCategory } from './dashboard/ActivityMetrics';
import { RewardActions, RewardActionsRef, MintCategory as RewardMintCategory } from './dashboard/RewardActions';
import { RewardProgress } from './dashboard/RewardProgress';
import { CompactSetupPrompt } from './dashboard/CompactSetupPrompt';
import { AdminBaselineReset } from './dashboard/AdminBaselineReset';
import { NFTResetPanel } from './admin/NFTResetPanel';
import { TokenPriceCard } from './dashboard/TokenPriceCard';
import { PullToRefreshIndicator } from './ui/pull-to-refresh';
import { AnimatedContainer, AnimatedItem } from './ui/animated-section';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

interface ZenSolarDashboardProps {
  isDemo?: boolean;
}

export function ZenSolarDashboard({ isDemo = false }: ZenSolarDashboardProps) {
  const navigate = useNavigate();
  const {
    activityData,
    isLoading: dataLoading,
    refreshDashboard,
    connectedAccounts,
    lastUpdatedAt,
  } = useDashboardData();
  const { profile, isLoading: profileLoading } = useProfile();
  const { isAdmin } = useAdminCheck();
  const { triggerConfetti } = useConfetti();
  const rewardActionsRef = useRef<RewardActionsRef>(null);
  
  // Shared token price state
  const [tokenPrice, setTokenPrice] = useState(0.10);
  
  const { pullDistance, isRefreshing, isReady, containerRef } = usePullToRefresh({
    onRefresh: refreshDashboard,
  });

  const handleMintTokens = () => {
    rewardActionsRef.current?.openTokenMintDialog();
  };

  const handleMintCategory = (category: MintCategory) => {
    // Map category to RewardActions expected format (charging covers both supercharger and home_charger)
    const mappedCategory: RewardMintCategory = 
      category === 'supercharger' || category === 'home_charger' ? 'charging' : category;
    rewardActionsRef.current?.openTokenMintDialogForCategory?.(mappedCategory);
  };

  // Celebration animation when tokens are minted from Pending Rewards
  const handleMintSuccess = useCallback(() => {
    triggerConfetti();
  }, [triggerConfetti]);

  // Use connectedAccounts from useDashboardData which syncs with profile
  const energyAccounts = connectedAccounts;
  const hasEnergyConnected = energyAccounts.some(acc => acc.connected);
  
  // Get connected provider names for display
  const connectedProviders = energyAccounts
    .filter(acc => acc.connected)
    .map(acc => acc.service);

  const firstName = profile?.display_name?.trim().split(/\s+/)[0];
  const dashboardTitle = firstName ? `Welcome, ${firstName}` : 'Dashboard';

  // "Current Activity" is what is mintable: lifetime until first mint, then delta since last mint.
  // We centralize rounding here so Pending Rewards and Current Activity always match.
  const currentActivity = {
    solarKwh: Math.max(0, Math.floor(activityData.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(activityData.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(activityData.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(activityData.pendingChargingKwh || 0)),
  };

  if (profileLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="bg-background min-h-full w-full"
    >
      {isDemo && <DashboardHeader isDemo={isDemo} />}
      
      <PullToRefreshIndicator 
        pullDistance={pullDistance} 
        isRefreshing={isRefreshing}
        isReady={isReady}
      />
      
      <AnimatedContainer className="w-full max-w-lg min-w-0 mx-auto px-3 sm:px-4 py-6 space-y-6 box-border">
        {/* Dashboard Header with Logo - fixed height to prevent layout shifts */}
        <AnimatedItem className="flex flex-col items-center gap-3 pb-2 text-center min-h-[100px]">
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            className="h-10 w-auto object-contain dark:animate-logo-glow" 
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{dashboardTitle}</h1>
            <p className="text-sm text-muted-foreground">Earn $ZSOLAR tokens and ZenSolar NFT's from your clean energy use</p>
          </div>
        </AnimatedItem>

        {/* Token Price Card - Prominent at top */}
        <AnimatedItem>
          <TokenPriceCard 
            tokensHeld={activityData.lifetimeMinted} 
            defaultPrice={0.10}
            onPriceChange={setTokenPrice}
          />
        </AnimatedItem>

        {/* Compact Setup Prompt for new users without energy accounts */}
        {!hasEnergyConnected && (
          <AnimatedItem>
            <CompactSetupPrompt onConnectEnergy={() => navigate('/profile')} />
          </AnimatedItem>
        )}
        
        {/* ENERGY COMMAND CENTER - The Hero Section */}
        <AnimatedItem>
          <ActivityMetrics
            data={activityData}
            currentActivity={currentActivity}
            refreshInfo={{ lastUpdatedAt }}
            connectedProviders={connectedProviders}
            onMintCategory={profile?.wallet_address ? handleMintCategory : undefined}
            onMintSuccess={handleMintSuccess}
            tokenPrice={tokenPrice}
          />
        </AnimatedItem>

        <AnimatedItem>
          <RewardActions 
            ref={rewardActionsRef}
            onRefresh={refreshDashboard} 
            isLoading={dataLoading}
            walletAddress={profile?.wallet_address}
            pendingRewards={{
              solar: currentActivity.solarKwh,
              evMiles: currentActivity.evMiles,
              battery: currentActivity.batteryKwh,
              charging: currentActivity.chargingKwh,
            }}
          />
        </AnimatedItem>

        {/* NFT Milestones - Beta */}
        <AnimatedItem>
          <RewardProgress
            tokensEarned={activityData.tokensEarned}
            solarKwh={activityData.solarEnergyProduced}
            evMilesDriven={activityData.evMilesDriven}
            evChargingKwh={activityData.teslaSuperchargerKwh + activityData.homeChargerKwh}
            batteryDischargedKwh={activityData.batteryStorageDischarged}
            nftsEarned={activityData.nftsEarned}
            isNewUser={true}
          />
        </AnimatedItem>
        
        {/* Admin-only Baseline Reset Tool */}
        {isAdmin && (
          <AnimatedItem>
            <AdminBaselineReset onResetComplete={refreshDashboard} />
          </AnimatedItem>
        )}

        {/* Admin-only NFT Reset Tool */}
        {isAdmin && (
          <AnimatedItem>
            <NFTResetPanel />
          </AnimatedItem>
        )}
      </AnimatedContainer>
    </div>
  );
}
