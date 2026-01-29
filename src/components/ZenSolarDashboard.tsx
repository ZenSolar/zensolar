import { useRef, useCallback, useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useProfile } from '@/hooks/useProfile';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useConfetti } from '@/hooks/useConfetti';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { DashboardFooter } from './dashboard/DashboardFooter';
import { ActivityMetrics, MintCategory } from './dashboard/ActivityMetrics';
import { RewardActions, RewardActionsRef, MintCategory as RewardMintCategory } from './dashboard/RewardActions';
import { RewardProgress } from './dashboard/RewardProgress';
import { CompactSetupPrompt } from './dashboard/CompactSetupPrompt';
import { AdminBaselineReset } from './dashboard/AdminBaselineReset';
import { NFTResetPanel } from './admin/NFTResetPanel';
import { TokenPriceCard } from './dashboard/TokenPriceCard';
import { NFTQuickMintDialog, NFTQuickMintDialogRef } from './nft/NFTQuickMintDialog';
import { PullToRefreshIndicator } from './ui/pull-to-refresh';
import { AnimatedContainer, AnimatedItem } from './ui/animated-section';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Loader2, Images, RefreshCw } from 'lucide-react';
import {
  SOLAR_MILESTONES,
  EV_MILES_MILESTONES,
  EV_CHARGING_MILESTONES,
  BATTERY_MILESTONES,
  calculateEarnedMilestones,
  calculateComboAchievements,
} from '@/lib/nftMilestones';
import { Link } from 'react-router-dom';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
interface ZenSolarDashboardProps {
  isDemo?: boolean;
}

export function ZenSolarDashboard({ isDemo = false }: ZenSolarDashboardProps) {
  const {
    activityData,
    isLoading: dataLoading,
    refreshDashboard,
    connectedAccounts,
    lastUpdatedAt,
  } = useDashboardData();
  const { profile, isLoading: profileLoading } = useProfile();
  const { isAdmin, isAdminView } = useAdminCheck();
  const { triggerConfetti } = useConfetti();
  const rewardActionsRef = useRef<RewardActionsRef>(null);
  const nftQuickMintRef = useRef<NFTQuickMintDialogRef>(null);
  
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

  // Calculate total NFTs available for minting (1 welcome + milestones + combos)
  const solarEarned = calculateEarnedMilestones(activityData.solarEnergyProduced, SOLAR_MILESTONES);
  const batteryEarned = calculateEarnedMilestones(activityData.batteryStorageDischarged, BATTERY_MILESTONES);
  const evMilesEarned = calculateEarnedMilestones(activityData.evMilesDriven, EV_MILES_MILESTONES);
  const evChargingEarned = calculateEarnedMilestones(
    activityData.teslaSuperchargerKwh + activityData.homeChargerKwh, 
    EV_CHARGING_MILESTONES
  );
  const comboEarned = calculateComboAchievements(solarEarned, evMilesEarned, evChargingEarned, batteryEarned);
  const totalNftsAvailable = 1 + solarEarned.length + batteryEarned.length + evMilesEarned.length + evChargingEarned.length + comboEarned.length;

  // "Current Activity" is what is mintable: lifetime until first mint, then delta since last mint.
  // We centralize rounding here so Pending Rewards and Current Activity always match.
  const currentActivity = {
    solarKwh: Math.max(0, Math.floor(activityData.pendingSolarKwh || 0)),
    evMiles: Math.max(0, Math.floor(activityData.pendingEvMiles || 0)),
    batteryKwh: Math.max(0, Math.floor(activityData.pendingBatteryKwh || 0)),
    chargingKwh: Math.max(0, Math.floor(activityData.pendingChargingKwh || 0)),
    superchargerKwh: Math.max(0, Math.floor(activityData.pendingSuperchargerKwh || 0)),
    homeChargerKwh: Math.max(0, Math.floor(activityData.pendingHomeChargerKwh || 0)),
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
            <p className="text-sm text-muted-foreground">
              Mint $ZSOLAR tokens and NFTs directly to your wallet — powered by{' '}
              <Link 
                to="/technology" 
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2 transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
              >
                patent-pending SEGI technology
              </Link>.
            </p>
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
            <CompactSetupPrompt onConnectEnergy={() => window.location.href = '/profile'} />
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
            lifetimeMinted={activityData.lifetimeMinted}
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

        {/* NFT Milestones - Beta */}
        <AnimatedItem>
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

        {/* NFT Mint Button - Below NFT Card with Glow Animation */}
        <AnimatedItem className="space-y-3">
          <Button
            onClick={() => nftQuickMintRef.current?.openDialog()}
            disabled={dataLoading}
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
            disabled={dataLoading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {dataLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            REFRESH DASHBOARD
          </Button>
        </AnimatedItem>

        {/* NFT Quick Mint Dialog */}
        <NFTQuickMintDialog
          ref={nftQuickMintRef}
          walletAddress={profile?.wallet_address}
          activityData={activityData}
          onMintSuccess={refreshDashboard}
        />
        
        {/* Admin-only Baseline Reset Tool */}
        {isAdminView && (
          <AnimatedItem>
            <AdminBaselineReset onResetComplete={refreshDashboard} />
          </AnimatedItem>
        )}

        {/* Admin-only NFT Reset Tool */}
        {isAdminView && (
          <AnimatedItem>
            <NFTResetPanel />
          </AnimatedItem>
        )}
      </AnimatedContainer>
      
      {/* Dashboard Footer */}
      <DashboardFooter />
    </div>
  );
}
