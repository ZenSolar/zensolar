import { useRef, useCallback, useState } from 'react';
import { useDemoData } from '@/hooks/useDemoData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useConfetti } from '@/hooks/useConfetti';
import { CompactSetupPrompt } from '@/components/dashboard/CompactSetupPrompt';
import { CompactWalletPrompt } from '@/components/dashboard/CompactWalletPrompt';
import { ActivityMetrics, MintCategory, MintRequest } from '@/components/dashboard/ActivityMetrics';
import { RewardProgress } from '@/components/dashboard/RewardProgress';
import { TokenPriceCard } from '@/components/dashboard/TokenPriceCard';
import { DashboardFooter } from '@/components/dashboard/DashboardFooter';
import { PullToRefreshIndicator } from '@/components/ui/pull-to-refresh';
import { AnimatedContainer, AnimatedItem } from '@/components/ui/animated-section';
import { DemoRewardActions, DemoRewardActionsRef, MintCategory as DemoMintCategory } from '@/components/demo/DemoRewardActions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Images, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WeatherWidget } from '@/components/dashboard/WeatherWidget';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';
import { toast } from 'sonner';

export function DemoDashboard() {
  const { 
    activityData, 
    isLoading, 
    refreshDashboard, 
    connectAccount, 
    disconnectAccount, 
    connectedAccounts, 
    profile,
    connectWallet,
    disconnectWallet,
    lastUpdatedAt,
    hasWelcomeNFT,
    mintedNFTs,
    getEligibility,
    simulateMintWelcomeNFT,
    simulateMintTokens,
  } = useDemoData();
  
  const demoRewardActionsRef = useRef<DemoRewardActionsRef>(null);
  const { triggerConfetti } = useConfetti();
  const [tokenPrice, setTokenPrice] = useState(0.10);
  
  const { pullDistance, isRefreshing, isReady, containerRef } = usePullToRefresh({
    onRefresh: refreshDashboard,
  });

  const handleMintRequest = (request: MintRequest) => {
    const mappedCategory: DemoMintCategory = 
      request.category === 'supercharger' || request.category === 'home_charger' ? 'charging' : request.category;
    demoRewardActionsRef.current?.openMintDialogForCategory?.(mappedCategory);
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

  const eligibility = getEligibility();

  // Calculate total NFTs available (matches real dashboard)
  const totalNftsAvailable = 1 + eligibility.eligibleMilestoneNFTs.length + eligibility.eligibleComboNFTs.length;

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
        {/* Dashboard Header with Logo */}
        <AnimatedItem className="flex flex-col items-center gap-3 pb-2 text-center min-h-[100px]">
          <img 
            src={zenLogo} 
            alt="ZenSolar" 
            className="h-10 w-auto object-contain dark:animate-logo-glow" 
          />
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{dashboardTitle}</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              Earn $ZSOLAR for every kWh you generate — powered by{' '}
              <Link 
                to="/demo/technology" 
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2 transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]"
              >
                Mint-on-Proof™
              </Link>{' '}
              technology.
            </p>
          </div>
          <WeatherWidget />
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

        {/* Energy Command Center */}
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

        {/* Demo Reward Actions */}
        <AnimatedItem>
          <DemoRewardActions 
            ref={demoRewardActionsRef}
            onRefresh={refreshDashboard} 
            isLoading={isLoading}
            walletAddress={profile.wallet_address}
            pendingRewards={{
              solar: currentActivity.solarKwh,
              evMiles: currentActivity.evMiles,
              battery: currentActivity.batteryKwh,
              charging: currentActivity.chargingKwh,
            }}
            hasWelcomeNFT={hasWelcomeNFT}
            eligibleMilestones={eligibility.eligibleMilestoneNFTs.length}
            eligibleCombos={eligibility.eligibleComboNFTs.length}
            ownedNFTCount={mintedNFTs.length}
            onMintWelcomeNFT={simulateMintWelcomeNFT}
            onMintTokens={simulateMintTokens}
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

        {/* NFT Mint Button + Refresh */}
        <AnimatedItem className="space-y-3">
          <Button
            onClick={() => {
              demoRewardActionsRef.current?.openMintDialogForCategory?.('all');
            }}
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
